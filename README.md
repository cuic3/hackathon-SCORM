# hackathon-SCORM

Problem statement: Clinical Learning Hub customers with their own SCORM-based training must keep that content in a separate LMS today, splitting assignments, completion tracking, and reporting across two systems. Customer Success reports that 29 clients cannot migrate to CLH until they can bring their own SCORM content with them.

## Docs

The team's working docs live at the repo root, not in a `template/` folder — these are the real, filled-in project docs, not blank scaffold:

- [`spec.md`](spec.md) — source of truth for intent, scope, and acceptance criteria
- [`plan.md`](plan.md) — technical approach, architecture, and schema
- [`tasks.md`](tasks.md) — ordered build work, traced to `spec.md`
- [`CLAUDE.md`](CLAUDE.md) — team working agreement / stack conventions
- [`metrics.md`](metrics.md) — checkpoint capture
- [`skills.md`](skills.md) — reusable AI prompts the team has captured
- [`archive/`](archive/) — superseded/historical docs, kept for reference only

## Setup

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Configure environment

Create `app/.env` (never committed — see `app/.gitignore`) with:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Get these from the Supabase dashboard (Project Settings → API) or a teammate with access. `SUPABASE_SERVICE_ROLE_KEY` has no `VITE_` prefix — Vite never inlines it into the client bundle, since it's used server-side by the dev proxy (`app/vite-plugins/scorm-content-proxy.ts`).

On the corporate network, npm may also need `NODE_EXTRA_CA_CERTS` pointed at the Zscaler root cert (see `plan.md` §1).

## Running locally

```bash
cd app
npm run dev
```

Serves at `http://localhost:5173`.

**Logging in:** three seeded demo accounts exist, sharing one demo password (deliberately simple/non-sensitive — see `plan.md` §3):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.local` | `DemoPass123!` |
| Learner | `learner@demo.local` | `DemoPass123!` |
| Educator | `educator@demo.local` | `DemoPass123!` |

## Testing

```bash
cd app
npm test           # Vitest — unit/component tests, mocked Supabase
npm run test:e2e   # Playwright — hits the real live Supabase project + a real browser
```

**Node version note:** the test runner needs Node ≥22.14/≥24. If `npm test` crashes with a `webidl.util.markAsUncloneable is not a function` error, your shell is likely on an older default Node (e.g. Homebrew's) — see `plan.md`'s Verification section for the `nvm`/`PATH` fix.

`npm run test:e2e` needs seeded-account credentials as env vars in `app/.env` — see the spec file under `app/e2e/` for which vars it reads.
