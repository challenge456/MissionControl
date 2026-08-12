# Governing WorkOrders

WorkOrders are the primary unit of value in the software factory — not tasks shaped like chat transcripts.

## Create a WorkOrder

Each WorkOrder declares:

- **Desired outcome** — one sentence the operator can verify
- **Acceptance criteria** — checklist, test, or command verification methods
- **Requirements and evidence obligations** — stable IDs, category, count, and independent producer
- **Positive and negative constraints** — required behavior plus prohibited change space
- **Change budget** — file, line, path, dependency, schema, infrastructure, and command authority
- **Verification contract** — mandatory independent checks and optional human review reservation
- **Risk level** — LOW → CRITICAL drives approval requirements
- **Source-of-truth refs** — repo, doc, PRD, issue links

Use **Delivery → Work Orders** or `createSoftwareFactoryProject` for a seeded factory project.

## Lifecycle states

| State | Meaning |
| --- | --- |
| READY | Scoped and dispatchable |
| IN_PROGRESS | Execution run active |
| BLOCKED | Preflight or dependency failure |
| AWAITING_APPROVAL | Human gate open |
| AWAITING_VERIFICATION | Run complete, criteria pending |

## Verification receipts

Criterion-level proof lives in `verificationReceipts`. Verification-first WorkOrders also require a WorkOrder-level receipt whose server-recomputed verdict is `VERIFIED`. A worker-reported command is context, not proof. Missing, failed, skipped, unconfigured, errored, stale, or blocked checks prevent progression.

For an enforced contract, Mission Control commits the local candidate, runs the frozen independent checks, confirms the candidate remains clean and unchanged, records evidence, and only then allows the Factory to push or create a pull request. Use the **Executable specification** and **Independent verification** panels on Work Order detail to inspect this boundary.

CLI inspection is available with `mc work-order inspect <work-order-id>`. The authenticated orchestration endpoint is `GET /workorders/:workOrderId/verification`.

## Approvals

RED/YELLOW policy hits create `approvals` rows. Dual-control approvals require two decisions before dispatch proceeds.

## UI drill-down

Command Center → blocked WorkOrders → Trace Inspector for step timeline and artifacts.

See [Factory overview](https://github.com/jaydubya818/MissionControl/blob/main/docs/software-factory/information-architecture.md) for the full entity model and [Verification-first WorkOrder contract](https://github.com/jaydubya818/MissionControl/blob/main/docs/software-factory/verification-first-workorder-contract.md) for the executable proof boundary.
