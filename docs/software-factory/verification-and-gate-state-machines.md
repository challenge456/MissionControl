---
title: Verification and Gate State Machines
status: ACCEPTED_NORMATIVE
last_verified: 2026-08-11
baseline_commit: 2b1a7c4
accepted_on: 2026-08-12
---

# Verification and Gate State Machines

This document defines cross-record semantics. It does not require a broad rename
of existing WorkOrder or WorkflowRun states.

## Governing invariant

```text
execution completed != verification passed
verification passed != gate eligible
gate eligible != WorkOrder accepted
WorkOrder accepted != pull request merged
pull request merged != production verified
```

## Quality Contract projection — implemented lifecycle

```mermaid
stateDiagram-v2
  [*] --> PLAN_DRAFT
  PLAN_DRAFT --> PLAN_IN_REVIEW
  PLAN_IN_REVIEW --> PLAN_APPROVED: approve exact revision
  PLAN_IN_REVIEW --> PLAN_DRAFT: revision requested
  PLAN_APPROVED --> PROJECTION_COMPILED: canonical compilation
  PROJECTION_COMPILED --> PROJECTION_SUPERSEDED: new Plan approved
  PROJECTION_COMPILED --> PROJECTION_WITHDRAWN: Plan authority withdrawn
  PROJECTION_COMPILED --> PROJECTION_EXPIRED: validity ends
```

Only an approved Plan and its matching compiled projection may create an
enforced WorkOrder projection. The compiled Quality Contract has no independent
editable lifecycle. Change the Plan through a new revision, approve it, and
compile a new digest.

## WorkflowRun/Attempt — implemented mapping

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> RUNNING: lease claimed
  RUNNING --> PAUSED: external decision required
  PAUSED --> RUNNING: valid continuation claimed
  RUNNING --> COMPLETED: terminal report accepted
  RUNNING --> FAILED: unrecoverable failure
  RUNNING --> CANCELED: cancel reconciled
  PAUSED --> FAILED: authority or evidence invalidated
  PAUSED --> CANCELED: canceled
```

A retry that represents a new execution try creates a new Attempt identity.
Resume continues the same Attempt only when candidate, manifest, evidence,
approval, lease, and continuation checkpoint remain valid.

## Verification Run — implemented behavior

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> RUNNING
  RUNNING --> COMPLETED
  RUNNING --> ERROR
  RUNNING --> CANCELED
```

The persisted baseline may store terminal results without every intermediate
state as a separate column; ordered run events retain the lifecycle. Completed
results are immutable.

### Check results

```text
PASS | FAIL | SKIPPED | NOT_CONFIGURED | ERROR
```

Only `PASS` satisfies a mandatory check. An explicitly optional check may be
`SKIPPED` only when the active contract and policy authorize that outcome.

### P0 verification verdict

```text
VERIFIED | NOT_VERIFIED | BLOCKED | REQUIRES_HUMAN_REVIEW
```

- `VERIFIED`: mandatory checks pass and criteria have sufficient evidence.
- `NOT_VERIFIED`: proof is missing, failed, skipped, unconfigured, or errored.
- `BLOCKED`: scope, budget, negative constraint, or hard policy failed.
- `REQUIRES_HUMAN_REVIEW`: deterministic proof passed but policy reserves
  advancement for a human.

## Evidence lifecycle

```mermaid
stateDiagram-v2
  [*] --> RECORDED
  RECORDED --> USABLE: provenance and subject verified
  RECORDED --> REJECTED: malformed or unauthorized
  USABLE --> STALE: validity or subject changes
  USABLE --> SUPERSEDED: newer applicable evidence
  USABLE --> REVOKED: producer or proof compromised
  USABLE --> CONFLICTED: credible counterevidence
```

Stale, superseded, revoked, rejected, and conflicted evidence remains visible.
State changes append reason, actor, time, and triggering record.

## Quality Gate Decision — V1 implemented, target evolution

```mermaid
stateDiagram-v2
  [*] --> UNKNOWN
  UNKNOWN --> INELIGIBLE: blocking failure
  UNKNOWN --> STALE: required proof expired
  UNKNOWN --> WAIVER_REQUIRED: waivable finding
  UNKNOWN --> AWAITING_HUMAN: machine proof sufficient
  UNKNOWN --> ELIGIBLE: all policy conditions satisfied
  WAIVER_REQUIRED --> UNKNOWN: waiver recorded
  AWAITING_HUMAN --> ELIGIBLE: approval recorded
  ELIGIBLE --> STALE: subject or dependency changes
  ELIGIBLE --> INELIGIBLE: revocation or counterevidence
```

V1 appends a decision for every independently recomputed verification packet.
The broader transition model above is the accepted evolution for expiry,
waivers, counterevidence, and cross-policy aggregation. Policy modes are
`OBSERVE_ONLY`, `SHADOW`, `ENFORCED`, and `EMERGENCY_BYPASS`. Only `ENFORCED`
decisions authorize normal advancement. Emergency bypass requires named human
authority, exact scope, expiration, compensating controls, and audit.

## Human review continuation — implemented

1. Verification produces `REQUIRES_HUMAN_REVIEW` for an exact candidate.
2. Control plane reserves an approval and pauses the same Attempt.
3. Conditional approval, rejection, revision, expiry, or invalid authority
   closes the continuation; it cannot publish.
4. Unconditional approval queues the same Attempt.
5. Worker verifies manifest, candidate, receipt, approval, lease, and checkpoint.
6. Control plane issues and atomically consumes a short-lived publication
   permit immediately before GitHub mutation.
7. Restart recovery reconciles existing branch/PR identity idempotently.

## Transition audit contract

Every authoritative transition records subject and prior version, actor and
identity source, reason, policy/contract version, idempotency key, timestamp,
required evidence IDs, before/after state, and invalidated dependent records.
