import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

// Exercises spec.md §3.3 US-3.6 against the real live Supabase project and a
// real browser download — the thing report.test.tsx's jsdom suite (T38)
// can't prove, since jsdom stubs URL.createObjectURL and never performs an
// actual file save. See tasks.md T39.

const EDUCATOR_EMAIL = process.env.E2E_EDUCATOR_EMAIL;
const EDUCATOR_PASSWORD = process.env.E2E_EDUCATOR_PASSWORD;

test.skip(
    !EDUCATOR_EMAIL || !EDUCATOR_PASSWORD,
    'E2E_EDUCATOR_EMAIL / E2E_EDUCATOR_PASSWORD not set in app/.env — see README/CLAUDE.md for the seeded educator account.'
);

test('educator can export the unified report as a real CSV download', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EDUCATOR_EMAIL!);
    await page.getByLabel('Password').fill(EDUCATOR_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/report$/);
    await expect(page.getByRole('table')).toBeVisible();
    // Report data (`report.tsx`'s Supabase fetch) resolves after the initial
    // render — the Export CSV button is disabled until it does.
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export CSV' }).click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^completion-report-\d{4}-\d{2}-\d{2}\.csv$/);

    const downloadPath = await download.path();
    const csv = await fs.readFile(downloadPath!, 'utf-8');
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('Learner,Lesson,Origin,Source,Status,Score');
    // Live seed data always has at least the seeded Elsevier rows (plan.md
    // §2.1) — a header-only file here would mean the report query broke.
    expect(lines.length).toBeGreaterThan(1);
});
