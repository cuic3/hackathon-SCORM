# plan.md — Custom Content Uploader (SCORM) · <Team Name>
<!-- TECHNICAL APPROACH: the HOW, derived from the current spec.
     If this contradicts spec.md, resolve the contradiction before building. -->

## 1. Stack
- **Language/framework:** React 17 + TypeScript, built with Vite. Client-side routing via `react-router-dom` v5 (matches the main Clinical Learning Hub app's version).
- **UI/styling:** Elsevier's internal Leyden/ELS design system (`@els/els-styleguide-core` + `@els/els-react--*` component packages — header, footer, card, pill, badge, button, icon, link-element), same as the main CLH frontend (`ecl-neuron-app`), so the demonstrator looks native to the product. Plain SCSS per component (no CSS Modules), BEM-ish class naming, same as `ecl-neuron-app` conventions.
- **Data/storage:** **Supabase** (Postgres + Auth + Storage). Schema, RLS, and seed data in §2.1 below. Replaces the current static mock (`app/src/data/lessons.ts`).
- **New dependency:** `jszip` (client-side zip inspection/extraction for the upload flow). No `@types/jszip` (ships its own types), no `mime` package (small hand-rolled extension map covers the file types actually seen in the sample package), no `uuid` package (`crypto.randomUUID()` instead).
- **Run commands:**
  - Install: `cd app && npm install`
  - Dev: `cd app && npm run dev` (serves at http://localhost:5173)
  - Build: `cd app && npm run build`
  - Note: on this network, npm requires `NODE_EXTRA_CA_CERTS` pointed at the Zscaler root cert (corporate TLS interception), e.g. `NODE_EXTRA_CA_CERTS=/path/to/ZscalerRootCertificate-2048-SHA256.crt npm install`.
  - New required env var: `SUPABASE_SERVICE_ROLE_KEY` in `app/.env` (no `VITE_` prefix — see §3).
  - Demo target: **local `npm run dev` only** — no separate deployment/hosting config needed (confirmed with product owner).

## 2. Architecture Sketch
- `app/src/App.tsx` — router shell. Adds `/login`, `/admin/upload`, `/report` alongside existing `/` and `/lesson/:lessonId`, with role-based route guards (see §2.5).
- `app/src/components/app-shell/` — page chrome (ELS `Header` + `Footer` + top nav), wraps every route.
- `app/src/pages/home/` — lesson list ("My learning"), split into "Elsevier lessons" and "Custom lessons" sections. Maps to US-1 (custom lesson available, origin distinguishable) and US-3 (unified reporting view). Now reads from Supabase instead of mock data.
- `app/src/pages/lesson/` — single-lesson view: real SCORM player (iframe + API adapter, see §2.4) for custom lessons; read-only progress panel for seeded Elsevier lessons (no real launch — out of scope, Elsevier integration is mocked/seeded only). Maps to US-2 (launch/complete) and US-4 (completion history display).
- `app/src/components/lesson-card/` — shared card used by Home for both Elsevier and custom lessons; shows a "Custom content" badge when `origin === 'custom'`.
- `app/src/pages/admin-upload/` *(new)* — admin upload view: zip select → validate → parse manifest → upload to Storage → insert lesson row. See §2.3.
- `app/src/pages/report/` *(new)* — nurse educator unified report view. See §2.6.
- `app/src/pages/login/` *(new)* + `app/src/utils/auth-context.tsx` *(new)* — real Supabase Auth email/password login, session/profile context, route guards. See §2.5.
- `app/src/utils/scorm-api-adapter.ts` *(new)* — the `window.API` object implementing the SCORM 1.2 runtime contract. See §2.4.
- `app/vite-plugins/scorm-content-proxy.ts` *(new)* — same-origin dev/preview server middleware serving uploaded package files. See §2.2.
- `app/src/data/lessons.ts` — retired once Supabase wiring lands; was standing in for the real upload/enrollment/completion backend.

**The core technical problem this design solves:** SCORM 1.2's API-discovery convention (`findAPI()` in the sample package, `sample-content/RuntimeBasicCalls_SCORM12/shared/scormfunctions.js`) walks `window.parent` looking for a window property literally named `API`, with **no error handling** around that property access. If the SCO runs in an iframe pointed directly at a Supabase Storage URL (a different origin from the app), that access throws `SecurityError` and crashes discovery outright. The sample is also a real multi-page course with real relative-path navigation between pages/assets (confirmed: `launchpage.html` → nested iframe → `../Playing/Playing.html`, `@import url(style.css)`, `parent.RecordTest(...)` reaching back up a frame level) — so blob-URL tricks would break relative resolution. The fix (§2.2): extract the zip to Supabase Storage at upload time, but serve it back to the browser through a same-origin Vite dev-server proxy, not a direct Storage URL.

### 2.1 Supabase schema (applied via `apply_migration`)
```sql
create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role text not null check (role in ('admin','learner','educator')),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  origin text not null check (origin in ('elsevier','custom')),
  title text not null,
  description text,
  duration_minutes integer,
  is_active boolean not null default true,
  package_id text,               -- storage folder key; null for elsevier rows
  launch_path text,              -- e.g. 'shared/launchpage.html'; null for elsevier rows
  manifest_title text,           -- raw title parsed from imsmanifest.xml
  uploaded_by uuid references profiles(id),
  replaces_lesson_id uuid references lessons(id),
  superseded_by_lesson_id uuid references lessons(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lesson_completions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references profiles(id),
  lesson_id uuid not null references lessons(id),   -- default RESTRICT: can't hard-delete a lesson with completions
  lesson_title_snapshot text not null,
  lesson_origin_snapshot text not null check (lesson_origin_snapshot in ('elsevier','custom')),
  status text not null check (status in ('not-started','incomplete','completed','passed','failed')),
  score_raw numeric,
  score_min numeric,
  score_max numeric,
  lesson_location text,          -- cmi.core.lesson_location bookmark
  exit_mode text,                -- cmi.core.exit: 'suspend' | '' | null
  session_time text,
  first_launched_at timestamptz,
  completed_at timestamptz,
  last_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (learner_id, lesson_id)
);

create table content_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id),
  action text not null check (action in ('upload','deactivate','reactivate','edit')),
  lesson_id uuid references lessons(id),
  previous_lesson_id uuid references lessons(id),
  detail jsonb,
  created_at timestamptz not null default now()
);
```

**Why history survives re-upload/deactivate (US-4):** a re-upload always inserts a brand-new `lessons` row; the only write to the old row is `is_active=false, superseded_by_lesson_id=<new>`. `lesson_completions` is never touched by upload/deactivate, and carries its own `lesson_title_snapshot`/`lesson_origin_snapshot` so the report never has to re-join a changed or deactivated `lessons` row. The FK (`ON DELETE RESTRICT`) makes hard-deleting a lesson with completions structurally impossible, and no `delete` RLS policy exists on `lesson_completions` at all — a recorded completion can never be deleted through the API.

RLS (all tables `enable row level security`, plus a security-definer `current_profile_role()` helper to avoid recursive-RLS issues):
- `organizations`: select for any authenticated user; no client insert/update.
- `profiles`: select own row, or any row if role is admin/educator.
- `lessons`: select for any authenticated user; insert/update restricted to `role = 'admin'`; no delete policy.
- `lesson_completions`: select own rows, or all rows if role is admin/educator; insert/update restricted to own (`learner_id = auth.uid()`); no delete policy for any role.
- `content_audit_log`: admin-only select and insert (never joined into the report — satisfies US-4.2).
- Storage bucket `content` (created **private**): authenticated read, admin-only insert/update, no delete policy.

**Seed data** (via `execute_sql`): 1 `organizations` row ("Riverside Health", matching existing mock copy); 3 Supabase Auth users via direct `auth.users` insert (`crypt()`/pgcrypto, `email_confirmed_at = now()` so login works without SMTP) for the seeded admin/learner/educator roles (`admin@demo.local` / `learner@demo.local` / `educator@demo.local`, shared demo password — confirmed with product owner) + matching `profiles` rows; 3–5 `elsevier`-origin `lessons` rows (reusing shapes from `app/src/data/lessons.ts`) with matching `lesson_completions` rows for the learner in mixed states (completed w/ score, in-progress/incomplete, not-started).

### 2.2 Same-origin content proxy (new: `app/vite-plugins/scorm-content-proxy.ts`)
A Vite plugin exporting `configureServer` and `configurePreviewServer` (both call the same `installMiddleware(server)`), intercepting `/content/*`:
- Strip query string before mapping path → Storage object and before mime lookup (the sample package's assessment page is requested as `assessmenttemplate.html?questions=...`).
- Reject any path segment `==` `..`.
- Fetch the object from Supabase Storage using the **service role key** (bypasses Storage RLS server-side; the browser never talks to Storage directly for content bytes).
- Buffer as `ArrayBuffer` → `Buffer`, set `Content-Type` from a small hand-rolled extension map (`.html/.htm/.js/.css/.xml/.xsd/.jpg/.jpeg/.png/.gif/.svg/.json/.txt`, default `application/octet-stream`) and `Content-Length`, `res.end(buffer)`.

This makes `iframe src="/content/{packageId}/shared/launchpage.html"` truly same-origin (so `window.parent.API` access works) and preserves real relative-path resolution between the package's internal files/pages. No CORS issue: the browser only ever talks to its own origin; the cross-origin hop to `*.supabase.co` happens server-side in the Vite plugin process.

### 2.3 Admin upload flow (new: `app/src/pages/admin-upload/`)
1. Admin selects `.zip`. `JSZip.loadAsync(await file.arrayBuffer())`.
2. If no root-level `imsmanifest.xml` in `zip.files` → abort with `"This file doesn't look like a SCORM package (missing imsmanifest.xml)"`. Nothing is created (US-1.4).
3. Parse `imsmanifest.xml` with `DOMParser` + `getElementsByTagName` (namespace-agnostic): default org's `<title>` (manifest title), the org's first `<item identifierref>`, the matching `<resource href>` = launch path.
4. `packageId = crypto.randomUUID()`; upload every zip entry to `content/{packageId}/{relativePath}` in Storage (small hand-rolled concurrency batching, ~4-6 at a time).
5. Insert `lessons` row (`origin: 'custom'`, `package_id`, `launch_path`, `manifest_title`, admin-provided title/description/duration, `uploaded_by`).
6. Insert `content_audit_log` row (`action: 'upload'`).
7. Success → redirect to admin's lesson list, which also gets a **Deactivate** action (`is_active=false` + audit log row) for US-4.1.

### 2.4 SCORM runtime bridge (rewrite: `app/src/pages/lesson/lesson.tsx`)
New: `app/src/utils/scorm-api-adapter.ts` implementing `LMSInitialize/LMSFinish/LMSGetValue/LMSSetValue/LMSCommit/LMSGetLastError/LMSGetErrorString/LMSGetDiagnostic` — **all string returns** (`"true"`/`"false"`, matching the sample's `SCORM_TRUE`/`SCORM_FALSE` convention), backed by a small static SCORM 1.2 error-code table.

Sequencing (avoids the async-load vs. synchronous-`LMSInitialize` race):
1. On mount, `useEffect` fetches the learner's existing `lesson_completions` row for this lesson (if any) — render a "Preparing lesson…" placeholder until this resolves.
2. Build the in-memory `cmiModel` from that row (or defaults: `lesson_status="not attempted"`, `lesson_location=""`) — mapping our `status` vocabulary to SCORM 1.2's (`not-started→"not attempted"`, `incomplete→"incomplete"`, `completed→"completed"`, `passed→"passed"`, `failed→"failed"`).
3. Assign `window.API = adapter`, **then** render `<iframe src="/content/{packageId}/{launchPath}">`. Clean up (`delete window.API`) on unmount/lesson-id change — required because this is a client-routed SPA, so a stale adapter from a previous lesson session would otherwise still answer a new lesson's `findAPI()`.
4. Persistence: debounce (~300-400ms) upsert to `lesson_completions` on every `LMSSetValue`. On the `cmi.core.exit` SetValue and on `LMSFinish` (which fires from `onbeforeunload`/`onunload` — no `LMSCommit` exists in this sample, so this can't be the only safety net), do an **immediate, non-debounced flush via `fetch(url, {method:'POST', keepalive:true, headers:{apikey, Authorization}})`** direct to the PostgREST endpoint (`sendBeacon` can't carry the required custom headers). By the time `LMSFinish` runs, the debounced flush from prior `SetValue` calls has almost always already landed — the unload-time write is belt-and-suspenders.
5. Never fabricate: only write what the package actually reports; if `LMSFinish` fires with `lesson_status` still `"not attempted"`/`"incomplete"` and no score set, persist exactly that (edge case, "package launches but never reports completion").

Resume: the sample's own `doStart()` already reads `cmi.core.lesson_location` and prompts to resume via native `confirm()` — no SCO-side changes needed, just correct state-loading in the adapter (step 2 above).

### 2.5 Auth & routing (new: `app/src/pages/login/`, `app/src/utils/auth-context.tsx`)
- Real Supabase Auth email/password login (`supabase.auth.signInWithPassword`).
- `AuthContext` (session + profile + loading) via `supabase.auth.onAuthStateChange`.
- Route guards in `App.tsx`: unauthenticated → `/login`; authenticated → route by `profiles.role` (admin → `/admin/upload`, learner → `/`, educator → `/report`); mismatched role on a route → redirect to that role's own landing view.

### 2.6 Unified report (new: `app/src/pages/report/report.tsx`)
Single table/list joining all `lesson_completions` (seeded elsevier + real custom), reading from denormalized snapshot fields (not live-joining `lessons`, so deactivated/edited content never changes historical display). Origin badge reused from `lesson-card`'s existing "Custom content" badge pattern. Score display rule (MUST): always `"{pct}% ({raw}/{max})"` when a score exists, else `"Completed — no score reported"` (never blank/dash) when status indicates completion with no score.

## 3. Key Decisions
- Built as a **separate standalone project** (`hackathon-SCORM/app`), not inside `ecl-neuron-app` — matches the spec's "standalone demonstrator" constraint and avoids touching the production CLH codebase.
- Reused the **real** `@els/*` packages (not a hand-rolled copy of the tokens) since this machine already has Artifactory registry access — keeps the visual language authentic with minimal maintenance.
- Content is extracted and re-hosted in Supabase Storage at upload time (not served as a raw zip), so the same-origin proxy can serve individual files by real relative path.
- The dev-server proxy (§2.2), not a direct Storage URL or Edge Function, is what the iframe points at — the only design that is simultaneously same-origin, preserves real relative-path resolution, and requires no extra deploy step beyond `npm run dev`. Alternatives considered and rejected: Supabase Edge Function + hosting rewrites (still cross-origin unless proxied anyway, and needs a deploy step); service worker interception (no benefit over the plugin, more demo-day failure modes); a separate Express proxy process (functionally identical, extra process to run).
- **Manual step required from the product owner:** the proxy needs the Supabase **service role key** to read Storage server-side (the Supabase MCP tooling only exposes the anon/publishable key). Must be copied from the Supabase dashboard (Project Settings → API) and added to `app/.env` as `SUPABASE_SERVICE_ROLE_KEY` (no `VITE_` prefix, so Vite never inlines it into the client bundle; `app/.gitignore` already ignores `*env`, so this stays untracked).
- Seeded auth accounts use simple, non-sensitive default credentials and the demo targets local `npm run dev` only (both confirmed with product owner — see §1).

## 4. Engineering Constraints
- SCORM 1.2 only (per spec Business Rules) — no SCORM 2004/xAPI/AICC.
- Must not integrate with real Clinical Learning Hub systems or real customer/learner data (per spec Business Rules).
- Must never lose or mutate a recorded completion as a side effect of content management actions (US-4) — enforced structurally via the schema in §2.1 (soft-deactivate only, denormalized snapshots, no delete RLS policy on completions).

## 5. Risks & Fallbacks
- Some `@els/*` deprecated color tokens (e.g. `confirm-background`) resolve to white under the `old-branding` theme in the newer package versions this project pulled in → verified by rendering and switched to the token this codebase's own precedent uses (`confirm-on-dark`, see `checklist-details-card.tsx`) instead.
- Cross-origin `SecurityError` in SCORM API discovery if content is ever served directly from a Storage URL instead of through the proxy — mitigated by routing every content request through `/content/*` (§2.2); do not introduce a code path that points an iframe at a raw Storage URL.
- `LMSFinish` fires during page unload with no guaranteed time to complete an async write — mitigated by debounced persistence on every `LMSSetValue` (so the unload-time write is not the only save point) plus a `keepalive: true` fetch for the final flush.
- Real SCORM runtime integration (imsmanifest.xml parsing, SCORM API adapter for completion/score) was the biggest remaining risk to the P1 demo as of the prior static-mockup phase — §2.1–§2.6 above is the concrete design to retire that risk; still unbuilt as of this plan update and the next thing to implement.

## Alignment Check
- [x] The approach satisfies the current P1 acceptance criteria for the UI shell (US-1.2 origin distinguishability, US-3.2 origin marking) and now covers the full P1 loop on paper (US-1.1, US-1.4, US-2, US-3.1, US-3.3, US-4) via §2.1–§2.6 — not yet implemented as of this plan update.
- [x] Nothing here contradicts `spec.md`.
- [x] Two ambiguities (demo/deploy target, seed credentials) were surfaced to the product owner rather than guessed, and resolved before finalizing this plan — see §1 and §3.

## 6. Build order / tasks (to also populate `tasks.md`)
1. **Schema + seed** (§2.1) — no UI changes yet.
2. **Thin end-to-end loop** (demo-critical path): real login/route guards (§2.5) → admin upload, hardcoded to the one sample package first (§2.3) → content proxy plugin (§2.2) → SCORM adapter + lesson launch (§2.4) → persistence wiring → report page (§2.6). Manually verify the full loop once: admin uploads → learner completes → educator sees it next to seeded rows.
3. **Required edge cases** (spec §8): resume-from-bookmark verification, deactivate button + audit log, missing-manifest rejection message, admin-only audit log view.
4. **Polish**: full re-upload/replace flow, multiple learners/packages if time allows, upload UX polish.

## Verification
- `cd app && npm install jszip && npm run dev` — run the actual local demo loop end-to-end: log in as each seeded role, upload the sample zip as admin, launch+complete it as learner (confirm real iframe-hosted SCORM content runs, not a placeholder), confirm suspend/resume works (exit mid-lesson, relaunch, confirm resume prompt), view the report as educator and confirm both seeded Elsevier rows and the new custom completion appear with correct origin/score formatting.
- Re-test each AC in `spec.md` §9/§9.1 against the running system.
- `get_advisors` (Supabase MCP) after migration to catch any RLS/security lint issues.
- Confirm a missing-`imsmanifest.xml` zip is rejected with the required error and creates nothing (check no `lessons`/Storage rows were written).
- Confirm deactivating/re-uploading custom content leaves existing `lesson_completions` rows unchanged in the report (US-4.1).
