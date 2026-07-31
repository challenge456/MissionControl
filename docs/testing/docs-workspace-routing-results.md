---
title: DOCS-001 Workspace Routing Results
date: 2026-07-28
status: VERIFIED
owner: Mission Control Platform
reviewer: Quality Engineering
branch: codex/fix-docs-workspace-routing
workspace_id: sn71gskbdemgf4z1trt9zdmm5h8bde69
---

# DOCS-001 Workspace Routing Results

## Problem and root cause

`workspace` query and local-storage strings were cast directly to
`Id<"projects">` before the accessible project list loaded. An invalid,
deleted, or inaccessible value could therefore reach `projects:get` and crash
the application through the error boundary.

## Implementation

- Start with no selected Convex project ID.
- Load and filter the accessible active project list.
- Resolve exact requested, valid stored, preferred Mission Control, then first
  accessible workspace.
- Fail closed with no project when the accessible list is empty.
- Replace only the `workspace` query parameter.
- Preserve every other query parameter, including `doc`, `mission`, `task`,
  `workOrder`, `tab`, `filters`, `view`, `automation`, and `definition`.
- Announce the exact recovery message in a dedicated nonblocking
  `role="status"` notice.
- Remember dismissal for the resolved invalid request and reannounce only when
  a different invalid workspace is explicitly requested.

No server schema or workspace authorization rule changed.

## Focused validation

| Check | Result |
| --- | --- |
| Selection-policy tests | PASS — 8 |
| Existing route tests | PASS — 2 |
| UI typecheck | PASS |
| Chromium DOCS-001 journey | PASS — 4.4 seconds |
| Invalid/deleted/inaccessible fallback | PASS |
| Valid accessible request | PASS |
| No-parameter stored fallback | PASS |
| Query preservation | PASS |
| Docs route preservation | PASS |
| Refresh | PASS |
| Back and Forward | PASS |
| Warning `role="status"` and dismissal | PASS |
| Different invalid workspace reannouncement | PASS |
| Workspace isolation | PASS |
| Page errors | 0 |
| Console errors | 0 |
| Relevant network failures | 0 |
| Critical Axe violations | 0 |

Intentional page navigation can abort in-flight `fonts.gstatic.com` font
downloads. The browser test excludes only those font `ERR_ABORTED` events and
the optional gateway health probe; neither is a Docs, application, or Convex
request failure.

## Complete root validation

| Command | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run ci:prepare` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS — 10 skills, 0 errors, 0 warnings |
| `pnpm test` | PASS — 941 tests |
| `pnpm build` | PASS |

The existing production chunk-size warning remains non-blocking.

## Evidence

- Before workspace:
  `w17bnnjbwzws1rdyvg97s9cwxd8bfda8`
- Corrected workspace:
  `sn71gskbdemgf4z1trt9zdmm5h8bde69`
- Initial route:
  `/v2/docs?workspace=w17bnnjbwzws1rdyvg97s9cwxd8bfda8&doc=sfe-overview&mission=m1&task=t1&workOrder=w1&tab=evidence&filters=open&view=operator&automation=a1&definition=d1`
- Corrected route:
  `/v2/docs?workspace=sn71gskbdemgf4z1trt9zdmm5h8bde69&doc=sfe-overview&mission=m1&task=t1&workOrder=w1&tab=evidence&filters=open&view=operator&automation=a1&definition=d1`
- Screenshot:
  `docs/testing/evidence/docs-workspace-routing/docs-001-recovered.png`
- Dismissed-warning screenshot:
  `docs/testing/evidence/docs-workspace-routing/docs-001-dismissed.png`
- Manual screenshot:
  `docs/testing/evidence/docs-workspace-routing/invalid-workspace-recovered.png`
- Playwright trace:
  `docs/testing/evidence/docs-workspace-routing/docs-001-workspace-routing-trace.zip`
- Test:
  `tests/e2e/docs-workspace-routing.e2e.spec.ts`

## Migration and rollback

No data migration is required. Roll back the App selection change, selection
helper, tests, and Docs registration together. A rollback reopens DOCS-001 and
must not be treated as safe for arbitrary workspace URLs.

## Known limitations

- The client can validate only against workspaces returned by the authorized
  accessible-list query.
- Dynamic Docs authoring remains out of scope.
- Workspace warning history is session-local UI behavior, not an audit record.

## Post-deploy monitoring

Search for `projects:get`, `ArgumentValidationError`, and
`Mission Control render failure`. Healthy behavior is a corrected URL plus the
warning with no failed Convex request. Roll back if an inaccessible workspace
is queried or data appears before accessible selection completes.
