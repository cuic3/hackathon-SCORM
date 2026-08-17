import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryBuilder, createSupabaseMock } from '../test/mocks/supabase';
import type { CompletionSeed } from './scorm-api-adapter';

const upsertResult = { data: null, error: null };
const supabaseMock = createSupabaseMock({
    from: () => createQueryBuilder(upsertResult),
});

vi.mock('./supabase', () => ({
    supabase: supabaseMock,
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
}));

// Imported after the mock so the module under test picks up the mocked './supabase'.
const { ScormApiAdapter } = await import('./scorm-api-adapter');

function makeAdapter(seed: CompletionSeed | null = null) {
    return new ScormApiAdapter({
        learnerId: 'learner-1',
        lessonId: 'lesson-1',
        lessonTitleSnapshot: 'Test Lesson',
        lessonOriginSnapshot: 'elsevier',
        accessToken: 'token-123',
        seed,
    });
}

describe('ScormApiAdapter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: true } as Response)
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    describe('initial cmi state', () => {
        it('seeds a first-launch adapter with "not attempted" / ab-initio', () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSGetValue('cmi.core.lesson_status')).toBe('not attempted');
            expect(adapter.LMSGetValue('cmi.core.entry')).toBe('ab-initio');
            expect(adapter.LMSGetValue('cmi.core.student_id')).toBe('learner-1');
            expect(adapter.LMSGetValue('cmi.core.score.raw')).toBe('');
        });

        it('resumes from a seed with a saved location', () => {
            const adapter = makeAdapter({
                status: 'incomplete',
                scoreRaw: 40,
                scoreMin: 0,
                scoreMax: 100,
                lessonLocation: 'page-3',
                firstLaunchedAt: '2026-01-01T00:00:00.000Z',
                completedAt: null,
            });
            adapter.LMSInitialize('');
            expect(adapter.LMSGetValue('cmi.core.lesson_status')).toBe('incomplete');
            expect(adapter.LMSGetValue('cmi.core.entry')).toBe('resume');
            expect(adapter.LMSGetValue('cmi.core.lesson_location')).toBe('page-3');
            expect(adapter.LMSGetValue('cmi.core.score.raw')).toBe('40');
        });

        it('maps an unrecognized seed status to "not attempted"', () => {
            const adapter = makeAdapter({
                status: 'not-started',
                scoreRaw: null,
                scoreMin: null,
                scoreMax: null,
                lessonLocation: null,
                firstLaunchedAt: null,
                completedAt: null,
            });
            adapter.LMSInitialize('');
            expect(adapter.LMSGetValue('cmi.core.lesson_status')).toBe('not attempted');
        });
    });

    describe('LMSInitialize', () => {
        it('returns "true" on first call and sets error to 0', () => {
            const adapter = makeAdapter();
            expect(adapter.LMSInitialize('')).toBe('true');
            expect(adapter.LMSGetLastError()).toBe('0');
        });

        it('returns "false" with error 101 on a second call', () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSInitialize('')).toBe('false');
            expect(adapter.LMSGetLastError()).toBe('101');
        });
    });

    describe('LMSGetValue', () => {
        it('returns "" and error 301 when not initialized', () => {
            const adapter = makeAdapter();
            expect(adapter.LMSGetValue('cmi.core.lesson_status')).toBe('');
            expect(adapter.LMSGetLastError()).toBe('301');
        });

        it('returns "" and error 401 for an unknown element', () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSGetValue('cmi.objectives.0.id')).toBe('');
            expect(adapter.LMSGetLastError()).toBe('401');
        });
    });

    describe('LMSSetValue', () => {
        it('returns "false" and error 301 when not initialized', () => {
            const adapter = makeAdapter();
            expect(adapter.LMSSetValue('cmi.core.lesson_status', 'completed')).toBe('false');
            expect(adapter.LMSGetLastError()).toBe('301');
        });

        it('rejects writes to read-only elements with error 403', () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSSetValue('cmi.core.student_id', 'hacker')).toBe('false');
            expect(adapter.LMSGetLastError()).toBe('403');
            expect(adapter.LMSGetValue('cmi.core.student_id')).toBe('learner-1');
        });

        it('rejects writes to cmi.core.student_name as read-only', () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSSetValue('cmi.core.student_name', 'Someone')).toBe('false');
            expect(adapter.LMSGetLastError()).toBe('403');
        });

        it('accepts writes to a writable element and echoes it back', () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSSetValue('cmi.core.lesson_status', 'completed')).toBe('true');
            expect(adapter.LMSGetLastError()).toBe('0');
            expect(adapter.LMSGetValue('cmi.core.lesson_status')).toBe('completed');
        });

        it('debounces the persist call for ordinary writes', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.lesson_location', 'page-1');

            expect(fetch).not.toHaveBeenCalled();
            expect(supabaseMock.from).not.toHaveBeenCalled();

            await vi.advanceTimersByTimeAsync(350);
            expect(supabaseMock.from).toHaveBeenCalledWith('lesson_completions');
        });

        it('coalesces rapid successive writes into a single debounced persist', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.lesson_location', 'page-1');
            await vi.advanceTimersByTimeAsync(100);
            adapter.LMSSetValue('cmi.core.lesson_location', 'page-2');
            await vi.advanceTimersByTimeAsync(100);
            adapter.LMSSetValue('cmi.core.lesson_location', 'page-3');

            await vi.advanceTimersByTimeAsync(350);
            expect(supabaseMock.from).toHaveBeenCalledTimes(1);
        });

        it('flushes immediately (bypassing the debounce) when cmi.core.exit is set', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.exit', 'suspend');

            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            expect(supabaseMock.from).not.toHaveBeenCalled();
        });
    });

    describe('LMSCommit', () => {
        it('flushes immediately via keepalive fetch', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSCommit('')).toBe('true');

            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
            expect(url).toBe(
                'https://example.supabase.co/rest/v1/lesson_completions?on_conflict=learner_id,lesson_id'
            );
            expect(init.method).toBe('POST');
            expect(init.keepalive).toBe(true);
            expect(init.headers.Authorization).toBe('Bearer token-123');
            expect(init.headers.apikey).toBe('anon-key');
        });

        it('cancels a pending debounced flush so it does not double-persist', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.lesson_location', 'page-1');
            adapter.LMSCommit('');

            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            await vi.advanceTimersByTimeAsync(500);
            expect(supabaseMock.from).not.toHaveBeenCalled();
        });

        it('serializes the current cmi state into the request body', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.lesson_status', 'passed');
            adapter.LMSSetValue('cmi.core.score.raw', '85');
            adapter.LMSSetValue('cmi.core.score.min', '0');
            adapter.LMSSetValue('cmi.core.score.max', '100');
            adapter.LMSCommit('');

            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
            const body = JSON.parse(init.body);
            expect(body.status).toBe('passed');
            expect(body.score_raw).toBe(85);
            expect(body.score_min).toBe(0);
            expect(body.score_max).toBe(100);
            expect(body.learner_id).toBe('learner-1');
            expect(body.lesson_id).toBe('lesson-1');
            expect(body.completed_at).not.toBeNull();
        });

        it('reports null scores when none have been set', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSCommit('');

            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
            const body = JSON.parse(init.body);
            expect(body.score_raw).toBeNull();
            expect(body.score_min).toBeNull();
            expect(body.score_max).toBeNull();
            expect(body.completed_at).toBeNull();
        });

        it('sets completed_at only once across repeated commits of a finished status', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.lesson_status', 'completed');
            adapter.LMSCommit('');
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
            const firstBody = JSON.parse(
                (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body
            );

            adapter.LMSCommit('');
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
            const secondBody = JSON.parse(
                (fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body
            );

            expect(secondBody.completed_at).toBe(firstBody.completed_at);
        });

        it('does not throw when the keepalive fetch rejects', async () => {
            (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(() => adapter.LMSCommit('')).not.toThrow();
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        });
    });

    describe('LMSFinish', () => {
        it('returns "false" and error 301 when not initialized, without flushing', () => {
            const adapter = makeAdapter();
            expect(adapter.LMSFinish('')).toBe('false');
            expect(adapter.LMSGetLastError()).toBe('301');
            expect(fetch).not.toHaveBeenCalled();
        });

        it('returns "true" and flushes when initialized', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            expect(adapter.LMSFinish('')).toBe('true');
            await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        });
    });

    describe('error string lookups', () => {
        it('returns known messages for LMSGetErrorString and LMSGetDiagnostic', () => {
            const adapter = makeAdapter();
            expect(adapter.LMSGetErrorString('401')).toBe('Not implemented error');
            expect(adapter.LMSGetDiagnostic('403')).toBe('Element is read only');
        });

        it('returns "Unknown error" for an unrecognized code', () => {
            const adapter = makeAdapter();
            expect(adapter.LMSGetErrorString('999')).toBe('Unknown error');
            expect(adapter.LMSGetDiagnostic('999')).toBe('Unknown error');
        });
    });

    describe('dispose', () => {
        it('cancels a pending debounced flush', async () => {
            const adapter = makeAdapter();
            adapter.LMSInitialize('');
            adapter.LMSSetValue('cmi.core.lesson_location', 'page-1');
            adapter.dispose();

            await vi.advanceTimersByTimeAsync(500);
            expect(supabaseMock.from).not.toHaveBeenCalled();
        });

        it('is safe to call when there is no pending flush', () => {
            const adapter = makeAdapter();
            expect(() => adapter.dispose()).not.toThrow();
        });
    });
});
