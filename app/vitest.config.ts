import { defineConfig } from 'vitest/config';
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
    },
});
