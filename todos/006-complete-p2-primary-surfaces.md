---
status: complete
completed_at: 2026-07-28
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

- [x] Retained routes answer attention, evidence, and action questions.
- [x] Global/workspace/demo data is explicitly separated.
- [x] Context workspace tabs follow the selected repository.
- [x] Preview routes remain hidden until launch-ready.
- [x] Retained routes provide loading, empty, error, and action states.
- [x] Route and isolation tests pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 5 into an implementation todo.

**Learnings:**
- Consolidation is necessary to reach the 17-destination target.

### 2026-07-28 - Implemented

**By:** Codex

**Actions:**
- Reduced the default operator navigation to 13 declared live routes.
- Added persistent Global/Preview/Demo scope badges and fail-closed direct-route handling.
- Scoped context evals and repository installations while leaving the catalog and docs explicitly global.
- Kept Intelligence, developer tools, and demo surfaces out of the default V1 menu.

**Learnings:**
- Hiding an incomplete route is safer than wiring a page that cannot answer an operator question.
