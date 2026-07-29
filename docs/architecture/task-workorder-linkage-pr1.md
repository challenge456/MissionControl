# Task-to-Work-Order PR 1

Date: 2026-07-28
Branch: `codex/task-workorder-linkage-pr1`
Design source: PR #41
Implementation commit: `de13dd829f3e62f143a4b15af24a0065c602d280`
Draft pull request: https://github.com/jaydubya818/MissionControl/pull/45

## Product hierarchy

The implementation preserves the approved hierarchy:

`Goal → Mission → Work Order → Task → Attempt → Steps, tools, artifacts, evidence`

Tasks remain the Kanban execution unit. Work Orders remain governed delivery contracts. A WorkflowRun with `parentTaskId` is projected as an Attempt and never creates an additional Task card.

## Schema and query model

- Added optional `tasks.workOrderId`.
- Added indexes for Tasks by Work Order, workspace and Work Order, and workspace, Work Order, and status.
- Mission is derived through `Task → Work Order → Mission`; no duplicate `tasks.missionId` was introduced.
- `workOrders.legacyTaskId` remains compatibility-only.
- Task list queries load project Work Orders, Missions, and WorkflowRuns in bounded batches and build maps in memory. The Kanban board does not issue one parent query per card.
- `workOrders.get` returns projected Child Tasks.

## Governance classification

Classification is derived, not persisted as a second status field:

- `GOVERNED`: `workOrderId` resolves to a Work Order in the same workspace.
- `UNGOVERNED`: no Work Order and `metadata.governanceOrigin` is `UNGOVERNED_INTAKE`.
- `LEGACY`: historical parentless Tasks or unresolved historical relationships that cannot be safely reclassified.

New creation writes the provenance marker. This makes new intake enforceable without destructively rewriting historical records. Legacy Tasks retain compatibility behavior until a reviewed migration can classify them.

## Backend behavior

- Task creation accepts an optional Work Order, validates existence and workspace ownership, derives Mission context, and returns the full parent/Attempt projection.
- Parentless creation remains Inbox intake and writes the explicit Ungoverned marker.
- `tasks.linkToWorkOrder` validates both records, rejects cross-workspace relationships, is state-idempotent, preserves Task history, and records actor, timestamp, old relationship, new Work Order, and derived Mission in both Activity and Task Event streams.
- An Ungoverned Task can remain in Inbox or be canceled. Every other transition returns: `Link this Task to a Work Order before execution.`
- Failed validation does not patch Task state.

## Operator UI

- New Task includes a human-readable Parent Work Order selector, Mission preview, repository, risk, and Work Order state.
- Opening New Task from Work Order detail preselects the Work Order.
- Global creation explicitly offers `Create as Ungoverned Inbox`.
- Task cards display Work Order, Mission, governance, due date, assigned agent, current Attempt, and retry count.
- Ungoverned cards show the required remediation and do not offer active moves.
- Task detail includes Parent Delivery and a link mutation for Ungoverned intake.
- Work Order detail includes Child Tasks, execution progress, and separately calculated acceptance readiness.
- Task-to-Work-Order and Task-to-Mission navigation use one routed history entry, preserving Back and Forward behavior.
- Shared page headers stack actions until the `2xl` breakpoint so the agent rail cannot intercept Task actions in a three-column shell.

## Attempt projection

WorkflowRuns with `parentTaskId` are ordered by `startedAt`. Projection exposes:

- current Attempt ID, number, status;
- Attempt count;
- retry count (`Attempt count - 1`);
- internal step retry count.

Existing metadata-only retry-shaped Tasks are flagged `legacyRetryAmbiguous`; they are not merged or duplicated automatically.

## Migration and rollback

Migration is additive. There is no backfill or destructive rewrite. New Tasks receive explicit relationship provenance; historical records remain Legacy.

Rollback:

1. Remove UI consumers and mutations.
2. Stop writing `workOrderId` and governance provenance.
3. Leave the optional field and indexes in place until no deployed reader depends on them.
4. Remove schema fields only in a separately reviewed cleanup after confirming stored values are no longer needed.

## Known limitations and next boundary

- Task-scoped Attempt creation and retry controls are not added. Existing Attempts are projected and verified, but binding a new Work Order execution to one of several Child Tasks needs an explicit scheduling contract.
- Historical parentless Tasks remain Legacy; a measured classification/backfill is a separate migration.
- Work Order acceptance is intentionally not rolled up from Task completion.
- Automatic Quick Work Orders, READY migration, swimlanes, bulk actions, and broad Kanban redesign remain out of scope.
- The optional gateway service on port 4100 was unavailable locally. Its health probe is unrelated to this feature; feature requests had zero failures.

The recommended next PR is a bounded Task scheduler: select a governed Child Task when dispatching, create a Task-scoped Attempt, expose retry under that same Task, and retain Work Order approval/verification gates.
