# metrics.md — SCORMed
<!-- Lightweight capture. Update at checkpoints; accuracy matters more than polish. -->

## Baseline
- Team confidence using AI/spec-first ways of working (1–5):
  - <Michelle>: <4>
  - <Claire>: <4>
  - <Campbell>: <4>
  - <Rory>: <4>
- **Team average:** 4

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

## Checkpoint 2 — mid Day 2 (2026-08-18, through commit `20e3f1d`)

### Delivery
- Thin slice working end-to-end? **Y** — unchanged from Checkpoint 1, now with source-institution tracking, real self-service signup, the 70%-pass/fail threshold, and CSV export layered on top.
- Tasks planned / completed: **20 planned / 20 completed** — T24–T27, T29, T30, T32–T38, T40–T42 (T12, T14, T23, T36, T37, T38 among them — mostly review/backfill/verification work, not new features).
- Acceptance criteria currently passing: **23 / 23 (verified, not an estimate this time)** — the Verify Table (§9/§9.1) was actually filled in this checkpoint (T12) by re-testing against live Supabase data, the Vitest suite, and source review; every row says PASS, none say FAIL or are still blank.

### Spec health
- Scope/behavior deviations discovered: **2** — self-service signup (`d96e0d5`) and the 70%-pass/fail threshold (`6fc627d`) both shipped before `spec.md` had any coverage for them, the same pattern Checkpoint 1 flagged for the content-lifecycle feature.
- Deviations reflected in `spec.md` before continuing: **0 of 2 at ship time, 2 of 2 same-day once caught** — neither was confirmed-then-built like source-institution/Elsevier-playback were; both were built-then-backfilled after a review pass caught them. CSV export (`US-3.6`) and the origin-pill source-institution carve-out (`US-1.2`/`US-1.5`) are the counter-example this checkpoint: both went through spec confirmation (Rory Myers) as part of building them, not after.
- `spec.md`, `plan.md`, and `tasks.md` aligned? **Mostly Y, one flagged exception** — `plan.md` §2.10 still explicitly notes the `profiles`-row-creation trigger for signup is unverified against the live project (email confirmation itself *was* verified; the DB trigger wasn't). Everything else caught at Checkpoint 1 (the stale "Polish" line, `CLAUDE.md`'s blank stack section, `tasks.md`'s stale notes) is now fixed.

### AI + human judgment
- **Where AI added value:** the full Verify Table pass (T12) — checked all 22 then-existing ACs against live Supabase data, the test suite, and source review in one pass, and in doing so *discovered* that T23 (the source-institution migration) was already done, that T14 (seeded rows dropping from the report) needed a real fix, and that US-4.3/4.4/4.5 had never actually been exercised live (spun into T37). One verification pass surfaced three separate follow-up tasks instead of just rubber-stamping PASS everywhere.
- **Where AI struggled / a human intervened:** the same "ship first, spec later" pattern repeated twice this checkpoint (signup, pass/fail threshold) despite being explicitly called out at Checkpoint 1 — a human (Michelle) had to keep initiating review passes to catch it rather than it being caught automatically. Also: two people/sessions filled in `CLAUDE.md`'s Stack & conventions independently in parallel (T26 and T34), needing a manual merge rather than either side knowing the other was mid-edit.
- Reusable pattern captured in `skills.md`? **Y** — Skill 6 (Sync Docs With Commit) was added specifically to reduce this checkpoint's repeat "ship-then-backfill" pattern going forward.

### Friction
- Time lost to setup/tooling/blockers: **~10–15 min (measured, not estimated)** — the test runner (`npm test`) hard-crashed on this machine's default Node 20 (`jsdom`'s `undici` needs Node ≥22.14/≥24); fix was prepending nvm's Node 24 to `PATH` explicitly, since `nvm use 24` alone didn't win against Homebrew's earlier `PATH` entry.
- Biggest blocker: the same scope-drift pattern from Checkpoint 1 recurring rather than being prevented — features still shipping before spec coverage, just now caught faster (same-day) instead of carrying over to the next day.

---
<!-- Repeat checkpoints as useful. -->

## End of Event
- End confidence average: <4>
- Confidence delta: <0>
- Final Verify: 23 PASS / 0 FAIL
- Tasks completed: 40 / 40
- Skills captured: <6>
- One thing that did **not** work: <keeping tasks.md up to date>
- What we changed because of it: <we added a skill with strict update rules>
- One pattern another team could reuse: <task.md update skill>
