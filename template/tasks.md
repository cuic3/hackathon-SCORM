# tasks.md — Custom Content Uploader (SCORM) · Clinical Learning Hub
<!-- Ordered build work. Every task traces to a user story or acceptance criterion.
     If a task cannot be traced, it is either unnecessary or the spec is missing something.
     Reconstructed from git history (`git log --all --stat`) — see commit hashes per task. -->

## Completed
- [x] [T1] Scaffold team working docs (`spec.md`, `plan.md`, `tasks.md`, `metrics.md`, `skills.md`, `CLAUDE.md`) — n/a (process setup) — Claire Cui (`cuic3`) — `acf2613`, `bc100d3`
- [x] [T2] Reformat the CS product brief into an agent-consumable `spec.md` structure (stable AC IDs, MUST/SHOULD framing) — n/a (spec authoring) — Claire Cui (`cuic3`) — `25421fe`
- [x] [T3] Adopt `spec.md` as the canonical spec; fill in Open Assumptions owners (§7: A1/A2/A3) — n/a (spec authoring) — Michelle Zuckerberg — `d2bbc80`, `b5a7b98`
- [x] [T4] Add real SCORM 1.2 sample package (Rustici golf course, `RuntimeBasicCalls_SCORM12`) to validate the upload/launch/completion pipeline against — US-1.1, A1 — Michelle Zuckerberg — `4839689`
- [x] [T5] Push initial mock frontend (static lesson data, home/lesson pages, lesson-card, app-shell) as the pre-Supabase scaffold — US-2.1 (scaffold only, later replaced) — Claire Cui (`cuic3`) — `9e41ed8`
- [x] [T6] Wire up Supabase MCP + client (`.mcp.json`, `src/utils/supabase.ts`) — infra — Rory Myers — `f89bed7`
- [x] [T7] Draft the technical plan — Supabase schema, RLS policies, SCORM runtime bridge design, same-origin content proxy design (`plan.md` §1–§6) — n/a (planning, traces to all of §2.1–§2.7) — Rory Myers — `5206c94`
- [x] [T8] Build the full P1 loop end-to-end: real login/role guards, admin upload + manifest validation + Storage upload, SCORM 1.2 API adapter + real iframe player + resume/bookmark, unified educator report, audit log on upload/deactivate — US-1.1, US-1.3, US-1.4, US-2.1, US-2.2, US-2.3, US-2.4, US-3.1, US-3.2, US-3.3, US-3.4, US-4.1, US-4.2 — Rory Myers — `4ded8bd`
- [x] [T9] Rebrand app to "Clinical Learning Hub" (header wordmark, login copy, typo fix) — n/a (polish) — Campbell Isherwood — `8ec7ca3`, `757739b`, `9b3bf46`
- [x] [T10] Enable real SCORM playback for Elsevier-origin lessons: generalize the player gate from `origin === 'custom'` to content-availability, author 4 real SCORM packages via the `generate-scorm-lessons` skill, backfill via `seed-elsevier-content.mjs` — US-2.1 (§3.3 scope update) — Rory Myers — `dd9d948`
- [x] [T11] Resolve spec-drift: align "no score reported" display text between `format-score.ts` and `spec.md` so code and spec say the same thing — US-3.3, §8 edge case — Michelle Zuckerberg — `0c2b238`

### Thin Slice
Smallest subset that produced a working end-to-end path: T4, T6, T7, T8 (login → admin upload → real SCORM completion → educator report).

## Next
<!-- Gaps identified by re-checking the running build against spec.md — not yet started. -->
- [ ] [T12] Fill in `spec.md` §9/§9.1 Verify Table by re-testing every AC against the running system — all US IDs — unassigned
- [ ] [T13] Log an actual `metrics.md` checkpoint (tasks planned/completed, ACs passing, deviations, AI-vs-human notes) — spec §4 MUST — unassigned
- [ ] [T14] Confirm seeded "not started" Elsevier lessons actually appear in the educator report (report.tsx currently queries from `lesson_completions`, not `lessons` — verify against live data) — US-3.1 — unassigned
- [ ] [T15] Build the full re-upload/replace flow (`replaces_lesson_id`/`superseded_by_lesson_id` columns and the `reactivate`/`edit` audit actions exist in schema but are unused by the UI) — US-4.1 — unassigned

## Cut / Deferred
<!-- Keep the reason. Scope change should remain visible. -->
- ~~[T16] Multiple learners/packages/assignments beyond the single P1 loop~~ — deferred per assumption A3 (one learner/one package sufficient to prove the loop, owner Rory Myers)
