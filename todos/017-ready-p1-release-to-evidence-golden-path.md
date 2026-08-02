---
status: in_progress
priority: p1
issue_id: "017"
tags: [software-factory, missions, workorders, attempts, evidence, governance]
dependencies: ["008"]
---

# Complete Release-to-Evidence Mission Golden Path

## Problem Statement

Approved Mission plans release governed WorkOrders, but the browser-operable path stops before authoritative Task execution, structured handoff, independent validation, and Mission acceptance are connected end to end.

## Findings

- WorkOrder approval, dispatch, immutable Attempts, receipts, acceptance, and retry already exist and must remain authoritative.
- First WorkOrder dispatch does not currently transition the parent Mission into execution.
- Tasks created with assignees remain `INBOX` until a separate hidden assignment transition occurs.
- Mission handoffs do not yet prove accepted WorkOrder/run/artifact/assertion ownership strongly enough.
- Validator receipts and Mission assertion state require duplicate operator actions.
- Mission acceptance currently evaluates assertions without requiring every released WorkOrder and handoff to be complete.
- Mission Detail links to WorkOrders but does not present one ordered execution and evidence path.

## Proposed Solutions

### Option 1: Build a Mission-specific executor

**Pros:** A single tailored screen and mutation family.

**Cons:** Duplicates the authoritative WorkOrder and Attempt engines and creates hidden coupling.

**Risk:** High.

### Option 2: Reuse WorkOrder execution and add a Mission coordination layer

**Pros:** Preserves one lifecycle, adds only missing transitions, and keeps execution evidence inspectable in existing surfaces.

**Cons:** Requires careful cross-record invariants and coordinated UI navigation.

**Risk:** Medium.

## Recommended Action

Implement Option 2 using `docs/plans/2026-07-31-feat-release-to-evidence-golden-path-plan.md`. Keep production rollout gated, stop at Mission acceptance, and do not automate merge or deployment.

## Acceptance Criteria

- [x] First eligible WorkOrder dispatch atomically moves its Mission into execution and is audited.
- [x] Validator dispatch is impossible before every predecessor WorkOrder is accepted and has a complete handoff.
- [x] Task creation with an assignee produces a canonical execution-ready Task and dispatch creates an immutable Attempt.
- [x] Failed Attempts remain visible and bounded retry creates a new linked Attempt with a reason.
- [x] Complete Mission handoffs require an accepted WorkOrder, completed run, valid role, owned artifacts, and complete assertion coverage.
- [x] Validator receipts automatically update linked Mission assertions and preserve independent evidence provenance.
- [x] Mission acceptance requires all assertions, released WorkOrders, and handoffs to be complete.
- [x] Mission Detail provides a live Execution tab with one clear next action, blockers, evidence, and links to existing approval/run controls.
- [ ] Loading, empty, blocked, error, success, refresh, desktop, and narrow viewport states are verified.
- [ ] Focused tests, full typecheck, production build, browser flow, and durable evidence all pass.

## Work Log

### 2026-07-31 - Implementation started

**By:** Codex

**Actions:**
- Captured the approved bounded design and implementation plan.
- Confirmed the existing WorkOrder, Task Attempt, approval, receipt, retry, and acceptance engines are the foundation.
- Identified the server transition, evidence linkage, Task readiness, and Mission execution UI gaps.

**Learnings:**
- The core execution machinery already exists; the shippable work is lifecycle integrity and operator guidance, not another orchestration system.
- Mission acceptance must fail closed on delivery records as well as assertion labels.

### 2026-07-31 - Lifecycle and browser recovery path implemented

**By:** Codex

**Actions:**
- Added Mission dispatch, validation receipt, structured handoff, and acceptance reconciliation around the existing WorkOrder engine.
- Made assigned Task creation enter `READY` through the audited Task transition and kept the workflow executor compatible with that contract.
- Added the Mission Execution workspace, next-action model, Task creation entry point, WorkOrder/run deep links, and structured handoff form.
- Verified plan approval/release, assigned Task creation, WorkOrder dispatch, failed Attempt inspection, and immutable retry from the browser.
- Ran all 356 Convex tests, 65 workflow-engine tests, UI and Convex typechecks, and the production UI build successfully.

**Remaining verification:**
- The first three live Attempts retained the seeded runtime's missing-persona failure and proved immutable retry lineage. After registering the local persona, the next Attempt exposed and fixed a second integration gap: executor-created Tasks now inherit their WorkOrder before entering `READY`.
- Attempt 4 now starts its governed workflow Task successfully. The local environment has no active agent worker to complete that Task, so live receipt, handoff, validator, and final Mission acceptance proof remains pending rather than being simulated.
- Complete the success-path browser evidence and narrow-viewport pass when the local agent worker is available.
