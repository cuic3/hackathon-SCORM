# spec.md — Custom Content Uploader (SCORM) · <Team Name>
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
- **Given** a valid SCORM 1.2 package containing `imsmanifest.xml` **when** the admin uploads it **then** the package becomes available as a custom lesson.
- **Given** an uploaded custom lesson **when** its origin is displayed **then** it is clearly distinguishable from seeded Elsevier content.

### US-2 — Complete a custom lesson (P1)
As a learner, I want to launch and complete a custom lesson so that my learning activity is captured in the same experience.
- **Given** a custom SCORM 1.2 lesson is available **when** the learner launches it **then** the real SCORM lesson runs rather than a mock screen.
- **Given** the learner completes the lesson and the package reports completion and score **when** the session finishes **then** the completion and score are recorded for that learner.

### US-3 — See unified completion reporting (P1)
As a nurse educator, I want one report containing Elsevier and custom learning activity so that I do not have to reconcile completion data across two systems.
- **Given** seeded Elsevier lesson records and at least one completed custom lesson **when** the educator views the report **then** both appear together in the same report.
- **Given** a custom lesson appears in the report **when** the educator reviews the record **then** its custom origin is clearly marked.
- **Given** a learner completed a custom lesson **when** the report is viewed **then** the recorded completion and score are visible.

### US-4 — Preserve recorded completion history (P1)
As a nurse educator, I want recorded completions to survive content-management changes so that historical learning evidence is not lost.
- **Given** a learner has a recorded completion **when** the related custom content is re-uploaded, deactivated, or otherwise changed **then** the existing completion record remains available.

## 3. Business Rules & Constraints
- The demonstrator is **standalone**; it does not integrate with or require access to Clinical Learning Hub.
- The organisation, users, and Elsevier lesson records used in the demonstrator are synthetic/seeded.
- Only **SCORM 1.2** packages are in scope.
- A supported SCORM package is a ZIP containing the SCORM contract file `imsmanifest.xml`.
- Recorded completion history must never be lost through re-upload, deactivation, or refactoring.
- The demonstration must use real SCORM packages and working software; mock screens do not satisfy the brief.

## 4. UX / Experience Notes
- **Primary flow:** Admin uploads custom content → custom lesson is available → learner launches and completes lesson → educator reviews a combined report containing Elsevier and custom content.
- **Important states:** successful upload; lesson available; lesson launched; completion recorded; score recorded; combined report; custom-origin indicator.
- **Known experience constraints:** TODO — inspect the supplied SCORM 1.2 sample package(s) and record any user-facing implications discovered before implementation.

## 5. Edge Cases
- A SCORM package does not contain `imsmanifest.xml` → expected user-facing behavior is not specified in the brief; team must define it before implementation.
- A package launches but does not report completion → preserve the actual recorded state; do not fabricate completion.
- A package does not report a score → do not invent one; exact report behavior must be defined before implementation.
- A previously completed lesson is re-uploaded or deactivated → the historical completion remains available.
- A custom lesson and a seeded Elsevier lesson appear together → origin must remain unambiguous.

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
