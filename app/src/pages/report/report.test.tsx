import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQueryBuilder } from '../../test/mocks/supabase';

const fromMock = vi.fn();
vi.mock('../../utils/supabase', () => ({
    supabase: { from: fromMock },
}));

const Report = (await import('./report')).default;

function learnerRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'learner-1',
        display_name: 'Ada Lovelace',
        ...overrides,
    };
}

function completionRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'row-1',
        learner_id: 'learner-1',
        lesson_title_snapshot: 'Hand Hygiene Basics',
        lesson_origin_snapshot: 'elsevier',
        source_institution_snapshot: null,
        status: 'completed',
        score_raw: 90,
        score_min: 0,
        score_max: 100,
        ...overrides,
    };
}

function mockTables({
    learners = [],
    completions = [],
    learnersError = null,
    completionsError = null,
}: {
    learners?: unknown[];
    completions?: unknown[];
    learnersError?: unknown;
    completionsError?: unknown;
} = {}) {
    fromMock.mockImplementation((table: string) => {
        if (table === 'profiles') {
            return createQueryBuilder({ data: learners, error: learnersError });
        }
        return createQueryBuilder({ data: completions, error: completionsError });
    });
}

function getRowByLessonTitle(title: string) {
    return screen.getByText(title).closest('tr') as HTMLTableRowElement;
}

describe('Report', () => {
    beforeEach(() => {
        fromMock.mockReset();
    });

    it('shows a loading state before data resolves', () => {
        mockTables({ learners: [], completions: [] });
        render(<Report />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('renders a table row per completion with learner, lesson, status and score', async () => {
        mockTables({ learners: [learnerRow()], completions: [completionRow()] });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        const row = getRowByLessonTitle('Hand Hygiene Basics');
        expect(within(row).getByText('Ada Lovelace')).toBeInTheDocument();
        expect(within(row).getByText('Elsevier')).toBeInTheDocument();
        expect(within(row).getByText('Completed')).toBeInTheDocument();
        expect(within(row).getByText('90% (90/100)')).toBeInTheDocument();
    });

    it('shows a "Custom content" badge for custom-origin completions', async () => {
        mockTables({
            learners: [learnerRow()],
            completions: [completionRow({ lesson_origin_snapshot: 'custom' })],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('shows every learner even when they have no completions yet', async () => {
        mockTables({
            learners: [learnerRow({ id: 'learner-2', display_name: 'New Learner' })],
            completions: [],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        const row = screen.getByText('New Learner').closest('tr') as HTMLTableRowElement;
        expect(within(row).getByText('No lessons started yet')).toBeInTheDocument();
        expect(within(row).getAllByText('Not started')).toHaveLength(2);
    });

    it('falls back to "Unknown learner" when a completion has no matching profile', async () => {
        mockTables({
            learners: [],
            completions: [completionRow()],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('Unknown learner')).toBeInTheDocument();
    });

    it('maps every status through toDisplayStatus for the Status column', async () => {
        mockTables({
            learners: [learnerRow()],
            completions: [
                completionRow({
                    id: 'row-a',
                    lesson_title_snapshot: 'Lesson A',
                    status: 'not-started',
                    score_raw: null,
                }),
                completionRow({
                    id: 'row-b',
                    lesson_title_snapshot: 'Lesson B',
                    status: 'incomplete',
                    score_raw: null,
                }),
                completionRow({
                    id: 'row-c',
                    lesson_title_snapshot: 'Lesson C',
                    status: 'failed',
                    score_raw: null,
                }),
            ],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        // Status is the 5th <td> in each row (Learner, Lesson, Origin, Source, Status, Score).
        expect(getRowByLessonTitle('Lesson A').cells[4]).toHaveTextContent('Not started');
        expect(getRowByLessonTitle('Lesson B').cells[4]).toHaveTextContent('In progress');
        expect(getRowByLessonTitle('Lesson C').cells[4]).toHaveTextContent('Completed');
    });

    it('shows the source institution for custom-origin lessons', async () => {
        mockTables({
            learners: [learnerRow()],
            completions: [
                completionRow({
                    lesson_origin_snapshot: 'custom',
                    source_institution_snapshot: 'Springfield General Hospital',
                }),
            ],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(
            getRowByLessonTitle('Hand Hygiene Basics').cells[3]
        ).toHaveTextContent('Springfield General Hospital');
    });

    it('falls back to "Unknown" for a custom lesson with no recorded source institution', async () => {
        mockTables({
            learners: [learnerRow()],
            completions: [
                completionRow({
                    lesson_origin_snapshot: 'custom',
                    source_institution_snapshot: null,
                }),
            ],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(getRowByLessonTitle('Hand Hygiene Basics').cells[3]).toHaveTextContent('Unknown');
    });

    it('shows an em dash for the source column on Elsevier-origin lessons', async () => {
        mockTables({
            learners: [learnerRow()],
            completions: [completionRow({ lesson_origin_snapshot: 'elsevier' })],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(getRowByLessonTitle('Hand Hygiene Basics').cells[3]).toHaveTextContent('—');
    });

    it('renders an empty table body when there are no learners or completions', async () => {
        mockTables({ learners: [], completions: [] });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryAllByRole('row')).toHaveLength(1); // header row only
    });

    it('handles a null data response without crashing', async () => {
        mockTables({ learners: null as unknown as unknown[], completions: null as unknown as unknown[] });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByRole('table')).toBeInTheDocument();
    });
});
