# Task-to-Work-Order PR 1

This bounded implementation establishes the canonical delivery relationship without replacing the Tasks Kanban board:

`Mission → Work Order → Task → Attempt`

Implementation commit: `de13dd829f3e62f143a4b15af24a0065c602d280`

Draft pull request: https://github.com/jaydubya818/MissionControl/pull/45

## What changed

- Tasks can reference one governed Work Order.
- Mission context is derived through the Work Order.
- New parentless Tasks are explicit Ungoverned Inbox intake.
- Existing parentless records remain Legacy compatibility records.
- Ungoverned work cannot execute until linked.
- Task cards and detail show parent delivery and Attempt context.
- Work Order detail shows Child Tasks, execution progress, and separate acceptance readiness.

The relationship is additive and workspace-scoped. Cross-workspace parents are rejected. Linking records an Activity and Task Event with actor, timestamp, previous relationship, new Work Order, and derived Mission.

## Compatibility

There is no destructive backfill. `workOrders.legacyTaskId` remains compatibility-only, historical retry-shaped Tasks are not merged, and Work Order acceptance remains independent from Task completion.

## Operator policy

Ungoverned Tasks can be created, edited, searched, filtered, linked, or canceled. Any attempted active transition returns:

> Link this Task to a Work Order before execution.

## Attempt behavior

A Task-scoped WorkflowRun is projected as an Attempt. Multiple Attempts update count, current status, and retry count on one Task card.

Starting and retrying a Task-scoped Attempt is the recommended next bounded PR because Work Orders may have multiple Child Tasks and require an explicit scheduling contract.

Full engineering decision record: `docs/architecture/task-workorder-linkage-pr1.md`.
