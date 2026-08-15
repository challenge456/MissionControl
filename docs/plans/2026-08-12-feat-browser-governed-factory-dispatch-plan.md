---
title: "feat: Complete browser-governed Factory dispatch"
type: feat
status: active
date: 2026-08-12
---

# Complete Browser-Governed Factory Dispatch

## Overview

Finish the browser path from a scoped WorkOrder contract to a governed Factory
Attempt. Reuse the existing Work Orders, Approvals, immutable Factory version,
and durable worker lifecycles. Do not add a parallel launch surface or weaken
server-side dispatch authority.

## Problem Statement

The Work Orders browser currently creates a repository label without stable
repository, scope, team, owner, or environment IDs. It splits verification
arguments on whitespace, so an exact argv such as `node -e` cannot survive
creation. Dispatch can discover an active Factory version, but it does not bind
the current local host and can select a code scope not frozen into that version.

As a result, the full governed path still needs CLI setup or direct record
repair and cannot be claimed as a browser-operable golden path.

## Local Research Findings

- `convex/lib/workOrderCreate.ts` already validates and persists stable
  repository, code-scope, team, owner, and environment IDs when callers provide
  them.
- `convex/factory/configuration.ts` already owns immutable Factory versions,
  readiness, activation, repository scope, and host readiness checks.
- `convex/workOrders.ts` is the single dispatch command, but local scope
  validation sees only `executorHostId` while the UI omits it; Factory binding
  resolution happens later.
- `apps/mission-control-ui/src/controlPlane/WorkOrdersView.tsx` uses a free-form
  repository/workflow and `split(/\s+/)` for verification argv.
- `apps/mission-control-ui/src/workspace/WorkspaceRepositoriesPanel.tsx` stores
  free-form `approvalPolicy` prose, which becomes an unsatisfiable required
  approval type at dispatch.
- The institutional schema lesson requires validators, persistence, consumers,
  generated types, and tests to land atomically.

## SpecFlow Analysis

### Happy path

1. Operator opens **Delivery → Work Orders** and selects **New WorkOrder**.
2. Browser loads authorized ready repositories, active organization structure,
   and the exact active Factory context for the selected repository.
3. Operator chooses an approved code scope and accountable owner, supplies an
   exact verification argv array, and creates the WorkOrder.
4. The WorkOrder remains awaiting its ordinary `HUMAN_REVIEW`; the operator
   requests it and an authorized approver decides it in the Approvals screen.
5. The WorkOrder dispatch gate shows the frozen repository, scope, Factory
   version, workflow, local environment, and current host.
6. Dispatch revalidates those identities and creates one immutable Attempt.
7. Independent verification completes and the durable worker pauses that same
   Attempt before GitHub publication for the Factory-owned review checkpoint.

### Required unhappy paths

- Missing project, ready repository, active Factory, current passing readiness,
  approved scope, active team member, or current clean host disables creation or
  dispatch with one actionable explanation.
- Invalid verification-argument JSON never creates a WorkOrder.
- A scope outside the active Factory version, a repository/team/owner mismatch,
  or a stale/dirty/replaced host is rejected server-side.
- Factory activation, assessment, or host changes between browser read and
  dispatch fail closed without creating a run.
- Duplicate create and dispatch submissions replay idempotently.
- Refresh preserves the WorkOrder, approval, dispatch, Attempt, and later pause
  lineage; browser state is never the authority.

## Implementation Phases

### Phase 1 — Make dispatch context authoritative

- [x] Expose the active Factory repository, workflow, approved scopes, current
      assessment, and deterministic eligible host as one authorized query.
- [x] Require a WorkOrder's selected code scopes to be included in the exact
      active Factory version before a Factory Attempt can be created.
- [x] Pass and revalidate the selected current host for local dispatch.

### Phase 2 — Persist the browser-created WorkOrder scope

- [x] Replace free-form repository and workflow fields with registry/Factory
      selections.
- [x] Persist repository ID, code-scope ID, owning-team ID, owner-member ID, and
      `LOCAL` execution environment during creation.
- [x] Parse verification argv as an exact JSON array of strings with focused
      validation and tests.

### Phase 3 — Control approval policy identifiers

- [x] Restrict new code-scope approval gates to supported identifiers such as
      `HUMAN_REVIEW` and `RISK_REVIEW`.
- [x] Store descriptive approval guidance separately from the gate identifier.
- [x] Preserve fail-closed compatibility for existing scope records.

### Phase 4 — Finish the operator dispatch gate

- [x] Show the exact repository, scope, Factory version, workflow, environment,
      and host before dispatch.
- [x] Provide explicit loading, configuration-missing, approval-pending,
      ready, dispatching, rejected, running, and paused states.
- [x] Keep request/decision authority in the existing WorkOrder and Approvals
      surfaces.

### Phase 5 — Validate and ship

- [x] Add focused UI-model, scope-policy, Factory-context, and dispatch tests.
- [x] Pass typecheck, lint, unit/contract suites, build, runtime-contract, and
      applicable smoke gates.
- [ ] Prove browser create → pre-dispatch approval → dispatch → independently
      verified human-review pause in an isolated local run.
- [x] Capture browser evidence and update README and canonical Factory docs.

## Acceptance Criteria

- [x] A browser-created WorkOrder persists stable repository, approved code
      scope, team, owner, local environment, and exact verification argv.
- [x] Dispatch visibly binds and server-revalidates one active Factory version,
      current passing assessment, exact workflow, approved scope, and clean
      current host.
- [x] Verification argv containing spaces remains one argument and is not shell
      parsed.
- [x] Code-scope descriptive prose cannot become an approval gate identifier.
- [ ] An authorized operator can complete create, pre-dispatch approval,
      dispatch, and verified publication pause without CLI creation or direct
      database mutation.
- [ ] Refresh and duplicate submissions preserve one WorkOrder and one Attempt
      lineage.
- [x] Remote sandbox enforcement, learning-ledger CRUD, trust scoring,
      verified-throughput metrics, and further deployment/production expansion
      remain outside the change.

## Risks and Mitigations

- **Stale browser configuration:** every dispatch binding is revalidated in the
  server mutation immediately before run creation.
- **Legacy scope policy prose:** retain the schema-compatible string field, but
  reject unsupported identifiers for new writes and keep old unknown gates
  fail-closed.
- **UI monolith growth:** place deterministic parsing and readiness decisions in
  tested model helpers; keep the view responsible for presentation and calls.
- **Accidental production mutation:** browser proof uses the isolated local
  Research Lab and stops at the human-review pause before provider writes.

## References

- `docs/brainstorms/2026-08-12-browser-governed-factory-dispatch.md`
- `docs/product/mission-control-north-star.md`
- `docs/software-factory/domain-contracts.md`
- `docs/software-factory/verification-first-workorder-contract.md`
- `docs/software-factory/durable-codex-github-pr.md`
- `docs/design.md`
- `docs/solutions/build-errors/missing-convex-schema-contracts-ci-20260730.md`
