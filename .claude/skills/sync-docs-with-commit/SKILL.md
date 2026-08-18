---
name: sync-docs-with-commit
description: |
  Sync template/plan.md and template/tasks.md with what a recent commit (or the
  current uncommitted diff) actually built. Never edits spec.md — spec.md is the
  human-owned source of truth per CLAUDE.md's working agreement, so a commit that
  looks like it changed scope or behavior only gets flagged for human review, not
  auto-rewritten. Use after pushing a feature/fix, or when asked to "update the
  docs for this commit", "sync plan/tasks with what I just built", or similar.
metadata:
  version: 0.1.0
  category: workflow
  tags: [docs, plan, tasks, spec, git, sync]
---

# Sync plan.md / tasks.md with a commit

This is a manual skill — invoke it explicitly (e.g. `/sync-docs-with-commit`, or ask
Claude to run it) after a commit. It does not run automatically on `git commit`; there
is no background process watching the repo.

## Inputs

- Target: by default, the most recent commit (`HEAD`). If the user names a different
  commit/range/branch, use that instead. If there are uncommitted staged/unstaged
  changes and no explicit target was given, prefer diffing those (`git diff HEAD`)
  over `HEAD~1..HEAD`, since that's more likely what the user means by "what I just
  built."
- Docs: `template/plan.md`, `template/tasks.md`, `template/spec.md` (read-only).

## Steps

1. **Get the diff.** `git show <target>` or `git diff` for the working tree. Also
   skim the commit message(s) in range — they often state intent more clearly than
   the diff alone.

2. **Read `template/spec.md`, `template/plan.md`, `template/tasks.md` in full** before
   editing anything. Do not guess at existing structure — match each file's existing
   section numbering/format (see `## 6. Build order / tasks` in plan.md, the AC-ID
   table format in spec.md, and tasks.md's own list style) rather than introducing a
   new format.

3. **Update `template/tasks.md`:**
   - Mark tasks that the diff completes as done, using whatever "done" convention the
     file already uses (checkbox, status column, etc.) — check the file first.
   - If the diff implements work not yet listed as a task, add it under the
     appropriate section, tracing it to a spec AC ID (`US-x.y`) if one applies. If it
     doesn't trace to any AC, say so explicitly in the addition rather than inventing
     a rationale.

4. **Update `template/plan.md`:**
   - Where the plan already describes this piece of work as "not yet implemented" /
     "TODO" / a risk, update that status to reflect it's now built, referencing the
     commit.
   - If the actual implementation deviated from what the plan described (different
     library, different schema shape, different file layout), correct the plan text
     to match reality — plan.md documents the current technical approach, and a
     stale plan is worse than no plan.
   - Do not add speculative future work here beyond what the diff/commit message
     actually indicates.

5. **Never edit `template/spec.md`.** Instead, compare the diff against spec.md's
   scope (§6 Out of Scope) and acceptance criteria (§3, §8 Edge Cases). If the commit:
   - adds behavior not covered by any existing AC,
   - touches something listed in §6 Out of Scope, or
   - contradicts an existing MUST/MUST NOT statement,

   then stop and clearly flag this to the user instead of silently updating plan.md
   around it — e.g. "This commit adds X, which isn't covered by any AC in spec.md.
   Per this repo's working agreement, spec.md needs a human-confirmed update before
   this becomes accepted scope — want me to draft the addition for you to review?"
   Only draft the spec.md change if the user says yes; still don't apply it yourself
   without them reviewing it first.

6. **Report a short summary**: which tasks were marked done/added, what in plan.md
   changed, and whether anything was flagged for spec.md (and why).

## What this is not

- Not a git hook — nothing fires automatically on `git commit`. If automatic-on-commit
  behavior is wanted later, that requires a `.git/hooks/post-commit` script invoking
  `claude -p` non-interactively, which is a separate mechanism from this skill.
- Not a replacement for `metrics.md` checkpoint logging (see the hackathon-workflow
  skill) — this only touches plan.md/tasks.md, not retro/metrics content.
