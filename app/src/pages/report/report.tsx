import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Badge } from '@els/els-react--badge';
// @ts-ignore
import { Button } from '@els/els-react--button';
import { supabase } from '../../utils/supabase';
import { formatScoreCell } from '../../utils/format-score';
import { toDisplayStatus } from '../../types/domain';
import type { CompletionStatus, LessonOrigin } from '../../types/domain';
import './report.scss';

interface ReportRow {
    id: string;
    learnerName: string;
    lessonTitle: string | null;
    origin: LessonOrigin | null;
    sourceInstitution: string | null;
    status: CompletionStatus | null;
    scoreRaw: number | null;
    scoreMin: number | null;
    scoreMax: number | null;
}

const STATUS_LABEL: Record<string, string> = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    completed: 'Completed',
};

// Shared by both the on-screen table and the CSV export so the two can never
// disagree (spec.md §3.3 US-3.6: export reflects exactly what's displayed).
function originText(origin: LessonOrigin | null): string {
    if (origin === 'custom') return 'Custom content';
    if (origin === 'elsevier') return 'Elsevier';
    return '—';
}

function sourceText(row: ReportRow): string {
    return row.origin === 'custom' ? row.sourceInstitution ?? 'Unknown' : '—';
}

function csvCell(value: string): string {
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function buildReportCsv(rows: ReportRow[]): string {
    const header = ['Learner', 'Lesson', 'Origin', 'Source', 'Status', 'Score'];
    const lines = rows.map((row) =>
        [
            row.learnerName,
            row.lessonTitle ?? 'No lessons started yet',
            originText(row.origin),
            sourceText(row),
            STATUS_LABEL[toDisplayStatus(row.status)],
            formatScoreCell(row.status, row.scoreRaw, row.scoreMin, row.scoreMax),
        ]
            .map(csvCell)
            .join(',')
    );
    return [header.join(','), ...lines].join('\r\n');
}

const Report = () => {
    const baseClassName = 'report';
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [{ data: learners }, { data: lessons }, { data: completions }] = await Promise.all([
                supabase.from('profiles').select('id, display_name').eq('role', 'learner').order('display_name'),
                supabase
                    .from('lessons')
                    .select('id, title, origin, source_institution')
                    .eq('is_active', true)
                    .order('title'),
                supabase
                    .from('lesson_completions')
                    .select(
                        'id, learner_id, lesson_id, lesson_title_snapshot, lesson_origin_snapshot, source_institution_snapshot, status, score_raw, score_min, score_max'
                    ),
            ]);

            const learnerNameById = new Map(
                (learners ?? []).map((learner: any) => [learner.id, learner.display_name ?? 'Unknown learner'])
            );
            const completionByLearnerAndLesson = new Map(
                (completions ?? []).map((row: any) => [`${row.learner_id}:${row.lesson_id}`, row])
            );
            const consumedCompletionIds = new Set<string>();
            const rowCountByLearner = new Map<string, number>();
            const nextRows: ReportRow[] = [];

            const pushRow = (learnerId: string | null, row: ReportRow) => {
                if (learnerId) {
                    rowCountByLearner.set(learnerId, (rowCountByLearner.get(learnerId) ?? 0) + 1);
                }
                nextRows.push(row);
            };

            // Every known learner × every active lesson — synthesizes "Not
            // started" (from the live `lessons` row, since there's no
            // snapshot yet) for any pair with no completion, so a learner
            // who's completed lesson A but never touched lesson B still
            // shows lesson B as "Not started" instead of not appearing at
            // all.
            (learners ?? []).forEach((learner: any) => {
                (lessons ?? []).forEach((lesson: any) => {
                    const completion = completionByLearnerAndLesson.get(`${learner.id}:${lesson.id}`);
                    if (completion) {
                        consumedCompletionIds.add(completion.id);
                        pushRow(learner.id, {
                            id: completion.id,
                            learnerName: learnerNameById.get(learner.id) ?? 'Unknown learner',
                            lessonTitle: completion.lesson_title_snapshot,
                            origin: completion.lesson_origin_snapshot,
                            sourceInstitution: completion.source_institution_snapshot,
                            status: completion.status,
                            scoreRaw: completion.score_raw,
                            scoreMin: completion.score_min,
                            scoreMax: completion.score_max,
                        });
                    } else {
                        pushRow(learner.id, {
                            id: `not-started-${learner.id}-${lesson.id}`,
                            learnerName: learnerNameById.get(learner.id) ?? 'Unknown learner',
                            lessonTitle: lesson.title,
                            origin: lesson.origin,
                            sourceInstitution: lesson.source_institution,
                            status: 'not-started',
                            scoreRaw: null,
                            scoreMin: null,
                            scoreMax: null,
                        });
                    }
                });
            });

            // Completions the grid above didn't cover — the lesson has since
            // been deactivated/superseded (so it's missing from the active
            // `lessons` list), or the completion's learner_id no longer
            // matches a role='learner' profile. Still shown, using their own
            // frozen snapshot fields, so a recorded completion is never lost
            // (spec.md US-4.1).
            (completions ?? [])
                .filter((row: any) => !consumedCompletionIds.has(row.id))
                .forEach((row: any) => {
                    pushRow(row.learner_id, {
                        id: row.id,
                        learnerName: learnerNameById.get(row.learner_id) ?? 'Unknown learner',
                        lessonTitle: row.lesson_title_snapshot,
                        origin: row.lesson_origin_snapshot,
                        sourceInstitution: row.source_institution_snapshot,
                        status: row.status,
                        scoreRaw: row.score_raw,
                        scoreMin: row.score_min,
                        scoreMax: row.score_max,
                    });
                });

            // A learner who ended up with zero rows (no active lessons at
            // all, and no completions) would otherwise vanish from the
            // report entirely — keep them visible.
            (learners ?? [])
                .filter((learner: any) => !rowCountByLearner.get(learner.id))
                .forEach((learner: any) => {
                    nextRows.push({
                        id: `learner-${learner.id}`,
                        learnerName: learnerNameById.get(learner.id) ?? 'Unknown learner',
                        lessonTitle: null,
                        origin: null,
                        sourceInstitution: null,
                        status: null,
                        scoreRaw: null,
                        scoreMin: null,
                        scoreMax: null,
                    });
                });

            setRows(nextRows);
            setLoading(false);
        };
        void load();
    }, []);

    const handleExportCsv = () => {
        const csv = buildReportCsv(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `completion-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={baseClassName}>
            <div className={`${baseClassName}__header`}>
                <div>
                    <h1 id="my-content" tabIndex={-1}>
                        Completion report
                    </h1>
                    <p className={`${baseClassName}__subtitle`}>
                        Elsevier and custom-content completions appear together here,
                        with each record&rsquo;s origin clearly marked.
                    </p>
                </div>
                <Button type="secondary" htmlType="button" onClick={handleExportCsv} disabled={loading}>
                    Export CSV
                </Button>
            </div>

            {loading ? (
                <p>Loading…</p>
            ) : (
                <table className={`${baseClassName}__table`}>
                    <thead>
                        <tr>
                            <th>Learner</th>
                            <th>Lesson</th>
                            <th>Origin</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td>{row.learnerName}</td>
                                <td>{row.lessonTitle ?? 'No lessons started yet'}</td>
                                <td>
                                    {row.origin === 'custom' ? (
                                        <Badge content="Custom content" type="subtle" />
                                    ) : (
                                        originText(row.origin)
                                    )}
                                </td>
                                <td>{sourceText(row)}</td>
                                <td>{STATUS_LABEL[toDisplayStatus(row.status)]}</td>
                                <td>
                                    {formatScoreCell(
                                        row.status,
                                        row.scoreRaw,
                                        row.scoreMin,
                                        row.scoreMax
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Report;
