import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
        lesson_id: 'lesson-1',
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

function lessonRow(overrides: Record<string, unknown> = {}) {
    return {
        id: 'lesson-1',
        title: 'Hand Hygiene Basics',
        origin: 'elsevier',
        source_institution: null,
        ...overrides,
    };
}

function mockTables({
    learners = [],
    lessons = [],
    completions = [],
    learnersError = null,
    lessonsError = null,
    completionsError = null,
}: {
    learners?: unknown[];
    lessons?: unknown[];
    completions?: unknown[];
    learnersError?: unknown;
    lessonsError?: unknown;
    completionsError?: unknown;
} = {}) {
    fromMock.mockImplementation((table: string) => {
        if (table === 'profiles') {
            return createQueryBuilder({ data: learners, error: learnersError });
        }
        if (table === 'lessons') {
            return createQueryBuilder({ data: lessons, error: lessonsError });
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

    it('shows "Not started" for an active lesson a learner has never touched, even though they completed a different one', async () => {
        mockTables({
            learners: [learnerRow()],
            lessons: [
                lessonRow({ id: 'lesson-1', title: 'Hand Hygiene Basics' }),
                lessonRow({ id: 'lesson-2', title: 'Sepsis Recognition', origin: 'custom' }),
            ],
            completions: [completionRow({ lesson_id: 'lesson-1', status: 'completed' })],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(
            within(getRowByLessonTitle('Hand Hygiene Basics')).getByText('Completed')
        ).toBeInTheDocument();

        const untouchedRow = getRowByLessonTitle('Sepsis Recognition');
        expect(within(untouchedRow).getByText('Ada Lovelace')).toBeInTheDocument();
        expect(within(untouchedRow).getAllByText('Not started')).toHaveLength(2);
    });

    it('synthesizes a "Not started" row per active lesson for a learner with no completions at all, instead of one placeholder', async () => {
        mockTables({
            learners: [learnerRow({ id: 'learner-2', display_name: 'New Learner' })],
            lessons: [
                lessonRow({ id: 'lesson-1', title: 'Hand Hygiene Basics' }),
                lessonRow({ id: 'lesson-2', title: 'Sepsis Recognition' }),
            ],
            completions: [],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(screen.queryByText('No lessons started yet')).not.toBeInTheDocument();
        expect(
            within(getRowByLessonTitle('Hand Hygiene Basics')).getByText('New Learner')
        ).toBeInTheDocument();
        expect(
            within(getRowByLessonTitle('Sepsis Recognition')).getByText('New Learner')
        ).toBeInTheDocument();
    });

    it('still shows a completion whose lesson has since been deactivated (missing from the active lessons list)', async () => {
        mockTables({
            learners: [learnerRow()],
            lessons: [lessonRow({ id: 'lesson-2', title: 'Sepsis Recognition' })],
            completions: [
                completionRow({
                    lesson_id: 'lesson-1',
                    lesson_title_snapshot: 'Retired Lesson',
                    status: 'completed',
                }),
            ],
        });
        render(<Report />);

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
        expect(
            within(getRowByLessonTitle('Retired Lesson')).getByText('Completed')
        ).toBeInTheDocument();
        // The learner has a real row (their retired-lesson completion), so no
        // spurious "No lessons started yet" placeholder should also appear.
        expect(screen.queryByText('No lessons started yet')).not.toBeInTheDocument();
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

    describe('Export CSV', () => {
        let createObjectURL: ReturnType<typeof vi.fn>;
        let revokeObjectURL: ReturnType<typeof vi.fn>;
        let anchorClickSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            createObjectURL = vi.fn(() => 'blob:mock-url');
            revokeObjectURL = vi.fn();
            // jsdom doesn't implement these — stub them so the download path
            // is exercised without touching a real object URL/anchor.
            (URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL =
                createObjectURL;
            (URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL =
                revokeObjectURL;
            anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        });

        it('is disabled while the report is still loading', () => {
            mockTables({ learners: [], completions: [] });
            render(<Report />);
            expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
        });

        it('downloads a CSV with a header-only row when the report has no data', async () => {
            mockTables({ learners: [], completions: [] });
            render(<Report />);
            await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

            expect(createObjectURL).toHaveBeenCalledTimes(1);
            const blob = createObjectURL.mock.calls[0][0] as Blob;
            expect(blob.type).toBe('text/csv;charset=utf-8;');
            await expect(blob.text()).resolves.toBe('Learner,Lesson,Origin,Source,Status,Score');
            expect(anchorClickSpy).toHaveBeenCalledTimes(1);
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
        });

        it('exports one CSV row per displayed report row with the same formatting shown on screen', async () => {
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

            fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

            const blob = createObjectURL.mock.calls[0][0] as Blob;
            const csv = await blob.text();
            expect(csv).toBe(
                [
                    'Learner,Lesson,Origin,Source,Status,Score',
                    'Ada Lovelace,Hand Hygiene Basics,Custom content,Springfield General Hospital,Completed,90% (90/100)',
                ].join('\r\n')
            );
        });

        it('quotes CSV values that contain a comma', async () => {
            mockTables({
                learners: [learnerRow({ display_name: 'Lovelace, Ada' })],
                completions: [completionRow()],
            });
            render(<Report />);
            await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

            fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

            const blob = createObjectURL.mock.calls[0][0] as Blob;
            const csv = await blob.text();
            expect(csv.split('\r\n')[1]).toMatch(/^"Lovelace, Ada",/);
        });
    });
});
