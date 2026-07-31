---
title: Governed Mission lifecycle evidence
date: 2026-07-28
environment: local Convex + EOS demo shell
---

# Governed Mission lifecycle evidence

## Fixture

Mission `Mission UI verification` was created in the local `Mission Control`
workspace and completed with one approved Worker blueprint, one independent
Validator blueprint, and the `outcome-verified` assertion.

## Observed lifecycle

1. Plan submitted and explicitly approved.
2. Worker WorkOrder was released and dispatched with workflow `feature-dev`.
3. A complete Worker-to-Validator handoff recorded `pnpm --filter
   mission-control-ui build` with exit code `0`.
4. A separate `VALIDATOR` WorkflowRun recorded a `FAIL` for
   `outcome-verified`; the Mission entered `BLOCKED`.
5. The operator requested corrective work. The Mission entered `READY`, its
   corrective iteration count became `1`, and new Worker/Validator WorkOrders
   retained the approved plan and blueprint IDs.
6. The corrective Worker created a second complete handoff. A separate
   Validator run recorded `PASS`, making the Mission eligible for acceptance.
7. Operator acceptance moved the Mission to `DONE`. The fixture revealed that
   this endpoint had not required the validator run to be terminal; the guard
   below was added immediately afterward and verified against the same fixture.

## Guard validation

- A Mission cannot start without a released WorkOrder.
- A dependent Validator WorkOrder dispatched only after a structurally complete
  Worker handoff.
- A pass from a pending Validator run is rejected: `A passing Mission assertion
  requires a completed validator WorkflowRun`.
- Focused governance, WorkOrder, and navigation tests passed (47 tests).
- `pnpm --filter mission-control-ui build` and `pnpm exec convex codegen`
  passed. The build retains the existing Vite chunk-size warning.

## Operator UI verification

Verified in `http://localhost:5199/v2/missions`: Mission navigation, draft
creation, plan-authoring fields, and live Convex provenance render in the EOS
shell. The corrective action and WorkOrder-release controls use the same
server-owned lifecycle commands documented above.
