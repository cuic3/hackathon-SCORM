import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Badge } from '@els/els-react--badge';
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

const Report = () => {
    const baseClassName = 'report';
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [{ data: learners }, { data: completions }] = await Promise.all([
                supabase.from('profiles').select('id, display_name').eq('role', 'learner'),
                supabase
                    .from('lesson_completions')
                    .select(
                        'id, learner_id, lesson_title_snapshot, lesson_origin_snapshot, source_institution_snapshot, status, score_raw, score_min, score_max'
                    )
                    .order('lesson_title_snapshot'),
            ]);

            const completionsByLearner = new Map<string, any[]>();
            (completions ?? []).forEach((row: any) => {
                const existing = completionsByLearner.get(row.learner_id) ?? [];
                existing.push(row);
                completionsByLearner.set(row.learner_id, existing);
            });

            const knownLearnerIds = new Set((learners ?? []).map((learner: any) => learner.id));

            const nextRows: ReportRow[] = [];
            (learners ?? []).forEach((learner: any) => {
                const learnerCompletions = completionsByLearner.get(learner.id) ?? [];
                if (learnerCompletions.length === 0) {
                    nextRows.push({
                        id: `learner-${learner.id}`,
                        learnerName: learner.display_name ?? 'Unknown learner',
                        lessonTitle: null,
                        origin: null,
                        sourceInstitution: null,
                        status: null,
                        scoreRaw: null,
                        scoreMin: null,
                        scoreMax: null,
                    });
                    return;
                }
                learnerCompletions.forEach((row) => {
                    nextRows.push({
                        id: row.id,
                        learnerName: learner.display_name ?? 'Unknown learner',
                        lessonTitle: row.lesson_title_snapshot,
                        origin: row.lesson_origin_snapshot,
                        sourceInstitution: row.source_institution_snapshot,
                        status: row.status,
                        scoreRaw: row.score_raw,
                        scoreMin: row.score_min,
                        scoreMax: row.score_max,
                    });
                });
            });

            (completions ?? [])
                .filter((row: any) => !knownLearnerIds.has(row.learner_id))
                .forEach((row: any) => {
                    nextRows.push({
                        id: row.id,
                        learnerName: 'Unknown learner',
                        lessonTitle: row.lesson_title_snapshot,
                        origin: row.lesson_origin_snapshot,
                        sourceInstitution: row.source_institution_snapshot,
                        status: row.status,
                        scoreRaw: row.score_raw,
                        scoreMin: row.score_min,
                        scoreMax: row.score_max,
                    });
                });

            setRows(nextRows);
            setLoading(false);
        };
        void load();
    }, []);

    return (
        <div className={baseClassName}>
            <h1 id="my-content" tabIndex={-1}>
                Completion report
            </h1>
            <p className={`${baseClassName}__subtitle`}>
                Elsevier and custom-content completions appear together here,
                with each record&rsquo;s origin clearly marked.
            </p>

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
                                    ) : row.origin === 'elsevier' ? (
                                        'Elsevier'
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td>
                                    {row.origin === 'custom'
                                        ? row.sourceInstitution ?? 'Unknown'
                                        : '—'}
                                </td>
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
