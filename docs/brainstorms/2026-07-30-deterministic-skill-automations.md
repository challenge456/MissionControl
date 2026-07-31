---
date: 2026-07-30
topic: deterministic-skill-automations
---

# Deterministic Skill Automations

## What We're Building

Extend the existing Automation Control Plane so a published Context Registry
skill can be assessed, converted through a resumable seven-step wizard, linked
to a deterministic repository artifact, reviewed, activated, evaluated into a
governed WorkOrder, dispatched only after approval, and independently verified
through the existing receipt boundary.

## Why This Approach

Mission Control already owns canonical Context Registry packages, Automation
Definitions, WorkOrders, approval decisions, execution runs, verification
receipts, and Automation decisions. Reusing those records keeps operator views,
governance, metrics, and audit lineage coherent. Only conversion drafts,
execution-artifact metadata, and evaluation records are new.

## Key Decisions

- Skill candidates are derived from published Context Registry package versions
  and a deterministic eligibility evaluator; ineligible skills stay visible.
- Candidate defer/dismiss/restore decisions use persisted meta-loop suggestions
  and Automation decisions rather than a second candidate table.
- Automation Definitions gain additive optional source-skill, adapter, artifact,
  validation, review, repository, and correlation fields.
- Generated artifact content is previewed and validated before persistence.
  Existing files are link-only in V1; no silent overwrite is permitted.
- The seven adapters share one strict manifest. Commands are selected from
  adapter-specific allowlisted shapes, never arbitrary interpolated shell.
- Scheduled/manual evaluation remains evaluation-only and creates an
  `AWAITING_APPROVAL` WorkOrder. The scheduler never invokes an adapter.
- Execution runs use existing `executionRuns`; verification uses existing
  `verificationReceipts`; final success requires both a passed run and receipt.
- V1 remains LEVEL_1, read-only, approval-required, no automatic dispatch, and
  independent-receipt-required.

## Extension Points

- Schema: `convex/schema.ts`
- Eligibility/artifact policy: `convex/lib/skillAutomation.ts`
- Backend lifecycle: `convex/skillAutomations.ts`, existing `automations.ts`,
  `automationScheduler.ts`, and `workOrders.ts`
- Registry entry: `RegistryPackageDetail.tsx`
- Operator workflow: existing `apps/mission-control-ui/src/automations/`
- Runtime: orchestration server deterministic adapter endpoint
- Tests: Convex unit/integration tests and real local Playwright journey

## Open Questions

None blocking. Authenticated operator identity remains a platform-wide follow-up;
the UI and audit trail must continue to label the current trusted-operator mode.

## Next Steps

Implement in vertical slices: policy/schema → conversion backend → wizard and
candidate UI → governed execution/verification → seed and tests → browser proof.
