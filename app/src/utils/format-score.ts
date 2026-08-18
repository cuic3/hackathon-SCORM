import type { CompletionStatus } from '../types/domain';

export interface FormatScoreOptions {
    /**
     * "report" (default): the unified educator report — a finished lesson
     * with no reported score shows "Completed — no score reported" (spec.md
     * §3.3), since the row needs to stand on its own without page context.
     * "learner": the learner's own lesson/profile views (lesson.tsx,
     * lesson-card.tsx) — the learner is already looking at their own
     * completed lesson, so "Completed" is redundant; shows "No score
     * reported" instead (spec.md §3.2).
     */
    audience?: 'report' | 'learner';
}

/**
 * Score display rule (spec MUST): always show percentage + raw value together,
 * e.g. "78% (78/100)". A finished lesson with no reported score must never
 * show a blank/dash — see FormatScoreOptions for the exact wording per audience.
 */
export function getScorePercent(raw: number, min: number | null, max: number | null): number {
    const effectiveMin = min ?? 0;
    const effectiveMax = max ?? 100;
    return effectiveMax > effectiveMin
        ? Math.round(((raw - effectiveMin) / (effectiveMax - effectiveMin)) * 100)
        : Math.round(raw);
}

export function formatScoreCell(
    status: CompletionStatus | null | undefined,
    raw: number | null,
    min: number | null,
    max: number | null,
    options: FormatScoreOptions = {}
): string {
    if (!status || status === 'not-started') return 'Not started';

    if (raw === null || raw === undefined) {
        if (status === 'incomplete') return 'In progress';
        return options.audience === 'learner'
            ? 'No score reported'
            : 'Completed — no score reported';
    }

    const effectiveMax = max ?? 100;
    return `${getScorePercent(raw, min, max)}% (${raw}/${effectiveMax})`;
}
