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
    lessonTitle: string;
    origin: LessonOrigin;
    sourceInstitution: string | null;
    status: CompletionStatus;
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
            const { data } = await supabase
                .from('lesson_completions')
                .select(
                    'id, lesson_title_snapshot, lesson_origin_snapshot, source_institution_snapshot, status, score_raw, score_min, score_max, learner:profiles!lesson_completions_learner_id_fkey(display_name)'
                )
                .order('lesson_title_snapshot');

            setRows(
                (data ?? []).map((row: any) => ({
                    id: row.id,
                    learnerName: row.learner?.display_name ?? 'Unknown learner',
                    lessonTitle: row.lesson_title_snapshot,
                    origin: row.lesson_origin_snapshot,
                    sourceInstitution: row.source_institution_snapshot,
                    status: row.status,
                    scoreRaw: row.score_raw,
                    scoreMin: row.score_min,
                    scoreMax: row.score_max,
                }))
            );
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
                                <td>{row.lessonTitle}</td>
                                <td>
                                    {row.origin === 'custom' ? (
                                        <Badge content="Custom content" type="subtle" />
                                    ) : (
                                        'Elsevier'
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
