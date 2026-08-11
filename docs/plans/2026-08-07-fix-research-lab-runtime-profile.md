---
date: 2026-08-07
status: complete
workspace: Software Factory Research Lab
---

# Durable Software Factory Research Lab runtime

## Problem

`pnpm run dev:demo` intentionally starts the project-scoped Software Factory
Demo database on port 3212. The original Software Factory Research Lab remains
intact in the central local Convex state on port 3210, so starting the demo
profile makes the Research Lab disappear from the workspace selector.

## Plan

1. Add an explicit `dev:research-lab` runtime profile.
2. Resolve the preserved central backend from the configured local deployment
   instead of hard-coding credentials or copying data.
3. Start the preserved backend and the v2 UI on port 5199 with local-only
   company-context visibility disabled. Use the explicitly configured UI
   checkout when the preserved backend contract is newer than the main branch.
4. Do not seed, migrate, reconstruct, or run autonomous executors against the
   Research Lab.
5. Add focused tests and browser verification that the workspace appears and
   survives reload.

## Follow-up: application readiness

The preserved Convex process can accept HTTP traffic before its deployed
functions are ready to serve the canonical workspace list. Starting Vite after
only the `/instance_name` probe can therefore make the first `projects:list`
request time out. Because that query is owned by the application shell, the
failure leaves the whole page in its error boundary even after the backend
recovers.

The launcher must not start Vite until `projects:list` succeeds and includes the
Software Factory Research Lab workspace. Transient query failures should be
retried within a bounded readiness window, and the launcher should fail closed
when the canonical workspace never becomes available.

## Safety boundaries

- Production company authorization remains unchanged.
- The Software Factory Demo database remains untouched.
- Local backend credentials are read from existing Convex state and are never
  printed or copied into the repository.
- The launcher fails closed when required state, binaries, or ports are not
  available.
