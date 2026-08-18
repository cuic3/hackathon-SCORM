import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
    loadScormPackage,
    MISSING_MANIFEST_ERROR,
    parseManifest,
} from './scorm-manifest';

function manifestXml({
    organizationsDefault = 'ORG-1',
    organizations = `
        <organization identifier="ORG-1">
            <title>Golf Etiquette</title>
            <item identifierref="RES-1" />
        </organization>
    `,
    resources = `
        <resource identifier="RES-1" href="index.html" />
    `,
    schemaVersion = '1.2',
}: {
    organizationsDefault?: string | null;
    organizations?: string;
    resources?: string;
    schemaVersion?: string | null;
} = {}): string {
    const defaultAttr =
        organizationsDefault === null ? '' : `default="${organizationsDefault}"`;
    const metadata =
        schemaVersion === null
            ? ''
            : `<metadata><schema>ADL SCORM</schema><schemaversion>${schemaVersion}</schemaversion></metadata>`;
    return `<?xml version="1.0"?>
<manifest identifier="COURSE-1" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
    ${metadata}
    <organizations ${defaultAttr}>
        ${organizations}
    </organizations>
    <resources>
        ${resources}
    </resources>
</manifest>`;
}

describe('parseManifest', () => {
    it('extracts the title and launch path from a well-formed manifest', () => {
        const result = parseManifest(manifestXml());
        expect(result).toEqual({ title: 'Golf Etiquette', launchPath: 'index.html' });
    });

    it('trims whitespace from the title', () => {
        const result = parseManifest(
            manifestXml({
                organizations: `
                    <organization identifier="ORG-1">
                        <title>   Padded Title   </title>
                        <item identifierref="RES-1" />
                    </organization>
                `,
            })
        );
        expect(result.title).toBe('Padded Title');
    });

    it('returns a null title when no <title> element is present', () => {
        const result = parseManifest(
            manifestXml({
                organizations: `
                    <organization identifier="ORG-1">
                        <item identifierref="RES-1" />
                    </organization>
                `,
            })
        );
        expect(result.title).toBeNull();
    });

    it('selects the organization matching organizations/@default', () => {
        const result = parseManifest(
            manifestXml({
                organizationsDefault: 'ORG-2',
                organizations: `
                    <organization identifier="ORG-1">
                        <title>First</title>
                        <item identifierref="RES-1" />
                    </organization>
                    <organization identifier="ORG-2">
                        <title>Second</title>
                        <item identifierref="RES-1" />
                    </organization>
                `,
            })
        );
        expect(result.title).toBe('Second');
    });

    it('falls back to the first organization when @default is absent', () => {
        const result = parseManifest(
            manifestXml({
                organizationsDefault: null,
                organizations: `
                    <organization identifier="ORG-1">
                        <title>First</title>
                        <item identifierref="RES-1" />
                    </organization>
                    <organization identifier="ORG-2">
                        <title>Second</title>
                        <item identifierref="RES-1" />
                    </organization>
                `,
            })
        );
        expect(result.title).toBe('First');
    });

    it('falls back to the first organization when @default references an unknown id', () => {
        const result = parseManifest(
            manifestXml({
                organizationsDefault: 'NOPE',
                organizations: `
                    <organization identifier="ORG-1">
                        <title>First</title>
                        <item identifierref="RES-1" />
                    </organization>
                `,
            })
        );
        expect(result.title).toBe('First');
    });

    it('accepts a manifest that declares schema version 1.2', () => {
        expect(() => parseManifest(manifestXml({ schemaVersion: '1.2' }))).not.toThrow();
    });

    it('rejects a SCORM 1.1 manifest', () => {
        expect(() => parseManifest(manifestXml({ schemaVersion: '1.1' }))).toThrow(
            'This app only supports SCORM 1.2 packages. Found schema version "1.1".'
        );
    });

    it('rejects a SCORM 2004 manifest', () => {
        expect(() => parseManifest(manifestXml({ schemaVersion: '2004 3rd Edition' }))).toThrow(
            'This app only supports SCORM 1.2 packages. Found schema version "2004 3rd Edition".'
        );
    });

    it('rejects a manifest with no <schemaversion> element at all', () => {
        expect(() => parseManifest(manifestXml({ schemaVersion: null }))).toThrow(
            'This app only supports SCORM 1.2 packages. Found schema version "unknown".'
        );
    });

    it('trims whitespace around the schema version before comparing', () => {
        expect(() => parseManifest(manifestXml({ schemaVersion: '  1.2  ' }))).not.toThrow();
    });

    it('throws when the XML is not well-formed', () => {
        expect(() => parseManifest('<manifest><unterminated>')).toThrow(
            "This SCORM package's imsmanifest.xml could not be parsed."
        );
    });

    it('throws when there are no organization elements', () => {
        expect(() =>
            parseManifest(`<?xml version="1.0"?>
<manifest><metadata><schemaversion>1.2</schemaversion></metadata><organizations></organizations><resources></resources></manifest>`)
        ).toThrow("This SCORM package's manifest doesn't specify a launchable file.");
    });

    it('throws when the organization has no item element', () => {
        expect(() =>
            parseManifest(
                manifestXml({
                    organizations: `<organization identifier="ORG-1"><title>No item</title></organization>`,
                })
            )
        ).toThrow("This SCORM package's manifest doesn't specify a launchable file.");
    });

    it('throws when the item has no identifierref', () => {
        expect(() =>
            parseManifest(
                manifestXml({
                    organizations: `
                        <organization identifier="ORG-1">
                            <title>No ref</title>
                            <item />
                        </organization>
                    `,
                })
            )
        ).toThrow("This SCORM package's manifest doesn't specify a launchable file.");
    });

    it('throws when the referenced resource does not exist', () => {
        expect(() =>
            parseManifest(
                manifestXml({
                    organizations: `
                        <organization identifier="ORG-1">
                            <title>Dangling ref</title>
                            <item identifierref="MISSING" />
                        </organization>
                    `,
                })
            )
        ).toThrow("This SCORM package's manifest doesn't specify a launchable file.");
    });

    it('throws when the resource has no href', () => {
        expect(() =>
            parseManifest(manifestXml({ resources: `<resource identifier="RES-1" />` }))
        ).toThrow("This SCORM package's manifest doesn't specify a launchable file.");
    });
});

describe('loadScormPackage', () => {
    async function zipToFile(zip: JSZip, name = 'package.zip'): Promise<File> {
        const blob = await zip.generateAsync({ type: 'blob' });
        return new File([blob], name, { type: 'application/zip' });
    }

    it('parses the manifest from a valid SCORM zip', async () => {
        const zip = new JSZip();
        zip.file('imsmanifest.xml', manifestXml());
        zip.file('index.html', '<html></html>');
        const file = await zipToFile(zip);

        const result = await loadScormPackage(file);
        expect(result.manifest).toEqual({ title: 'Golf Etiquette', launchPath: 'index.html' });
        expect(result.zip.file('index.html')).not.toBeNull();
    });

    it('throws MISSING_MANIFEST_ERROR when imsmanifest.xml is absent', async () => {
        const zip = new JSZip();
        zip.file('index.html', '<html></html>');
        const file = await zipToFile(zip);

        await expect(loadScormPackage(file)).rejects.toThrow(MISSING_MANIFEST_ERROR);
    });

    it('does not accept a manifest nested in a subfolder as the root manifest', async () => {
        const zip = new JSZip();
        zip.file('subfolder/imsmanifest.xml', manifestXml());
        const file = await zipToFile(zip);

        await expect(loadScormPackage(file)).rejects.toThrow(MISSING_MANIFEST_ERROR);
    });

    it('propagates manifest parse errors for a malformed manifest inside the zip', async () => {
        const zip = new JSZip();
        zip.file('imsmanifest.xml', '<manifest><unterminated>');
        const file = await zipToFile(zip);

        await expect(loadScormPackage(file)).rejects.toThrow(
            "This SCORM package's imsmanifest.xml could not be parsed."
        );
    });
});
