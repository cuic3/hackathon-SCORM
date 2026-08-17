import { describe, expect, it } from 'vitest';
import { formatScoreCell } from './format-score';

describe('formatScoreCell', () => {
    it('returns "Not started" when status is null', () => {
        expect(formatScoreCell(null, null, null, null)).toBe('Not started');
    });

    it('returns "Not started" when status is undefined', () => {
        expect(formatScoreCell(undefined, null, null, null)).toBe('Not started');
    });

    it('returns "Not started" when status is "not-started"', () => {
        expect(formatScoreCell('not-started', 50, 0, 100)).toBe('Not started');
    });

    it('returns "In progress" when incomplete with no reported score', () => {
        expect(formatScoreCell('incomplete', null, null, null)).toBe('In progress');
    });

    it('returns "Completed — no score reported" for a finished status with no score', () => {
        expect(formatScoreCell('completed', null, null, null)).toBe(
            'Completed — no score reported'
        );
        expect(formatScoreCell('passed', null, null, null)).toBe(
            'Completed — no score reported'
        );
        expect(formatScoreCell('failed', null, null, null)).toBe(
            'Completed — no score reported'
        );
    });

    it('treats score undefined the same as null', () => {
        expect(formatScoreCell('completed', undefined as unknown as null, null, null)).toBe(
            'Completed — no score reported'
        );
    });

    it('defaults min/max to 0/100 when not provided', () => {
        expect(formatScoreCell('completed', 78, null, null)).toBe('78% (78/100)');
    });

    it('computes percentage against a custom min/max range', () => {
        expect(formatScoreCell('passed', 45, 0, 50)).toBe('90% (45/50)');
    });

    it('rounds the computed percentage', () => {
        // (1/3)*100 = 33.33...
        expect(formatScoreCell('completed', 1, 0, 3)).toBe('33% (1/3)');
    });

    it('falls back to rounding the raw value when max <= min', () => {
        expect(formatScoreCell('completed', 55, 10, 10)).toBe('55% (55/10)');
        expect(formatScoreCell('completed', 55.6, 10, 5)).toBe('56% (55.6/5)');
    });

    it('handles a raw score of zero as a real value, not a missing one', () => {
        expect(formatScoreCell('failed', 0, 0, 100)).toBe('0% (0/100)');
    });

    it('handles negative raw scores without throwing', () => {
        expect(formatScoreCell('failed', -10, 0, 100)).toBe('-10% (-10/100)');
    });
});
