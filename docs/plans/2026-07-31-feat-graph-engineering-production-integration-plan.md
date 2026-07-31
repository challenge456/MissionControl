---
title: Graph Engineering Production Integration
type: feat
status: complete
date: 2026-07-31
brainstorm: docs/brainstorms/2026-07-31-graph-engineering-production-integration.md
---

# Graph Engineering Production Integration

## Problem This Solves

Mission Control already understands dependency graphs, parallel node execution,
verification, retries, and approval gates, but operators cannot reliably reach,
dispatch, or observe that capability from the production EOS flow. Runs also
resolve the latest workflow definition while executing, so updating a workflow
can change an in-flight graph.

## Operator Flow

1. Start a bounded Graph Engineering cycle.
2. Review the generated root WorkOrder and its read-only workflow contract.
3. Explicitly dispatch the graph.
4. Observe queued, active, completed, failed, and blocked nodes from the cycle.
5. Inspect node evidence, retries, routing, and the approval gate in the existing
   Execution Run Inspector.
6. Recover failed runs through the governed WorkOrder flow.

## Implementation

### 1. Pin Workflow Definitions to Runs

- Add optional workflow version and snapshot fields to `workflowRuns` for
  backward-compatible rollout.
- Snapshot the active definition in both WorkOrder dispatch and direct workflow
  start paths.
- Execute and inspect a run using its snapshot; use the installed definition only
  for legacy runs without one.
- Cover the behavior with executor and Convex tests.

### 2. Add the Graph Dispatch Surface

- Resolve each selected cycle's root WorkOrder and latest workflow run.
- Add an exception/evidence-first graph card with topology, progress,
  verification count, status, failure reason, and operational next action.
- Idempotently provision the two project-scoped agent personas required by the
  built-in graph when a cycle is created.
- Offer direct dispatch only for a ready WorkOrder with no active or failed run.
- Use a stable cycle/revision idempotency key to prevent double dispatch.
- Open the existing Execution Run Inspector for active and terminal runs.
- Send failure recovery and WorkOrder review to the existing Work Orders page.

### 3. Make the Capability Reachable

- Promote `harness-loops` from preview to live.
- Label the destination **Graph Engineering** in both EOS and classic navigation.
- Update page copy to explain governed DAG execution without overstating
  autonomy.

### 4. Start the Runtime

- Add a root workflow-executor development command that loads `.env.local`.
- Include the executor in `pnpm run dev:demo` alongside Convex and the UI.
- Idempotently install built-in workflow definitions before the executor starts.
- Update operator run documentation.

### 5. Verification

- Test workflow snapshot selection and legacy fallback.
- Test graph execution summaries and dispatch availability.
- Test live route visibility and navigation labeling.
- Run workflow-engine, Convex, UI, and type checks.
- Verify the complete flow from the main repo at `http://localhost:5180` (the
  active-development equivalent of the canonical `:5199` demo) and capture browser
  evidence for loading, ready-to-dispatch, active/terminal, and inspector states.

## Acceptance Criteria

- [x] Graph Engineering is visible in the default EOS navigation.
- [x] Starting a cycle creates governed work but does not auto-dispatch it.
- [x] A ready cycle WorkOrder can be dispatched once from the cycle page.
- [x] A new cycle has the project-scoped research and evidence-review personas
      required to materialize its nodes.
- [x] Repeated dispatch interaction is idempotent.
- [x] Operators can see graph topology, node progress, verification progress,
      failures, and the correct recovery action.
- [x] Operators can open the Execution Run Inspector from the cycle.
- [x] Each new run executes the exact workflow version captured at dispatch.
- [x] Legacy runs without a snapshot continue using the installed definition.
- [x] The demo command installs workflows and starts the workflow executor.
- [x] The explicit evidence-bound approval gate remains intact.
- [x] Focused automated tests and browser verification pass.

## Risks and Controls

- **Dirty shared worktree:** edit only graph-related seams and preserve existing
  model-routing and navigation work.
- **Legacy data:** snapshot fields remain optional and have a tested fallback.
- **Duplicate execution:** use backend idempotency plus UI state gating.
- **Executor unavailable:** identify queued state clearly; demo startup includes
  the executor.
- **Scope creep:** do not build automatic evidence ingestion or speculative
  per-node learned routing in this slice.
