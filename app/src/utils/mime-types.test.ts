import { describe, expect, it } from 'vitest';
import { mimeTypeFor, MIME_TYPES } from './mime-types';

describe('mimeTypeFor', () => {
    it('returns the correct mime type for every entry in the map', () => {
        Object.entries(MIME_TYPES).forEach(([ext, mime]) => {
            expect(mimeTypeFor(`file${ext}`)).toBe(mime);
        });
    });

    it('is case-insensitive on the extension', () => {
        expect(mimeTypeFor('IMAGE.JPG')).toBe('image/jpeg');
        expect(mimeTypeFor('Page.HTML')).toBe('text/html; charset=utf-8');
    });

    it('resolves nested paths using only the basename extension', () => {
        expect(mimeTypeFor('shared/scripts/scormfunctions.js')).toBe(
            'application/javascript; charset=utf-8'
        );
    });

    it('uses the last extension for multi-dot filenames', () => {
        expect(mimeTypeFor('archive.tar.gz')).toBe('application/octet-stream');
        expect(mimeTypeFor('archive.tar.xml')).toBe('application/xml; charset=utf-8');
    });

    it('returns octet-stream for unknown extensions', () => {
        expect(mimeTypeFor('file.unknownext')).toBe('application/octet-stream');
    });

    it('returns octet-stream when there is no extension at all', () => {
        expect(mimeTypeFor('README')).toBe('application/octet-stream');
    });

    it('returns octet-stream for a filename ending in a bare dot', () => {
        expect(mimeTypeFor('file.')).toBe('application/octet-stream');
    });

    it('handles an empty string without throwing', () => {
        expect(mimeTypeFor('')).toBe('application/octet-stream');
    });

    it('handles a dotfile with no extension (leading dot only)', () => {
        // lastIndexOf('.') === 0, slice(0) === '.htaccess' which isn't in the map
        expect(mimeTypeFor('.htaccess')).toBe('application/octet-stream');
    });
});
