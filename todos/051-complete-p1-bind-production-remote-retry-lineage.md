---
status: complete
priority: p1
issue_id: "051"
tags: [code-review, factory, remote-sandbox, retry, authority]
dependencies: []
---

# Bind production remote retry lineage

## Problem Statement

PR #121's final merge audit found that production-dispatched Remote Sandbox Attempts do not preserve the exact identity and retry invariants proven by the standalone qualification runner. A real production manifest can bind the public run ID while the worker supplies the Convex workflow document ID, and retry dispatch can reuse lineage bindings or bypass/reset the frozen retry budget.

## Findings

- `factory-execution-manifest/v1` freezes `causation.workflowRunId` from the public run ID, while the worker used the Convex workflow document ID for the Remote Sandbox request and recomputed resource identity.
- Explicit replacement branch/worktree values were not rejected when they matched an earlier Attempt lineage.
- A linked remote retry could select a different Factory Version, resetting the policy aggregation boundary.
- A same-revision remote failure could be dispatched again without `retryOfWorkflowRunId`, avoiding the typed retry gate.
- Lost remote worker leases were terminal but did not persist a typed retryable failure.
- Supervisor-produced transient failures were reclassified as non-retryable when their synthetic failed result intentionally omitted acceptance-criterion success accounting.
- Crash diagnostics truncated before redaction, allowing a credential fragment to cross the truncation boundary.

## Proposed Solutions

### Option A — Preserve public execution identity and enforce lineage at dispatch

Use the manifest's public workflow run identity at the sandbox boundary, retain the Convex document ID only for persistence, reject reused bindings, require same-version linked recovery, require retry lineage for same-scope terminal remote failures, and classify lost remote leases as retryable infrastructure failures.

- Pros: smallest repair; matches the frozen manifest and existing service-command persistence model.
- Cons: requires regression coverage spanning manifest construction and worker validation.
- Effort: Medium
- Risk: Low after full qualification.

### Option B — Rebuild manifests after workflow document insertion

Insert the run first, then build and patch a manifest using its Convex ID.

- Pros: one workflow ID at persistence and remote boundaries.
- Cons: larger transactional/idempotency change; risks exposing a partially initialized runnable record.
- Effort: Large
- Risk: High.

## Recommended Action

Implement Option A. Keep control-plane persistence keyed by the Convex workflow document ID while binding the execution-only sandbox to the already frozen public run identity.

## Technical Details

- `apps/orchestration-server/src/factoryAttemptWorker.ts`
- `convex/lib/workOrderDispatch.ts`
- `convex/workOrders.ts`
- `convex/factory/attempts.ts`
- focused worker/dispatch/recovery tests

## Acceptance Criteria

- [x] A production-built remote manifest passes the worker's exact identity validation.
- [x] The sandbox request/resource identity uses the manifest's frozen public workflow run ID.
- [x] A retry cannot reuse any branch/worktree from its lineage.
- [x] A remote retry cannot switch Factory Versions or omit required same-scope retry lineage.
- [x] Lost remote leases persist `RETRYABLE_INFRA` with internally consistent retryability.
- [x] Typed transient supervisor failures remain retryable without inventing structured success.
- [x] Attempt credentials are redacted before bounded diagnostic truncation.
- [x] Focused and full Factory qualification pass.

## Work Log

### 2026-08-18 — Final merge audit

**By:** Repository operator via Codex

**Actions:**

- Reproduced the identity and retry-control gaps through the production dispatch/claim/worker call chain.
- Blocked merge of PR #121 pending a bounded repair and regression coverage.

**Learnings:**

- The standalone live qualification synthesized matching identifiers, so production manifest construction must be exercised directly in the regression suite.

### 2026-08-18 — Bounded repair and qualification

**By:** Repository operator via Codex

**Actions:**

- Preserved separate durable document and public execution identities across dispatch, claim, sandbox, supervisor, and result validation.
- Enforced latest-Attempt lineage, frozen Factory Version/budget, and fresh workspace identities for remote retries.
- Added lost-lease typing, transient failed-bundle preservation, and redaction-before-truncation regressions.
- Passed focused compatibility, Convex codegen/typecheck, the complete `qualify:factory` gate, secret scanning, and a read-only zero-VM provider inventory check.

**Learnings:**

- Production composition tests must keep persistence identifiers distinct from public execution identifiers; matching fixture strings can conceal boundary failures.

## Resources

- PR #121
- `docs/testing/evidence/remote-codex-structured-output-v1/`
