---
title: "AI Software Factory V1 Product Decisions"
date: 2026-08-02
status: active
owner: Product Owner
baseline_commit: 04b5e64
related_plan: docs/plans/2026-08-02-feat-ai-software-factory-v1-program-plan.md
---

# AI Software Factory V1 Product Decisions

This is the authoritative decision log for choices that constrain the V1
program. A recommended default is not an approved decision. Runtime work may
depend only on rows marked **Approved**.

## Decisions

| ID | Decision | Status | Selected or recommended position | Implementation consequence |
| --- | --- | --- | --- | --- |
| ASF-001 | V1 Git provider | **Approved** | GitHub only | Do not add GitLab or a generic connector framework before the GitHub golden path ships |
| ASF-002 | Initial executor | **Approved** | Codex-based production executor; simulated adapter only for deterministic tests | Freeze one versioned adapter contract after GitHub readiness and Factory configuration; do not promote either current worker script directly |
| ASF-003 | Merge authority | **Approved** | Human merge only | V1 ends at a review-ready PR; no GREEN auto-merge |
| ASF-004 | RED execution | **Approved** | Sandboxed implementation after explicit approval | Require restricted tools, independent validation, and rollback evidence |
| ASF-005 | Evidence retention | **Approved** | Tiered: audit/decisions 1 year, execution evidence 90 days, sensitive temporary data 30 days | Apply export, redaction, audited deletion, and legal-hold override before customer data |
| ASF-006 | Uncorrelated evidence owner | **Approved** | Existing Approver/Reviewer role | Avoid a new Evidence Steward role in V1 |
| ASF-007 | Production outcome source | **Approved** | GitHub Issues with governed labels and exact repository/commit linkage | Count only linked `production-defect`, `incident`, or `rollback` issues; Mission Control projections are not the source of truth |
| ASF-008 | Second connector | **Approved — deferred** | Choose from customer demand after GitHub | Do not commit to Jira and Linear simultaneously |

All eight decisions were explicitly approved by the Product Owner on
2026-08-02 by accepting the recommended defaults and directing implementation
to proceed.

## ASF-002 — Initial executor

**Status:** Approved
**Decider:** Product Owner
**Decision date:** 2026-08-02

Mission Control will support exactly one production executor in V1: a
Codex-based executor. A simulated adapter remains available only for
deterministic contract and recovery tests.

The production executor must:

- execute only an approved, versioned WorkOrder/Task/Attempt envelope;
- operate in an isolated repository worktree rather than the main checkout;
- expose explicit capabilities, configuration validation, estimate, execute,
  event, cancellation, health, and optional-resume behavior;
- receive fixed tool, network, secret, budget, repository, and policy scopes;
- emit structured events and artifacts through authenticated service commands;
- never approve, validate, merge, release, or expand its own authority;
- be independently validated for material changes.

The decision does **not** approve either existing script as the production
adapter. `scripts/codex-factory-worker.ts` is a read-only evidence worker and
`scripts/codex-implementation-worker.ts` is a one-shot implementation
prototype. Both inform the later adapter, but PR 5 must place the stable
contract behind the orchestration boundary after GitHub readiness and the
versioned Factory configuration are complete.

## Approved V1 operating boundary

- GitHub is the only V1 Git provider.
- Merge remains a separate human/GitHub decision; Mission Control prepares a
  review-ready PR and evidence package.
- RED work may execute only in an approved sandbox with restricted authority,
  independent validation, and rollback evidence.
- The existing Approver/Reviewer role owns valid but uncorrelated evidence in
  V1; no new Evidence Steward role is added.
- A second connector is deliberately deferred until customer demand is known.
- Audit/decision evidence is retained for one year, execution evidence for 90
  days, and sensitive temporary data for 30 days, subject to export, redaction,
  audited deletion, and legal hold.
- GitHub Issues are the V1 production outcome source. Only governed issue labels
  with exact repository and commit/deployment linkage may feed later outcome
  analytics.

## Existing decisions incorporated by reference

- [ADR-001: Orchestration Architecture](./001-orchestration-architecture.md):
  Hono is the long-running orchestration process; Convex remains authoritative.
- [Task and Work Order Hierarchy](./task-workorder-hierarchy-decisions.md):
  Mission/WorkOrder owns governed delivery while Task owns operational work.

## Change control

- Changing ASF-002 requires a Product Owner decision and a new decision-log
  entry; it must not silently turn into multi-executor support.
- Proposed rows become Approved only through an explicit Product Owner response.
- Deferred rows cannot block the PR golden path unless their dependency becomes
  active.
