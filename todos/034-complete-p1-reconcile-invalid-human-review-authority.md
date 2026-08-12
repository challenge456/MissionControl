---
status: complete
priority: p1
issue_id: "034"
tags: [software-factory, human-review, recovery, governance]
dependencies: []
---

# Reconcile Invalid Human-Review Authority

## Problem Statement

An expired, revoked, superseded, or revision-invalidated human-review checkpoint can leave the same Attempt indefinitely `PAUSED` or `PENDING`, preventing governed retry and starving later work.

## Findings

- Approval can outlive its verification receipt and currently resumes without first rejecting stale evidence.
- Claim validation throws before leasing or patching an invalid resumed Attempt.
- Generic expiry and revision paths do not close the linked Factory continuation.

## Proposed Solutions

### Option 1: Keep retrying invalid checkpoints

**Pros:** No schema changes.

**Cons:** No recovery path; hot polling can starve the queue.

### Option 2: Close invalid checkpoints atomically

**Pros:** Fail-closed, audited, and retryable through the existing governed retry path.

**Cons:** Requires explicit terminal continuation state and lifecycle tests.

## Recommended Action

Use Option 2. Reject stale evidence at decision time and atomically fail/close invalid continuations from expiry, revision, and claim reconciliation paths.

## Acceptance Criteria

- [x] Stale verification evidence cannot resume publication.
- [x] Invalid resumed authority reaches a durable terminal state instead of hot polling.
- [x] Revision and explicit expiry cannot strand a paused checkpoint.
- [x] Source receipt and continuation status truthfully reflect closure.
- [x] Deterministic expiry, revision, and claim-rejection tests pass.

## Work Log

### 2026-08-11 - PR #72 review

**By:** Codex

**Actions:**

- Confirmed the invalid-authority wedge through data-integrity, architecture/security, TypeScript, and agent-parity review passes.

### 2026-08-11 - Implemented

**By:** Codex

**Actions:**

- Added atomic checkpoint closure for stale evidence, expiry, revision invalidation, and failed claim validation.
- Closed the Attempt, continuation, receipts, and WorkOrder consistently so governed retry remains available.
- Added boundary tests for evidence expiry, approval expiry, revision mismatch, and exact checkpoint lineage.
