---
status: complete
priority: p1
issue_id: "035"
tags: [software-factory, github, authorization, publication]
dependencies: ["034"]
---

# Consume a Publication Permit Before GitHub Writes

## Problem Statement

Approval is revalidated at claim and after GitHub publication, leaving a race where authority can change before push/PR and the external side effect can be orphaned from control-plane lineage.

## Findings

- Push and PR creation precede terminal authority validation.
- A later rejection can roll back the PR artifact while the provider-side PR remains real.

## Proposed Solutions

### Option 1: Recheck mutable approval after publication

**Pros:** Minimal code.

**Cons:** Too late to guard the external write.

### Option 2: Consume a short-lived lease-bound publication permit

**Pros:** Establishes an auditable point of no return immediately before GitHub mutation and lets terminal reporting validate the immutable grant.

**Cons:** Adds one signed service command and persisted grant.

## Recommended Action

Use Option 2. Bind the permit to Attempt, active lease, exact candidate, approval, receipt, and expiry.

## Acceptance Criteria

- [x] The worker consumes a current permit immediately before GitHub credentials and writes.
- [x] Permit issuance revalidates the exact candidate, revision, approval, receipt, and required approvals.
- [x] Terminal lineage validates the consumed immutable permit.
- [x] Tests cover authority changing before permit and after permit issuance.

## Work Log

### 2026-08-11 - PR #72 review

**By:** Codex

**Actions:**

- Confirmed the external-side-effect race independently in three review passes.

### 2026-08-11 - Implemented

**By:** Codex

**Actions:**

- Added a signed `attempts.authorize-publication` command and persisted lease/candidate-bound permit.
- Revalidated all mutable governance immediately before the provider boundary.
- Required the worker to validate the permit before token mint, push, and PR creation; terminal reporting validates the immutable consumed grant.
- Added ordering, lease/candidate mismatch, expiry, and post-consumption lineage tests.
