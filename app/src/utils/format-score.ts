import type { CompletionStatus } from '../types/domain';

/**
 * Score display rule (spec MUST): always show percentage + raw value together,
 * e.g. "78% (78/100)". A finished lesson with no reported score must show
 * "Completed — no score reported", never a blank/dash.
 */
export function formatScoreCell(
    status: CompletionStatus | null | undefined,
    raw: number | null,
    min: number | null,
    max: number | null
): string {
    if (!status || status === 'not-started') return 'Not started';

    if (raw === null || raw === undefined) {
        return status === 'incomplete'
            ? 'In progress — no score yet'
            : 'Completed — no score reported';
    }

    const effectiveMin = min ?? 0;
    const effectiveMax = max ?? 100;
    const pct =
        effectiveMax > effectiveMin
            ? Math.round(((raw - effectiveMin) / (effectiveMax - effectiveMin)) * 100)
            : Math.round(raw);

    return `${pct}% (${raw}/${effectiveMax})`;
}
