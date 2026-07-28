---
status: ready
priority: p1
issue_id: "008"
tags: [software-factory, missions, governance, validation]
dependencies: []
---

# Implement Governed Missions

## Problem Statement

Mission screens are a demo projection, while governed WorkOrders, runs, approvals,
and receipts are already real. Operators need one durable Mission record that
turns an approved objective into serial, evidence-backed delivery work without
introducing a competing workflow engine.

## Findings

- WorkOrder governance and execution evidence are real in `convex/workOrders.ts`
  and `convex/workflowRuns.ts`.
- EOS Mission views read seeded narrative data and title-match WorkOrders.
- No first-class Mission, frozen validation contract, or canonical handoff
  contract exists.

## Proposed Solutions

### Option 1: Extend the demo Mission projections

**Pros:** Small UI-only change.

**Cons:** Does not provide truthful lifecycle control or validation gates.

**Risk:** High.

### Option 2: Add an additive governed Mission parent record

**Pros:** Reuses existing WorkOrder/run/receipt lifecycle and provides durable,
auditable role separation.

**Cons:** Requires schema, server commands, UI conversion, and end-to-end tests.

**Risk:** Medium.

## Recommended Action

Implement Option 2 in vertical slices: contract and governance first; then
orchestration handoffs, live UI, and browser/evidence validation. Preserve
direct WorkOrders and keep one mutating WorkOrder per Mission in V1.

## Acceptance Criteria

- [ ] Mission contract specifies state, role, handoff, validation, and stop rules.
- [ ] Mission schema and server-owned lifecycle commands are additive and tested.
- [ ] Mission guards prevent out-of-order or concurrent mutating WorkOrder dispatch.
- [ ] Independent validator evidence is required before Mission acceptance.
- [ ] EOS Mission views use live records, not title-matched demo state.
- [ ] Full lifecycle has Convex, browser, and evidence validation.

## Work Log

### 2026-07-28 - Approved implementation start

**By:** Codex

**Actions:**
- Reviewed approved plan `docs/plans/2026-07-28-feat-governed-missions-plan.md`.
- Confirmed current WorkOrder, receipt, and run-inspector contracts are the
  foundation; no second execution engine will be created.
- Began Phase 0 contract definition.

**Learnings:**
- The smallest shippable slice is a Mission parent/governance contract over
  existing WorkOrders, not a broad multi-agent platform rewrite.

### 2026-07-28 - Phase 0 and Phase 1 foundation

**By:** Codex

**Actions:**
- Added `docs/software-factory/governed-missions-contract.md` defining the V1
  role boundaries, state transitions, validation evidence, handoff contents,
  recovery, and escalation rules.
- Added additive Mission, MissionPlan, ValidationAssertion, MissionHandoff, and
  MissionEvent records in `convex/schema.ts`, with optional links from existing
  WorkOrders, runs, receipts, and artifacts.
- Added server-owned Mission draft, plan submission/approval, start, handoff,
  validation-result, and acceptance commands in `convex/missions.ts`.
- Added Mission dispatch guards to `convex/workOrders.ts`; Mission WorkOrders
  must be created from the approved blueprint and are serialized by mutation,
  dependency handoff, budget, and corrective-iteration limits.
- Added seven focused governance tests and verified the existing WorkOrder
  dispatch/governance tests plus Convex type checking.

**Learnings:**
- The validation contract can remain independent while existing WorkOrder
  acceptance criteria continue to own execution-level checks.
- Mission enforcement belongs at the existing WorkOrder dispatch boundary, not
  in a parallel scheduler or UI-only guard.
