import JSZip from 'jszip';

export const MISSING_MANIFEST_ERROR =
    "This file doesn't look like a SCORM package (missing imsmanifest.xml)";

export interface ParsedManifest {
    title: string | null;
    launchPath: string;
}

/**
 * Validates a SCORM 1.2 package structure and extracts the launch path +
 * title from imsmanifest.xml. Uses getElementsByTagName (namespace-agnostic)
 * rather than CSS selectors, since the manifest declares a default XML
 * namespace that querySelector doesn't match against. Rejects manifests
 * whose <metadata><schemaversion> isn't exactly "1.2" (e.g. SCORM 1.1 or
 * SCORM 2004 packages).
 */
export function parseManifest(xml: string): ParsedManifest {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('This SCORM package\'s imsmanifest.xml could not be parsed.');
    }

    const schemaVersion = doc.getElementsByTagName('schemaversion')[0]?.textContent?.trim();
    if (schemaVersion !== '1.2') {
        throw new Error(
            `This app only supports SCORM 1.2 packages. Found schema version "${schemaVersion ?? 'unknown'}".`
        );
    }

    const organizationsEl = doc.getElementsByTagName('organizations')[0];
    const defaultOrgId = organizationsEl?.getAttribute('default') ?? null;

    const organizationEls = Array.from(doc.getElementsByTagName('organization'));
    const organizationEl =
        (defaultOrgId &&
            organizationEls.find((el) => el.getAttribute('identifier') === defaultOrgId)) ||
        organizationEls[0];

    if (!organizationEl) {
        throw new Error(
            "This SCORM package's manifest doesn't specify a launchable file."
        );
    }

    const titleEl = organizationEl.getElementsByTagName('title')[0];
    const title = titleEl?.textContent?.trim() || null;

    const itemEl = organizationEl.getElementsByTagName('item')[0];
    const resourceRef = itemEl?.getAttribute('identifierref');
    if (!resourceRef) {
        throw new Error(
            "This SCORM package's manifest doesn't specify a launchable file."
        );
    }

    const resourceEls = Array.from(doc.getElementsByTagName('resource'));
    const resourceEl = resourceEls.find(
        (el) => el.getAttribute('identifier') === resourceRef
    );
    const launchPath = resourceEl?.getAttribute('href');
    if (!launchPath) {
        throw new Error(
            "This SCORM package's manifest doesn't specify a launchable file."
        );
    }

    return { title, launchPath };
}

export interface LoadedPackage {
    zip: JSZip;
    manifest: ParsedManifest;
}

/** Throws MISSING_MANIFEST_ERROR if the zip has no root-level imsmanifest.xml (US-1.4). */
export async function loadScormPackage(file: File): Promise<LoadedPackage> {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const manifestEntry = zip.file('imsmanifest.xml');
    if (!manifestEntry) {
        throw new Error(MISSING_MANIFEST_ERROR);
    }
    const xml = await manifestEntry.async('text');
    const manifest = parseManifest(xml);
    return { zip, manifest };
}
