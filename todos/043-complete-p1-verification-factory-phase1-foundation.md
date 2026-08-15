---
status: complete
priority: p1
issue_id: "043"
tags: [verification-factory, convex, workflow-engine, governance]
dependencies: []
---

# Verification Factory Phase 1 foundation

## Problem Statement

Mission Control currently stores verification results, but policy-v1 can still
trust producer-authored independence and select receipts without the exact
immutable candidate lineage required by the merged Verification Factory plan.
Phase 1 must establish the additive, fail-closed policy-v2 domain before a
separate verifier worker or broader UI is introduced.

## Findings

- `workflowRuns` is the existing Attempt aggregate and must remain authoritative.
- `verificationRuns`, `evidenceEnvelopes`, and `verificationReceipts` are the
  existing verification/evidence aggregates and should be extended in place.
- `workOrders.accept` currently selects the latest arbitrary execution run and
  delegates to legacy criterion/receipt evaluation.
- `evidenceEnvelopes.producer.independent` is caller supplied and cannot satisfy
  policy-v2.
- Runtime contract v18 is the merged-main baseline.
- Convex schema, indexes, producers/consumers, generated types, runtime contract,
  and compatibility tests must land atomically.

## Proposed Solutions

### Option 1: Additive policy-v2 foundation in existing aggregates

**Approach:** Add immutable subject/plan/provenance fields, pure deterministic
domain helpers, exact-current eligibility, and a policy-v2 acceptance guard
while preserving policy-v1 behavior.

**Pros:** Matches the merged plan, fails closed, preserves history, and avoids a
parallel QA model.

**Cons:** Adds optional compatibility fields before the Phase 3 worker writes
all of them.

**Effort:** Multi-file Phase 1 implementation.

**Risk:** Medium.

### Option 2: Delay governance integration until the verifier worker exists

**Approach:** Add types only and keep acceptance unchanged.

**Pros:** Smaller immediate diff.

**Cons:** Leaves policy-v2 without an enforced trust boundary and violates the
Phase 1 handoff.

**Effort:** Small.

**Risk:** High.

## Recommended Action

Implement Option 1. New policy-v2 records must prove exact lineage and
server-derived independence; historical policy-v1 records remain readable but
cannot be promoted into policy-v2 guarantees.

## Technical Details

Primary areas:

- `convex/schema.ts` and WorkOrder validators
- `packages/workflow-engine/src/verification*.ts`
- `convex/lib/workOrderGovernance.ts` and `convex/workOrders.ts`
- runtime compatibility contract and focused tests

No destructive backfill is required. Phase 2+ Factory routing, the separate
verification worker, richer UI, and golden paths remain outside this todo.

## Resources

- `docs/plans/2026-08-14-feat-verification-intelligent-automation-factory-plan.md`
- PR #91 / merge commit `405c8df32ae2cfc5a2737878aefd8a3f67e42c92`
- `docs/solutions/build-errors/missing-convex-schema-contracts-ci-20260730.md`

## Acceptance Criteria

- [x] Add backward-compatible Factory purpose, WorkOrder kind, Attempt purpose,
      immutable subject, verification binding, and automation artifact schema.
- [x] Add contract-v2 required-risk, independence, and digest validation.
- [x] Add immutable, digest-bound Verification Plan validation and lifecycle.
- [x] Add full verification evidence/result lineage and server-derived
      independence semantics.
- [x] Add deterministic coverage/verdict handling with required and discovered
      risks separated.
- [x] Add one exact-current acceptance eligibility helper covering WorkOrder,
      revision, contract digest, source Attempt, and subject digest.
- [x] Make `workOrders.accept` use the exact-current helper for enforced v2 while
      leaving v1/no-contract behavior unchanged.
- [x] Preserve historical verdicts when current eligibility becomes stale.
- [x] Add correlated candidate, verification, evidence, eligibility, acceptance,
      and rejection events with provider-neutral trace context.
- [x] Increment and verify the runtime contract atomically.
- [x] Add focused tests for software/automation identity, plan immutability,
      independence spoofing, exact currentness, migration, failure states, and
      compatibility.
- [x] Run all repository-standard checks required by the handoff and record the
      exact results.
- [x] Commit, push, and open a draft PR with plan-section mapping and operational
      validation notes.

## Work Log

### 2026-08-15 - Phase A and implementation audit

**By:** Codex

**Actions:**

- Confirmed every PR #91 check green and merged it with the repository-standard
  merge-commit method.
- Verified the plan commit and file on `origin/main`, then removed only the
  clean plan branch/worktree.
- Created `codex/verification-factory-v1-phase1` from merge commit `405c8df`.
- Read the merged plan and relevant authority, isolation, and institutional
  guidance.
- Audited current Factory, WorkOrder, Attempt, verification, evidence,
  acceptance, event, automation-artifact, and runtime-contract code.

**Learnings:**

- Policy-v2 must not reuse inline `factoryContinuation` or producer-authored
  independence.
- The acceptance guard must distinguish immutable historical verdict from exact
  current eligibility and fail closed when any lineage edge is absent.

### 2026-08-15 - Phase 1 implementation and verification

**By:** Codex

**Actions:**

- Added policy-v2 Factory/WorkOrder/Attempt classification, immutable Git and
  automation Verification Subjects, frozen Verification Plans, exact lineage,
  server-derived independence, deterministic coverage/verdicts, and currentness.
- Extended the existing verification/evidence/receipt/event/artifact aggregates
  additively; legacy rows remain readable but cannot prove policy-v2 guarantees.
- Routed enforced policy-v2 acceptance through one exact-current helper while
  preserving the existing authorization, approvals, and sole acceptance API.
- Added Automation Design/Output Snapshot artifact payloads and provider-neutral
  event trace context without adding a new automation runtime or UI surface.
- Bumped the public runtime contract from v18 to v19; the guard accepted four
  additive argument changes (`factory/configuration:create`, `workOrders:create`,
  `workflowRuns:createArtifact`, and `workflowRuns:recordEvent`).

**Validation:**

- Focused Verification Factory domain: 5 files, 30 tests passed.
- Expanded Convex compatibility: 12 files, 95 tests passed.
- Focused orchestration compatibility: 5 files, 14 tests passed.
- Focused browser-governed Factory/UI models: 3 files, 16 tests passed.
- `pnpm test`: all runnable workspace suites passed; workflow-engine 130,
  orchestration 56 passed/1 intentional integration skip, UI 241, Convex 545.
- `pnpm lint`: passed, including workspace TypeScript and 10/10 skill lint.
- `pnpm run ci:runtime-contract`: passed, v18 -> v19.
- `pnpm build`: passed; retained the existing Vite large-chunk warning.
- `pnpm run smoke:orchestration-start`: passed.
- `pnpm run test:e2e:critical`: 9 failed on unchanged UI/E2E files because the
  v2 shell exposes nested `main` landmarks during its unresolved lazy-loading
  state; no verification-foundation assertion was reached. A clean single-worker
  rerun reproduced the same baseline shell failure.

**Scope retained:**

- No UI files, remote provider integration, VM abstraction, paid capacity,
  separate verifier worker, automatic acceptance, commit merge, or unrelated
  browser-shell changes were added.

## Notes

- Do not edit the merged plan while executing this todo.
- Do not auto-merge the implementation PR.
