# skills.md — SCORMed
<!-- Capture only patterns another team could use without asking you what you meant. -->
<!-- Copy a "Prompt" block verbatim into Claude Code — no paraphrasing, no filling in context from memory. -->

## Index
| # | Skill | Use when |
|---|-------|----------|
| 1 | SCORM Contract Extraction | Before finalizing US-2 — probe the sample package |
| 2 | Spec → Backlog Decomposition | Right after Ready gate — derive plan.md + tasks.md |
| 3 | QE Verify-Against-AC | After every finished task, any sprint |
| 4 | Spec-Drift Guard | The moment build reality disagrees with spec.md |
| 5 | Checkpoint Retro Capture | Every checkpoint + final demo |
| 6 | Sync Docs With Commit | Right after pushing a feature/fix — reconcile plan.md/tasks.md with what actually shipped |
| 7 | Generate SCORM Lessons | Adding sample/demo lesson content beyond the seeded golf package |

---

## Skill 1 — SCORM Contract Extraction (probe before you spec)
- **Context:** Resolves the Probe findings TODO and assumptions A1/A2. Run once the sample package is unzipped, before locking US-2's technical scope.
- **Prompt:**
  ```
  Unzip sample-content/RuntimeBasicCalls_SCORM12. Read imsmanifest.xml and every
  file in shared/. Report, without inventing anything not in the files:
  1) the exact sequence of LMS API calls the content makes (LMSInitialize,
     LMSGetValue, LMSSetValue, LMSCommit, LMSFinish) and their arguments,
  2) which cmi.* fields it actually sets (completion status, score, others),
  3) the minimum subset of the SCORM 1.2 API our LMS shim needs to implement
     for this package to run and report completion+score,
  4) anything the manifest/package assumes that isn't stated in the product brief.
  Flag anything ambiguous instead of guessing.
  ```
- **Example output:** Narrows "how much of the contract do you actually need" (the brief's own hint) to a concrete, minimal API surface.
- **Why it helped:** Resolves A1/A2 with evidence instead of assumption, and stops the team from over-building a full SCORM RTE.

## Skill 2 — Spec → Backlog Decomposition with Alignment Check
- **Context:** Immediately after the mentor Ready gate. Produces plan.md + tasks.md that can't silently drift from spec.md.
- **Prompt:**
  ```
  Read the Ready spec.md only. Derive plan.md (stack, architecture, key
  decisions, risks) and tasks.md (every task traced to a US/AC, ordered, with
  a named thin slice). Do not add scope not implied by spec.md. Then run an
  alignment check: quote any line in plan.md or tasks.md that could be read as
  contradicting spec.md, or state "no contradictions found."
  ```
- **Example output:** Thin slice named explicitly as "one Golf package → one learner → one completion+score → visible in report."
- **Why it helped:** The explicit alignment-check step is what turns a decomposition into something that actually passes the mentor gate.

## Skill 3 — QE Verify-Against-AC (parallel, not sequential)
- **Context:** Run by whoever holds QE Hat, on a second machine, after every finished task — while Driver moves on to the next one.
- **Prompt:**
  ```
  Here is spec.md and the diff/commit for task [T#]. Re-test only the
  Given/When/Then lines this task claims to satisfy. For each: PASS, FAIL, or
  "not observable from this change" — no partial credit language. If FAIL,
  state whether the fix belongs in code or in spec.md.
  ```
- **Example output:** Feeds directly into the Day 2 Verify table — same prompt, just run early and often instead of once at freeze.
- **Why it helped:** Keeps verification from stacking into a Day-2 crunch; every task ships already tested against its AC.

## Skill 4 — Spec-Drift Guard (Law 2 enforcement)
- **Context:** Any time the build surfaces something the spec didn't anticipate — e.g. the manifest requires a call the plan didn't account for.
- **Prompt:**
  ```
  [Describe the discrepancy between what spec.md says and what we just found
  while building/probing.] Don't code around this. Tell me: is this a spec gap
  (spec.md needs a new line) or a build error (code needs to match the existing
  spec)? Propose the exact spec.md edit if it's the former.
  ```
- **Example output:** Used when a Golf-package edge case (e.g. no score reported) turns up mid-sprint — routes the surprise into spec.md the same sprint, out loud.
- **Why it helped:** Operationalizes "if reality and spec disagree, one changes — never silently."

## Skill 5 — Checkpoint Retro Capture ("what didn't work")
- **Context:** Every checkpoint and the final demo. Owned by Spec Hat.
- **Prompt:**
  ```
  Fill metrics.md for this checkpoint from what actually happened, not what we
  intended: tasks planned vs. completed, ACs passing, any scope/behavior
  deviation and whether spec.md was updated before we kept building, one
  specific thing AI got right, one specific thing a human had to fix, and one
  concrete failure for the required "what didn't work" section.
  ```
- **Example output:** Gives you the demo's required failure section pre-written instead of scrambled together at 2pm on Day 2.
- **Why it helped:** Turns a scored requirement into a running log instead of a last-minute reconstruction.

## Skill 6 — Sync Docs With Commit (`/sync-docs-with-commit`)
- **Context:** Run right after pushing a feature/fix, or whenever `plan.md`/`tasks.md` have drifted from what actually got built. Never touches `spec.md` — it's human-owned per `CLAUDE.md`'s working agreement, so a commit that looks like it changed scope only gets flagged for a human to confirm, not silently rewritten.
- **Prompt:**
  ```
  /sync-docs-with-commit
  ```
  (Defaults to the most recent commit/`HEAD`, or the current uncommitted diff if that's more likely "what I just built." Name a different commit/range if needed.)
- **Example output:** Marks the tasks a diff completes as done in `tasks.md`, adds any undocumented work traced to its AC ID, updates `plan.md` status for anything that moved from "TODO"/risk to shipped — and if the diff adds behavior not covered by any AC or touches something in §6 Out of Scope, stops and flags it for a human-confirmed `spec.md` update instead of guessing.
- **Why it helped:** This is exactly the gap T18/T24/T30/T35 kept falling into — features landing before their scope note/AC/Verify row existed. Running this right after each push turns that into a same-session fix instead of a later review finding.

## Skill 7 — Generate SCORM Lessons (`generate-scorm-lessons`)
- **Context:** Use when expanding the demo catalog beyond the one seeded golf sample — new Elsevier-flavored or custom-flavored lesson packages. Both origins share the identical SCORM 1.2 package format and runtime contract per `spec.md` §3.3; origin is purely a `lessons.origin` data-model distinction, not a packaging difference.
- **Prompt:**
  ```
  /generate-scorm-lessons
  ```
  (Reads `spec.md`, the reference package under `sample-content/RuntimeBasicCalls_SCORM12/`, `app/src/utils/scorm-manifest.ts`, and `app/src/utils/scorm-api-adapter.ts` before authoring anything — those are ground truth for what the app actually accepts, not a generic SCORM 1.2 reference.)
- **Example output:** New `.zip` packages under `sample-content/generated/`, each with a root-level `imsmanifest.xml`, 2-3 content pages plus a scored assessment page, and bookmarking via `cmi.core.lesson_location` — plus a summary per package and a flagged follow-up (Elsevier-flavored packages need a `lessons` row inserted; custom-flavored ones go through `/admin/upload` by a human).
- **Why it helped:** Keeps generated content honest to the host app's actual constraints (exact `cmi.*` element allowlist, manifest shape the parser requires) instead of a generic SCORM 1.2 tutorial that silently fails upload or playback.