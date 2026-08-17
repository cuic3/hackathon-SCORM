// Small, hand-rolled extension map — covers everything the SCORM sample
// packages use (html/js/css/xml/images). No `mime` dependency needed.
export const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.xsd': 'application/xml; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

export function mimeTypeFor(path: string): string {
    const dot = path.lastIndexOf('.');
    if (dot === -1) return 'application/octet-stream';
    return MIME_TYPES[path.slice(dot).toLowerCase()] ?? 'application/octet-stream';
}
