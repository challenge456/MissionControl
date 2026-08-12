---
title: Harden ESM startup and resume human-reviewed factory attempts
type: fix
status: complete
date: 2026-08-11
owners:
  - software-factory
---

# Harden ESM startup and resume human-reviewed factory attempts

## Problem

The built orchestration service cannot start under Node ESM because emitted
workspace-package imports omit file extensions or resolve to directories. The
verification-first worker also treats `REQUIRES_HUMAN_REVIEW` as terminal,
forcing a new governed retry after approval instead of continuing the same
verified Attempt.

## Outcome

1. `pnpm --filter @mission-control/orchestration-server start` loads the built
   artifact without Node ESM resolution errors.
2. CI has a dedicated built-artifact startup smoke test that fails on this
   class of packaging regression.
3. Enforced verification that requires human review durably pauses the current
   WorkflowRun before GitHub publication.
4. An unconditional, current-revision human approval resumes that exact run at
   the publish checkpoint without invoking `codex/v1` or rerunning independent
   verification.
5. Resume revalidates the exact verified candidate SHA and current approval
   receipt before push, PR creation, and terminal completion.
6. Conditional approval, rejection, revision request, stale WorkOrder revision,
   expired approval, or changed candidate remains fail-closed. Decisions that
   require a candidate change close the Attempt so a governed retry is possible.

## Design

### ESM package boundary

- Use explicit `.js` specifiers for relative runtime imports and exports in the
  orchestration server's workspace dependency closure.
- Keep each runtime workspace package explicitly typed as ESM with a package
  export pointing at its built entrypoint.
- Build all runtime dependencies and the orchestration server before the smoke
  test.
- Start the compiled entrypoint with startup side effects disabled; do not use
  `tsx`, experimental Node resolution, or a bundler to hide invalid package
  output.

### Human-review checkpoint

- Persist the independent verification receipt and an immutable continuation
  checkpoint containing the WorkflowRun, WorkOrder revision, verification run,
  receipt, source SHA, and candidate SHA.
- Transition the WorkflowRun from `RUNNING` to `PAUSED`, release its lease, and
  create one idempotent `HUMAN_REVIEW` approval request.
- On unconditional approval, append a superseding `VERIFIED` WorkOrder receipt
  linked to the approval decision and transition the same WorkflowRun to
  `PENDING` at `PUBLISHING`.
- On the next claim, return the continuation checkpoint. The worker verifies
  that the checkout still points at the approved candidate, skips agent
  execution and verification, and continues only with GitHub publication.
- Terminal completion rechecks receipt validity, WorkOrder/run/revision
  lineage, approval status, and PR head SHA.
- Conditional approval, rejection, or revision request fails the run with an
  auditable reason and requires a new governed Attempt. Conditions are not
  treated as executable policy unless a later revision makes them explicit.

## Acceptance checks

- [x] Built workspace packages contain Node-resolvable ESM specifiers.
- [x] Built orchestration startup smoke exits successfully.
- [x] Verification-first worker tests cover verified, not-verified, paused, and
      resumed publish paths.
- [x] Convex transition tests cover decision mapping, exact Attempt/revision
      validation, approval-linked receipt validation, and fail-closed outcomes.
- [x] Typecheck, unit tests, build, and lint pass.
- [x] The Work Orders approval UI explains same-attempt resume and preserves
      evidence-first operator context.
- [x] Browser verification covers the updated Work Orders decision surface.
- [x] README documents built startup, smoke verification, durable resume, and
      explicitly deferred product scope.

## Explicitly deferred

- Remote sandbox enforcement
- CI ingestion
- Learning-ledger CRUD
- Trust scoring
- Verified-throughput metrics
- Deployment
- Production verification
