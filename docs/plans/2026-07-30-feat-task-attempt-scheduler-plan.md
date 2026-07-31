---
title: "feat: Add governed Task Attempt scheduling and retry"
type: feat
status: completed
date: 2026-07-30
owner: Mission Control Platform
design_source: "PR #41 and PR #45"
---

# Governed Task Attempt Scheduler

## Overview

Mission Control now models `Mission → Work Order → Task → Attempt`, but Work
Order dispatch still defaults the new WorkflowRun to the compatibility-only
`legacyTaskId`. An operator cannot explicitly choose which governed Child Task
is being executed, and the Task surface does not provide a governed retry for
the latest failed Attempt.

This bounded change makes Task selection explicit at dispatch, creates the
WorkflowRun under that Task, and exposes reasoned retry under the same Task.
It reuses the existing Work Order dispatch, approval, model-routing,
idempotency, revision, and verification gates rather than introducing a second
execution path.

## Local research

- `convex/workOrders.ts` already owns governed dispatch, recovery validation,
  routing, audit events, receipt invalidation, and Work Order state changes.
- `convex/lib/workOrderDispatch.ts` already rejects active-run collisions,
  cross-Work-Order retries, non-failed retries, and missing retry reasons.
- `convex/lib/taskProjection.ts` already projects Task-scoped WorkflowRuns as
  ordered Attempts without creating duplicate Kanban cards.
- `apps/mission-control-ui/src/controlPlane/WorkOrdersView.tsx` already exposes
  dispatch and failed-run recovery.
- `apps/mission-control-ui/src/TaskDrawerTabs.tsx` already exposes governed
  Parent Delivery but no Attempt action.
- No relevant `docs/solutions/` entry or repository-wide critical-pattern file
  was present. The approved target model and the shipped PR #45 evidence are
  the controlling local sources.

External research is intentionally skipped: this is an internal contract
completion with strong repository patterns and no new framework or provider.

## Contract

### Dispatch

When a Work Order has canonical Child Tasks, the operator must select one
governed Child Task before dispatch. The backend never guesses the first Task.
The selected Task must:

- exist;
- belong to the same workspace and Work Order;
- have a valid canonical `workOrderId`;
- be `ASSIGNED` or `IN_PROGRESS`;
- not be terminal (`DONE` or `CANCELED`);
- have no active Task-scoped Attempt.

Work Orders without canonical Child Tasks retain the existing compatibility
path through `legacyTaskId`.

### Attempt identity

The dispatch mutation assigns the next Attempt number atomically inside the
Convex transaction. The created WorkflowRun stores:

- `parentTaskId`;
- Task Attempt number;
- retry number;
- prior WorkflowRun ID and reason for retries.

The current Task projection remains derived from immutable WorkflowRuns.

### Retry

Retry is allowed only when:

- the selected Task is governed by the same Work Order;
- the prior WorkflowRun belongs to that Task and Work Order;
- the prior run is the Task's latest Attempt;
- the prior run is `FAILED`;
- the operator provides a reason of at least ten characters;
- no active Work Order or Task Attempt exists.

Retry creates a new WorkflowRun under the same Task. It never creates or
renames a Task and never erases the failed Attempt.

### Governance

All scheduling goes through `workOrders.dispatch`. Existing Work Order
approval, risk, mission, revision, model-routing, operator-control,
verification, and active-run gates remain authoritative. Task selection cannot
bypass them. Task completion does not accept the Work Order.

## User flows

1. **Work Order dispatch**
   - Open Work Order.
   - Select a governed Child Task.
   - Dispatch.
   - See the new Task-scoped Attempt in the Work Order and Task detail.

2. **Task start**
   - Open a governed Task with no Attempt.
   - Start Attempt.
   - See loading, success, current Attempt, and persisted history.

3. **Task retry**
   - Open a Task whose latest Attempt failed.
   - Enter a required recovery reason.
   - Retry.
   - See the failed Attempt retained and a new Attempt on the same card.

4. **Failure paths**
   - Missing selection, foreign Task, cross-workspace Task, stale retry,
     non-failed retry, active-run collision, or missing approval fails closed
     with an actionable message and no new WorkflowRun.

## Spec-flow decisions

- **Concurrency:** this PR preserves the existing one-active-run-per-Work-Order
  gate. Parallel Child Task scheduling is separate work.
- **Task lifecycle:** scheduler actions do not silently force Task state
  transitions. Task state and Attempt runtime remain separate until a
  separately specified synchronization policy is approved.
- **First attempt vs. retry:** Start is available only before the first
  Task-scoped Attempt. Retry is available only for the latest failed Attempt.
- **Legacy runs:** runs without canonical `parentTaskId` remain visible and are
  not migrated or regrouped automatically.
- **Permissions:** the current operator identity continues through the existing
  dispatch contract. No new approval bypass or autonomous dispatch is added.
- **Recovery feedback:** mutation errors render inline and remain associated
  with the scheduling controls.

## Acceptance criteria

### Backend

- [x] Add a pure, tested Task Attempt scheduling policy.
- [x] Extend governed Work Order dispatch with an optional explicit Task.
- [x] Require explicit selection when canonical Child Tasks exist.
- [x] Reject missing, foreign, cross-workspace, Ungoverned, and terminal Tasks.
- [x] Reject active, stale, non-failed, cross-Task, and reasonless retries.
- [x] Assign Task Attempt and retry numbers atomically.
- [x] Write Task and Work Order audit evidence for start and retry.
- [x] Preserve idempotent replay without duplicate Attempts or audit events.
- [x] Preserve legacy Work Orders without canonical Child Tasks.

### Operator UI

- [x] Add an accessible Child Task selector to Work Order dispatch.
- [x] Show Task identity on linked execution runs.
- [x] Add Task Attempt history and start/retry controls to Task detail.
- [x] Require an inline retry reason and display actionable errors.
- [x] Update Attempt count and retry count without adding a Kanban card.
- [x] Preserve selected workspace, Task, Work Order, refresh, Back, and Forward.

### Verification and documentation

- [x] Add focused policy and projection tests.
- [x] Add deterministic browser coverage for start, failed retry, persistence,
      one-card behavior, history, isolation, duplicate submission, console,
      network, and accessibility.
- [x] Run bounded typecheck, focused tests, lint, and production build.
- [x] Capture screenshots and a Playwright trace.
- [x] Publish architecture and test evidence in repository Docs and Mission
      Control Docs.
- [x] Add rollback and post-deploy monitoring to the draft PR.

## Non-scope

- Parallel Child Task execution.
- Automatic Task selection.
- Automatic Task status synchronization from Attempt state.
- Work Order acceptance automation.
- Legacy retry-Task migration or deletion.
- Kanban redesign, swimlanes, table mode, WIP limits, or bulk actions.
- New executors, runtimes, workflow definition formats, or model-routing rules.

## Risks and mitigations

- **Ambiguous execution ownership:** fail closed when canonical Child Tasks
  exist and no Task is selected.
- **Duplicate Attempts:** reuse dispatch idempotency and validate active runs
  transactionally.
- **Retrying stale failures:** require the prior run to be the latest Task
  Attempt.
- **Governance bypass:** keep Work Order dispatch as the only public scheduling
  mutation.
- **Historical corruption:** make no destructive migration or backfill.

## Rollback

Remove Task selection and Task detail controls, stop passing `taskId`, and
revert the dispatch validation/metadata additions. Existing Task-scoped
WorkflowRuns remain readable by the PR #45 projection. No stored record needs
to be deleted or rewritten.

## Post-deploy monitoring

- Search logs for `Task selection required`, `Task Attempt`, `active-run-exists`,
  `retry-run-not-failed`, and `retry-run-not-latest`.
- Watch failed dispatch count, duplicate idempotency hits, Task Attempts per
  Task, retry rate, and WorkflowRuns missing `parentTaskId`.
- Healthy behavior: one selected Task creates one Attempt and one card; a
  reasoned retry preserves the failed run and increments counts.
- Roll back if cross-Task linkage succeeds, duplicate Attempts appear, or any
  existing Work Order approval gate can be bypassed.
- Validation window: first 24 hours after deployment.
- Owner: Mission Control Platform.

## References

- PR #41 — canonical hierarchy design.
- PR #45 — governed Task/Work Order linkage and Attempt projection.
- `docs/plans/task-workorder-target-model.md`
- `docs/architecture/task-workorder-linkage-pr1.md`
- `docs/testing/task-workorder-linkage-results.md`
- `convex/workOrders.ts`
- `convex/lib/workOrderDispatch.ts`
- `convex/lib/taskProjection.ts`
