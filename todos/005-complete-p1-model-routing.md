---
status: complete
completed_at: 2026-07-28
priority: p1
issue_id: "005"
tags: [models, routing, workflow, audit]
dependencies: ["002", "004"]
---

# Integrate Auditable Model Routing

## Problem Statement

Model routing exists as an isolated package but is not authoritative at dispatch and has no persistent workspace policy, operator controls, simulator, or decision log.

## Findings

- Workflow tiers and project default models exist.
- `packages/model-router` has prototype rules and fallbacks.
- Runtime code does not import the router as a dispatch dependency.
- Hard-coded model/provider data is not a durable policy source.

## Proposed Solutions

### Option 1: Add per-agent model dropdowns

**Pros:** Fast visible control.

**Cons:** Inconsistent; difficult to audit; ignores risk and fallback.

**Risk:** High.

### Option 2: Workspace policy with narrow overrides

**Pros:** Deterministic, explainable, safe, centrally managed.

**Cons:** Requires schema, dispatch, and UI work.

**Risk:** Medium.

## Recommended Action

Implement versioned workspace routing policies, a model catalog, narrow agent overrides, one dispatch resolver, a simulator, and immutable decision evidence.

## Technical Details

- `packages/model-router/`
- `convex/schema.ts`
- `convex/modelCatalog.ts`
- `convex/modelRoutingPolicies.ts`
- `convex/modelRoutingDecisions.ts`
- workflow/execution dispatch boundary
- `apps/mission-control-ui/src/ModelRoutingView.tsx`

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [x] Simulator and dispatch choose the same route.
- [x] Every Work Order dispatch records the policy, rule, and explanation.
- [x] Precedence is deterministic.
- [x] Fallbacks enforce risk and capability requirements.
- [x] Provider secrets never reach Convex or the browser.
- [x] Canary flag and kill switch work.
- [x] Unit, integration, typecheck, and build tests pass.
- [ ] Final browser regression pass (local navigation was blocked by the browser security policy).

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 4 into an implementation todo.

**Learnings:**
- Centralized policy is simpler and safer than distributed model selection.

### 2026-07-28 - Implemented

**By:** Codex

**Actions:**
- Added a persistent model catalog, versioned workspace policies, agent overrides, and immutable routing decisions.
- Added one shared resolver for simulator and Work Order dispatch with risk/capability/budget-safe fallback.
- Added shadow mode, deterministic canary enforcement, kill switch, exhausted-route incidents, and run-inspector evidence.
- Added the Settings → Model Routing page.

**Learnings:**
- Shadow-by-default lets operators validate route quality without silently changing execution behavior.
