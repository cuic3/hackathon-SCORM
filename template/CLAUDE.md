# CLAUDE.md — Team Working Agreement

## Source of truth
- `spec.md` is the source of truth for intent, scope, and acceptance criteria.
- If a request conflicts with `spec.md`, surface the conflict. Do not silently comply.
- Never build anything listed as Out of Scope unless the team changes `spec.md` first.
- Never guess a requirement, value, mapping, or business rule. Leave it explicit as TODO/unknown/assumption and ask a human.
- `plan.md` records the current technical approach. It must never override the spec.
- `tasks.md` is the current ordered build work. Every task must trace to the spec.

## Working behavior
- Before implementation, explain the intended change and any material assumptions.
- Keep work bounded to the current task.
- Verify completed behavior against the relevant acceptance criteria.
- If learning changes scope, behavior, or an acceptance criterion, update `spec.md` before continuing.
- Keep `plan.md` and `tasks.md` synchronized with the current spec.

## Stack & conventions
- <Team fills this in after the technical approach is chosen>
