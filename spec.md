# spec-new.md — Custom Content Uploader (SCORM) — Agent-Consumable Spec

> This document is the authoritative spec for this feature. It is self-contained: do not resolve ambiguity by deferring to another document.

## 0. How to use this document
- Every acceptance criterion (AC) below has a stable ID (`US-x.y`). Use these IDs in commits, PRs, and test names.
- Statements phrased as **MUST / MUST NOT** are hard constraints. Statements phrased as **SHOULD** are strong defaults but not yet confirmed — check §7 (Open Assumptions) before treating them as final.
- Do not implement anything in §6 (Out of Scope) without first updating this document.
- If a value, mapping, or business rule is not explicit here, do not guess — leave a `TODO(spec)` and ask.

## 1. Goal
Build a standalone demonstrator where:
1. An admin uploads a real SCORM 1.2 `.zip` package.
2. A learner launches and completes the real SCORM content (not a mock).
3. A nurse educator views one report showing both seeded Elsevier lesson records and the custom SCORM completion/score, with custom content clearly labeled as custom-origin.

**Definition of done (demo):** one admin upload → one learner completion with score → one unified report showing that result next to seeded Elsevier lesson data, origin unambiguous.

**Why it matters:** 29 CLH customers cannot migrate until they can bring their own SCORM content instead of running a second LMS. This is not stated for narrative color — it is the reason "real SCORM package, real completion, real report" is a hard requirement, not "any working demo."

## 2. System Actors & Entry Points
| Role | Credentials | Entry point / landing view |
|---|---|---|
| Admin | Real login (username/password), synthetic/seeded account | Admin upload view |
| Learner | Real login (username/password), synthetic/seeded account | Available lessons list |
| Nurse educator | Real login (username/password), synthetic/seeded account | Unified report view |

- **MUST**: each role has its own real credential-based login.
- **MUST NOT**: implement SSO (out of scope).
- All accounts, the organisation, and Elsevier lesson records are synthetic/seeded — there is no real CLH integration.

## 3. Functional Requirements by Feature

### 3.1 Upload custom SCORM content (US-1, P1)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-1.1 | A valid SCORM 1.2 `.zip` containing `imsmanifest.xml` | Admin uploads it | Package becomes available as a custom lesson |
| US-1.2 | An uploaded custom lesson | Its origin is displayed anywhere in the UI | It is clearly distinguishable from seeded Elsevier content |

**Validation rule:** a "supported SCORM package" = a ZIP file containing `imsmanifest.xml` at the root the parser expects (see sample package structure in §5).

**Required error message (edge case, verbatim example from spec):**
```
This file doesn't look like a SCORM package (missing imsmanifest.xml)
```
Exact wording is an example, not necessarily verbatim-required, but MUST clearly state the missing-manifest reason.

**Scope addition — source institution (confirmed with Michelle Zuckerberg):** the brief's underlying motivation (§1) is that many different customer institutions each bring their own SCORM content — P1 simplified this to one seeded organization (A3), but a custom-uploaded lesson MAY additionally record which real institution it represents, as a free-text, admin-entered, display-only attribution (e.g. "Johns Hopkins Hospital"). This does not change A3 or require multiple real organizations/logins — it is a label on the lesson, not a data-model change to who can log in or what they can see. No source entered → displays as "Unknown". Only applies to `custom`-origin lessons; Elsevier-origin lessons don't show this field.

### 3.2 Complete a lesson (US-2, P1)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-2.1 | A SCORM 1.2 lesson is available (custom-uploaded or seeded Elsevier content — see §3.3 scope update) | Learner launches it | The real SCORM lesson runs (real runtime, not a mock screen) |
| US-2.2 | Learner completes the lesson; package reports completion + score | Session finishes | Completion and score are recorded for that learner |
| US-2.5 | A lesson is finished but the package reported no score | Learner views their own lesson/profile view | Shows `"No score reported"` (no "Completed —" prefix, distinct from §3.3's report wording — the learner is already looking at their own completed lesson, so restating "Completed" is redundant) |
| US-2.6 | A completed lesson reported a score below 70% | Learner views their available lessons list | The lesson shows a `"Failed"` status (distinct from `"Completed"`) instead of a passing completion, and the launch link reads `"Retake lesson"` instead of `"Review lesson"`, allowing the learner to relaunch it |

**Scope addition — pass/fail threshold (confirmed with Rory Myers):** 70% of `cmi.core.score.raw` (scaled against `.min`/`.max`) is the passing bar for the demo. This applies only to the learner's own lesson-card display (`lesson-card.tsx`) — it does not change what's persisted (the actual reported score/status is still recorded as-is, per §4's "MUST NOT fabricate a completion state or score" rule) and does not add a new `lesson_completions.status` value; "Failed" is a display-only derivation (`score_raw < 70%` of an otherwise `completed` record), not a new stored state. The educator report (§3.3) is unaffected by this AC — it continues to show the raw score/status, not a Failed label.

**Runtime contract (MUST implement, see §5 for full technical detail):**
- Hosting app MUST expose a window-discoverable LMS API object the SCO can find and call (SCORM 1.2 API discovery convention).
- MUST persist `cmi.core.lesson_location` as the bookmark.
- MUST honor `cmi.core.exit == "suspend"` as "incomplete, resumable" — on relaunch, resume from the stored `cmi.core.lesson_location` rather than restarting.
- MUST read score from `cmi.core.score.raw` / `.min` / `.max` (0–100 scale).

### 3.3 Unified completion reporting (US-3, P1)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-3.1 | Seeded Elsevier lesson records + ≥1 completed custom lesson | Educator views the report | Both appear together in the same report |
| US-3.2 | A custom lesson appears in the report | Educator reviews the record | Its custom origin is clearly marked |
| US-3.3 | A learner completed a custom lesson | Report is viewed | Recorded completion and score are visible |
| US-3.6 | The unified report is on screen (any filter/state) | Educator clicks "Export CSV" | A CSV file downloads with one row per currently-displayed report row, same columns and same display formatting as the on-screen table (learner, lesson, origin, source institution, status, score) |

**Scope addition — CSV export (confirmed with Rory Myers, 2026-08-18):** the educator report gets a client-side "Export CSV" action. It exports exactly what's rendered in the table — same rows, same `formatScoreCell`/status-label formatting — not a separate raw-data query, so the CSV can never disagree with what the educator is looking at on screen. No new backend endpoint or stored export record; this is a UI-only addition to §3.3, not a change to what's persisted (§4's "MUST NOT fabricate" rule is unaffected — export only ever reflects rows already computed for display).

**Display rule (MUST):** wherever a score is shown, display both percentage and raw value, e.g. `"78% (78/100)"`. On **this report specifically**: when no score is reported, a completed lesson shows `"Completed — no score reported"` (never blank/dash); an incomplete/in-progress lesson shows `"In progress"`. (On the learner's own lesson/profile view, the no-score wording is shorter — see US-2.5. The two views deliberately say different things for the same underlying state; don't "fix" one to match the other.)

**Seed data requirement:** seed 3–5 Elsevier lesson records with mixed states (some completed with scores, some incomplete, some not started) so the report doesn't look sparse.

**Scope update (confirmed with Rory Myers):** Elsevier-origin lessons are also packaged and played as real SCORM 1.2 content, using the identical format and runtime pipeline as admin-uploaded custom lessons (same `imsmanifest.xml` structure, same `window.API` contract, same content-proxy serving path). This does not change the "synthetic/seeded, no real CLH integration" rule in §4 — the content itself is still authored by the team as demo material, not sourced from a real Elsevier system; it is simply packaged as a genuinely interactive SCO instead of a static completion row. Origin (`elsevier` vs `custom`) remains a data-model distinction (`lessons.origin`, display badge) independent of how the content happens to be authored or delivered.

### 3.4 Preserve recorded completion history (US-4, P1)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-4.1 | A learner has a recorded completion | Related custom content is re-uploaded, deactivated, or otherwise changed | The existing completion record remains available in the report, exactly as before |
| US-4.3 | An active custom lesson | Admin uploads new content via "Replace content" | A new `lessons` row is created (new package/manifest); the old row is deactivated and linked to the new one; any existing completions for the old row are untouched |
| US-4.4 | A deactivated custom lesson that has **not** been replaced/superseded | Admin clicks "Reactivate" | The lesson becomes active again and reappears in the learner's available lessons; a superseded lesson (one replaced via US-4.3) MUST NOT offer this action — it can only be replaced again |
| US-4.5 | A custom lesson | Admin edits title/description/duration via "Edit details" | Metadata updates in place; `package_id`/`launch_path` are never touched by this action (content changes only go through US-4.3) |

**MUST NOT**: ever lose or mutate a recorded completion as a side effect of content management actions (re-upload, deactivate, reactivate, edit).

### 3.5 Learner self-service signup (US-5, NEW)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-5.1 | A prospective learner with no existing account | Submits the signup form with a valid email/password and picks an existing seeded organization | A new learner profile is created against that organization and they can subsequently log in |

**Scope addition — learner self-service signup (confirmed with Claire Cui, 2026-08-18):** `/signup` is not exposed to the public — it is only used to create synthetic/seeded learner accounts against an existing seeded organization, the same category of data §4 already calls synthetic/seeded. It does not conflict with §4's rule; it's a path for producing that same seeded data, not a public-registration feature. Also verified end-to-end: the live Supabase project requires email confirmation, and the confirmation email is delivered and the signup → confirm → login path works.

## 4. Business Rules (cross-cutting)
- **MUST**: demonstrator is standalone — no dependency on / integration with real Clinical Learning Hub.
- **MUST**: only SCORM 1.2 is supported (not 2004, not xAPI, not AICC).
- **MUST**: all org/user/Elsevier-lesson data is synthetic/seeded. (§3.5: learner self-service signup is not public-facing and only ever produces synthetic/seeded accounts against a seeded organization — confirmed consistent with this rule, not an exception to it.)
- **MUST NOT**: fabricate a completion state or score that the package did not report (see Edge Cases, §5).
- **MUST**: at every `metrics.md` checkpoint, log — tasks planned vs. completed; ACs currently passing; any scope/behavior deviation and whether `spec.md` was updated first; one thing AI got right; one thing a human had to fix; and (End of Event only) one concrete "what didn't work."

## 5. Technical / Runtime Notes (from inspecting `sample-content/RuntimeBasicCalls_SCORM12/`)
- The SCO is a multi-page mini-course behind a single launch page: `shared/launchpage.html`.
- That launch page calls the SCORM runtime API directly from JS — the hosting app MUST expose a discoverable LMS API object in the window hierarchy that the SCO can find (standard SCORM 1.2 `ipsvLearning`/API discovery pattern — confirm exact object name against the sample before hardcoding).
- Bookmarking field: `cmi.core.lesson_location`.
- Suspend flag: `cmi.core.exit = "suspend"` set by the package on an incomplete exit.
- Score fields: `cmi.core.score.raw`, `cmi.core.score.min`, `cmi.core.score.max` — 0–100 scale.
- Package validity check: ZIP MUST contain `imsmanifest.xml`.

## 6. Explicitly Out of Scope — do not build without updating this document first
- SCORM 2004 support
- xAPI support
- AICC support
- CE/CPD credit parsing
- Bulk migration tooling
- Draft/version-history workflows
- Scheduled publishing
- Single sign-on (SSO)
- Integration with the real Clinical Learning Hub
- Migration of real customer or learner data
- Multi-package migration or library-scale administration beyond what's needed for the end-to-end demo

## 7. Open Assumptions — do not silently resolve; confirm with owner if a tripwire fires
| ID | Assumption | Owner | Tripwire (when this assumption breaks) |
|---|---|---|---|
| A1 | The supplied sample SCORM 1.2 package is treated as valid/supported for the P1 demo | Campbell Isherwood, Claire Cui | Supplied package cannot be parsed/launched per the SCORM 1.2 contract described |
| A2 | The P1 sample package reports a score usable in the final report | Michelle Zuckerberg | Inspection shows no score is reported |
| A3 | One learner completing one custom package is sufficient to prove the P1 loop | Rory Myers | Mentor/product clarification requires multiple learners/packages/assignments |

## 8. Edge Cases Checklist (implement handling for all of these)
- [ ] Missing `imsmanifest.xml` → reject upload with clear error; nothing added.
- [ ] Package launches but never reports completion → preserve actual state; do not fabricate completion.
- [ ] Package reports no score → never a blank/dash. Incomplete → `"In progress"` everywhere. Completed → `"Completed — no score reported"` on the educator report (§3.3), `"No score reported"` on the learner's own view (§3.2, US-2.5) — deliberately different wording per audience, not a bug.
- [ ] Previously completed lesson's content is re-uploaded/deactivated → historical completion still visible, unchanged.
- [ ] Custom + seeded Elsevier lesson shown together → origin must stay visually unambiguous.
- [ ] Learner exits mid-lesson (`cmi.core.exit = "suspend"` + bookmarked location) → relaunch resumes at bookmark, not restart.
- [ ] A lesson (either origin) has no `package_id`/`launch_path` set → show a "content not yet available" placeholder; MUST NOT attempt to render an iframe or construct a SCORM adapter for it.
- [ ] A custom lesson is uploaded with no source institution entered → displays as "Unknown", never blank; Elsevier-origin lessons never show a source institution value at all.
- [ ] Educator clicks "Export CSV" when the report has zero rows (no learners/lessons seeded yet) → still downloads a valid CSV containing just the header row, never an error or a blank/broken file.
- [ ] Admin replaces, reactivates, or edits a custom lesson → each action is logged as its own `content_audit_log` entry (`upload`+`previous_lesson_id` / `reactivate` / `edit`); a superseded lesson (already replaced) MUST NOT show a "Reactivate" option.
- [x] A learner signs up via self-service signup (§3.5) → email confirmation IS required by the live Supabase auth settings; verified end-to-end (Claire Cui) that the confirmation email is actually delivered and the signup→confirm→login path works, so this is not a blocker for the demo.
- [ ] A learner signs up via self-service signup → they need a matching `profiles` row created via an `auth.users` trigger (client code no longer inserts one directly, as of `054b3da`); this trigger isn't documented in `plan.md` §2.1 and isn't confirmed to exist on the live project — MUST be verified before relying on this path (see `plan.md` §2.10).

## 9. Verify Table
Filled in this session (2026-08-18) by re-testing every AC against the running system: live Supabase project data (`list_tables`/`execute_sql`), the Vitest suite (`npm test` — 16 files, 191/191 passing), `tsc -b --noEmit` (clean), and direct source review against the exact wording/behavior each AC requires. No interactive browser-automation tool was available in this session, so nothing below claims a fresh click-through login→launch→complete pass that didn't happen — rows verified that way say so in Notes; everything else is evidence from real historical usage already sitting in the live DB, or from reading the code that implements the AC.

| AC | Scenario | Verdict | Notes |
|---|---|---|---|
| US-1.1 | Valid SCORM 1.2 ZIP becomes a custom lesson | PASS | Live DB has 3 active custom lessons created via real admin uploads (`content_audit_log` shows 4 real `upload` actions), each with `package_id`/`launch_path` set. Code path (`admin-upload.tsx`) matches. |
| US-1.2 | Custom lesson origin is distinguishable | PASS | `lesson-card.tsx`/`home.tsx` show a "Custom content" badge gated on `origin === 'custom'`; `report.tsx` shows the same badge. Confirmed by source read, not a fresh screenshot. |
| US-2.1 | Learner launches real SCORM content | PASS | Live `lesson_completions` rows show real runtime writes (`lesson_location`, `exit_mode`) for both a custom lesson ("Cat Caretaking Basics") and a seeded Elsevier lesson ("Hand Hygiene Basics") — real SCO sessions actually ran for both origins, not just custom. |
| US-2.2 | Completion and score are recorded | PASS | Live data: multiple `lesson_completions` rows with `status='completed'/'passed'/'failed'` and populated `score_raw`/`score_max`. |
| US-2.5 | Learner's own view shows "No score reported" (no "Completed —") for a finished lesson with no score | PASS | `format-score.ts`'s `formatScoreCell({audience:'learner'})` returns exactly `"No score reported"`, matching spec text verbatim; covered by `format-score.test.ts` (in the 191 passing tests). No live completed-no-score row exists to eyeball in the running UI this session — verified via code + tests, not a live screenshot. |
| US-2.6 | Completed lesson scoring below 70% shows "Failed" + "Retake lesson" on the learner's lesson card; educator report unaffected | PASS | `lesson-card.tsx` derives `isFailed` from `score_raw`/`score_max` (not a new stored status) and swaps the CTA to "Retake lesson"; `report.tsx` has no such derivation and still prints the raw score. Live data has a real SCO-reported `status='failed'` row (score 20/100, "Early Recognition of Sepsis") confirming the failed-status pill path; the score-derived-Failed path (a `completed` row scoring <70%) is verified by code read only, no live row currently exercises it. |
| US-3.1 | Elsevier + custom records appear together | PASS | `report.tsx` queries `lesson_completions` (not `lessons`) and live data includes a `not-started` seeded Elsevier row ("Medication Safety Fundamentals") alongside completed custom rows — this also resolves T14's open question: seeded not-started rows DO have their own `lesson_completions` row, so they don't drop out of the report. |
| US-3.2 | Custom origin is marked in report | PASS | `report.tsx:139-141` renders the "Custom content"/Elsevier badge per row off `row.origin`. |
| US-3.3 | Completion + score visible in report | PASS | Live data confirms both score-bearing and no-score-but-completed rows render through `formatScoreCell` (default `audience: 'report'` → `"Completed — no score reported"`, matches spec verbatim). |
| US-3.6 | Export CSV on the unified report | PASS | `report.tsx`'s "Export CSV" button builds the CSV from the same `originText`/`sourceText`/`STATUS_LABEL`/`formatScoreCell` helpers the table itself renders with, so export can't drift from what's on screen; covered by `report.test.tsx` (header-only export on an empty report, a full row matching the table's own formatting, and comma-value quoting) plus a real-browser Playwright e2e test (`app/e2e/report-export-csv.spec.ts`, T41) that logs in as the seeded educator against the live Supabase project and confirms an actual file downloads with the expected header row and ≥1 data row. |
| US-4.1 | Recorded completion survives content change | PASS | Structural guarantee, not just runtime behavior: `report.tsx` reads only denormalized snapshot columns (never live-joins `lessons`), the `lesson_completions.lesson_id` FK is `ON DELETE RESTRICT`, and there is no delete RLS policy on `lesson_completions` at all. The one deactivated lesson in the live DB ("wrong edition...") has zero completions, so this session found no live row to visually confirm end-to-end — verified via schema/code guarantee, not a live before/after screenshot. |
| US-4.3 | Replace content deactivates the old lesson, links to the new one, leaves existing completions untouched | PASS | Exercised live (T37): "Golf Explained" was replaced by a new lesson ("Gold Explained Replaced"), which has `replaces_lesson_id` pointing at it; the old row got `is_active=false, superseded_by_lesson_id=<new>`; `content_audit_log` shows the matching `upload` (with `previous_lesson_id`) + `deactivate` (`reason: superseded`) pair, timestamped together (2026-08-18 15:05 UTC). |
| US-4.4 | Reactivate restores a deactivated (non-superseded) lesson; superseded lessons never show Reactivate | PASS | Exercised live (T37): the deactivated "wrong edition" lesson (inactive, never superseded) was reactivated — `content_audit_log` shows a real `reactivate` action (15:06 UTC), then a `deactivate` again shortly after. Button-gating confirmed by code read (`admin-upload.tsx:543`): a lesson only gets a Reactivate button when it's inactive AND has no `superseded_by_lesson_id` — an inactive-and-superseded lesson (the "old" side of a Replace) renders neither Reactivate nor Replace/Deactivate, only Edit details. |
| US-4.5 | Edit details updates metadata only, never package_id/launch_path | PASS | Exercised live (T37): a real `edit` action in `content_audit_log` shows "Cat Caretaking Basics" → "Cat Caretaking" with matching `before`/`after` detail; the lesson's title/`updated_at` changed while `package_id`/`launch_path` did not. |
| US-5.1 | Self-service signup creates a learner profile and allows login | PASS | Confirmed in-scope (§3.5, Claire Cui, 2026-08-18): `/signup` only ever produces synthetic/seeded accounts against a seeded organization, not public registration — consistent with §4, not an exception to it. Email confirmation is required by the live project and verified working end-to-end (Claire Cui) — see §8. This session's own live-DB check independently corroborates the mechanism: a real signed-up learner has a matching `profiles` row (via the `handle_new_learner_signup` trigger) and a confirmed email despite no SMTP being configured on this machine. No `signup.test.tsx` exists (only page in the app with zero automated coverage). |

### 9.1 Additional ACs (added during spec refinement)
These were introduced after the original verification table was drafted (login flows, resume, invalid-upload, no-score display, audit log) and never got folded back into a §3 Given/When/Then row. This section is §9's one deliberate exception to "every ID needs a §3 row" — an append-only home for ACs discovered after §3 was first drafted, not an invitation to skip writing the §3 row for new ACs going forward (US-2.5/US-4.3/US-4.4/US-4.5/US-5.1 above got real §3 rows; the ones below didn't and are grandfathered here instead of being backfilled, since backfilling them isn't worth the time on this clock).

| AC | Scenario | Verdict | Notes |
|---|---|---|---|
| US-1.3 | Admin login reaches upload view | PASS | `App.tsx` routes `/admin/upload` behind `RequireRole allow={['admin']}`; `require-role.tsx`'s `landingRouteForRole` sends an admin there and redirects any other role away from it. Covered by `require-role.test.tsx`. |
| US-1.4 | Invalid upload (missing `imsmanifest.xml`) rejected with clear error | PASS | `scorm-manifest.ts` throws the exact spec string `"This file doesn't look like a SCORM package (missing imsmanifest.xml)"`; also rejects non-1.2 `<schemaversion>` (T19). Live DB has a real historical example: a SCORM 2004 package upload ("wrong edition (should throw error)") exists as a deactivated row, predating the T19 schema-version check, then manually deactivated — current code would reject that same file outright per `scorm-manifest.test.ts`. |
| US-2.3 | Learner login reaches available lessons | PASS | Same `RequireRole`/`landingRouteForRole` mechanism as US-1.3, `allow={['learner']}` on `/`. |
| US-2.4 | Suspended lesson resumes from bookmark on relaunch | PASS | Live `lesson_completions` rows show real `exit_mode='suspend'` + non-empty `lesson_location` written by actual SCO sessions (e.g. "Hand Hygiene Basics" bookmarked at `"assessment"`). Resume-prompt logic itself lives in the sample package's own `doStart()` (copied verbatim per `plan.md` §2.7), reading the bookmark the adapter loads on mount (`lesson.tsx`, `scorm-api-adapter.test.ts`) — not re-driven through a fresh browser session this session. |
| US-3.4 | Educator login reaches report view | PASS | Same mechanism, `allow={['educator']}` on `/report`. |
| US-3.5 | No-score lesson shows "Completed — no score reported" | PASS | Live data has a real example: "Infection Control Documentation" is `status='completed'` with `score_raw=null`, which `formatScoreCell`'s default (`audience: 'report'`) renders as exactly this string. |
| US-4.2 | Backend audit log records content changes, not exposed in report | PASS | `content_audit_log` is referenced only from `admin-upload.tsx` (and its test) — never from `report.tsx`/`home.tsx`. Live log has 4 real `upload` rows + 1 `deactivate` row from actual admin actions, confirming the log is actually being written, not just designed. |
| US-1.5 | Custom lesson's source institution is captured on upload and displayed (or "Unknown" if blank); not shown for Elsevier lessons | PASS | **Unblocked — the `source_institution`/`source_institution_snapshot` migration IS applied on the live project** (verified via `list_tables`; both columns exist). Live data confirms the full path end-to-end: "Cat Caretaking Basics" has `source_institution='Hackathon'` and its `lesson_completions` row has the matching `source_institution_snapshot='Hackathon'`; other custom lessons with no institution entered show `null`, which `admin-upload.tsx` renders as `"Unknown"`. **T23 in `tasks.md` is stale** — it's marked "Blocking, not yet run" but the migration has clearly been applied and used since. |

## 10. Working Agreement
- Never guess a requirement, value, mapping, or business rule — leave it explicit as TODO/unknown/assumption and ask.
- If new learning changes scope, behavior, or an acceptance criterion, update this document before continuing to build.
- Keep `plan.md` and `tasks.md` synchronized with whatever is current in this document.
- At each `metrics.md` checkpoint, record what actually happened, not what was intended (see §4).