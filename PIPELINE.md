# CI/CD & Deployment Pipeline — Halloween Rock

This document describes a complete, cost-efficient pipeline for the "Halloween Rock" project using a static frontend (Cloudflare Pages / Vercel) and a lightweight Supabase backend (Postgres + Edge Functions). It lists automated checks, manual runbook steps, rollback behaviour, and party-day verification checks.

## Goals

- Fast, reliable deploys from commits/PRs
- Pre-merge automated checks (build, lint, unit tests)
- Safe deployment of database migrations and Edge Functions
- Simple rollback and monitoring
- Minimal monthly cost and low operational overhead

## Components

- Frontend: SPA (Svelte/Preact or vanilla JS) built with Vite and deployed to Cloudflare Pages (or Vercel)
- Backend: Supabase (Postgres) for optional cross-device persistence + Edge Functions for server-side endpoints
- CI: GitHub Actions
- Secrets: stored in GitHub Actions Secrets and Supabase project settings

---

## Branching & Git workflow

- `main` — production (auto-deploy)
- `staging` — optional preview staging (auto-deploy preview)
- `feature/*` — developer branches, PR to `main` or `staging`

PR flow:

- Developers open PR -> CI runs checks -> reviewers approve -> merge to `main` triggers deployment

---

## Pre-merge (PR) checks — REQUIRED

These checks must pass before merging any PR to `main`.

- [ ] Build: `npm run build` succeeds (production build artifact created)
- [ ] Lint: `npm run lint` (ESLint/Prettier) — no blocking errors
- [ ] Unit tests: `npm test` (if tests exist) — all passing
- [ ] Accessibility quick check: Lighthouse or axe-core smoke test (optional but recommended)
- [ ] Security scan: dependency-check / npm audit (auto-comment in PR if high severity)
- [ ] Preview deployed (optional): the PR preview URL works and basic UX is validated

Automate these in GitHub Actions. Block merges on failing checks.

---

## CI Workflows (recommended names)

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

---

## Secrets & environment variables

- `SUPABASE_URL` (client) — public
- `SUPABASE_ANON_KEY` (client) — public-limited (use for client SDK)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only) — store as `SUPABASE_SERVICE_ROLE_KEY` in GitHub Secrets and only use in server-side deploy steps / Edge Function deployments
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` or Vercel token — for deployment
- `CF_PAGES_PROJECT_NAME` or equivalent

Only use service-role secrets in CI steps that run server-side logic (migrations, function deploy). Never expose them in client bundles.

---

## Deploy checks (post-deploy)

After a successful deploy, run this checklist automatically (if possible) or manually:

- [ ] Public site reachable (GET /) -> 200 within 3s
- [ ] Critical assets (JS/CSS/audio) served from CDN -> 200
- [ ] PWA / service worker registered (if configured)
- [ ] Audio playback: open a test page and ensure Web Audio can load and play (smoke test)
- [ ] Sync endpoint `/edge/sync` responds 200 to a test batched event (use test API key)
- [ ] Leaderboard `/edge/leaderboard` returns 200 and expected JSON schema
- [ ] DB row count sanity check (players/purchases table) — no unexpected large increases

Automate these as a post-deploy job in `deploy-frontend.yml`/`deploy-supabase.yml` wherever possible.

---

## Acceptance & Quality Gates (Green-before-Done)

Before declaring a release ready for the party (production), ensure these gates PASS:

- Build: PASS (artifact exists)
- Lint: PASS
- Unit tests: PASS
- Manual smoke test on a mobile device: Play -> Tap -> coin increments
- Offline test: Load once, then switch device to airplane mode and verify local play still works
- Persistence test: Buy item -> reload -> item still owned

If any gate fails, revert the merge or block the deployment until fixed.

---

## Rollback strategy

- Frontend: Cloudflare Pages / Vercel provide previous deploys — revert to last known good build via provider UI or trigger redeploy of a tagged commit.
- Supabase DB migrations: design migrations to be reversible where possible. If a destructive migration is applied, have a DB backup snapshot or rely on point-in-time recovery (PITR) if enabled.
- If Edge Function introduces breaking behavior, disable the function via Supabase dashboard and roll back code.

---

## Monitoring & Alerts

- Monitor Cloudflare Pages / Vercel uptime and logs
- Monitor Supabase Edge Function invocations and errors
- Configure basic alerts:
  - Error rate > X% in Edge Functions -> Slack/email
  - DB row growth anomaly -> email
  - Budget threshold reached -> billing alert

Supabase dashboard and Cloudflare provide metrics; connect to Slack or email alerts for party reliability.

---

## Party-day runbook (quick checklist)

- [ ] Deploy latest `main` and confirm post-deploy checks succeeded
- [ ] Generate QR codes pointing to the production URL (shorten if desired)
- [ ] Test on 3 different phones (iOS Safari, Android Chrome, older Android if available)
- [ ] Verify audio latency and volume on devices
- [ ] Confirm offline behavior after a cold load
- [ ] Print backup QR (and short instructions) in case of connectivity issues

If anything fails on the party day, fallback options:

- Serve a local hotspot with the built site hosted on a tiny device (optional)
- Switch to a pre-built offline demo page (single file) that demonstrates the core experience without backend

---

## Security & Abuse mitigations (party scale)

- Rate-limit `/edge/sync` by IP and by playerId
- Sanitize user-provided names before writing to the leaderboard
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if leaked

---

## Local developer commands (examples - PowerShell)

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

---

## Useful GitHub Actions / Implementation notes

- Use the official Cloudflare Pages Action or Vercel Action for deployment
- Use `supabase/cli-action` or run `npm i -g supabase` in CI to deploy migrations and functions
- Keep the `deploy-supabase.yml` workflow manual if you expect to run migrations only on demand

---

## Appendix: Quick PR checklist (copy into PR template)

- [ ] I added tests for any new behavior
- [ ] I updated documentation where necessary (README / PIPELINE.md)
- [ ] Local dev tested: build, run, and smoke-tested on mobile
- [ ] No sensitive keys in code

---

End of pipeline document. If you'd like, I can now scaffold the GitHub Actions workflows referenced here (CI, deploy-frontend, deploy-supabase) and a sample PWA-ready frontend scaffold. Which should I scaffold next? (A: full Svelte + workflows, B: vanilla single-file prototype + workflows, C: only workflows and SQL migrations)
