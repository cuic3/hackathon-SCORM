import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mimeTypeFor } from '../src/utils/mime-types';

export interface ScormContentProxyOptions {
    supabaseUrl: string;
    serviceRoleKey: string;
}

/**
 * Serves uploaded SCORM package files (stored in the private `content` Storage
 * bucket) same-origin with the app, at /content/{packageId}/{relativePath}.
 *
 * This exists because SCORM 1.2's API-discovery convention (`findAPI()` in
 * shared/scormfunctions.js) walks `window.parent` looking for `window.API`
 * with no error handling — if the SCO iframe were pointed directly at a
 * Storage URL (a different origin), that access throws SecurityError and
 * discovery crashes outright. Serving through this same-origin proxy instead
 * keeps `window.parent.API` accessible and preserves the package's real
 * relative-path navigation between its internal pages/assets.
 */
export function scormContentProxy(options: ScormContentProxyOptions): Plugin {
    const { supabaseUrl, serviceRoleKey } = options;
    let warned = false;

    const handler = async (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void
    ) => {
        if (!req.url || !req.url.startsWith('/content/')) {
            next();
            return;
        }

        if (!serviceRoleKey) {
            if (!warned) {
                // eslint-disable-next-line no-console
                console.warn(
                    '[scorm-content-proxy] SUPABASE_SERVICE_ROLE_KEY is not set in app/.env — uploaded lesson content cannot be served.'
                );
                warned = true;
            }
            res.statusCode = 500;
            res.end('Server is missing SUPABASE_SERVICE_ROLE_KEY.');
            return;
        }

        // Strip query string before mapping to a Storage path or mime type —
        // the sample package requests e.g. assessmenttemplate.html?questions=...
        const pathname = new URL(req.url, 'http://internal').pathname;
        const objectPath = pathname.replace(/^\/content\//, '');
        const segments = objectPath.split('/');
        if (objectPath === '' || segments.some((segment) => segment === '..')) {
            res.statusCode = 400;
            res.end('Invalid content path');
            return;
        }

        const storageUrl = `${supabaseUrl}/storage/v1/object/content/${objectPath}`;
        try {
            const upstream = await fetch(storageUrl, {
                headers: {
                    Authorization: `Bearer ${serviceRoleKey}`,
                    apikey: serviceRoleKey,
                },
            });

            if (!upstream.ok) {
                res.statusCode = upstream.status === 404 ? 404 : 502;
                res.end(`Content not found: ${objectPath}`);
                return;
            }

            const buffer = Buffer.from(await upstream.arrayBuffer());
            res.statusCode = 200;
            res.setHeader('Content-Type', mimeTypeFor(objectPath));
            res.setHeader('Content-Length', String(buffer.length));
            res.end(buffer);
        } catch {
            res.statusCode = 502;
            res.end('Failed to fetch package content');
        }
    };

    const install = (server: ViteDevServer | PreviewServer) => {
        server.middlewares.use((req, res, next) => {
            void handler(req, res, next);
        });
    };

    return {
        name: 'scorm-content-proxy',
        configureServer(server) {
            install(server);
        },
        configurePreviewServer(server) {
            install(server);
        },
    };
}
