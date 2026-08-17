// Uploads generated SCORM 1.2 packages to Supabase Storage and backfills the
// matching `lessons` rows' package_id/launch_path/manifest_title.
//
// Run from `app/`: node --env-file=.env scripts/seed-elsevier-content.mjs
//
// Uses the service-role key server-side only (bypasses RLS, same trust model
// as vite-plugins/scorm-content-proxy.ts) — never exposed to the browser.
// Safe to re-run: uploads use upsert:true and the DB write is a plain UPDATE.

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { createClient } from '@supabase/supabase-js';

// Mirrors app/src/utils/mime-types.ts's small hand-rolled extension map.
const MIME_TYPES = {
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

function mimeTypeFor(path) {
    const dot = path.lastIndexOf('.');
    if (dot === -1) return 'application/octet-stream';
    return MIME_TYPES[path.slice(dot).toLowerCase()] ?? 'application/octet-stream';
}

// Known seeded Elsevier lesson rows (origin='elsevier', package_id/launch_path
// currently null) — ids confirmed via a live query against the project.
// launchPath/manifestTitle taken from the generate-scorm-lessons skill's own
// generation summary, not re-parsed from XML here (avoids adding a Node XML
// parser dependency for this one-off/occasional-use script).
const PACKAGES = [
    {
        lessonId: '55555555-5555-5555-5555-555555555551',
        title: 'Hand Hygiene Basics',
        zipPath: '../../sample-content/generated/hand-hygiene-basics.zip',
        launchPath: 'shared/launchpage.html',
        manifestTitle: 'Hand Hygiene Basics',
    },
    {
        lessonId: '55555555-5555-5555-5555-555555555552',
        title: 'Early Recognition of Sepsis',
        zipPath: '../../sample-content/generated/early-recognition-of-sepsis.zip',
        launchPath: 'shared/launchpage.html',
        manifestTitle: 'Early Recognition of Sepsis',
    },
    {
        lessonId: '55555555-5555-5555-5555-555555555553',
        title: 'Medication Safety Fundamentals',
        zipPath: '../../sample-content/generated/medication-safety-fundamentals.zip',
        launchPath: 'shared/launchpage.html',
        manifestTitle: 'Medication Safety Fundamentals',
    },
    {
        lessonId: '55555555-5555-5555-5555-555555555554',
        title: 'Infection Control Documentation',
        zipPath: '../../sample-content/generated/infection-control-documentation.zip',
        launchPath: 'shared/launchpage.html',
        manifestTitle: 'Infection Control Documentation',
    },
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run with --env-file=.env from app/).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
});

async function uploadPackage(packageId, zip) {
    const entries = Object.entries(zip.files).filter(([, entry]) => !entry.dir);
    for (const [relativePath, entry] of entries) {
        const buffer = await entry.async('nodebuffer');
        const { error } = await supabase.storage
            .from('content')
            .upload(`${packageId}/${relativePath}`, buffer, {
                contentType: mimeTypeFor(relativePath),
                upsert: true,
            });
        if (error) throw new Error(`Failed to upload ${relativePath}: ${error.message}`);
    }
}

async function seedOne(pkg) {
    const zipBuffer = await readFile(resolve(import.meta.dirname, pkg.zipPath));
    const zip = await JSZip.loadAsync(zipBuffer);
    const packageId = randomUUID();

    await uploadPackage(packageId, zip);

    const { error } = await supabase
        .from('lessons')
        .update({
            package_id: packageId,
            launch_path: pkg.launchPath,
            manifest_title: pkg.manifestTitle,
        })
        .eq('id', pkg.lessonId);
    if (error) throw new Error(`Failed to update lesson row ${pkg.lessonId}: ${error.message}`);

    return packageId;
}

let failures = 0;
for (const pkg of PACKAGES) {
    try {
        const packageId = await seedOne(pkg);
        console.log(`OK   ${pkg.title} -> package_id=${packageId}`);
    } catch (error) {
        failures += 1;
        console.error(`FAIL ${pkg.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

if (failures > 0) {
    console.error(`${failures} of ${PACKAGES.length} package(s) failed.`);
    process.exit(1);
}
console.log(`All ${PACKAGES.length} packages seeded successfully.`);
