---
status: complete
priority: p1
issue_id: "013"
tags: [graph-engineering, workflows, loop-engineering, operator-ux]
dependencies: []
---

# Ship Graph Engineering as a Governed Operator Flow

## Problem Statement

Mission Control has a capable DAG engine and Loop Engineering workflow, but the
default product flow does not expose dispatch, graph progress, or run inspection.
The demo runtime also omits the executor, and in-flight runs are not pinned to the
workflow definition used at dispatch.

## Findings

- `workflows/loop-engineering.yaml` already defines fan-out/fan-in research,
  independent verification, synthesis, and an explicit approval gate.
- `packages/workflow-engine` already validates and schedules bounded DAGs with
  retry and failure-containment policies.
- Loop cycle creation intentionally creates a root Task and WorkOrder without
  dispatching it; this is the correct governance boundary.
- `harness-loops` is marked preview and hidden from the default EOS navigation.
- `pnpm run dev:demo` starts Convex and the UI but not the workflow executor.
- The executor loads the latest installed workflow on each tick, allowing a
  workflow update to alter an in-flight run.

## Proposed Solutions

### Option 1: Auto-dispatch on Cycle Creation

**Pros:** One click and fewer visible steps.

**Cons:** Removes the operator review boundary and makes agent execution
surprising.

**Effort:** Low. **Risk:** High.

### Option 2: Integrate Explicit Graph Dispatch (Selected)

**Pros:** Reuses proven primitives, preserves governance, makes execution and
evidence visible, and has a contained blast radius.

**Cons:** Retains a deliberate two-step start/dispatch flow.

**Effort:** Medium. **Risk:** Low to medium.

### Option 3: Build a Separate Graph Orchestration Product

**Pros:** Maximum flexibility.

**Cons:** Duplicates the workflow engine and delays a shippable V1.

**Effort:** High. **Risk:** High.

## Recommended Action

Implement Option 2 using the detailed plan in
`docs/plans/2026-07-31-feat-graph-engineering-production-integration-plan.md`.

## Technical Details

Primary areas: workflow run persistence, WorkOrder dispatch, executor definition
resolution, Loop Engineering UI, route capability/navigation, demo startup, and
focused automated/browser tests.

## Resources

- `docs/software-factory/GRAPH_ENGINEERING.md`
- `docs/software-factory/LOOP_ENGINEERING.md`
- `docs/testing/software-factory-loop-engineering-e2e-report.md`
- `docs/brainstorms/2026-07-31-graph-engineering-production-integration.md`
- `docs/plans/2026-07-31-feat-graph-engineering-production-integration-plan.md`

## Acceptance Criteria

- [x] Graph Engineering is a live, reachable EOS destination.
- [x] Explicit dispatch is available from the selected cycle.
- [x] Required research and evidence-review personas are provisioned per project.
- [x] Graph progress, exceptions, evidence work, and run inspection are visible.
- [x] Workflow definitions are pinned per run with legacy fallback.
- [x] Demo startup installs workflows and includes the workflow executor.
- [x] Automated checks and browser verification pass.
- [x] Existing approval and recovery controls remain intact.

## Work Log

### 2026-07-31 - Audit and Approved Direction

**By:** Codex

**Actions:**
- Audited the existing workflow engine, Loop Engineering workflow, Convex
  persistence, WorkOrder dispatch, UI reachability, tests, and demo runtime.
- Confirmed that production integration—not a new engine—is the simplest
  shippable approach.
- Recorded the accepted explicit-dispatch design and implementation plan.

**Learnings:**
- The graph primitives are substantially complete.
- Product reachability, deterministic run snapshots, and runtime startup are the
  critical shipping gaps.

### 2026-07-31 - Implementation and Live Verification

**By:** Codex

**Actions:**
- Added version-pinned workflow snapshots with a tested legacy fallback.
- Added explicit idempotent graph dispatch, graph health/progress metrics,
  exception recovery, and the existing Execution Run Inspector to the cycle UI.
- Promoted Graph Engineering to a live EOS route and navigation destination.
- Added idempotent workflow installation and executor startup to the demo command.
- Provisioned the built-in research and evidence-review identities per project.
- Ran full type checks, production builds, 90 focused automated tests, and live
  browser verification with captured evidence.

**Learnings:**
- A fresh demo needed both built-in workflow installation and project-scoped
  personas; the live test caught both before handoff.
- Executor failures remained contained to failed/downstream-blocked nodes and
  surfaced the correct WorkOrder recovery action.

## Notes

Do not auto-dispatch a graph when a cycle is created. The WorkOrder review and
explicit dispatch action are part of the product's trust model.
