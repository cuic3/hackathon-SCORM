import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQueryBuilder } from '../../test/mocks/supabase';

const fromMock = vi.fn();
vi.mock('../../utils/supabase', () => ({
    supabase: { from: fromMock },
}));

const Report = (await import('./report')).default;

function completionRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'row-1',
        lesson_title_snapshot: 'Hand Hygiene Basics',
        lesson_origin_snapshot: 'elsevier',
        status: 'completed',
        score_raw: 90,
        score_min: 0,
        score_max: 100,
        learner: { display_name: 'Ada Lovelace' },
        ...overrides,
    };
}

function getRowByLessonTitle(title: string) {
    return screen.getByText(title).closest('tr') as HTMLTableRowElement;
}

describe('Report', () => {
    beforeEach(() => {
        fromMock.mockReset();
    });

    it('shows a loading state before data resolves', () => {
        fromMock.mockReturnValue(createQueryBuilder({ data: [], error: null }));
        render(<Report />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('renders a table row per completion with learner, lesson, status and score', async () => {
        fromMock.mockReturnValue(
            createQueryBuilder({
                data: [completionRow()],
                error: null,
            })
        );
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        const row = getRowByLessonTitle('Hand Hygiene Basics');
        expect(within(row).getByText('Ada Lovelace')).toBeInTheDocument();
        expect(within(row).getByText('Elsevier')).toBeInTheDocument();
        expect(within(row).getByText('Completed')).toBeInTheDocument();
        expect(within(row).getByText('90% (90/100)')).toBeInTheDocument();
    });

    it('shows a "Custom content" badge for custom-origin completions', async () => {
        fromMock.mockReturnValue(
            createQueryBuilder({
                data: [completionRow({ lesson_origin_snapshot: 'custom' })],
                error: null,
            })
        );
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('Custom content')).toBeInTheDocument();
    });

    it('falls back to "Unknown learner" when the learner join is null', async () => {
        fromMock.mockReturnValue(
            createQueryBuilder({
                data: [completionRow({ learner: null })],
                error: null,
            })
        );
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByText('Unknown learner')).toBeInTheDocument();
    });

    it('maps every status through toDisplayStatus for the Status column', async () => {
        fromMock.mockReturnValue(
            createQueryBuilder({
                data: [
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
                error: null,
            })
        );
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        // Status is the 4th <td> in each row (Learner, Lesson, Origin, Status, Score).
        expect(getRowByLessonTitle('Lesson A').cells[3]).toHaveTextContent('Not started');
        expect(getRowByLessonTitle('Lesson B').cells[3]).toHaveTextContent('In progress');
        expect(getRowByLessonTitle('Lesson C').cells[3]).toHaveTextContent('Completed');
    });

    it('renders an empty table body when there are no completions', async () => {
        fromMock.mockReturnValue(createQueryBuilder({ data: [], error: null }));
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryAllByRole('row')).toHaveLength(1); // header row only
    });

    it('handles a null data response without crashing', async () => {
        fromMock.mockReturnValue(createQueryBuilder({ data: null, error: { message: 'boom' } }));
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.getByRole('table')).toBeInTheDocument();
    });
});
