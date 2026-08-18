import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const elsMock = path.resolve(import.meta.dirname, 'src/test/mocks/els-components.tsx');

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@els/els-react--card': elsMock,
            '@els/els-react--button': elsMock,
            '@els/els-react--badge': elsMock,
            '@els/els-react--pill': elsMock,
            '@els/els-react--icon': elsMock,
            '@els/els-react--header': elsMock,
            '@els/els-react--footer': elsMock,
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        css: false,
        restoreMocks: true,
        // e2e/ holds real-browser Playwright specs (npm run test:e2e), not
        // Vitest tests — its `test`/`expect` come from @playwright/test and
        // aren't compatible with Vitest's runner.
        exclude: [...configDefaults.exclude, 'e2e/**'],
    },
});
