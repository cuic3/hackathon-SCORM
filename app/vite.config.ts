import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { scormContentProxy } from './vite-plugins/scorm-content-proxy';

export default defineConfig(({ mode }) => {
    // Third arg '' loads all env vars regardless of VITE_ prefix — needed to
    // read SUPABASE_SERVICE_ROLE_KEY, which must never reach client code.
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            scormContentProxy({
                supabaseUrl: env.VITE_SUPABASE_URL,
                serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
            }),
        ],
        server: {
            port: 5173,
        },
    };
});
