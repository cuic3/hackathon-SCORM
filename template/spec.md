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

### 3.2 Complete a lesson (US-2, P1)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-2.1 | A SCORM 1.2 lesson is available (custom-uploaded or seeded Elsevier content — see §3.3 scope update) | Learner launches it | The real SCORM lesson runs (real runtime, not a mock screen) |
| US-2.2 | Learner completes the lesson; package reports completion + score | Session finishes | Completion and score are recorded for that learner |

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

**Display rule (MUST):** wherever a score is shown, display both percentage and raw value, e.g. `"78% (78/100)"`. When no score is reported: a **completed** lesson shows `"Completed — no score reported"` (never blank/dash); an **incomplete/in-progress** lesson shows `"In progress"`.

**Seed data requirement:** seed 3–5 Elsevier lesson records with mixed states (some completed with scores, some incomplete, some not started) so the report doesn't look sparse.

**Scope update (confirmed with Rory Myers):** Elsevier-origin lessons are also packaged and played as real SCORM 1.2 content, using the identical format and runtime pipeline as admin-uploaded custom lessons (same `imsmanifest.xml` structure, same `window.API` contract, same content-proxy serving path). This does not change the "synthetic/seeded, no real CLH integration" rule in §4 — the content itself is still authored by the team as demo material, not sourced from a real Elsevier system; it is simply packaged as a genuinely interactive SCO instead of a static completion row. Origin (`elsevier` vs `custom`) remains a data-model distinction (`lessons.origin`, display badge) independent of how the content happens to be authored or delivered.

### 3.4 Preserve recorded completion history (US-4, P1)
| AC ID | Given | When | Then |
|---|---|---|---|
| US-4.1 | A learner has a recorded completion | Related custom content is re-uploaded, deactivated, or otherwise changed | The existing completion record remains available in the report, exactly as before |

**MUST NOT**: ever lose or mutate a recorded completion as a side effect of content management actions (re-upload, deactivate, edit).

## 4. Business Rules (cross-cutting)
- **MUST**: demonstrator is standalone — no dependency on / integration with real Clinical Learning Hub.
- **MUST**: only SCORM 1.2 is supported (not 2004, not xAPI, not AICC).
- **MUST**: all org/user/Elsevier-lesson data is synthetic/seeded.
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
- [ ] Package reports no score → show `"Completed — no score reported"` if the lesson is completed, or `"In progress"` if it isn't; never a blank/dash either way.
- [ ] Previously completed lesson's content is re-uploaded/deactivated → historical completion still visible, unchanged.
- [ ] Custom + seeded Elsevier lesson shown together → origin must stay visually unambiguous.
- [ ] Learner exits mid-lesson (`cmi.core.exit = "suspend"` + bookmarked location) → relaunch resumes at bookmark, not restart.
- [ ] A lesson (either origin) has no `package_id`/`launch_path` set → show a "content not yet available" placeholder; MUST NOT attempt to render an iframe or construct a SCORM adapter for it.

## 9. Verify Table
Fill this in at feature freeze by re-testing every AC above against the running system. Do not invent new IDs — use the ones defined in §3.

| AC | Scenario | Verdict | Notes |
|---|---|---|---|
| US-1.1 | Valid SCORM 1.2 ZIP becomes a custom lesson | PASS / FAIL | |
| US-1.2 | Custom lesson origin is distinguishable | PASS / FAIL | |
| US-2.1 | Learner launches real SCORM content | PASS / FAIL | Verify against both a custom-uploaded lesson and a seeded Elsevier lesson (§3.3 scope update) |
| US-2.2 | Completion and score are recorded | PASS / FAIL | |
| US-3.1 | Elsevier + custom records appear together | PASS / FAIL | |
| US-3.2 | Custom origin is marked in report | PASS / FAIL | |
| US-3.3 | Completion + score visible in report | PASS / FAIL | |
| US-4.1 | Recorded completion survives content change | PASS / FAIL | |

### 9.1 Additional ACs (added during spec refinement)
These were introduced after the original verification table was drafted (login flows, resume, invalid-upload, no-score display, audit log). Tracked here separately so they don't get mixed into the original table above.

| AC | Scenario | Verdict | Notes |
|---|---|---|---|
| US-1.3 | Admin login reaches upload view | PASS / FAIL | |
| US-1.4 | Invalid upload (missing `imsmanifest.xml`) rejected with clear error | PASS / FAIL | |
| US-2.3 | Learner login reaches available lessons | PASS / FAIL | |
| US-2.4 | Suspended lesson resumes from bookmark on relaunch | PASS / FAIL | |
| US-3.4 | Educator login reaches report view | PASS / FAIL | |
| US-3.5 | No-score lesson shows "Completed — no score reported" | PASS / FAIL | |
| US-4.2 | Backend audit log records content changes, not exposed in report | PASS / FAIL | |

## 10. Working Agreement
- Never guess a requirement, value, mapping, or business rule — leave it explicit as TODO/unknown/assumption and ask.
- If new learning changes scope, behavior, or an acceptance criterion, update this document before continuing to build.
- Keep `plan.md` and `tasks.md` synchronized with whatever is current in this document.
- At each `metrics.md` checkpoint, record what actually happened, not what was intended (see §4).