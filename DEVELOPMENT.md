# Development Guide — Halloween Rock

This document covers the project's modular architecture, refactoring history, and deployment pipeline.

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Refactoring Overview](#refactoring-overview)
3. [CI/CD & Deployment Pipeline](#cicd--deployment-pipeline)

---

## Project Structure

### File Structure
```
Halloween-Rock/
├── index.html              (cleaned up - only HTML structure)
├── styles/
│   └── main.css           (all CSS styles)
├── scripts/
│   ├── state.js           (state management & localStorage)
│   ├── audio.js           (audio context & sample loading)
│   ├── ui.js              (DOM manipulation & rendering)
│   └── main.js            (app initialization)
├── sw.js                  (updated cache list)
└── public/
    ├── audio/
    └── images/
```

### Module Breakdown

#### `scripts/state.js`
- State management and persistence
- localStorage operations (load/save)
- Shop items configuration
- Business logic for buying and equipping items

#### `scripts/audio.js`
- AudioContext initialization
- Sample loading from public/audio/
- Playback functions (samples + synthesized fallback)
- Audio file format detection (.wav, .mp3, .ogg, .m4a)

#### `scripts/ui.js`
- DOM element references
- Rendering functions
- Visual animations (coin fly, tap effects)
- Shop modal management
- Idle hint timer

#### `scripts/main.js`
- Application initialization
- Event listener setup
- Module coordination
- Entry point for the app

#### `styles/main.css`
- All CSS extracted from inline `<style>` tag
- Properly formatted and readable
- Unchanged styling - just reorganized

---

## Refactoring Overview

The Halloween Rock project has been refactored from a single-file structure to a modular architecture for improved maintainability.

## Changes Made

### File Structure
```
Halloween-Rock/
├── index.html              (cleaned up - only HTML structure)
├── styles/
│   └── main.css           (all CSS styles)
├── scripts/
│   ├── state.js           (state management & localStorage)
│   ├── audio.js           (audio context & sample loading)
│   ├── ui.js              (DOM manipulation & rendering)
│   └── main.js            (app initialization)
├── sw.js                  (updated cache list)
└── public/
    ├── audio/
    └── images/
```

### Module Breakdown

#### `scripts/state.js`
- State management and persistence
- localStorage operations (load/save)
- Shop items configuration
- Business logic for buying and equipping items

#### `scripts/audio.js`
- AudioContext initialization
- Sample loading from public/audio/
- Playback functions (samples + synthesized fallback)
- Audio file format detection (.wav, .mp3, .ogg, .m4a)

#### `scripts/ui.js`
- DOM element references
- Rendering functions
- Visual animations (coin fly, tap effects)
- Shop modal management
- Idle hint timer

#### `scripts/main.js`
- Application initialization
- Event listener setup
- Module coordination
- Entry point for the app

#### `styles/main.css`
- All CSS extracted from inline `<style>` tag
- Properly formatted and readable
- Unchanged styling - just reorganized

### Service Worker Updates
- Cache name bumped to `v3`
- Added new files to precache:
  - `styles/main.css`
  - `scripts/state.js`
  - `scripts/audio.js`
  - `scripts/ui.js`
  - `scripts/main.js`

## Benefits

### Maintainability
- ✅ Separation of concerns (state, UI, audio)
- ✅ Easier to debug specific features
- ✅ Clear module responsibilities

### Scalability
- ✅ Easy to add new features to specific modules
- ✅ Can test modules independently
- ✅ Better code reusability

### Development Experience
- ✅ Better syntax highlighting in editors
- ✅ Cleaner git diffs (changes isolated to specific files)
- ✅ Easier code navigation

### Performance
- ✅ Better browser caching (unchanged files stay cached)
- ✅ Smaller updates when only one module changes
- ✅ ES6 modules enable potential tree-shaking in future

## Compatibility

### GitHub Pages
- ✅ No changes required to deployment
- ✅ All paths remain relative
- ✅ Service worker properly configured

### Browser Support
- ES6 modules used (`type="module"`)
- Supported by all modern browsers
- Same browser support as before (AudioContext, etc.)

## Testing Checklist
Before pushing to production:
- [ ] Test basic drum tap functionality
- [ ] Test coin earning
- [ ] Test shop modal (open/close)
- [ ] Test buying items
- [ ] Test equipping items
- [ ] Test owned instrument buttons
- [ ] Test audio playback (samples + fallback)
- [ ] Test service worker update banner
- [ ] Test offline functionality

## Next Steps (Optional)
Future improvements could include:
- Add unit tests for state.js
- Add JSDoc comments for better IDE support
- Consider bundler (Vite/Parcel) for production optimization
- Add TypeScript for type safety

---

## CI/CD & Deployment Pipeline

This section describes a complete, cost-efficient pipeline for the "Halloween Rock" project using a static frontend (Cloudflare Pages / Vercel) and a lightweight Supabase backend (Postgres + Edge Functions). It lists automated checks, manual runbook steps, rollback behaviour, and party-day verification checks.

### Goals

- Fast, reliable deploys from commits/PRs
- Pre-merge automated checks (build, lint, unit tests)
- Safe deployment of database migrations and Edge Functions
- Simple rollback and monitoring
- Minimal monthly cost and low operational overhead

### Components

- Frontend: SPA (Svelte/Preact or vanilla JS) built with Vite and deployed to Cloudflare Pages (or Vercel)
- Backend: Supabase (Postgres) for optional cross-device persistence + Edge Functions for server-side endpoints
- CI: GitHub Actions
- Secrets: stored in GitHub Actions Secrets and Supabase project settings

### Branching & Git workflow

- `main` — production (auto-deploy)
- `staging` — optional preview staging (auto-deploy preview)
- `feature/*` — developer branches, PR to `main` or `staging`

PR flow:

- Developers open PR -> CI runs checks -> reviewers approve -> merge to `main` triggers deployment

### Pre-merge (PR) checks — REQUIRED

These checks must pass before merging any PR to `main`.

- [ ] Build: `npm run build` succeeds (production build artifact created)
- [ ] Lint: `npm run lint` (ESLint/Prettier) — no blocking errors
- [ ] Unit tests: `npm test` (if tests exist) — all passing
- [ ] Accessibility quick check: Lighthouse or axe-core smoke test (optional but recommended)
- [ ] Security scan: dependency-check / npm audit (auto-comment in PR if high severity)
- [ ] Preview deployed (optional): the PR preview URL works and basic UX is validated

Automate these in GitHub Actions. Block merges on failing checks.

### CI Workflows (recommended names)

1) `ci.yml` — Runs on PRs

- Steps:
  - checkout
  - install deps
  - run lint
  - run tests
  - run build (to ensure production build success)
  - optional: run bundle size check (e.g., `bundlesize`)

2) `deploy-frontend.yml` — Runs on push to `main`

- Steps:
  - checkout
  - install deps
  - build
  - run smoke tests (simple http request to local built index)
  - deploy to Cloudflare Pages or Vercel via official action
  - run post-deploy smoke test (check public URL, expected status 200)

3) `deploy-supabase.yml` — Manual or scheduled run (deploy DB migrations & Edge Functions)

- Steps:
  - checkout
  - install supabase CLI (or use pre-built action)
  - run SQL migrations (idempotent) against Supabase (use service role key in CI secret)
  - deploy Edge Functions
  - run server-side smoke test (call `/health` or `/edge/leaderboard`)

Note: Keep `deploy-supabase.yml` gated (manual approval) if migrations are destructive.

#### Lockfile recommendation

For deterministic installs and to avoid CI failures, commit a lockfile (`package-lock.json` or `npm-shrinkwrap.json`) to the repository. Many CI workflows (and `npm ci`) expect a lockfile; without it `npm ci` will fail with an EUSAGE error. Recommended steps:

```powershell
cd C:\path\to\repo
npm install --package-lock-only   # creates package-lock.json without installing node_modules
git add package-lock.json
git commit -m "chore: add package-lock.json for CI"
git push origin main
```

If you prefer not to commit a lockfile, ensure your CI workflows fall back to `npm install` when a lockfile is missing. This is less deterministic but prevents the CI `npm ci` error.

### Secrets & environment variables

- `SUPABASE_URL` (client) — public
- `SUPABASE_ANON_KEY` (client) — public-limited (use for client SDK)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only) — store as `SUPABASE_SERVICE_ROLE_KEY` in GitHub Secrets and only use in server-side deploy steps / Edge Function deployments
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` or Vercel token — for deployment
- `CF_PAGES_PROJECT_NAME` or equivalent

Only use service-role secrets in CI steps that run server-side logic (migrations, function deploy). Never expose them in client bundles.

### Deploy checks (post-deploy)

After a successful deploy, run this checklist automatically (if possible) or manually:

- [ ] Public site reachable (GET /) -> 200 within 3s
- [ ] Critical assets (JS/CSS/audio) served from CDN -> 200
- [ ] PWA / service worker registered (if configured)
- [ ] Audio playback: open a test page and ensure Web Audio can load and play (smoke test)
- [ ] Sync endpoint `/edge/sync` responds 200 to a test batched event (use test API key)
- [ ] Leaderboard `/edge/leaderboard` returns 200 and expected JSON schema
- [ ] DB row count sanity check (players/purchases table) — no unexpected large increases

Automate these as a post-deploy job in `deploy-frontend.yml`/`deploy-supabase.yml` wherever possible.

### Acceptance & Quality Gates (Green-before-Done)

Before declaring a release ready for the party (production), ensure these gates PASS:

- Build: PASS (artifact exists)
- Lint: PASS
- Unit tests: PASS
- Manual smoke test on a mobile device: Play -> Tap -> coin increments
- Offline test: Load once, then switch device to airplane mode and verify local play still works
- Persistence test: Buy item -> reload -> item still owned

If any gate fails, revert the merge or block the deployment until fixed.

### Rollback strategy

- Frontend: Cloudflare Pages / Vercel provide previous deploys — revert to last known good build via provider UI or trigger redeploy of a tagged commit.
- Supabase DB migrations: design migrations to be reversible where possible. If a destructive migration is applied, have a DB backup snapshot or rely on point-in-time recovery (PITR) if enabled.
- If Edge Function introduces breaking behavior, disable the function via Supabase dashboard and roll back code.

### Monitoring & Alerts

- Monitor Cloudflare Pages / Vercel uptime and logs
- Monitor Supabase Edge Function invocations and errors
- Configure basic alerts:
  - Error rate > X% in Edge Functions -> Slack/email
  - DB row growth anomaly -> email
  - Budget threshold reached -> billing alert

Supabase dashboard and Cloudflare provide metrics; connect to Slack or email alerts for party reliability.

### Party-day runbook (quick checklist)

- [ ] Deploy latest `main` and confirm post-deploy checks succeeded
- [ ] Generate QR codes pointing to the production URL (shorten if desired)
- [ ] Test on 3 different phones (iOS Safari, Android Chrome, older Android if available)
- [ ] Verify audio latency and volume on devices
- [ ] Confirm offline behavior after a cold load
- [ ] Print backup QR (and short instructions) in case of connectivity issues

If anything fails on the party day, fallback options:

- Serve a local hotspot with the built site hosted on a tiny device (optional)
- Switch to a pre-built offline demo page (single file) that demonstrates the core experience without backend

### Security & Abuse mitigations (party scale)

- Rate-limit `/edge/sync` by IP and by playerId
- Sanitize user-provided names before writing to the leaderboard
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if leaked

### Local developer commands (examples - PowerShell)

These assume a Vite/Svelte or Vite/Preact scaffold.

```powershell
# install deps
npm install

# dev server
npm run dev

# run lint
npm run lint

# run unit tests
npm test

# production build
npm run build

# preview production build locally
npm run preview
```

Supabase CLI quick commands (install per platform):

```powershell
# login and link project
supabase login
supabase link --project-ref <PROJECT_REF>

# run migrations
supabase db push

# deploy Edge Functions
supabase functions deploy sync
```

### Useful GitHub Actions / Implementation notes

- Use the official Cloudflare Pages Action or Vercel Action for deployment
- Use `supabase/cli-action` or run `npm i -g supabase` in CI to deploy migrations and functions
- Keep the `deploy-supabase.yml` workflow manual if you expect to run migrations only on demand

### Quick PR checklist (copy into PR template)

- [ ] I added tests for any new behavior
- [ ] I updated documentation where necessary (README / Development Guide)
- [ ] Local dev tested: build, run, and smoke-tested on mobile
- [ ] No sensitive keys in code

