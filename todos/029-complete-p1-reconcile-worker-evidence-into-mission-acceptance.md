---
status: complete
priority: p1
issue_id: "029"
tags: [software-factory, missions, governance, evidence, golden-path]
dependencies: ["024"]
---

# Reconcile Worker Evidence Into Mission Acceptance

## Problem Statement

A non-independent Mission assertion can be completed by an accepted Worker
WorkOrder, a passing WorkOrder verification receipt, and a complete structured
handoff, while the Mission assertion remains `PENDING`. The Mission therefore
stays `IN_PROGRESS` even though every approved outcome and evidence requirement
is satisfied.

The live GitHub App proof reproduced this with Mission
`vn71r4fwfze37ke4scakt5xt8s8c7eg2` and assertion `recovery-proof-pr`.

## Recommended Action

Make Mission reconciliation consume accepted Worker receipts and complete
handoffs for assertions that do not require independent validation. Preserve the
existing Validator-only requirement for independent assertions. Reconciliation
must be idempotent, revision-aware, and must never infer PASS without a current
passing receipt from the same WorkOrder/run.

Also make plan release carry the approved implementation policy into each
WorkOrder so the worker does not require a repair revision before its first
Attempt.

## Acceptance Criteria

- [x] A current passing Worker receipt can satisfy only a linked assertion with `requiresIndependentValidation=false`.
- [x] Independent assertions still require a completed Validator run and linked receipt.
- [x] A complete handoff plus accepted WorkOrder transitions an eligible Mission to `AWAITING_ACCEPTANCE`.
- [x] Stale, failed, waived, superseded, or cross-run evidence cannot produce a PASS.
- [x] Approved implementation policy is copied from the Mission plan blueprint into released WorkOrder metadata.
- [x] The operator can start and finish the path through the Mission UI without direct control-plane mutations.
- [x] Deterministic tests cover success, stale revision, cross-run mismatch, retry, and independent-validator cases.

## Evidence

- Live WorkOrder `kx7sm5meb0d1n9frm3v28aw15s8c7z3d` is `DONE` with verification `PASS`.
- Live handoff `vd789pg8rz0hf6xtgvfevwhk858c6ka2` reports `recovery-proof-pr` complete.
- The linked Mission assertion remained `PENDING`, blocking Mission acceptance.

## Work Log

### 2026-08-10 - Complete

**By:** Codex

**Actions:**

- Added revision-, run-, role-, and acceptance-criterion-aware reconciliation
  from passing Worker receipts into non-independent Mission assertions.
- Kept independent assertions Validator-only and made receipt replay
  idempotently resynchronize the Mission projection.
- Released approved implementation commands, limits, stop conditions, and
  budgets from Mission-plan blueprints into WorkOrders.
- Added stable owner, team, repository, and code-scope authority to Mission
  drafting, plus assertion-ID remapping for already released WorkOrders.
- Completed the browser-only golden path for Mission
  `vn77nszewrd50zrkzpekpm29z98c7nvp`: approved plan, WorkOrder
  `kx7gkkys20hrrth7xjr32pkhjh8c6bqj`, Task
  `hn7pq95j5aznb7fgmt5zj4ndy58c6ncq`, Attempt `05xd3s0o`, passing receipt,
  complete handoff, accepted WorkOrder, 1/1 reconciled assertion, and accepted
  Mission.

**Verification:**

- Focused Convex suite: 72 tests passed across Mission, WorkOrder, GitHub App,
  and reconciliation contracts.
- Focused UI suite: 17 tests passed; UI and Convex typechecks passed.
- Browser proof used product controls only; no control-plane repair mutation was
  run.
