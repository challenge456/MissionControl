---
status: complete
priority: p1
issue_id: "028"
tags: [software-factory, research-lab, governance, operations, recovery]
dependencies: ["027"]
---

# Research Lab Phase 0 Operational-Control Proof

## Problem Statement

The Research Lab has durable WorkOrder and Task authority, but continuous
scheduling must remain disabled until one read-only workflow proves bounded
operation under duplicate claims, process loss, operator intervention, timeout,
retry, budget, concurrency, and verification failure.

## Findings

- Factory Attempts already have atomic leases and heartbeats, but expired
  leases can currently be reclaimed indefinitely.
- The Codex V1 adapter supports cancel and bounded retry; it does not support
  in-process pause or resume.
- Read-only Automation Definitions already provide persistent pause/suspend
  state, one-at-a-time scheduling, timeout configuration, and an independent
  verifier boundary.
- Runtime budget and attempt ceilings need fail-closed enforcement at the
  execution claim, not only configuration-time validation.
- A safe V1 drain means stop new claims while allowing an already claimed
  read-only attempt to reach a checkpoint or terminal state.

## Recommended Action

Add one shared, deterministic operational-control contract for the read-only
canary path. Enforce it before a claim, on heartbeat, during stale recovery,
and before terminal evidence is accepted. Keep continuous scheduling off.

## Acceptance Criteria

- [x] A second worker cannot claim the same active read-only run.
- [x] Heartbeats renew only the matching, unexpired claim.
- [x] Pause blocks new claims; drain blocks new claims without aborting the
  already active read-only attempt.
- [x] Cancel reaches the running adapter and records a terminal cancellation.
- [x] Timeout is bounded by the frozen Definition runtime.
- [x] Retry creates or claims no more than the frozen attempt ceiling and
  records a reason referencing the prior attempt.
- [x] Expired claims are recovered against the same immutable execution
  binding and repeated stale recovery quarantines the Definition.
- [x] Budget and concurrency ceilings fail closed at claim time.
- [x] Completion remains awaiting independent verification; the executor
  cannot self-verify or accept the WorkOrder.
- [x] Focused tests prove every control and a complete read-only canary state
  sequence.
- [x] Research Lab browser evidence confirms the canary remains governed and
  continuous scheduling remains off.

## Work Log

### 2026-08-09 - Operational-Control Inventory

**By:** Codex

**Actions:**

- Confirmed the existing Factory Attempt lease and heartbeat primitives.
- Confirmed read-only Automation Definition pause/suspension, concurrency,
  timeout, and independent-verifier boundaries.
- Kept the Research Lab launcher in its non-autonomous profile.

**Learnings:**

- Codex V1 pause/resume must not be advertised; V1 pause and drain operate at
  the durable queue/Definition boundary.
- Runtime admission must re-check the frozen limits because readiness-time
  validation alone cannot prevent stale or over-budget claims.

### 2026-08-09 - Runtime Contract and Bounded Canary Attempt

**By:** Codex

**Actions:**

- Added a durable, immutable-binding read-only claim/heartbeat/retry contract.
- Wired operator `PAUSED`, `DRAINING`, and `QUARANTINED` modes into runtime
  admission and heartbeat behavior.
- Added governed cancellation and reasoned retry endpoints to the existing
  read-only Automation execution boundary.
- Made failed independent verification suspend the Automation Definition.
- Fixed child-process cancellation so timeout and cancel terminate the complete
  process group instead of only the shell wrapper.
- Recorded evidence in
  `docs/validation/2026-08-09-research-lab-phase-0-operational-controls.md`.

**Verification:**

- Convex control tests: 33 passed.
- Orchestration adapter tests: 11 passed.
- Convex and orchestration TypeScript checks passed.
- Browser reverified the preserved Research Lab after a controlled restart.

**State at that checkpoint:**

- The mutation-level canary was pending because the isolated legacy clone
  did not finish its backend/index upgrade inside the bounded recovery window.
- Continuous scheduling remains off.
- The following 2026-08-10 work log records the fresh-backend canary that closed
  this gap.

### 2026-08-10 - Isolated Canary, Durable Terminal States, and Browser Proof

**By:** Codex

**Actions:**

- Rebuilt a fresh isolated local Convex deployment from the current backend and
  seeded three env-gated, read-only Phase 0 fixtures.
- Executed the complete claim, duplicate-rejection, heartbeat, pause, drain,
  cancellation, timeout, retry, stale-recovery, quarantine, budget,
  concurrency, artifact, independent-verification, and acceptance sequence.
- Fixed durable terminal projection so completed runs no longer remain
  `RUNNING` and quarantined runs no longer retain stale ownership.
- Made pending cancellation terminal immediately, ensured a binding-mismatch
  quarantine commits instead of rolling back, and preserved spend when a
  budget overrun triggers quarantine.
- Corrected the Task KPI strip so canonical statuses are never collapsed into
  a misleading `In progress` count; the display-only aggregate is now labeled
  `Presentation active`.
- Restored and browser-verified the preserved Software Factory Research Lab at
  `http://localhost:5199` without seeding or starting an autonomous executor.

**Verification:**

- 43 focused Convex tests passed.
- 20 focused orchestration tests passed.
- 9 Research Lab runtime-profile tests passed.
- 2 Task KPI semantic tests passed.
- Convex, orchestration server, and Mission Control UI TypeScript checks passed.
- `git diff --check` passed.
- Browser evidence recorded the isolated governed WorkOrder plus the Research
  Lab's 159 canonical Task statuses and 62-task presentation grouping.

**Result:**

- Phase 0 exit gate passed.
- Continuous scheduling and the Factory worker remain off.
- The next safe slice is Phase 1 governed source registry and ingestion policy,
  followed by a supervised read-only pilot.

## Notes

- Do not edit the approved implementation plan while executing this todo.
- Do not enable the continuous scheduler in this slice.
- Do not create a commit unless the Product Owner explicitly asks.
