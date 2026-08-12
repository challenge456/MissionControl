# Verification-first P0 evidence

Date: 2026-08-11

## Deterministic lifecycle demonstration

`factoryAttemptWorker.test.ts` exercises the production-shaped sequence with a
real temporary Git repository and worktree:

```text
governed issue intent
  → frozen WorkOrder specification
  → executor-authored candidate change
  → local candidate commit
  → change-budget and negative-space verification
  → independent allowlisted command
  → evidence-bearing VERIFIED packet
  → control-plane receipt response
  → verification summary in pull-request package
  → terminal COMPLETED report
```

The paired negative test makes the control plane return `NOT_VERIFIED` for the
reported packet and proves that the worker does not push or create a pull
request. External GitHub network calls are replaced at the provider boundary;
the worker, Git worktree/commit/diff logic, verification engine, command
execution, clean-candidate invariant, report ordering, and PR gate are real.

The verifier unit and persistence suites separately prove missing evidence,
file/line and protected-path violations, deterministic failure,
`NOT_CONFIGURED`, `SKIPPED`, `ERROR`, server-side verdict recomputation, and
rejection of criterion mappings outside the approved contract.

## Live fixture

- WorkOrder: `yh7c2q1dm5132rh4rntz5w0hn58c840j`
- Title: `Verification-first browser fixture verified 2026-08-11`
- Result: `MEDIUM`, `READY`, specification version `1`, `ENFORCED`
- Honest empty state: no receipt, no verification runs, no evidence envelopes
  before dispatch
- Regression proved: denied/protected paths do not inflate requested-scope risk

Primary screenshots:

- `created-work-order-specification.png` — desktop executable specification
- `created-work-order-verification.png` — mandatory check and honest receipt state
- `mobile-work-order-detail.png` — 390 px detail layout and keyboard-focused back control
- `create-work-order-contract.png` — authoring the executable contract

## Commands and results

```text
pnpm exec vitest run convex/__tests__
  65 files passed; 445 tests passed

pnpm --filter @mission-control/workflow-engine test
  9 files passed; 94 tests passed

pnpm exec vitest run -c apps/orchestration-server/vitest.config.ts
  10 files passed, 1 environment-gated integration file skipped;
  34 tests passed, 1 skipped

pnpm --filter mission-control-ui test
  48 files passed; 205 tests passed

pnpm lint
  all 18 applicable workspaces typechecked;
  10 skills linted with 0 errors and 0 warnings

pnpm --filter @mission-control/workflow-engine build
pnpm --filter @mission-control/orchestration-server build
pnpm --filter @mission-control/cli build
pnpm --filter mission-control-ui build
  all passed; UI emitted the existing >500 kB vendor-chunk warning

git diff --check
  passed
```

Live interfaces:

```text
mc work-order inspect yh7c2q1dm5132rh4rntz5w0hn58c840j --json
  returned the stored specification, MEDIUM risk reason, budget, enforced
  contract, pending evidence state, revisions, events, and governance

GET /workorders/yh7c2q1dm5132rh4rntz5w0hn58c840j/verification
  authenticated in-process Hono request returned 200 with specification v1,
  MEDIUM risk, ENFORCED contract, zero runs, and zero evidence envelopes
```

Browser verification used `http://127.0.0.1:5180/v2/control-work-orders` with
the EOS flags enabled:

- created the executable WorkOrder through the real UI and Convex mutation;
- confirmed `MEDIUM`, `READY`, exact budget, protected paths, mandatory command,
  and the no-receipt empty state;
- inspected desktop and 390 × 844 layouts;
- confirmed detail/back keyboard focus restoration;
- Axe 4.12.1 WCAG 2 A/AA audit: 25 passes, 0 violations, 0 incomplete;
- browser page errors: none.

## Existing release blocker found during validation

The orchestration TypeScript build succeeds and the development runtime/API
loads correctly through `tsx`. The repository's existing standalone Node ESM
start path still fails before server startup because several pre-existing
workspace packages emit extensionless or directory imports (first failure:
`@mission-control/shared/dist/types`). This is broader than the
verification-first slice and should be repaired as a dedicated workspace
packaging PR before treating `pnpm --filter @mission-control/orchestration-server start`
as a production launch command.
