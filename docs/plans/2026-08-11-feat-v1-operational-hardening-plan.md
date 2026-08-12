# V1 Operational Hardening Plan

## Objective

Finish the single-repository Mission golden path so an unattended `codex/v1`
Attempt can recover after a worker interruption, return with one concise and
truthful review package, and remain operable through every browser state needed
for a confident V1 release decision.

This plan deliberately reuses the existing `workflowRuns` lease, durable
worktree, signed service-command boundary, GitHub App publisher, verification
receipts, PR checks, and Execution Run Inspector. It does not add a second
worker, another evidence database, a new primary navigation domain, additional
connectors, or hundred-agent scheduling.

## Current gaps

1. An expired durable lease is reclaimable, but the previous claim, reason,
   recovery count, and durable checkpoint are not presented as first-class
   recovery evidence.
2. Pull request, exact head SHA, CI result, acceptance criteria, verifier
   receipts, changed files, policy deviations, risks, and rollback guidance are
   stored, but there is no single fail-closed reviewer decision packet.
3. The run inspector has useful detail but does not distinguish loading from a
   missing run, does not explain recovery readiness clearly, and does not expose
   one top-level merge-readiness outcome.

## Phase 1 — Durable overnight recovery

- Treat reclaiming an expired `RUNNING` execution lease as a reasoned retry of
  the exact prior claim.
- Persist `executionStaleRecoveryCount`, `executionRetryOfClaimId`, and a stable
  recovery reason on the run.
- Record idempotent `RETRY_STARTED` and checkpoint-artifact evidence containing
  the prior claim, replacement claim, phase, checkpoint, and attempt number.
- Keep existing attempt, time, cost, scope, readiness, and cancellation limits
  authoritative. Recovery never expands authority.
- Preserve the current durable worktree/branch and idempotent PR lookup so a
  restart after commit or push cannot create a second pull request.
- Present active, waiting, recoverable, recovered, exhausted, and terminal
  recovery states in the inspector.

## Phase 2 — Unified review evidence

- Derive a review package at read time from durable records; do not let a worker
  self-certify it and do not copy evidence into a second mutable store.
- Bind the package to the exact run, WorkOrder revision, repository, branch,
  base/head SHA, and pull request.
- Build an acceptance-criterion matrix using the latest receipt for each
  criterion with explicit `PASS`, `FAIL`, `STALE`, `WAIVED`, `PENDING`, and
  `MISSING` semantics.
- Require a review-ready pull request, exact-head passing CI evaluation, no
  unresolved policy deviation, complete file lineage, and accepted criterion
  evidence before the package can report `READY`.
- Expose blocker reasons, reviewer focus areas, recovery history, known risks,
  plan-versus-execution deviations, and rollback guidance.
- Keep merge and deployment as separate human decisions.

## Phase 3 — Final V1 browser hardening

- Add a concise Review evidence package at the top of the existing Execution
  Run Inspector.
- Distinguish loading, not-found/error, blocked/incomplete, recovery, and ready
  states with a specific next action.
- Keep all details keyboard reachable, non-color dependent, responsive at the
  existing narrow viewport, and stable across refresh.
- Verify failed, canceled, stale-recovered, completed-with-missing-evidence, and
  fully-ready fixtures without inventing success data.
- Record browser screenshots and an evidence log under
  `docs/testing/evidence/v1-operational-hardening/`.

## Verification

- Focused unit tests for recovery classification and review-package evaluation.
- Focused UI tests for ready, blocked, recovery, loading, and missing states.
- Full typecheck, lint, runtime-contract guard, unit suite, and production build.
- Browser pass on `http://localhost:5199` covering desktop and narrow layouts,
  refresh durability, console errors, and critical accessibility checks.

## Release boundary

This work may prepare and review a pull request. It does not authorize automatic
merge, deployment, connector expansion, multi-repository fan-out, or
hundred-agent scaling. Those remain blocked until this one path is proven.
