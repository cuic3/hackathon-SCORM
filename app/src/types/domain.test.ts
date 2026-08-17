import { describe, expect, it } from 'vitest';
import { toDisplayStatus } from './domain';

describe('toDisplayStatus', () => {
    it('maps null/undefined/"not-started" to "not-started"', () => {
        expect(toDisplayStatus(null)).toBe('not-started');
        expect(toDisplayStatus(undefined)).toBe('not-started');
        expect(toDisplayStatus('not-started')).toBe('not-started');
    });

    it('maps "incomplete" to "in-progress"', () => {
        expect(toDisplayStatus('incomplete')).toBe('in-progress');
    });

    it('maps every finished status to "completed"', () => {
        expect(toDisplayStatus('completed')).toBe('completed');
        expect(toDisplayStatus('passed')).toBe('completed');
        expect(toDisplayStatus('failed')).toBe('completed');
    });
});
