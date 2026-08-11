---
status: complete
priority: p1
issue_id: "027"
tags: [software-factory, research-lab, governance, workorders, queue-hygiene]
dependencies: []
---

# Research Lab Phase 0 Authority and Queue Cleanup

## Problem Statement

The Software Factory Research Lab has an accessibility-audit WorkOrder whose
current workflow child objective concerns Task Attempt retry research. The
relationship is linked by ID but is not semantically within the authorized
outcome. The queue also contains legacy and synthetic browser-evidence Tasks
that must not be executed or canceled without an explicit reviewed decision.

## Findings

- The approved continuous-learning plan requires authority and queue truth
  before enabling continuous scheduling.
- The accessibility-audit WorkOrder must remain unchanged.
- Retry scheduling research needs its own governed WorkOrder.
- Workflow child Tasks already inherit `workOrderId`, but linkage alone does
  not prove that a generated Task is within the WorkOrder objective.
- Queue cleanup must produce a decision packet and avoid silent destructive
  transitions.

## Proposed Solutions

### Option 1: Keep the Existing WorkOrder

**Approach:** Continue retry research under the accessibility WorkOrder.

**Pros:** No new records.

**Cons:** Violates intent authority and makes evidence lineage misleading.

**Effort:** Low

**Risk:** High

### Option 2: Separate WorkOrder and Semantic Guard

**Approach:** Preserve the accessibility WorkOrder, create a separate retry
research WorkOrder, enforce generated-Task scope provenance, and produce a
non-destructive queue-hygiene packet.

**Pros:** Preserves intent, auditability, and a safe cleanup path.

**Cons:** Adds one governed WorkOrder and a focused contract change.

**Effort:** Medium

**Risk:** Low

## Recommended Action

Implement Option 2. This was explicitly approved by the Product Owner on
2026-08-08.

## Technical Details

**Affected areas:**

- WorkOrder creation and dispatch contracts
- workflow-generated Task metadata and validation
- focused workflow-engine/Convex tests
- Research Lab queue audit documentation

**Database changes:**

- Prefer existing metadata and source-of-truth references.
- Add schema only if the existing WorkOrder/Task metadata cannot express the
  authoritative objective reference safely.

## Resources

- `docs/plans/2026-08-08-feat-governed-continuous-learning-plan.md`
- `docs/product/mission-control-north-star.md`
- `packages/workflow-engine/src/executor.ts`
- `convex/tasks.ts`
- `convex/workOrders.ts`

## Acceptance Criteria

- [x] Accessibility-audit WorkOrder remains unchanged.
- [x] Retry research has a separate governed WorkOrder with explicit outcome,
  scope, acceptance criteria, repository, budget, and stop condition.
- [x] Workflow-generated Tasks carry an authoritative scope reference tied to
  their WorkOrder objective or approved source-of-truth reference.
- [x] Missing or mismatched scope provenance fails closed before execution.
- [x] Focused tests cover valid, missing, and mismatched scope provenance.
- [x] Queue hygiene is documented by category with recommended actions and no
  silent bulk cancellation.
- [x] Research Lab browser evidence proves both WorkOrders and the new governed
  retry-research chain.

## Work Log

### 2026-08-08 - Approved Phase 0 Start

**By:** Codex

**Actions:**

- Recorded Product Owner approval for the separate WorkOrder approach.
- Began inspection of the current WorkOrder, workflow, Task, and dirty-worktree
  contracts.

**Learnings:**

- ID linkage is necessary but not sufficient for WorkOrder authority.
- Queue cleanup must remain reviewable because Task cancellation is terminal.

### 2026-08-08 - Authority Guard and Queue Audit

**By:** Codex

**Actions:**

- Added revision-bound WorkOrder objective provenance to governed Task creation
  and linking.
- Made selected Child Tasks fail closed when provenance is missing or stale.
- Made workflow-generated Tasks validate and display the frozen WorkOrder
  objective before Task creation.
- Added focused valid, missing, and mismatched provenance tests.
- Produced `docs/validation/2026-08-08-research-lab-phase-0-queue-hygiene.md`
  from a read-only audit of the current 159-Task database.

**Verification:**

- Convex authority and scheduler tests: 24 passed.
- Workflow executor tests: 15 passed.
- Workflow engine and Mission Control UI typechecks passed.

### 2026-08-09 - Governed WorkOrder Split and Browser Proof

**By:** Codex

**Actions:**

- Created retry-research WorkOrder `yh7f82jncj56gbe2fxsdr44w6s8c56vc`
  with a read-only scope, four acceptance criteria, a bounded budget, and an
  explicit stop condition.
- Dispatched one governed `loop-engineering` run,
  `ys79vm5y2hgdszy2f7sah20dbn8c55t9` (`k18vfqxy`), which remains `PENDING`
  because no autonomous executor was enabled.
- Proved from the canonical database that accessibility-audit WorkOrder
  `yh72sn2jp02by6b2zr23pr01dh8bd4nb` retained its outcome, repository,
  revision, state, active run, and `updatedAt` value.
- Removed the stale local UI-checkout override that mixed client contract v5
  with the preserved v3 backend, then restarted the Research Lab runtime from
  `/Users/jaywest/MissionControl`.
- Browser-verified the Research Lab workspace, both separate WorkOrders, the
  retry-research run and acceptance gates, and zero browser console errors.

**Verification:**

- Convex authority, Attempt scheduler, and Research Lab launcher tests: 33
  passed.
- Workflow executor tests: 17 passed.
- Workflow engine typecheck passed.
- Browser: new WorkOrder `DISPATCHED`; retry run `PENDING`; accessibility audit
  separately `IN PROGRESS`; no console errors.

**Learnings:**

- A linked Task ID cannot substitute for revision-bound semantic authority.
- The preserved database needs a generous fail-closed startup window, and the
  UI checkout must match the active backend contract.

## Notes

- Do not edit the approved implementation plan while executing this todo.
- Do not create a commit unless the Product Owner explicitly asks.
