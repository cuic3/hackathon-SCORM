import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createQueryBuilder } from '../../test/mocks/supabase';
import { useAuth } from '../../utils/auth-context';

vi.mock('../../utils/auth-context', () => ({
    useAuth: vi.fn(),
}));

const fromMock = vi.fn();
const getSessionMock = vi.fn();
vi.mock('../../utils/supabase', () => ({
    supabase: {
        from: fromMock,
        auth: { getSession: getSessionMock },
    },
}));

const adapterInstances: Array<{ args: unknown; dispose: ReturnType<typeof vi.fn> }> = [];
vi.mock('../../utils/scorm-api-adapter', () => ({
    // A regular function (not an arrow function) so it's usable as a
    // constructor via `new ScormApiAdapter(...)`.
    ScormApiAdapter: vi.fn().mockImplementation(function (args: unknown) {
        const instance = { args, dispose: vi.fn() };
        adapterInstances.push(instance);
        return instance;
    }),
}));

const Lesson = (await import('./lesson')).default;
const mockUseAuth = vi.mocked(useAuth);

function lessonRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'lesson-1',
        title: 'Hand Hygiene Basics',
        description: 'Learn the basics.',
        origin: 'elsevier',
        package_id: null,
        launch_path: null,
        source_institution: null,
        ...overrides,
    };
}

function completionRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'completion-1',
        status: 'incomplete',
        score_raw: null,
        score_min: null,
        score_max: null,
        lesson_location: null,
        first_launched_at: null,
        completed_at: null,
        ...overrides,
    };
}

function mockLessonFetch(lesson: unknown, completion: unknown = null) {
    fromMock.mockImplementation((table: string) => {
        if (table === 'lessons') return createQueryBuilder({ data: lesson, error: null });
        if (table === 'lesson_completions')
            return createQueryBuilder({ data: completion, error: null });
        return createQueryBuilder({ data: null, error: null });
    });
}

function renderLesson(lessonId = 'lesson-1') {
    return render(
        <MemoryRouter initialEntries={[`/lesson/${lessonId}`]}>
            <Route exact path="/lesson/:lessonId">
                <Lesson />
            </Route>
        </MemoryRouter>
    );
}

describe('Lesson', () => {
    beforeEach(() => {
        fromMock.mockReset();
        getSessionMock.mockReset();
        getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
        adapterInstances.length = 0;
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'learner-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
    });

    afterEach(() => {
        delete (window as { API?: unknown }).API;
    });

    it('shows a loading state before the lesson resolves', () => {
        fromMock.mockImplementation(() => createQueryBuilder({ data: null, error: null }));
        renderLesson();
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows "Lesson not found." when no lesson row matches the id', async () => {
        mockLessonFetch(null);
        renderLesson();
        await waitFor(() => expect(screen.getByText('Lesson not found.')).toBeInTheDocument());
    });

    it('renders the lesson title and description', async () => {
        mockLessonFetch(lessonRow());
        renderLesson();
        await waitFor(() =>
            expect(screen.getByRole('heading', { name: 'Hand Hygiene Basics' })).toBeInTheDocument()
        );
        expect(screen.getByText('Learn the basics.')).toBeInTheDocument();
    });

    it('shows a "Custom content" badge for custom-origin lessons', async () => {
        mockLessonFetch(lessonRow({ origin: 'custom' }));
        renderLesson();
        await waitFor(() => expect(screen.getByText('Custom content')).toBeInTheDocument());
    });

    it('shows the no-content placeholder and no Refresh button when the lesson has no package', async () => {
        mockLessonFetch(lessonRow({ package_id: null, launch_path: null }));
        renderLesson();
        await waitFor(() =>
            expect(
                screen.getByText('This lesson doesn’t have content available yet.')
            ).toBeInTheDocument()
        );
        expect(screen.queryByText('Refresh status')).not.toBeInTheDocument();
        expect(adapterInstances).toHaveLength(0);
    });

    it('creates a SCORM adapter, assigns window.API, and renders the content iframe when playable', async () => {
        mockLessonFetch(
            lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }),
            completionRow()
        );
        renderLesson();

        await waitFor(() => expect(adapterInstances).toHaveLength(1));
        await waitFor(() => expect(screen.getByTitle('Hand Hygiene Basics')).toBeInTheDocument());

        const iframe = screen.getByTitle('Hand Hygiene Basics');
        expect(iframe).toHaveAttribute('src', '/content/pkg-1/index.html');
        expect(window.API).toBe(adapterInstances[0]);
    });

    it('passes the fetched completion as the adapter seed', async () => {
        mockLessonFetch(
            lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }),
            completionRow({ status: 'passed', score_raw: 88, lesson_location: 'page-2' })
        );
        renderLesson();

        await waitFor(() => expect(adapterInstances).toHaveLength(1));
        const args = adapterInstances[0].args as { seed: Record<string, unknown> | null };
        expect(args.seed).toMatchObject({
            status: 'passed',
            scoreRaw: 88,
            lessonLocation: 'page-2',
        });
    });

    it('passes the lesson\'s source institution through to the adapter', async () => {
        mockLessonFetch(
            lessonRow({
                package_id: 'pkg-1',
                launch_path: 'index.html',
                source_institution: 'Springfield General',
            })
        );
        renderLesson();

        await waitFor(() => expect(adapterInstances).toHaveLength(1));
        const args = adapterInstances[0].args as { sourceInstitutionSnapshot: string | null };
        expect(args.sourceInstitutionSnapshot).toBe('Springfield General');
    });

    it('passes a null seed when there is no prior completion', async () => {
        mockLessonFetch(lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }), null);
        renderLesson();

        await waitFor(() => expect(adapterInstances).toHaveLength(1));
        const args = adapterInstances[0].args as { seed: unknown };
        expect(args.seed).toBeNull();
    });

    it('shows the status pill and formatted score from the completion', async () => {
        mockLessonFetch(
            lessonRow(),
            completionRow({ status: 'completed', score_raw: 75, score_min: 0, score_max: 100 })
        );
        renderLesson();

        await waitFor(() => expect(screen.getByText('Completed')).toBeInTheDocument());
        expect(screen.getByText('75% (75/100)')).toBeInTheDocument();
    });

    it('shows "Not started" status and score when there is no completion yet', async () => {
        mockLessonFetch(lessonRow(), null);
        renderLesson();

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        const statusPills = screen.getAllByText('Not started');
        expect(statusPills.length).toBeGreaterThan(0);
    });

    it('refetches only the completion row when "Refresh status" is clicked', async () => {
        mockLessonFetch(
            lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }),
            completionRow({ status: 'incomplete' })
        );
        renderLesson();
        await waitFor(() => expect(screen.getAllByText('In progress').length).toBeGreaterThan(0));

        fromMock.mockImplementation((table: string) => {
            if (table === 'lesson_completions')
                return createQueryBuilder({
                    data: completionRow({ status: 'completed', score_raw: 100 }),
                    error: null,
                });
            return createQueryBuilder({ data: lessonRow({ package_id: 'pkg-1' }), error: null });
        });

        fireEvent.click(screen.getByText('Refresh status'));
        await waitFor(() => expect(screen.getByText('Completed')).toBeInTheDocument());
        // The adapter must not be torn down/recreated by a completion-only refresh.
        expect(adapterInstances).toHaveLength(1);
        expect(adapterInstances[0].dispose).not.toHaveBeenCalled();
    });

    it('disposes the adapter and clears window.API on unmount', async () => {
        mockLessonFetch(
            lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }),
            completionRow()
        );
        const { unmount } = renderLesson();
        await waitFor(() => expect(adapterInstances).toHaveLength(1));

        unmount();
        expect(adapterInstances[0].dispose).toHaveBeenCalled();
        expect(window.API).toBeUndefined();
    });

    it('does not create an adapter while the profile is still loading', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: true,
            signIn: vi.fn(),
            signUpLearner: vi.fn(),
            signOut: vi.fn(),
        });
        mockLessonFetch(lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }));
        renderLesson();
        expect(adapterInstances).toHaveLength(0);
    });

    it(
        'polls the completion row every 2 seconds while the lesson is playable and ready, so progress reflects live SCO writes',
        async () => {
            mockLessonFetch(
                lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }),
                completionRow({ status: 'incomplete' })
            );
            renderLesson();
            await waitFor(() => expect(adapterInstances).toHaveLength(1));

            const completionCallsBefore = fromMock.mock.calls.filter(
                ([table]) => table === 'lesson_completions'
            ).length;

            await new Promise((resolve) => setTimeout(resolve, 2100));

            const completionCallsAfter = fromMock.mock.calls.filter(
                ([table]) => table === 'lesson_completions'
            ).length;
            expect(completionCallsAfter).toBeGreaterThan(completionCallsBefore);
        },
        10000
    );

    it('stops polling once the component unmounts', async () => {
        mockLessonFetch(
            lessonRow({ package_id: 'pkg-1', launch_path: 'index.html' }),
            completionRow({ status: 'incomplete' })
        );
        const { unmount } = renderLesson();
        await waitFor(() => expect(adapterInstances).toHaveLength(1));
        unmount();

        const callsAtUnmount = fromMock.mock.calls.length;
        await new Promise((resolve) => setTimeout(resolve, 2100));
        expect(fromMock.mock.calls.length).toBe(callsAtUnmount);
    }, 10000);
});
