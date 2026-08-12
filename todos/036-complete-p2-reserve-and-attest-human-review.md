---
status: complete
priority: p2
issue_id: "036"
tags: [software-factory, approvals, identity, agent-parity]
dependencies: []
---

# Reserve and Attest Human Review

## Problem Statement

The generic approval-request path can replace a Factory-owned `HUMAN_REVIEW` request, while a tool-facing decision can supply an unverified approver label and cannot enumerate the pending queue.

## Findings

- `HUMAN_REVIEW` is a reserved publication checkpoint but is accepted by the generic request mutation.
- Approval proof provenance uses a caller-supplied label instead of one consistent authenticated identity.
- Tool consumers need an approval ID but lack a scoped queue read surface.

## Proposed Solutions

### Option 1: Treat Factory review like every generic approval

**Pros:** Fewer special cases.

**Cons:** Allows misleading replacement and weakens proof provenance.

### Option 2: Reserve the type and expose an authenticated review surface

**Pros:** Keeps checkpoint creation internal, decision identity auditable, and discovery explicit.

**Cons:** Requires a bounded read surface and identity plumbing.

## Recommended Action

Reserve `HUMAN_REVIEW` for the Factory, derive decision identity from authenticated access, and expose a scoped pending-review read endpoint without granting executor self-approval.

## Acceptance Criteria

- [x] Generic callers cannot create or supersede Factory human review.
- [x] Approval, receipt, WorkOrder event, and run event use one authenticated actor identity.
- [x] Authorized tools can list pending review checkpoints and evidence without deciding as the executor.

## Work Log

### 2026-08-11 - PR #72 review

**By:** Codex

**Actions:**

- Recorded architecture/security and agent-native review findings.

### 2026-08-11 - Implemented

**By:** Codex

**Actions:**

- Required the exact Factory-created approval ID and protected it from generic replacement or supersession.
- Derived approval provenance from authorized delivery access and removed caller-supplied actor labels from UI and orchestration decisions.
- Added an authenticated, project-scoped pending-checkpoint read endpoint with linked evidence and no Factory publication capability.
