---
status: complete
priority: p1
issue_id: "002"
tags: [workspace, convex, isolation, v2]
dependencies: ["001"]
---

# Make Workspace Scope Mandatory

## Problem Statement

Selecting a workspace does not reliably scope Command Center, Audit, Cost, EOS views, or mutations. Live global records and demo fixtures can appear under the wrong workspace.

## Findings

- `projectId` is not propagated through `EosViewRenderer`.
- “All Projects” immediately falls back to a default project.
- Audit ignores its project prop.
- Cost/analytics APIs are aggregate and unscoped.
- Several views use demo fallback when live data is empty.

## Proposed Solutions

### Option 1: Continue optional prop drilling

**Pros:** Small local edits.

**Cons:** Easy to regress; cannot enforce scope.

**Risk:** High.

### Option 2: Canonical WorkspaceScope provider

**Pros:** Central lifecycle, explicit transitions, testable invariant.

**Cons:** Requires coordinated shell/query changes.

**Risk:** Medium.

## Recommended Action

Introduce a required `WorkspaceScope`, remove “All Projects” for V1, require project IDs on retained workspace routes, and add two-project isolation tests.

## Technical Details

- `apps/mission-control-ui/src/App.tsx`
- `apps/mission-control-ui/src/workspace/WorkspaceScopeProvider.tsx`
- `apps/mission-control-ui/src/eos/EosSection.tsx`
- `apps/mission-control-ui/src/AuditView.tsx`
- affected Convex queries and mutations

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [x] Workspace switch updates every retained workspace route.
- [x] No workspace route shows records from another project.
- [x] Empty data never silently substitutes demo data.
- [x] Cross-project mutations are rejected server-side.
- [x] Deep links hydrate scope before entity data.
- [x] Isolation and browser tests pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 1 into an implementation todo.

**Learnings:**
- Scope isolation is the critical dependency for every later feature.

### 2026-07-28 - Implemented and verified

**By:** Codex

**Actions:**
- Added a canonical workspace scope provider and removed “All Projects.”
- Prevented unscoped queries while workspace selection is loading.
- Persisted workspace identity in the URL and local preference.
- Reset stale drawers, filters, selections, and modals on workspace change.
- Scoped Command Center, Audit, Analytics, alerts, navigation counts, ATC, telemetry, memory, identity, and health projections.
- Added selected-workspace validation to Command Center task/approval actions and Agent Registry lifecycle actions.
- Made demo narrative and tour content explicitly opt-in.
- Verified workspace switching and scoped deep links in the browser.
- Ran UI and Convex TypeScript checks plus targeted tests.

**Learnings:**
- React Router must own the workspace search parameter; direct History API updates were lost on the next route change.
- Health projections also needed project filters for receipts, context packages, and eval runs.
