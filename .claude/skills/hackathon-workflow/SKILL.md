2---
name: hackathon-workflow
description: |
  Lightweight working agreement for this hackathon team (4 people, ~1.5 days incl.
  breaks). References Elsevier's developer-workflow WoW, trimmed down to the habits
  that fit a short clock. Uses this repo's own spec.md/plan.md/tasks.md/metrics.md.
metadata:
  version: 0.2.0
  category: workflow
  tags: [workflow, hackathon]
---

# Hackathon Working Agreement

Five habits, not a process. References Elsevier's `developer-workflow` skill — same
underlying discipline, trimmed down for a 1.5-day clock. See the bottom section for what's
trimmed and why.

## 1. Before building anything: does it trace to `spec.md`/`tasks.md`?

If a task doesn't map to a user story or acceptance criterion, either skip it or add it
to `tasks.md` first. This is already the team's own non-negotiable — just don't skip it
under time pressure, since that's exactly when scope drifts.

## 2. For the risky logic, sanity-check it before moving on

Not "write a failing test for everything" — just: for the handful of things that would
silently break your demo, run a real check before you consider it done and move to the
next task. The risky spots here specifically:
- Manifest parsing (zip with/without `imsmanifest.xml`)
- SCORM runtime capture (does `LMSSetValue` for score/status actually land in your DB?)
- Completion history surviving re-upload/deactivation (US-4)

A quick manual run against real sample content counts. You don't need a test framework
ceremony around it — you do need to have actually run it, not assumed it works.

## 3. Demo = real, not mocked

Straight from your own spec: *"mock screens do not satisfy the brief."* Before calling
anything done, show it actually running end-to-end against the Given/When/Then in
`spec.md` — real upload, real launch, real score coming back. If you can't run it
end-to-end, say so instead of claiming it works.

## 4. Quick retro, not a ceremony

At natural breakpoints (after lunch, end of day), add 2-3 lines to `metrics.md`: what
worked, what didn't, one thing to change. Skip the rest of the original template's retro
structure (wiki compilation, decision logs) — not enough runtime to justify it.

## 5. Shared repo hygiene

- Use `sample-content/RuntimeBasicCalls_SCORM12/` as the stand-in SCORM 1.2 package until
  the real sample arrives — everyone testing against the same file avoids "works on my
  build" confusion.
- Pull before you start a work session; commit and push in small chunks rather than
  hoarding a big diff. With 4 people on one repo and no branch strategy in play, this is
  the cheap insurance against losing work to a merge conflict.

## Relationship to developer-workflow

This trims Elsevier's `developer-workflow` skill (gate-based WoW: Decision Tree →
Collaborative Requirements → TDD → Implementation → Demo → Sign-off → Retro) down to the
habits worth their cost at this scale:

| From developer-workflow | Here |
|---|---|
| TDD-first for every change | Only for the risky logic in #2 |
| Mandatory pre-commit checkpoint ritual | Commit when useful; a clear message is enough |
| Security/CVE dependency audits | Skipped — standalone demo, not shipping to production |
| `demos/` folder + markdown report per task | Just show it working live (#3) |
| TPR-1/2/3, System Dossier, three-role sign-off | Skipped — enterprise governance for production systems |
