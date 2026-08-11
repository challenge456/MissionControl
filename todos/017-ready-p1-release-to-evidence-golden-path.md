---
status: complete
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
- [x] Loading, empty, blocked, error, success, refresh, desktop, and narrow viewport states are verified.
- [x] Focused tests, full typecheck, production build, browser flow, and durable evidence all pass.

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

**At this checkpoint:**
- The first three live Attempts retained the seeded runtime's missing-persona failure and proved immutable retry lineage. After registering the local persona, the next Attempt exposed and fixed a second integration gap: executor-created Tasks now inherit their WorkOrder before entering `READY`.
- Attempt 4 now starts its governed workflow Task successfully. The local environment has no active agent worker to complete that Task, so live receipt, handoff, validator, and final Mission acceptance proof remains pending rather than being simulated.
- Complete the success-path browser evidence and narrow-viewport pass when the local agent worker is available.

### 2026-08-08 - Remaining browser-state matrix closed

**By:** Codex

**Actions:**

- Verified loading, explicit no-Task empty state, blocked/failed and immutable
  retry history, durable cancellation, completed run, refresh persistence,
  desktop, and 760 × 900 layouts through the WorkOrder and run inspector UI.
- Verified the fail-closed runtime-contract mismatch state with exact loaded and
  active contract versions.
- Corrected scheduled mission prompting so suggestions remain idempotent,
  unassigned intake until promoted through the canonical WorkOrder hierarchy;
  the scheduled path no longer attempts an invalid ungoverned `READY`
  transition.
- Recorded durable screenshots and results in
  `docs/testing/evidence/real-codex-github-pr-golden-path/`.

**Remaining verification:**

- The final test/build/browser/evidence criterion stays open until Todo 024
  produces a real GitHub App pull request from one browser-created,
  Factory-bound Mission Attempt. The implementation and deterministic test suite
  pass, but GitHub App owner authentication and installation are still required
  for that live success proof.

### 2026-08-09 - Real release-to-evidence Mission completed

**By:** Codex

**Actions:**

- Installed the private Mission Control GitHub App only on the existing
  `jaydubya818/MissionControl` repository with the documented minimum permission
  envelope.
- Completed recovered Mission `vn71r4fwfze37ke4scakt5xt8s8c7eg2` through its
  approved plan, released WorkOrder, canonical Task, immutable Attempt, worker
  receipt, structured handoff, WorkOrder acceptance, and final Mission
  acceptance.
- Published review-ready PR
  [#61](https://github.com/jaydubya818/MissionControl/pull/61) at commit
  `2fd0a5a0773560b05174776857545d7cd3bc5f95`; the pull request changes exactly
  `docs/software-factory/live-github-app-proof-recovery.md` and has all nine
  repository checks passing.
- Corrected Mission assertion evidence reconciliation so a worker receipt can
  satisfy a linked assertion only when independent validation is not required;
  Validator evidence remains mandatory when it is required.
- Verified in the browser that the Task and WorkOrder are `DONE`, assertion
  coverage is 1/1, and final operator acceptance presents the Mission as
  `Validated`.
- Preserved PR #61 as open and unmerged so review and merge remain human gates.
- Passed full workspace typecheck, production build, repository tests,
  runtime-contract guard, and the focused 16-test durable worker/publisher suite.

**Evidence:**

- `docs/testing/evidence/real-codex-github-pr-golden-path/mission-validated-pr-61.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/recovered-completed-attempt-pr-61.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/github-pr-61-lineage.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/README.md`
