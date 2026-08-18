import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Same convention as scripts/seed-elsevier-content.mjs's `node --env-file=.env` —
// loads app/.env directly rather than adding a dotenv dependency.
process.loadEnvFile(path.resolve(import.meta.dirname, '.env'));

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
    },
});
