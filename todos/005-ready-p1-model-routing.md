---
status: ready
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

- [ ] Simulator and dispatch choose the same route.
- [ ] Every routed run records the policy, rule, and explanation.
- [ ] Precedence is deterministic.
- [ ] Fallbacks enforce risk and capability requirements.
- [ ] Provider secrets never reach Convex or the browser.
- [ ] Canary flag and kill switch work.
- [ ] Unit, integration, and browser tests pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 4 into an implementation todo.

**Learnings:**
- Centralized policy is simpler and safer than distributed model selection.

