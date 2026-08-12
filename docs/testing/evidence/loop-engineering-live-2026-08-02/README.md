# Loop Engineering Live Verification

Date: 2026-08-02  
Route: `/v2/harness-loops`  
Workspace: Software Factory Demo (`sn7dtgyn9pt0gq43x2wpw5mwxn8b7adt`)

## Outcome

Loop Engineering satisfies the bounded Live-promotion gate. Sensitive factory
actions use server-derived operator authority, denied action decisions are
retained through a separate audited transaction, GitHub webhook ingestion stays
behind signature verification, and the workflow executor uses the existing
server-only Convex JWT boundary.

Uncorrelated PR/CI evidence is now quarantined in an exception-first inbox.
Operators can inspect deterministic repository, branch, WorkOrder state, and
producing Attempt signals; choose the exact Attempt; retain a reason; and make
one idempotent, immutable link or dismissal decision. A repeated same-head
ingest cannot overwrite that manual decision.

## Automated verification

- `pnpm typecheck` — passed for all configured workspaces after CI dependency preparation.
- `pnpm exec tsc -p convex/tsconfig.json --noEmit` — passed.
- `pnpm test` — passed.
  - Mission Control UI: 46 files, 197 tests.
  - Convex: 54 files, 389 tests.
  - Workflow engine: 6 files, 76 tests.
  - All other package suites in the recursive repository run passed.
- `pnpm build` — passed for all configured build workspaces.
- Final `pnpm --filter mission-control-ui build` — passed after the last UI refinement.
- `git diff --check` — passed.

The repository test command must follow the repository's `ci:prepare` step in a
fresh worktree so local package entrypoints exist. This is the ordering already
used by `pnpm typecheck` and the CI preparation script.

## Behavioral verification

- Exact candidate: PR fixture `#202` matched repository
  `jaydubya818/MissionControl`, branch `feature/demo-2`, WorkOrder
  `yh70dhz3y7s8n2e99hdsz3fqw18bpsq6`, and completed producing Attempt
  `ys7ff24rcv1jrx3e4a6ecz33358bpadm`.
- Mismatch handling: branch mismatches, missing Attempts, `PENDING` Attempts,
  and terminal WorkOrders were shown with exact blocked reasons and could not be selected.
- Confirmation: the confirmation dialog retained the operator reason before the write.
- Persistence: the linked evidence left the unresolved inbox and remained in
  immutable decision history after a full page reload and a complete local
  Convex backend restart.
- Idempotency: replaying the same reconciliation key returned `created: false`
  and the original decision.
- Immutable refresh: re-ingesting the same PR head with incoming
  `EXACT_BRANCH` lineage preserved `OPERATOR_RECONCILIATION`, the original
  decision ID, reason, and timestamp.
- Isolation: a cross-workspace candidate lookup failed closed, and the SellerFi
  workspace rendered its own empty state without Software Factory evidence.
- Navigation: expanding Intelligence and selecting Loop Engineering reached the
  Live route with the company/workspace scope preserved.

## Browser and accessibility verification

- Chromium, 1440 × 1100, dark mode: successful exact-candidate selection,
  confirmation, link, reload persistence, zero Axe violations, zero horizontal
  overflow, zero application console errors, zero page errors, and zero failed
  requests in the final journey.
- Chromium, 1024 × 900, light mode: responsive layout with zero horizontal overflow.
- The scrollable evidence and candidate regions are keyboard focusable.
- The Loop Engineering schematic's supporting copy was raised to a compliant
  contrast token after the accessibility pass identified two borderline labels.

## Visual evidence

- `final-reconciliation-exact-candidate.png` — exact completed Attempt selected with retained reason.
- `final-reconciliation-confirmation.png` — immutable-decision confirmation dialog.
- `final-reconciliation-persisted.png` — decision persisted after reload.
- `reconciliation-responsive-1024-light.png` — responsive light-mode layout.
- `reconciliation-workspace-isolation.png` — alternate-workspace isolation state.

All records used for behavioral verification are local demo fixtures. No remote
GitHub state, production data, or external deployment was changed.
