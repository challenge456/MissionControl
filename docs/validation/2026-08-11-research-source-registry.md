# Research Source Registry — Phase 1 Validation

Date: 2026-08-11

## Scope

This evidence covers the tenant-scoped Research Watchlist and the governed
source lifecycle from draft through retirement. Provider fetching, continuous
scheduling, credentials, observation ingestion, and repository-changing work
remain excluded and disabled.

## Contract checks

- `researchSources`, `researchSourceEvents`, and `researchObservations` include
  tenant, workspace, identity, provenance, retention, idempotency, and audit
  indexes.
- Every public query or mutation enforces a named Factory permission.
- Every source-specific public function verifies exact workspace ownership.
- Activation requires validation, stable provider identity, schedule,
  freshness, item cap, spend cap, retention, content class, exclusions, policy
  version, policy approval, and no unresolved exception.
- Lifecycle transitions fail closed. Event insertion and source mutation are
  atomic within the same Convex transaction.
- URL preview performs no network request and rejects credentials, secret-like
  parameters, non-HTTPS schemes, non-standard ports, and direct local/private/
  link-local/reserved IPv4 and IPv6 targets.

## Automated evidence

Run from the repository root:

```bash
pnpm exec vitest run convex/__tests__/researchSourcePolicy.test.ts
pnpm --filter mission-control-ui exec vitest run src/harness/components/ResearchWatchlistPanel.test.tsx
pnpm exec tsc -p convex/tsconfig.json --noEmit
pnpm --filter mission-control-ui typecheck
pnpm run typecheck
pnpm run build
```

Focused policy tests cover public feed normalization, credential/private target
rejection, stable provider identity requirements, the full activation envelope,
unresolved exception quarantine, lifecycle transitions, and workspace mismatch.

Focused UI tests cover loading/empty authority, private-target rejection,
gated lifecycle mutations, immutable decision history, and the explicit message
that collection remains off.

## Browser evidence

Browser verification must use an isolated local Convex deployment, not the
preserved Software Factory Research Lab database. Record:

- dark and light screenshots at the target viewport;
- add-source preview for a public HTTPS feed;
- private target rejection;
- create, validate, approve, activate, pause, resume, and retire transitions;
- immutable decision history after refresh;
- keyboard dialog close behavior;
- Axe WCAG A/AA including WCAG 2.2 target-size rules; and
- console errors, page errors, and failed requests.

The isolated run used project `y5715w7avg35anvyawza57h8w18c8a7v`
(`Software Factory Phase 0 Canary`) on `localhost:5202`, backed by an isolated
local Convex state directory. The preserved Research Lab database was not
modified.

Results:

- A public OpenAI RSS source was previewed, created, validated, policy-approved,
  activated, paused, resumed, paused again, and retired through the UI.
- `https://127.0.0.1/feed` was rejected before creation.
- The retired state and complete immutable event history persisted after reload.
- Escape closed the add-source dialog.
- A clean reload produced no page errors or failed requests.
- Axe reported zero violations and zero incomplete checks in true light and dark
  themes for WCAG 2 A/AA and WCAG 2.2 AA target-size rules.

Screenshots:

- `docs/testing/research-source-registry/phase-one-light.png`
- `docs/testing/research-source-registry/phase-one-dark.png`
