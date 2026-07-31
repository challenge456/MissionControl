---
title: Tasks Demo Server Recovery
date: 2026-07-28
status: VERIFIED
owner: Mission Control Platform
reviewer: Quality Engineering
workspace_id: sn71gskbdemgf4z1trt9zdmm5h8bde69
workspace_name: Software Factory Research Lab
repository: jaydubya818/MissionControl
source_branch: main working tree
commit: uncommitted operational recovery record
---

# Tasks Demo Server Recovery

## Summary

The requested Tasks URL returned the Mission Control error boundary even though
port 5199 returned HTTP 200. The listener belonged to an older nested worktree,
and the browser failed to load the lazy `OpsSection.tsx` module. Replacing only
that stale UI process with the supported main-repository demo UI restored the
route.

No product data, Convex records, or existing working-tree changes were mutated.

## Affected journey

```text
http://localhost:5199/v2/tasks?workspace=sn71gskbdemgf4z1trt9zdmm5h8bde69
```

## Initial result

| Check | Result |
| --- | --- |
| Port 5199 listener | Present |
| HTTP response | 200 |
| Browser render | Failed |
| Error boundary | “The operator console hit an unexpected error.” |
| Browser error | Failed to fetch dynamically imported `OpsSection.tsx` |
| Listener checkout | Nested `fix-mission-draft-routing` worktree |

The HTTP check alone was insufficient because Vite served the HTML shell while
the browser module graph failed.

## Recovery

1. Identified the exact 5199 listener and its working directory.
2. Stopped only the stale UI process tree.
3. Preserved the existing Convex development process.
4. Started `pnpm run dev:demo:ui` from `/Users/jaywest/MissionControl`.
5. Opened the exact Tasks URL in a new browser session.

## Verification result

| Check | Result |
| --- | --- |
| App shell | PASS |
| Workspace selector | PASS — Software Factory Research Lab |
| Tasks heading | PASS |
| Task data | PASS — 84 total |
| Board lanes | PASS |
| Browser page errors | PASS — zero |
| Browser console errors | PASS — zero |
| Existing working-tree changes | Preserved |

Screenshot:

`docs/validation/evidence/2026-07-28-tasks-demo-recovery.png`

## Decision

For local demo recovery, verify the listener checkout before changing
application code. HTTP 200 is not sufficient for a Vite application with lazy
modules. Restart only the stale UI process when the Convex backend is already
healthy.

## Risk and follow-up

- Multiple worktrees can start indistinguishable port-5199 processes.
- A future developer command could print the resolved repository root and fail
  when 5199 is owned by another checkout.
- The current recovery is operational; no source-code fix was required.

## Operator Docs mapping

- Mission Control Docs page: Get started → Run the demo
- Repository evidence: this file
- Screenshot: `docs/validation/evidence/2026-07-28-tasks-demo-recovery.png`
