# OUTDATED — superseded by spec.md
<!-- Kept for history only. This was spec.md before it was reformatted into the
     agent-consumable structure (stable AC IDs, MUST/SHOULD framing). All current
     content lives in /spec.md — edit that file, not this one. -->

# spec.md — Custom Content Uploader (SCORM) · SCORMed
<!-- BUSINESS SPEC: the WHAT and WHY. Keep implementation decisions in plan.md.
     Aim for clarity and testability, not length.
     Source: CS Product Brief — Custom Content Uploader (SCORM) · Clinical Learning Hub -->

## 1. Overview
**Problem statement:** Clinical Learning Hub customers with their own SCORM-based training must keep that content in a separate LMS today, splitting assignments, completion tracking, and reporting across two systems. Customer Success reports that 29 clients cannot migrate to CLH until they can bring their own SCORM content with them.

**Target user:** A Clinical Learning Hub administrator who uploads and manages their organisation's custom training content.

**Outcome:** <!-- SYNTHESIZED from Problem statement + Demo definition of done, not stated verbatim in the original brief — confirm/correct this. --> Customers who currently split training across two systems can bring their own SCORM 1.2 content into Clinical Learning Hub and get one unified view of completion and scores, removing the migration blocker for the 29 affected clients.

**Demo definition of done:** An admin uploads one real SCORM 1.2 package, a learner launches and completes it, and the completion plus score appear in one report alongside seeded Elsevier lessons with the custom origin clearly identified.

## 2. User Stories & Acceptance Criteria

### US-1 — Upload custom SCORM content (P1)
As a CLH admin, I want to upload my organisation's SCORM 1.2 training package so that it can be offered alongside Elsevier learning content.
- **Given** valid admin credentials **when** the admin logs in **then** they reach the admin upload view.
- **Given** a valid SCORM 1.2 package containing `imsmanifest.xml` **when** the admin uploads it **then** the package becomes available as a custom lesson.
- **Given** an uploaded custom lesson **when** its origin is displayed **then** it is clearly distinguishable from seeded Elsevier content.
- **Given** a zip that does not contain `imsmanifest.xml` **when** the admin uploads it **then** the upload is rejected with a clear error message and nothing is added as a lesson.

### US-2 — Complete a custom lesson (P1)
As a learner, I want to launch and complete a custom lesson so that my learning activity is captured in the same experience.
- **Given** valid learner credentials **when** the learner logs in **then** they reach their available lessons.
- **Given** a custom SCORM 1.2 lesson is available **when** the learner launches it **then** the real SCORM lesson runs rather than a mock screen.
- **Given** the learner completes the lesson and the package reports completion and score **when** the session finishes **then** the completion and score are recorded for that learner.
- **Given** a learner exited a lesson before completion (suspended, bookmarked) **when** they relaunch it **then** it resumes from the bookmarked location rather than restarting.

### US-3 — See unified completion reporting (P1)
As a nurse educator, I want one report containing Elsevier and custom learning activity so that I do not have to reconcile completion data across two systems.
- **Given** valid nurse educator credentials **when** the educator logs in **then** they reach the unified report view.
- **Given** seeded Elsevier lesson records and at least one completed custom lesson **when** the educator views the report **then** both appear together in the same report.
- **Given** a custom lesson appears in the report **when** the educator reviews the record **then** its custom origin is clearly marked.
- **Given** a learner completed a custom lesson **when** the report is viewed **then** the recorded completion and score are visible.
- **Given** a completed lesson for which the package reported no score **when** the report is viewed **then** it displays "Completed — no score reported" rather than a blank cell.

### US-4 — Preserve recorded completion history (P1)
As a nurse educator, I want recorded completions to survive content-management changes so that historical learning evidence is not lost.
- **Given** a learner has a recorded completion **when** the related custom content is re-uploaded, deactivated, or otherwise changed **then** the existing completion record remains available in the report exactly as before.
- **Given** custom content is re-uploaded, deactivated, or otherwise changed **when** that change happens **then** the system records it in a backend audit log (linked to the affected lesson) so completion records stay resolvable; this log is a backend guarantee only and is not exposed in the user-facing report.

## 3. Business Rules & Constraints
- The demonstrator is **standalone**; it does not integrate with or require access to Clinical Learning Hub.
- The organisation, users, and Elsevier lesson records used in the demonstrator are synthetic/seeded. Seed 3-5 Elsevier lesson records with mixed completion states (some completed with scores, some incomplete, some not started) so the unified report reads as realistic rather than sparse.
- Only **SCORM 1.2** packages are in scope.
- A supported SCORM package is a ZIP containing the SCORM contract file `imsmanifest.xml`.
- Recorded completion history must never be lost through re-upload, deactivation, or refactoring.
- The demonstration must use real SCORM packages and working software; mock screens do not satisfy the brief.
- Each role (admin, learner, nurse educator) has a real login (credentials, not SSO — SSO remains out of scope); accounts are synthetic/seeded per the rule above.
- Score is displayed as both a percentage and the raw value wherever shown in the report (e.g. "78% (78/100)").
- At each `metrics.md` checkpoint, record what actually happened, not what was intended: tasks planned vs. completed, ACs currently passing, any scope/behavior deviation and whether `spec.md` was updated before continuing to build, one specific thing AI got right, one specific thing a human had to fix, and — at End of Event — one concrete failure for the required "what didn't work" section.

## 4. UX / Experience Notes
- **Primary flow:** Admin logs in → uploads custom content → custom lesson is available → learner logs in → launches, completes (or suspends/resumes) lesson → educator logs in → reviews a combined report containing Elsevier and custom content.
- **Important states:** successful upload; lesson available; lesson launched; suspended (in progress, resumable from bookmark); completion recorded; score recorded (percentage + raw); combined report; custom-origin indicator.
- **Known experience constraints:** Findings from inspecting the SCORM 1.2 stand-in sample (`sample-content/RuntimeBasicCalls_SCORM12/`): the SCO is a multi-page mini-course behind a single launch page (`shared/launchpage.html`) that calls the SCORM runtime API directly — the hosting app must expose an LMS API object the SCO's window can find and call. The package bookmarks progress via `cmi.core.lesson_location` and sets `cmi.core.exit = "suspend"` on an incomplete exit, so a learner who leaves mid-lesson can resume rather than restart (see Edge Cases). Score is reported as `cmi.core.score.raw/min/max` (0-100 scale).

## 5. Edge Cases
- A SCORM package does not contain `imsmanifest.xml` → the upload is rejected with a clear error message (e.g. "This file doesn't look like a SCORM package (missing imsmanifest.xml)"); nothing is added as a lesson.
- A package launches but does not report completion → preserve the actual recorded state; do not fabricate completion.
- A package does not report a score → do not invent one; the report displays "Completed — no score reported" rather than a blank/dash, so it reads as intentional rather than broken.
- A previously completed lesson is re-uploaded or deactivated → the historical completion remains available.
- A custom lesson and a seeded Elsevier lesson appear together → origin must remain unambiguous.
- A learner exits a lesson before completion → the package reports `cmi.core.exit = "suspend"` with a bookmarked location; relaunching resumes from that bookmark rather than restarting.

## 6. Out of Scope
<!-- Adding one back requires changing this spec first. -->
- ❌ SCORM 2004 support.
- ❌ xAPI support.
- ❌ AICC support.
- ❌ CE/CPD credit parsing.
- ❌ Bulk migration tooling.
- ❌ Draft/version-history workflows.
- ❌ Scheduled publishing.
- ❌ Single sign-on (SSO).
- ❌ Integration with the real Clinical Learning Hub.
- ❌ Migration of real customer or learner data.
- ❌ Multi-package migration or library-scale administration beyond what is needed to prove the end-to-end demonstrator.

## 7. Open Questions & Named Assumptions
- **Question / assumption — A1, Valid-package assumption:** For the P1 demo, the supplied sample SCORM 1.2 package is treated as a valid supported package.
  - **Owner:** Campbell Isherwood, Claire Cui
  - **Tripwire:** The supplied package cannot be parsed/launched using the SCORM 1.2 contract described in the brief.
- **Question / assumption — A2, Score availability assumption:** The P1 sample package reports a score that can be shown in the final report.
  - **Owner:** Michelle Zuckerberg
  - **Tripwire:** Inspection of the supplied package/runtime shows that no score is reported.
- **Question / assumption — A3, Single-learner thin-slice assumption:** One learner completing one custom package is sufficient to prove the end-to-end P1 loop described in the brief.
  - **Owner:** Rory Myers
  - **Tripwire:** Mentor/product clarification requires multiple learners, packages, or assignments for the demo to satisfy the brief.

## 8. Ready Check
- [x] The problem and target user are specific.
- [x] The outcome is stated as an outcome, not a solution.
- [x] Every P1 acceptance criterion is observable and testable by a non-author.
- [x] Out of Scope contains at least five meaningful exclusions.
- [x] Shape-changing unknowns are resolved or recorded as named assumptions with owner + tripwire.
- [x] This document contains no implementation design masquerading as a requirement.
- [ ] Alignment: `plan.md` and `tasks.md` contradict nothing in this spec. *(Complete after Stage 2.)*

**Ready verdict:** READY WITH NAMED ASSUMPTIONS

<!-- At feature freeze: run Verify — re-test every Given/When/Then above and record PASS/FAIL. -->

## 9. Verify Table
<!-- Fill at feature freeze by re-testing every acceptance criterion. -->
| AC | Scenario | Verdict | Notes |
|---|---|---|---|
| US-1.1 | Valid SCORM 1.2 ZIP becomes a custom lesson | PASS / FAIL | |
| US-1.2 | Custom lesson origin is distinguishable | PASS / FAIL | |
| US-2.1 | Learner launches real SCORM content | PASS / FAIL | |
| US-2.2 | Completion and score are recorded | PASS / FAIL | |
| US-3.1 | Elsevier + custom records appear together | PASS / FAIL | |
| US-3.2 | Custom origin is marked in report | PASS / FAIL | |
| US-3.3 | Completion + score visible in report | PASS / FAIL | |
| US-4.1 | Recorded completion survives content change | PASS / FAIL | |
<!-- Below: ACs added during spec refinement (login, resume, invalid-upload, no-score display, audit log) — test separately. -->
| US-1.3 | Admin login reaches upload view | PASS / FAIL | |
| US-1.4 | Invalid upload (missing `imsmanifest.xml`) rejected with clear error | PASS / FAIL | |
| US-2.3 | Learner login reaches available lessons | PASS / FAIL | |
| US-2.4 | Suspended lesson resumes from bookmark on relaunch | PASS / FAIL | |
| US-3.4 | Educator login reaches report view | PASS / FAIL | |
| US-3.5 | No-score lesson shows "Completed — no score reported" | PASS / FAIL | |
| US-4.2 | Backend audit log records content changes, not exposed in report | PASS / FAIL | |
