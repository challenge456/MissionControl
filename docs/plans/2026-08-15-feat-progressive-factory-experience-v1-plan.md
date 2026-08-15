---
title: "feat: Progressive Software Factory Experience V1"
type: feat
status: completed
date: 2026-08-15
baseline_commit: 376505033ac1de56415a33305ba7e20696230d9f
runtime_contract_baseline: 22
related_audit: docs/architecture/2026-08-15-progressive-factory-experience-audit.md
related_brainstorm: docs/brainstorms/2026-08-15-progressive-factory-experience-v1-brainstorm.md
---

# Progressive Software Factory Experience V1

## Overview

Make Mission Control's governed factory understandable to operators who should
not need to configure every runtime primitive. This plan implements one P0
vertical slice over existing Mission, Plan, WorkOrder, Attempt, trace, eval,
Factory Version, and verification records.

## Architecture boundary

The implementation may add presentation models and Mission metadata only. It
must not create a new executor, trace store, WorkOrder type, evidence envelope,
acceptance mutation, or persistence lifecycle. `workOrders.accept` remains the
sole WorkOrder acceptance authority.

## Implementation phases

### 1. Recipe and experience projection

- [x] Add typed Basic/Intermediate/Advanced experience state with resilient
      browser-local persistence and accessible controls.
- [x] Add a typed recipe catalog with role, gate, verification, routing intent,
      duration posture, and cost posture.
- [x] Add deterministic recommendation rules with escalation for security,
      runtime, schema, policy, and acceptance-sensitive work.
- [x] Add tests for recommendation, override provenance, experience persistence,
      and non-mutating mode changes.

### 2. Canonical Mission and Plan integration

- [x] Reuse one Mission creation dialog from Missions and Factory Board.
- [x] Persist selected recipe, recommendation rationale, override,
      routing intent, and composition intent inside existing Mission metadata.
- [x] Resolve the selected recipe to an active existing workflow when a new
      Mission Plan is initialized.
- [x] Keep Plan submission, human approval, WorkOrder release, dispatch,
      verification, acceptance, and merge unchanged.

### 3. Progressive Factory Board

- [x] Replace the scheduled-jobs-only Factory Board with a guided request,
      recipe, and recent-run workspace.
- [x] Basic: request, repository, recommendation, status, progress, PR,
      verification, and approvals only.
- [x] Intermediate: add roles, routing intent, executor posture, deterministic
      gates, test/review/context strategy, retry bound, and estimate posture.
- [x] Advanced: expose full recipe details and links to Factory configuration,
      model routing, Observability, policies, evidence, and raw trace data.
- [x] Show UI mode, governed execution complexity, and autonomy independently.

### 4. Swimlane and phase inspector

- [x] Build compact run cards from `observability.getWorkspaceDashboard`.
- [x] Derive Human/Agent/Code presentation lanes from canonical observations.
- [x] Add compact and expanded swimlane views with duration, status, retry,
      model/tool owner, tokens, cost, artifacts, and gates where recorded.
- [x] Add a phase inspector organized into Input, Prompt, Agent configuration,
      Execution, Output, and Gates without inventing missing facts.
- [x] Preserve the existing full Observability tree/timeline as the Advanced
      diagnostic surface.

### 5. Documentation and verification

- [x] Add focused unit/component tests and update operator Docs.
- [x] Run typecheck, focused tests, build, and runtime-contract guard.
- [x] Validate at 1440, 1024, and approximately 390 pixels in dark and light
      themes with keyboard navigation, console/page errors, and overflow checks.
- [x] Capture browser evidence and document remaining P1/P2 work.
- [x] Create one commit, push the feature branch, and open a draft PR only.

## Acceptance criteria

- Basic hides raw Factory, quality-contract, context, identity, and trace data.
- Intermediate reveals workflow composition without granting bypass authority.
- Advanced preserves access to the full existing power-user surfaces.
- Switching level writes only presentation preference; it does not invoke a
  Convex mutation or alter a Mission, WorkOrder, Attempt, subject, contract,
  plan, evidence, eligibility, or policy.
- A recommendation is deterministic, shows rationale, allows override, and
  preserves both recommendation and selection on the Mission.
- A new Plan uses the recipe's compatible active workflow and still requires
  normal save, submit, approval, and WorkOrder release.
- Run cards and inspector use canonical Observability records and show missing
  telemetry as unavailable.
- All direct routes remain protected by their existing server-side permission
  checks even when Basic hides their navigation affordances.
- No schema or runtime-contract bump occurs unless the guard proves a public
  contract changed.

## Risks and mitigations

| Risk                                                | Mitigation                                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Recipe appears to grant policy                      | Label it as workflow composition; show governance may add gates; retain all server checks                         |
| Derived lanes misstate authority                    | Keep raw observation type in Advanced and label lane classification as a view                                     |
| Missing telemetry looks like zero                   | Use `Not recorded` / `Unavailable`, never zero-filled cost or tokens                                              |
| Recipe does not exactly match an installed workflow | Resolve by explicit candidate IDs, disclose the compiler target, and fall back visibly to operator selection      |
| Factory Board duplicates Observability              | Keep cards and lane overview concise; link to the existing full trace/eval workspace                              |
| Metadata becomes an authorization input             | Treat it as untrusted composition intent only; server-side Plan, Factory, and acceptance rules stay authoritative |

## Post-deploy monitoring and validation

- Search browser error capture for `Factory experience`, `Trace data could not
be loaded`, and failed Convex queries.
- Watch Factory Board load success, Mission creation failures, and recipe
  compiler fallbacks to an unmatched workflow.
- Healthy: mode selection persists, no mutations occur during mode switch,
  run cards reconcile to Observability counts, and Mission creation retains
  recommendation provenance.
- Rollback trigger: Factory Board cannot load current workspace traces, Mission
  creation loses required governance fields, or mode switching changes a
  persisted delivery record.
- Validation window: first 24 hours after deploy. Owner: SellerFi technical
  operator.

## References

- [Reference factory](https://github.com/disler/super-simple-software-factory)
- `docs/product/mission-control-north-star.md`
- `docs/product/mission-control-v1-product-strategy.md`
- `docs/design.md`
- `apps/mission-control-ui/src/FactoryView.tsx`
- `apps/mission-control-ui/src/eos/views/TraceInspectorView.tsx`
- `apps/mission-control-ui/src/eos/views/MissionPortfolioView.tsx`
- `apps/mission-control-ui/src/eos/views/MissionPlanWorkspace.tsx`
- `convex/observability.ts`
- `convex/factory/configuration.ts`
