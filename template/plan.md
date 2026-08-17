# plan.md — Custom Content Uploader (SCORM) · <Team Name>
<!-- TECHNICAL APPROACH: the HOW, derived from the current spec.
     If this contradicts spec.md, resolve the contradiction before building. -->

## 1. Stack
- **Language/framework:** React 17 + TypeScript, built with Vite. Client-side routing via `react-router-dom` v5 (matches the main Clinical Learning Hub app's version).
- **UI/styling:** Elsevier's internal Leyden/ELS design system (`@els/els-styleguide-core` + `@els/els-react--*` component packages — header, footer, card, pill, badge, button, icon, link-element), same as the main CLH frontend (`ecl-neuron-app`), so the demonstrator looks native to the product. Plain SCSS per component (no CSS Modules), BEM-ish class naming, same as `ecl-neuron-app` conventions.
- **Data/storage:** Not yet built — current UI (`app/src/pages`) runs on static mock data (`app/src/data/lessons.ts`). Real SCORM upload/launch/completion storage is a TODO for the next stage.
- **Run commands:**
  - Install: `cd app && npm install`
  - Dev: `cd app && npm run dev` (serves at http://localhost:5173)
  - Build: `cd app && npm run build`
  - Note: on this network, npm requires `NODE_EXTRA_CA_CERTS` pointed at the Zscaler root cert (corporate TLS interception), e.g. `NODE_EXTRA_CA_CERTS=/path/to/ZscalerRootCertificate-2048-SHA256.crt npm install`.

## 2. Architecture Sketch
- `app/src/App.tsx` — router shell (`/` → Home, `/lesson/:lessonId` → Lesson).
- `app/src/components/app-shell/` — page chrome (ELS `Header` + `Footer` + top nav), wraps every route.
- `app/src/pages/home/` — lesson list ("My learning"), split into "Elsevier lessons" and "Custom lessons" sections. Maps to US-1 (custom lesson available, origin distinguishable) and US-3 (unified reporting view).
- `app/src/pages/lesson/` — single-lesson view: SCORM player area (currently a placeholder — no real SCORM runtime wired up yet) + a progress panel showing status/score. Maps to US-2 (launch/complete) and US-4 (completion history display).
- `app/src/components/lesson-card/` — shared card used by Home for both Elsevier and custom lessons; shows a "Custom content" badge when `origin === 'custom'`.
- `app/src/data/lessons.ts` — typed mock lesson data standing in for the real upload/enrollment/completion backend.

## 3. Key Decisions
- Built as a **separate standalone project** (`hackathon-SCORM/app`), not inside `ecl-neuron-app` — matches the spec's "standalone demonstrator" constraint and avoids touching the production CLH codebase.
- Reused the **real** `@els/*` packages (not a hand-rolled copy of the tokens) since this machine already has Artifactory registry access — keeps the visual language authentic with minimal maintenance.
- UI is currently a **static mockup** (no upload flow, no real SCORM runtime, no persistence) — this was an explicit choice to nail the visual/UX shape before wiring the real SCORM 1.2 upload → launch → completion → report pipeline described in the spec.

## 4. Engineering Constraints
- SCORM 1.2 only (per spec Business Rules) — no SCORM 2004/xAPI/AICC.
- Must not integrate with real Clinical Learning Hub systems or real customer/learner data (per spec Business Rules).

## 5. Risks & Fallbacks
- Some `@els/*` deprecated color tokens (e.g. `confirm-background`) resolve to white under the `old-branding` theme in the newer package versions this project pulled in → verified by rendering and switched to the token this codebase's own precedent uses (`confirm-on-dark`, see `checklist-details-card.tsx`) instead.
- Real SCORM runtime integration (imsmanifest.xml parsing, SCORM API adapter for completion/score) is unbuilt — biggest remaining risk to the P1 demo and the next thing to plan for.

## Alignment Check
- [x] The approach satisfies the current P1 acceptance criteria for the UI shell (US-1.2 origin distinguishability, US-3.2 origin marking) — upload/launch/completion logic (US-1.1, US-2, US-3.1, US-3.3, US-4) is not yet implemented.
- [x] Nothing here contradicts `spec.md`.
- [ ] Any new requirement discovered while planning has been routed back into `spec.md`.
