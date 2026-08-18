import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQueryBuilder } from '../../test/mocks/supabase';
import { useAuth } from '../../utils/auth-context';

vi.mock('../../utils/auth-context', () => ({
    useAuth: vi.fn(),
}));

const fromMock = vi.fn();
vi.mock('../../utils/supabase', () => ({
    supabase: { from: fromMock },
}));

const Home = (await import('./home')).default;
const mockUseAuth = vi.mocked(useAuth);

function lessonRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'lesson-1',
        title: 'Hand Hygiene Basics',
        description: 'Learn the basics.',
        origin: 'elsevier',
        duration_minutes: 10,
        is_active: true,
        ...overrides,
    };
}

function renderHome() {
    return render(
        <MemoryRouter>
            <Home />
        </MemoryRouter>
    );
}

describe('Home', () => {
    beforeEach(() => {
        fromMock.mockReset();
    });

    it('shows nothing yet (no fetch) when profile has not resolved', () => {
        mockUseAuth.mockReturnValue({
            session: null,
            profile: null,
            loading: true,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        renderHome();
        expect(screen.getByText('Loading…')).toBeInTheDocument();
        expect(fromMock).not.toHaveBeenCalled();
    });

    it('renders elsevier lessons and a placeholder for an empty custom section', async () => {
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'learner-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        fromMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
                return createQueryBuilder({ data: [lessonRow()], error: null });
            }
            return createQueryBuilder({ data: [], error: null });
        });

        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        expect(screen.getByText('Hand Hygiene Basics')).toBeInTheDocument();
        expect(screen.getByText('No custom lessons available yet.')).toBeInTheDocument();
    });

    it('splits lessons into Elsevier and custom sections by origin', async () => {
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'learner-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        fromMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
                return createQueryBuilder({
                    data: [
                        lessonRow({ id: 'e1', title: 'Elsevier Lesson', origin: 'elsevier' }),
                        lessonRow({ id: 'c1', title: 'Custom Lesson', origin: 'custom' }),
                    ],
                    error: null,
                });
            }
            return createQueryBuilder({ data: [], error: null });
        });

        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        expect(screen.getByText('Elsevier Lesson')).toBeInTheDocument();
        expect(screen.getByText('Custom Lesson')).toBeInTheDocument();
        expect(screen.queryByText('No custom lessons available yet.')).not.toBeInTheDocument();
    });

    it('merges completion rows onto their matching lesson by lesson_id', async () => {
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'learner-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        fromMock.mockImplementation((table: string) => {
            if (table === 'lessons') {
                return createQueryBuilder({ data: [lessonRow({ id: 'lesson-1' })], error: null });
            }
            if (table === 'lesson_completions') {
                return createQueryBuilder({
                    data: [{ lesson_id: 'lesson-1', status: 'completed' }],
                    error: null,
                });
            }
            return createQueryBuilder({ data: [], error: null });
        });

        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('renders no lesson cards when lessons come back empty', async () => {
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'learner-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        fromMock.mockImplementation(() => createQueryBuilder({ data: [], error: null }));

        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('No custom lessons available yet.')).toBeInTheDocument();
        expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it('handles a null lessons response (e.g. a query error) without crashing', async () => {
        mockUseAuth.mockReturnValue({
            session: {} as never,
            profile: { id: 'learner-1' } as never,
            loading: false,
            signIn: vi.fn(),
            signOut: vi.fn(),
        });
        fromMock.mockImplementation(() =>
            createQueryBuilder({ data: null, error: { message: 'boom' } })
        );

        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('No custom lessons available yet.')).toBeInTheDocument();
    });
});
