---
status: ready
priority: p2
issue_id: "006"
tags: [ui, scope, knowledge, governance]
dependencies: ["002", "003"]
---

# Rehabilitate Remaining Primary Surfaces

## Problem Statement

Audit, Cost, Context Registry, Governance, Gateway, and Intelligence surfaces do not consistently communicate or enforce workspace/global scope and product maturity.

## Findings

- Audit ignores project scope.
- Cost is aggregate.
- Context catalog and workspace installations are mixed.
- Several intelligence routes are unscoped or demo-backed.
- Global pages are not visibly labeled Global.

## Proposed Solutions

### Option 1: Keep every destination primary

**Pros:** No route consolidation.

**Cons:** Retains sidebar overload and weak product hierarchy.

**Risk:** High.

### Option 2: Rehabilitate retained routes and consolidate the rest

**Pros:** Smaller trustworthy surface; clearer jobs and scope.

**Cons:** Requires redirects/tab restructuring.

**Risk:** Medium.

## Recommended Action

Scope and finish retained routes, consolidate related tools into tabs, label global content, and keep previews hidden until they pass the launch checklist.

## Technical Details

- Audit and analytics views/Convex APIs
- Context Registry routes and project propagation
- Governance scope badges and mutations
- EOS capability metadata and redirects

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [ ] Retained routes answer attention, evidence, and action questions.
- [ ] Global/workspace/demo data is explicitly separated.
- [ ] Context workspace tabs follow the selected repository.
- [ ] Preview routes remain hidden until launch-ready.
- [ ] Loading, empty, error, and action states are complete.
- [ ] Route and isolation tests pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 5 into an implementation todo.

**Learnings:**
- Consolidation is necessary to reach the 17-destination target.

