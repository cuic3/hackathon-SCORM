# metrics.md — SCORMed
<!-- Lightweight capture. Update at checkpoints; accuracy matters more than polish. -->

## Baseline
- Team confidence using AI/spec-first ways of working (1–5):
  - <Michelle>: <4>
  - <Clarie>: <4>
  - <Campbell>: <4>
  - <Rory>: <4>
- **Team average:** <>

## Checkpoint 1 — end of Day 1 (2026-08-17, through commit `9f63f04` at 16:32)

### Delivery
- Thin slice working end-to-end? **Y** — login → admin upload → real SCORM launch/completion → unified educator report all landed same day (`4ded8bd`, 13:52).
- Tasks planned / completed: **19 planned / 19 completed** 
- Acceptance criteria currently passing: **~15 / 16 (estimate)** 
  
### Spec health
- Scope/behavior deviations discovered: **3** — source-institution tracking, Elsevier-origin real playback, and the re-upload/Reactivate/Edit-details content-lifecycle feature (`275ed13`).
- Deviations reflected in `spec.md` before continuing: **2 of 3** — source-institution and Elsevier-playback both got a "Scope addition (confirmed with X)" note at build time. The content-lifecycle feature did **not** — it shipped same-day with zero AC/edge-case coverage in `spec.md`, and stayed that way until the next day's review pass (T24, Aug 18).
- `spec.md`, `plan.md`, and `tasks.md` aligned? **N** — as of this checkpoint, `plan.md` §6 still listed the just-shipped re-upload/replace flow under future "Polish"

### AI + human judgment
- **Where AI added value:** Claude built the entire re-upload/Reactivate/Edit-details flow (`275ed13`) — new `lessons` row + lineage tracking + per-action audit logging — same day it was conceived.
- **Where AI struggled / a human intervened:** that same feature is also the clearest case of AI moving faster than spec discipline — it shipped with no spec coverage at all, and needed a human-directed review pass the next day to catch and backfill it. A second friction point: two people built overlapping features touching the same files at nearly the same time (`275ed13` re-upload at 15:32, `c494971` source-institution at 15:36) — Michelle Zuckerberg's commit at `0e30e27` (15:41) is the manual merge resolving that overlap.
- Reusable pattern captured in `skills.md`? **Y** — Skill 4 (Spec-Drift Guard) exists specifically because of this kind of gap.

### Friction
- Time lost to setup/tooling/blockers: **~20–30 min (estimate)** — The setup steps `plan.md` documents as friction (Supabase/env var wiring, the Zscaler-cert npm note in §1).
- Biggest blocker: two people independently building features that touched the same files at the same time, requiring a manual merge instead of being caught by a shared task board beforehand.

---
<!-- Repeat checkpoints as useful. -->

## End of Event
- End confidence average: <4>
- Confidence delta: <0>
- Final Verify: <n> PASS / <n> FAIL
- Tasks completed: <n> / <n>
- Skills captured: <6>
- One thing that did **not** work: <keeping tasks.md up to date>
- What we changed because of it: <we added a skill with strict update rules>
- One pattern another team could reuse: <task.md update skill>
