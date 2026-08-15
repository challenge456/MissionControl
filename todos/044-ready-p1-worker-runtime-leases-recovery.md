---
status: complete
priority: p1
issue_id: "044"
tags: [software-factory, worker-runtime, leases, recovery, security]
dependencies: []
---

# Harden Worker Runtime Leases and Recovery

## Problem Statement

The verification-first Factory worker has service-authenticated Attempt leases,
but stable worker/session identity, server-side capability and slot admission,
frozen base SHA, process/worktree ownership, and safe cleanup proof are
incomplete. Cross-session lease recovery can otherwise reuse a workspace whose
executor state is unknown.

## Findings

- `workspaceHostBindings` already owns scoped host readiness, attestations, and
  capacity; a new worker control plane would duplicate it.
- `workflowRuns.lease` already fences claim/renew/report/publication, but it is
  bound only to the orchestration service ID and random lease ID.
- `factory-execution-manifest/v1` freezes most execution-critical inputs but not
  the exact base SHA.
- `factoryGitRuntime.ts` validates path/branch state but has no durable ownership
  manifest or automatic cleanup primitive.
- The upstream reference's durable identity/session, manifest, process, and
  fail-closed cleanup ideas close these gaps without replacing Mission Control.
- Runtime-contract baseline is 21 at main SHA
  `3673dd9a1d2c3e3e13da2ead7cbc7fd9c1de8bb4`.

## Proposed Solutions

### Option 1: Extend existing host binding and Attempt lease

**Approach:** Add provider-neutral worker runtime fields to host bindings, bind
leases to worker sessions, freeze base SHA, and add a protected workspace
ownership manifest plus exact clean-only cleanup.

**Pros:** Reuses current authority, schema, events, executor, and GitHub path;
smallest production-relevant change.

**Cons:** Host bindings remain repository-scoped rather than a global fleet
catalog; remote enrollment remains future work.

**Effort:** Multi-module feature.

**Risk:** Medium; mitigated by additive fields and deterministic tests.

### Option 2: Add a separate worker/fleet control plane

**Approach:** Introduce worker, session, claim, and workspace tables plus new
APIs parallel to the current Factory runtime.

**Pros:** Clean standalone fleet model.

**Cons:** Duplicates host selection and Attempt control, expands authorization
surface, and risks split-brain ownership.

**Effort:** Large.

**Risk:** High.

## Recommended Action

Implement Option 1 exactly as bounded by
`docs/plans/2026-08-15-feat-worker-runtime-leases-recovery-plan.md`. Preserve
unknown workspaces, require new Attempt lineage after unsafe cross-session loss,
and keep remote infrastructure disabled.

## Technical Details

**Primary files:**

- `convex/schema.ts`
- `convex/workspaceHostBindings.ts`
- `convex/lib/factoryAttempt.ts`
- `convex/factory/attempts.ts`
- `convex/lib/executionManifest.ts`
- `apps/orchestration-server/src/factoryAttemptWorker.ts`
- `apps/orchestration-server/src/factoryHostReporter.ts`
- `apps/orchestration-server/src/factoryGitRuntime.ts`
- `apps/orchestration-server/src/codexExecutorAdapter.ts`
- focused Convex and orchestration tests

**Database changes:** additive optional runtime identity/disposition fields and
lease identity fields; no replacement tables.

## Resources

- `docs/architecture/worker-runtime-hardening-audit.md`
- `docs/decisions/worker-runtime-leases-recovery.md`
- `docs/architecture/executor-adapter-contract.md`
- https://github.com/owainlewis/factory/tree/8c71e44c2113fdf8ab5886a0b4c777926eab9c00

## Acceptance Criteria

- [x] Worker registration, generation, capabilities, readiness, and slots are bounded and tested.
- [x] Attempt leases are fenced by active worker session and reject stale writes.
- [x] Capability mismatch and capacity exhaustion reject atomically.
- [x] Exact base SHA and provider-neutral execution requirements are frozen.
- [x] Restart, worker loss, process loss, cancellation, and new-lineage recovery are deterministic.
- [x] Workspace ownership and cleanup fail closed on every incomplete tuple.
- [x] Dirty, lost, mismatched, and unpublished workspaces are preserved.
- [x] Codex/Loom compatibility and verification/acceptance authority isolation remain intact.
- [x] Focused tests, golden paths, typecheck, full tests, and runtime-contract guard pass.
- [x] Architecture, operations, recovery, security, and final limitations are documented.

## Work Log

### 2026-08-15 - Phase 0 audit and planning

**By:** Codex

**Actions:**

- Created the isolated worktree from fresh `origin/main`.
- Audited Mission Control runtime, leases, cancellation, manifests, recovery,
  worktrees, host bindings, observability, and contract baseline.
- Inspected `owainlewis/factory` at commit
  `8c71e44c2113fdf8ab5886a0b4c777926eab9c00` as an architecture reference.
- Wrote the architecture gap matrix, decision record, and implementation plan.

**Learnings:**

- The safest V1 extends existing primitives rather than adding a fleet control
  plane.
- Cross-session recovery without process proof must preserve the workspace and
  create new Attempt lineage.
- Convex schema, consumers, generated types, and contract validation must land
  atomically.

### 2026-08-15 - Implementation and validation complete

**By:** Codex

**Actions:**

- Added provider-neutral worker sessions/capabilities and server-side claim
  admission to the existing host-binding and Attempt-lease paths.
- Froze the base SHA and backend requirements, added protected process/worktree
  ownership, exact publication recovery, and proof-based cleanup.
- Added operational recovery and future enrollment documents without deploying
  infrastructure or exposing a new network listener.
- Passed repository-wide typecheck and tests, focused negative/golden paths,
  `git diff --check`, and the final runtime-contract guard at v23 after main
  advanced to the Factory Memory v22 contract.
