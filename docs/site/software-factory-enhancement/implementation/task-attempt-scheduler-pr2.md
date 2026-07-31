# Task Attempt Scheduler PR 2

Status: **IMPLEMENTED AND LOCALLY VERIFIED**

Mission Control now binds governed execution to an explicit Child Task:

`Mission → Work Order → Task → Attempt`

## Operator contract

- Select an eligible Child Task before dispatch.
- Start only the first Attempt from Task detail.
- Retry only the latest failed Attempt.
- Explain what changed before retrying.
- Keep the failed Attempt as evidence.
- Never create another Kanban card for a retry.

Eligible Tasks belong to the same workspace and Work Order and are Assigned or
In Progress. Inbox, Review, Done, Canceled, foreign, and Ungoverned Tasks fail
closed with actionable guidance.

## Governance

The implementation reuses Work Order dispatch. Approval, risk, revision,
mission, model-routing, active-run, idempotency, and verification gates cannot
be skipped through the Task UI.

Legacy Work Orders and historical legacy recovery remain compatible. There is
no destructive migration, automatic Task selection, Task-state automation, or
parallel execution policy in this cycle.

## Evidence and rollback

The architecture record is
`docs/architecture/task-attempt-scheduler-pr2.md`; the browser record is
`docs/testing/task-attempt-scheduler-results.md`.

Rollback removes the new controls and Task metadata forwarding. Existing
Task-scoped WorkflowRuns remain readable and require no data deletion.
