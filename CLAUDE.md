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
- **Language/framework:** React 17 + TypeScript, built with Vite. Client-side routing via `react-router-dom` v5 (matches the main Clinical Learning Hub app's version).
- **UI/styling:** Elsevier's internal Leyden/ELS design system (`@els/els-styleguide-core` + `@els/els-react--*` packages — header, footer, card, pill, badge, button, icon, link-element). Plain SCSS per component (no CSS Modules), BEM-ish class naming (`.block__element`, `${baseClassName}__thing` string templates in JSX), one `.scss` file per component/page colocated with its `.tsx`.
- **Data/storage:** Supabase (Postgres + Auth + Storage). Schema/RLS/seed data are documented in `plan.md` §2.1 — treat that section as the source of truth for the data model, not this file; there is no ORM, reads/writes go straight through `@supabase/supabase-js`.
- **Testing:** Vitest, colocated `*.test.tsx`/`*.test.ts` next to the source file. Supabase and `@els/*` components are mocked (`app/src/test/mocks/`) rather than hit for real. Run via `npm test` (`vitest run`) from `app/`. Node ≥22.14/≥24 is required for the test runner (jsdom/undici) — see `plan.md`'s Verification section for the `nvm`/`PATH` gotcha if `npm test` crashes with a `webidl` error on this machine's default Node 20.
- **E2E testing:** Playwright, specs under `app/e2e/*.spec.ts` (excluded from Vitest's run — see `vitest.config.ts`'s `exclude`). Unlike Vitest, these hit the real live Supabase project and a real browser — no mocks — for the handful of behaviors (e.g. an actual file download) jsdom can't verify. Run via `npm run test:e2e` from `app/`; `playwright.config.ts` auto-starts `npm run dev` if it isn't already running. Needs seeded-account credentials as env vars in `app/.env` (never committed) — see each spec file for which vars it reads.
- **Run commands:** `cd app && npm install`; `npm run dev` (http://localhost:5173); `npm run build`; `npm test`. On the corporate network, npm needs `NODE_EXTRA_CA_CERTS` pointed at the Zscaler root cert. Requires `SUPABASE_SERVICE_ROLE_KEY` in `app/.env` (no `VITE_` prefix — never shipped to the client bundle).
- **Data-model conventions (see `plan.md` §2.1 for the schema):**
  - `lesson_completions` never live-joins `lessons` — it carries its own denormalized `*_snapshot` fields (title, origin, source institution) so a later edit/deactivate/replace of the lesson can never retroactively change a learner's historical report row.
  - Content management (upload/deactivate/reactivate/edit/replace) is soft-delete only: `lessons` rows are never hard-deleted or mutated in a way that could invalidate an existing completion; every such action also writes a `content_audit_log` row (admin-only, never joined into the report).
  - Never fabricate a completion state or score the SCO didn't actually report (`scorm-api-adapter.ts` only ever persists what `LMSSetValue` was actually called with).
  - SCORM content is extracted to Supabase Storage at upload time and served same-origin through `app/vite-plugins/scorm-content-proxy.ts` (`/content/{packageId}/{relativePath}`) — never point an iframe at a raw Storage URL (breaks `window.API` discovery across origins).
- See `plan.md` for the full architecture, key decisions, and risks — this section is intentionally a summary, not a duplicate.
