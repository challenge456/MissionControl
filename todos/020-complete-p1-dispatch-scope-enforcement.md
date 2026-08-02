---
status: complete
priority: p1
issue_id: "020"
tags: [control-plane, dispatch, executor, security, evidence]
dependencies: ["016", "017"]
---

# Enforce repository, code-scope, team, and executor boundaries

## Problem Statement

Filtering records in the UI does not prevent a crafted client or ineligible executor from dispatching work outside an authorized repository or monorepo scope.

## Findings

- Existing governed dispatch, routing, host binding, and receipt paths provide the integration points.
- Authorization must be repeated at dispatch and executor binding and must produce non-secret-bearing audit evidence on denial.

## Proposed Solutions

### Option 1: Dispatch-only validation

Validate once before queueing. This leaves stale-policy and executor substitution gaps. Risk: high.

### Option 2: Dual enforcement with shadow rollout

Validate at dispatch and binding, compare legacy/new decisions in shadow mode, persist rationale and denial receipts, and roll out per workspace. Risk: low.

## Recommended Action

Use fail-closed dual enforcement behind independent rollback flags while preserving legacy WorkOrder compatibility.

## Technical Details

- WorkOrder dispatch and workflow/executor binding
- Repository checkout host bindings
- Model routing decision and evidence receipt lineage
- Denial audit and shadow parity projection

## Resources

- SDD sections 8–9 and Phase 5

## Acceptance Criteria

- [x] Dispatch records company/workspace, team/owner, repository, code scopes, model decision, and environment.
- [x] Unauthorized repositories/code scopes are rejected server-side.
- [x] Executor binding revalidates repository checkout, scope, host health, model, runtime, and capacity.
- [x] Local execution requires an approved host and checkout binding.
- [x] Cross-scope work unions applicable review and verification requirements.
- [x] Denials create actionable audit evidence without secrets.
- [x] Legacy WorkOrders continue through a measured compatibility path.
- [x] Shadow parity and rollback flags are tested.

## Work Log

### 2026-08-01 - Execution queued

**By:** Codex

**Actions:**
- Identified dispatch and executor binding as separate security checkpoints.

**Learnings:**
- Server enforcement cannot depend on repository filters or client-supplied actor labels.

### 2026-08-01 - Completed

**By:** Codex

**Actions:**
- Enforced canonical team, owner, repository, code-scope, model, and environment decisions at dispatch and executor binding.
- Added fresh host attestations for checkout, runtime, model allowlist, network, secret policy, and capacity.
- Proved cross-workspace dispatch fails before run creation and leaves actionable, non-secret-bearing receipts.

**Learnings:**
- Host readiness is an expiring authorization fact, not a one-time setup checkbox.
