---
status: complete
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

- [x] Mission contract specifies state, role, handoff, validation, and stop rules.
- [x] Mission schema and server-owned lifecycle commands are additive and tested.
- [x] Mission guards prevent out-of-order or concurrent mutating WorkOrder dispatch.
- [x] Independent validator evidence is required before Mission acceptance.
- [x] EOS Mission views use live records, not title-matched demo state.
- [x] Full lifecycle has Convex, browser, and evidence validation.

### Mission plan and WorkOrder release slice

- [x] Plan drafts, validation assertions, and WorkOrder blueprints persist as a typed, versioned contract.
- [x] Operators can submit, reject with a reason, fork a revision, resubmit, and approve through Mission Detail.
- [x] Approval atomically creates linked validation assertions and WorkOrders exactly once without dispatching execution.
- [x] Plan decisions and release remain default-off behind `missions.plan-release-v1` outside verified local scope.
- [x] Focused Convex/UI tests, typecheck, and desktop/narrow browser verification pass.

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

### 2026-07-28 - Runtime and live operator slice

**By:** Codex

**Actions:**
- Extended Pi receipt-packet ingestion to optionally submit a structured Mission
  handoff through the same Convex lifecycle command.
- Added authenticated orchestration-server endpoints for Mission handoffs,
  validator results, and acceptance.
- Added distinct `WORKER` and `VALIDATOR` Mission blueprint/run roles.
- Replaced the EOS Mission portfolio and detail views' seeded fallback with
  live Convex Mission records, URL-backed selection, a draft creation dialog,
  and explicit decision/evidence states.
- Promoted Missions to a live left-navigation route and updated its visibility
  contract test.
- Created and inspected a local demo Mission draft at `http://localhost:5199`.

**Learnings:**
- A generic provenance component can make live data look simulated; Mission
  views now state their Convex source and validation semantics directly.

### 2026-07-31 - Mission plan and WorkOrder release implementation started

**By:** Codex

**Actions:**
- Approved bounded plan: `docs/plans/2026-07-31-feat-mission-planning-workorder-release-plan.md`.
- Confirmed the current gap: `approvePlan` creates assertions and marks the Mission ready but does not materialize WorkOrders.
- Started the typed plan, revision, decision, atomic release, and Mission Plan UI slice on the existing feature branch.

**Learnings:**
- The existing WorkOrder creation and governance path must be reused inside one Convex transaction; asynchronous per-blueprint release would permit partial state.
- Production approval must remain gated until actor authority is resolved server-side.

### 2026-07-31 - Mission plan and WorkOrder release completed

**By:** Codex

**Actions:**
- Added a typed, versioned Mission plan contract with deterministic blueprint and assertion validation.
- Added persistent draft saving, optimistic draft versions, submission, rejection reasons, revision forking, repository/workflow snapshots, and explicit approval evidence.
- Reused a shared WorkOrder creation engine so plan approval materializes all linked WorkOrders and validation assertions in one Convex transaction without dispatching execution.
- Added the Mission Detail Plan workspace, revision comparison, approval packet, release confirmation, WorkOrder eligibility explanations, and desktop/narrow responsive states.
- Kept the release surface default-off behind `missions.plan-release-v1` outside verified local scope.
- Verified the reject → revise → approve lifecycle in a real browser and recorded the evidence in `docs/testing/mission-plan-workorder-release-results.md`.
- Passed 70 focused tests, the full 18-project workspace typecheck, the Convex typecheck, and the production UI build.

**Learnings:**
- Plan approval and WorkOrder approval are intentionally separate gates; release creates governed pre-execution records but never grants dispatch authority.
- A neutral shared creation library preserves atomic Mission release without coupling public Convex function modules into other workspace packages.
