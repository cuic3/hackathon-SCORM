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
- **Frontend:** React 17 + TypeScript, built with Vite. Routing via `react-router-dom` v5.
- **UI:** Elsevier's internal Leyden/ELS design system (`@els/els-styleguide-core` + `@els/els-react--*`). Plain SCSS per component (no CSS Modules), BEM-ish class naming.
- **Backend/data:** Supabase (Postgres + Auth + Storage). Schema and RLS are documented in `plan.md` §2.1; treat that section as the source of truth for the data model, not this file.
- **Tests:** Vitest (`cd app && npm test`). Node ≥22.14/≥24 required for the test runner (jsdom/undici) — see `plan.md`'s Verification section for the `nvm`/`PATH` gotcha if `npm test` crashes with a `webidl` error on this machine's default Node 20.
- **Run commands:** `cd app && npm install && npm run dev` (serves at `localhost:5173`). Full command list in `plan.md` §1.
- See `plan.md` for the full architecture, key decisions, and risks — this section is intentionally a summary, not a duplicate.
