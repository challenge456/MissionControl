# WorkOrder revision and reopen lifecycle — changed files

## Backend and schema

- `convex/schema.ts`
- `convex/workOrders.ts`
- `convex/workflowRuns.ts`
- `convex/lib/workOrderDispatch.ts`
- `convex/lib/workOrderGovernance.ts`
- `convex/lib/workOrderRevision.ts`

## Tests

- `convex/__tests__/workOrderDispatch.test.ts`
- `convex/__tests__/workOrderGovernance.test.ts`
- `convex/__tests__/workOrderRevision.test.ts`

## UI

- `apps/mission-control-ui/src/controlPlane/WorkOrdersView.tsx`
- `apps/mission-control-ui/src/controlPlane/WorkOrderApprovalsView.tsx`
- `apps/mission-control-ui/src/controlPlane/workOrderLifecycleModel.ts`
- `apps/mission-control-ui/src/controlPlane/workOrderLifecycleModel.test.ts`

## CLI and orchestration

- `scripts/mc`
- `apps/orchestration-server/src/convexCalls.ts`
- `apps/orchestration-server/src/index.ts`

## Generated bindings and docs

- `convex/_generated/api.d.ts`
- `docs/software-factory/domain-contracts.md`
- `docs/software-factory/incremental-delivery-plan.md`
- `docs/software-factory/verification-receipt.md`
