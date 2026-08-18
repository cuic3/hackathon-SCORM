---
name: generate-scorm-lessons
description: |
  Author new interactive SCORM 1.2 lesson packages (.zip) for this SCORM demo app.
  Both "Elsevier" and "custom" origin lessons use the identical package format and
  runtime contract (per spec.md's scope update) — this skill generates either flavor.
  Use when asked to add more sample lesson content, generate demo courseware, expand
  the seeded lesson catalog beyond the one golf sample, or author test SCORM packages.
metadata:
  version: 0.1.0
  category: content-authoring
  tags: [scorm, content-generation, hackathon]
---

# Generate SCORM 1.2 lesson content

## Context

This app (`app/`) lets an admin upload a SCORM 1.2 `.zip`, a learner launch/complete it
in a real iframe-hosted runtime, and an educator see the result in a unified report next
to other seeded lessons. Read `spec.md` in full before generating anything —
it is the authoritative source of truth, and this skill must not contradict it.

Per `spec.md` §3.3 ("Scope update"), **both** `elsevier`-origin and
`custom`-origin lessons are packaged and played as real SCORM 1.2 content using the
identical format and runtime pipeline. Origin is purely a `lessons.origin` data-model
distinction (drives the "Custom content" badge and report grouping) — it has no bearing
on package format. Content for either origin is still synthetic/authored-by-the-team
demo material, not sourced from a real system, so this does not violate the "no real CLH
integration" business rule.

## Required package format — read the reference implementation first

Before authoring anything, read these two files in full — they are the ground truth for
what the hosting app actually implements, not a general SCORM 1.2 reference:

- `sample-content/RuntimeBasicCalls_SCORM12/imsmanifest.xml` — manifest structure to copy.
- `sample-content/RuntimeBasicCalls_SCORM12/shared/scormfunctions.js` — the exact API
  discovery + wrapper pattern (`findAPI`/`getAPI`, `ScormProcessInitialize/Finish/GetValue/SetValue`)
  that generated content must reuse. Don't reinvent SCORM plumbing — copy this file
  as-is into each generated package's `shared/` folder and call its wrapper functions
  from your own page JS, exactly like `shared/launchpage.html` does.
- `app/src/utils/scorm-manifest.ts` — the exact manifest parser the site runs on upload.
  It requires: a root-level `imsmanifest.xml`; an `<organizations>` element (with
  optional `default` attribute); at least one `<organization>` with a `<title>`; that
  organization's first `<item identifierref="...">`; and a `<resource identifier="..."
  href="...">` matching that ref, whose `href` is the launch page path. If any of these
  are missing, the site rejects the upload — verify your generated manifest satisfies
  this exactly, don't just eyeball it against a generic SCORM reference.
- `app/src/utils/scorm-api-adapter.ts` — the **host-side** API adapter. It only
  implements these `cmi.*` elements — anything else returns SCORM error `401` (not
  implemented):
  - `cmi.core.lesson_status` (values: `not attempted` | `incomplete` | `completed` |
    `passed` | `failed`)
  - `cmi.core.lesson_location` (bookmark string)
  - `cmi.core.entry`, `cmi.core.exit` (`""` | `"suspend"`)
  - `cmi.core.session_time`
  - `cmi.core.score.raw` / `.min` / `.max` (0–100 scale)
  - `cmi.core.student_id` / `.student_name` (read-only)
  - `cmi.suspend_data`
  Generated content MUST stick to this exact element set. Do not use `cmi.objectives.*`,
  `cmi.interactions.*`, or any SCORM 2004-only elements — this is a SCORM 1.2 app and the
  adapter has no support for anything beyond the list above.

## What to generate

For each lesson, produce a `.zip` containing:
- `imsmanifest.xml` at the root (single SCO, matching the structure above).
- A launch HTML page (any path, referenced by the manifest's `href`) that calls
  `ScormProcessInitialize()` on load and `ScormProcessFinish()` on unload (reusing the
  copied `scormfunctions.js`).
- Real, interactive multi-page content — not a single static page. At minimum: 2-3
  content pages plus one simple assessment/quiz page that computes a score and calls
  `ScormProcessSetValue('cmi.core.score.raw', ...)` /
  `ScormProcessSetValue('cmi.core.lesson_status', 'passed' | 'failed')` based on a
  pass/fail threshold, mirroring `shared/assessmenttemplate.html`'s `RecordTest()`
  pattern in the reference sample.
- Bookmarking: set `cmi.core.lesson_location` on each page navigation, matching the
  reference sample, so the site's resume-from-bookmark behavior (spec US-2.4) works
  against generated content too.

Topic guidance: match the clinical/nursing education theme already established in the
seed data (`Hand Hygiene Basics`, `Early Recognition of Sepsis`, `Medication Safety
Fundamentals`, `Infection Control Documentation` are the existing Elsevier-flavored
titles — either produce real content for these exact topics, or pick new but thematically
consistent ones; note any new titles clearly in your summary rather than colliding with
the existing seed rows). For custom-flavored lessons, any believable
organization-uploaded training topic is fine (onboarding, safety training, etc.) — these
represent what a CLH customer would upload themselves.

## Deliverables

1. Write each generated package as its own `.zip` under a clearly-named output directory
   (e.g. `sample-content/generated/`), one file per lesson.
2. Produce a short summary (title, intended origin, brief description, approximate
   duration, whether it includes a scored assessment) for every package generated.
3. Do not modify app code, the Supabase schema, or seed data yourself as part of this
   skill — generating content is a separate step from wiring it into the site:
   - **Custom-flavored** packages are meant to be uploaded through the existing Admin
     Upload UI (`/admin/upload`) by a human, exactly like any customer-supplied package
     — just hand off the file paths.
   - **Elsevier-flavored** packages additionally need a `lessons` row inserted
     (`origin='elsevier'`, `package_id`, `launch_path` set to match the uploaded
     package) — flag this as a required follow-up step rather than doing it yourself,
     unless the requester explicitly also asks you to seed it into the database.

## Verification before handing off

- Confirm each zip has `imsmanifest.xml` at its root (not nested in a subfolder) — this
  is the exact check `app/src/utils/scorm-manifest.ts` performs, and the #1 way
  generated packages fail silently.
- Confirm the manifest's `href` path actually resolves to a real file inside the same
  zip.
- If you can run the app locally, the fastest real check is to actually upload one
  generated package through `/admin/upload` and launch it as the learner — per this
  repo's `hackathon-workflow` skill, "mock screens do not satisfy the brief," and the
  same standard applies to generated test content: prove it loads and plays for real
  before calling the task done.