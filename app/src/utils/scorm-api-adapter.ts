import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';
import type { CompletionStatus, LessonOrigin } from '../types/domain';

// SCORM 1.2 error codes this adapter can raise. Not exhaustive — only the
// subset relevant to a hosting-app-side LMS API adapter.
const ERROR_MESSAGES: Record<string, string> = {
    '0': 'No error',
    '101': 'General exception',
    '301': 'Not initialized',
    '401': 'Not implemented error',
    '403': 'Element is read only',
};

const READ_ONLY_ELEMENTS = new Set([
    'cmi.core.student_id',
    'cmi.core.student_name',
]);

type ScormLessonStatus =
    | 'not attempted'
    | 'incomplete'
    | 'completed'
    | 'passed'
    | 'failed';

function toScormStatus(status: CompletionStatus | null | undefined): ScormLessonStatus {
    switch (status) {
        case 'incomplete':
        case 'completed':
        case 'passed':
        case 'failed':
            return status;
        default:
            return 'not attempted';
    }
}

function fromScormStatus(status: string): CompletionStatus {
    switch (status) {
        case 'incomplete':
        case 'completed':
        case 'passed':
        case 'failed':
            return status;
        default:
            return 'not-started';
    }
}

const FINISHED_STATUSES: CompletionStatus[] = ['completed', 'passed', 'failed'];

export interface CompletionSeed {
    status: CompletionStatus;
    scoreRaw: number | null;
    scoreMin: number | null;
    scoreMax: number | null;
    lessonLocation: string | null;
    firstLaunchedAt: string | null;
    completedAt: string | null;
}

export interface ScormApiAdapterArgs {
    learnerId: string;
    lessonId: string;
    lessonTitleSnapshot: string;
    lessonOriginSnapshot: LessonOrigin;
    /** Prior completion state to resume from, or null on first launch. */
    seed: CompletionSeed | null;
    /** Learner's current Supabase access token, for the unload-safe keepalive flush. */
    accessToken: string;
}

interface CompletionRow {
    learner_id: string;
    lesson_id: string;
    lesson_title_snapshot: string;
    lesson_origin_snapshot: LessonOrigin;
    status: CompletionStatus;
    score_raw: number | null;
    score_min: number | null;
    score_max: number | null;
    lesson_location: string | null;
    exit_mode: string | null;
    session_time: string | null;
    first_launched_at: string;
    completed_at: string | null;
    last_updated_at: string;
}

/**
 * Implements the SCORM 1.2 runtime contract (LMSInitialize/GetValue/SetValue/
 * Commit/Finish/error methods) as the object the SCO discovers via `window.API`.
 * Every method returns a STRING ("true"/"false"), matching the SCORM 1.2
 * convention the reference package's scormfunctions.js relies on.
 */
export class ScormApiAdapter {
    private initialized = false;
    private lastErrorCode = '0';
    private readonly cmi: Record<string, string>;
    private debounceHandle: ReturnType<typeof setTimeout> | null = null;

    private firstLaunchedAt: string | null;
    private completedAt: string | null;

    private readonly learnerId: string;
    private readonly lessonId: string;
    private readonly lessonTitleSnapshot: string;
    private readonly lessonOriginSnapshot: LessonOrigin;
    private readonly accessToken: string;

    constructor(args: ScormApiAdapterArgs) {
        this.learnerId = args.learnerId;
        this.lessonId = args.lessonId;
        this.lessonTitleSnapshot = args.lessonTitleSnapshot;
        this.lessonOriginSnapshot = args.lessonOriginSnapshot;
        this.accessToken = args.accessToken;

        const seed = args.seed;
        this.firstLaunchedAt = seed?.firstLaunchedAt ?? null;
        this.completedAt = seed?.completedAt ?? null;

        this.cmi = {
            'cmi.core.student_id': this.learnerId,
            'cmi.core.student_name': '',
            'cmi.core.lesson_status': toScormStatus(seed?.status),
            'cmi.core.lesson_location': seed?.lessonLocation ?? '',
            'cmi.core.entry': seed?.lessonLocation ? 'resume' : 'ab-initio',
            'cmi.core.credit': 'credit',
            'cmi.core.exit': '',
            'cmi.core.session_time': '',
            'cmi.core.score.raw': seed?.scoreRaw != null ? String(seed.scoreRaw) : '',
            'cmi.core.score.min': seed?.scoreMin != null ? String(seed.scoreMin) : '',
            'cmi.core.score.max': seed?.scoreMax != null ? String(seed.scoreMax) : '',
            'cmi.suspend_data': '',
        };
    }

    LMSInitialize = (_param: string): string => {
        if (this.initialized) {
            this.lastErrorCode = '101';
            return 'false';
        }
        this.initialized = true;
        this.lastErrorCode = '0';
        return 'true';
    };

    LMSFinish = (_param: string): string => {
        if (!this.initialized) {
            this.lastErrorCode = '301';
            return 'false';
        }
        this.lastErrorCode = '0';
        this.flushImmediately();
        return 'true';
    };

    LMSGetValue = (element: string): string => {
        if (!this.initialized) {
            this.lastErrorCode = '301';
            return '';
        }
        if (!(element in this.cmi)) {
            this.lastErrorCode = '401';
            return '';
        }
        this.lastErrorCode = '0';
        return this.cmi[element];
    };

    LMSSetValue = (element: string, value: string): string => {
        if (!this.initialized) {
            this.lastErrorCode = '301';
            return 'false';
        }
        if (READ_ONLY_ELEMENTS.has(element)) {
            this.lastErrorCode = '403';
            return 'false';
        }
        this.cmi[element] = value;
        this.lastErrorCode = '0';

        // cmi.core.exit is always the last meaningful write before LMSFinish
        // fires from onunload — flush immediately rather than waiting on the
        // debounce, since there's no LMSCommit call in the reference package.
        if (element === 'cmi.core.exit') {
            this.flushImmediately();
        } else {
            this.scheduleFlush();
        }
        return 'true';
    };

    LMSCommit = (_param: string): string => {
        this.flushImmediately();
        return 'true';
    };

    LMSGetLastError = (): string => this.lastErrorCode;

    LMSGetErrorString = (errorCode: string): string =>
        ERROR_MESSAGES[errorCode] ?? 'Unknown error';

    LMSGetDiagnostic = (errorCode: string): string =>
        ERROR_MESSAGES[errorCode] ?? 'Unknown error';

    /** Call on unmount/lesson change so a stale adapter never answers a later lesson's findAPI(). */
    dispose(): void {
        if (this.debounceHandle) {
            clearTimeout(this.debounceHandle);
            this.debounceHandle = null;
        }
    }

    private scheduleFlush(): void {
        if (this.debounceHandle) clearTimeout(this.debounceHandle);
        this.debounceHandle = setTimeout(() => {
            this.debounceHandle = null;
            void this.persist(false);
        }, 350);
    }

    private flushImmediately(): void {
        if (this.debounceHandle) {
            clearTimeout(this.debounceHandle);
            this.debounceHandle = null;
        }
        void this.persist(true);
    }

    private buildRow(): CompletionRow {
        const rawScore = this.cmi['cmi.core.score.raw'];
        const minScore = this.cmi['cmi.core.score.min'];
        const maxScore = this.cmi['cmi.core.score.max'];
        // Only ever reflects what the package actually reported — never fabricated.
        const status = fromScormStatus(this.cmi['cmi.core.lesson_status']);
        const now = new Date().toISOString();

        if (!this.firstLaunchedAt) this.firstLaunchedAt = now;
        if (FINISHED_STATUSES.includes(status) && !this.completedAt) {
            this.completedAt = now;
        }

        return {
            learner_id: this.learnerId,
            lesson_id: this.lessonId,
            lesson_title_snapshot: this.lessonTitleSnapshot,
            lesson_origin_snapshot: this.lessonOriginSnapshot,
            status,
            score_raw: rawScore === '' ? null : Number(rawScore),
            score_min: minScore === '' ? null : Number(minScore),
            score_max: maxScore === '' ? null : Number(maxScore),
            lesson_location: this.cmi['cmi.core.lesson_location'] || null,
            exit_mode: this.cmi['cmi.core.exit'] || null,
            session_time: this.cmi['cmi.core.session_time'] || null,
            first_launched_at: this.firstLaunchedAt,
            completed_at: this.completedAt,
            last_updated_at: now,
        };
    }

    private async persist(immediate: boolean): Promise<void> {
        const row = this.buildRow();
        if (!immediate) {
            await supabase
                .from('lesson_completions')
                .upsert(row, { onConflict: 'learner_id,lesson_id' });
            return;
        }

        // sendBeacon can't carry the apikey/Authorization headers PostgREST
        // requires, so use a keepalive fetch instead — it survives page unload
        // and can carry arbitrary headers.
        try {
            await fetch(
                `${supabaseUrl}/rest/v1/lesson_completions?on_conflict=learner_id,lesson_id`,
                {
                    method: 'POST',
                    keepalive: true,
                    headers: {
                        'Content-Type': 'application/json',
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${this.accessToken}`,
                        Prefer: 'resolution=merge-duplicates',
                    },
                    body: JSON.stringify(row),
                }
            );
        } catch {
            // Best-effort: the debounced upsert from prior SetValue calls has
            // almost always already landed by the time Finish/exit fires.
        }
    }
}
