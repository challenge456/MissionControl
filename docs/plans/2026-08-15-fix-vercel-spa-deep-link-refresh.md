---
date: 2026-08-15
topic: vercel-spa-deep-link-refresh
work_order: h97xvg7a69rj27rk95gvw2wwph8cgcbz
task: MCF-008
---

# Fix Vercel SPA deep-link refresh

## Problem

Mission Control is a Vite application using React Router's `BrowserRouter`.
Client navigation to `/v2/deployments` works, but Vercel resolves a fresh
request from its filesystem and returns `404 NOT_FOUND` because no SPA fallback
is configured.

## Routing architecture

- The application shell is built to `apps/mission-control-ui/dist/index.html`.
- Canonical application views live under `/v2/*`.
- `/api/health` and `/api/release` are root Vercel Functions.
- built JavaScript and CSS are served from `/assets/*`; `favicon.svg` is a
  separate static file.
- Clerk authentication is initialized inside the SPA. Returning an
  unauthenticated user to a `/v2/*` URL therefore requires Vercel to serve the
  application shell first.

## Decision

Add only these root `vercel.json` rewrites:

1. `/v2` → `/index.html`
2. `/v2/:path*` → `/index.html`

This is narrower than Vercel's standard global SPA catch-all. It fixes all
current Mission Control application routes without matching `/api/*`,
`/assets/*`, `/.well-known/*`, the favicon, or future server-owned namespaces.
React Router remains responsible for choosing the in-app view after the shell
loads; Clerk and Convex authorization remain unchanged.

## Verification

- Add a focused configuration contract test covering the two allowed rewrites
  and protected server/static namespaces.
- Run UI tests, lint, typecheck, build, runtime-contract guard, and repository
  smoke tests.
- On the Vercel preview, test direct requests, refresh, history navigation,
  authenticated evidence rendering, unauthenticated Clerk behavior, API
  responses, static assets, redirect loops, console errors, and page errors.
- Qualify the exact merge through governed staging before requesting separate
  human production approval.

## Non-goals

- No Clerk configuration or key migration.
- No authorization, WorkOrder, verification, or approval semantic changes.
- No Convex schema or API handler changes.
- No new dependency or global catch-all rewrite.
