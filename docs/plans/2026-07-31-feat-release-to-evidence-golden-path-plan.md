---
title: "feat: Complete release-to-evidence Mission golden path"
type: feat
status: active
date: 2026-07-31
source: docs/brainstorms/2026-07-31-release-to-evidence-golden-path-brainstorm.md
---

# Complete Release-to-Evidence Mission Golden Path

## Overview

Mission planning and atomic WorkOrder release are live, but execution still fragments across WorkOrder controls and Mission lifecycle gaps. This plan connects the existing authoritative engines into one browser-operable path without adding a second executor or collapsing approval, execution, validation, and acceptance states.

## Problem Statement

Today, a released Mission can remain `READY` after a WorkOrder is dispatched, assigned Tasks can remain in `INBOX`, complete handoffs can be recorded without proving the producing WorkOrder was accepted, validator receipts do not automatically update Mission assertions, and Mission acceptance does not require all released WorkOrders and handoffs to be complete. The underlying records exist, but the end-to-end operator contract is incomplete.

## Proposed Solution

### Phase 1 — Harden server-owned lifecycle transitions

- Extend Mission dispatch policy so Worker and Validator roles are allowed only in their valid Mission states.
- Atomically transition a Mission into execution on the first WorkOrder dispatch and audit the transition.
- Require completed runs, accepted WorkOrders, valid artifact ownership, correct roles, and complete assertion coverage before a handoff can unlock downstream work.
- Move a Mission to validation when all Worker WorkOrders and handoffs are complete.
- Link Validator verification receipts to Mission assertions and derive the Mission validation state from those durable receipts.
- Require passing assertions, accepted WorkOrders, and complete handoffs before Mission acceptance.

### Phase 2 — Close the canonical Task and Attempt browser path

- Make Task creation with assignees use the existing assignment transition so the Task becomes `READY` with an audit trail.
- Preserve explicit Task selection before WorkOrder dispatch.
- Surface Task Attempt number, retry lineage, failure reason, and current state from existing execution records.
- Preserve the existing bounded retry path; do not create an automatic infinite retry loop.

### Phase 3 — Add the Mission execution workspace

- Add an Execution tab to Mission Detail using live scoped Mission, WorkOrder, Task, Attempt, approval, handoff, and receipt data.
- Show one ordered delivery path with state, blocker, evidence coverage, and exactly one recommended next action per WorkOrder.
- Link approval decisions to the Decision Center and detailed execution to the existing WorkOrder workspace.
- Provide a structured handoff form only when the WorkOrder and completed run are eligible.
- Include loading, empty, blocked, error, success, refresh-safe, desktop, and narrow viewport states.

### Phase 4 — Verification and evidence

- Add focused pure lifecycle tests and UI model tests.
- Run existing Mission, WorkOrder governance, dispatch, Task Attempt, and feature-flag tests.
- Run Convex and full workspace typechecks plus the production UI build.
- Exercise approval, Task readiness, dispatch, completed Attempt, evidence receipt, WorkOrder acceptance, handoff, Validator unlock, independent pass, and Mission acceptance in the browser.
- Exercise a failed Attempt and bounded retry without overwriting history.
- Capture desktop and narrow screenshots, console/page errors, and durable Convex record evidence under `docs/testing/`.

## SpecFlow Decisions

- **Refresh/restart:** all progress derives from Convex records; local component state only holds unsaved form values.
- **Concurrency:** dispatch remains server-guarded; duplicate clicks use idempotency keys.
- **Failure:** failed runs remain immutable and retry creates a new Attempt with an explicit reason.
- **Cancellation:** no new cancellation semantics are introduced; existing WorkOrder cancel/supersede controls remain authoritative.
- **Authorization:** production rollout remains off until authenticated role enforcement is complete; verified local development uses the existing fallback actor.
- **Evidence freshness:** existing receipt expiration and stale-evidence logic remains authoritative.
- **Independent validation:** a passing Mission assertion must resolve to a completed Validator run and a linked passing receipt.
- **Acceptance:** Mission acceptance fails closed if any released WorkOrder, handoff, assertion, or evidence link is incomplete.
- **Responsive UX:** the execution sequence must remain readable and actionable at 390px without hiding blockers or decision rationale.

## Key Files

- `convex/lib/missionGovernance.ts`
- `convex/lib/missionExecution.ts` (new shared lifecycle helpers)
- `convex/missions.ts`
- `convex/workOrders.ts`
- `convex/tasks.ts`
- `apps/mission-control-ui/src/CreateTaskModal.tsx`
- `apps/mission-control-ui/src/eos/views/MissionDetailView.tsx`
- `apps/mission-control-ui/src/eos/views/MissionExecutionWorkspace.tsx` (new)
- `apps/mission-control-ui/src/eos/missionExecutionModel.ts` (new)

## Risks and Mitigations

- **Hidden lifecycle coupling:** keep state derivation in shared pure helpers and server mutations, not React.
- **Partial updates:** perform Mission transition and evidence propagation in the same Convex transaction as the triggering mutation.
- **Self-certification:** only Validator WorkOrder receipts can satisfy independent Mission assertions.
- **Unsafe execution:** approval, workflow, repository, budget, concurrency, dependency, and model-routing checks remain mandatory before dispatch.
- **Scope growth:** stop at Mission acceptance; PR, merge, deployment, and production rollout remain out of scope.

## Success Criteria

One operator can complete the approved Mission through independent validation and final acceptance using browser controls and real scoped Convex data. Every action survives refresh, every failure remains visible, no execution begins without explicit approval and dispatch, and no merge or deployment occurs.
