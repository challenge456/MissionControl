# Mission draft routing — focused verification

Date: 2026-07-28

Browser: Chromium

Workspace: Software Factory Research Lab (`sn71gskbdemgf4z1trt9zdmm5h8bde69`)
Disposable record: `PR1 Browser Validation — Disposable Mission`

## Automated results

| Check | Result |
| --- | --- |
| Mission route, presentation, draft model, form, and shell unit tests | 24 passed |
| Mission draft contract and existing governance tests | 11 passed |
| Mission Control UI typecheck | Passed |
| Convex typecheck | Passed |
| Mission Control production build | Passed |
| Focused Chromium journey | 1 passed |
| Focused axe scan | 0 critical violations |
| Browser page errors | 0 |
| Failed browser requests (excluding the known gateway-status probe) | 0 |

The full repository suite was intentionally not run. The focused browser test
created one disposable Mission through the UI, verified canonical routing,
edited every supported draft field, proved persistence after refresh, exercised
back/forward and direct-link behavior, rejected an invalid budget, produced an
explicit workspace-scope error, and confirmed exactly one
`MISSION_DRAFT_UPDATED` event.

## Identity note

Mission creation and draft-update events use `ctx.auth.getUserIdentity()` when
authentication is configured. The local demo has no user-auth provider, so it
records `development:local-operator` with
`actorSource: DEVELOPMENT_FALLBACK`. This is explicit development provenance,
not production authorization.
