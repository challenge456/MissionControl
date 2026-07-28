---
status: complete
priority: p1
issue_id: "003"
tags: [workspace, repository, github, execution]
dependencies: ["002"]
---

# Ship Workspaces and Repository Bindings

## Problem Statement

The workspace selector does not establish a visible, validated repository and executor-checkout context for Work Orders, Tasks, agents, and context scans.

## Findings

- Projects store a GitHub repository and branch but no validated binding health.
- A local checkout path is host-specific and cannot be treated as a universal project field.
- Current uncommitted `ProjectsView.tsx` work already adds create/connect foundations.

## Proposed Solutions

### Option 1: Store one local path on the project

**Pros:** Simple schema.

**Cons:** Incorrect across hosts; creates stale or misleading state.

**Risk:** High.

### Option 2: Repository binding plus host checkout bindings

**Pros:** Correct remote/local distinction; supports multiple executors.

**Cons:** Requires host health reporting.

**Risk:** Medium.

## Recommended Action

Promote the existing Projects UI into Workspaces & Repositories, validate GitHub bindings, and store local checkout health per execution host.

## Technical Details

- `apps/mission-control-ui/src/ProjectsView.tsx`
- `apps/mission-control-ui/src/App.tsx`
- `convex/schema.ts`
- `convex/projects.ts`
- `convex/workspaceHostBindings.ts`

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [x] Selector shows repository, branch, and health.
- [x] Manage workspaces is reachable from the selector.
- [x] Remote and local checkout health are distinct.
- [x] Missing/stale/mismatched checkouts have useful states.
- [x] Context and execution resolve the same repository identity.
- [x] Repository binding tests pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 2 into an implementation todo.

**Learnings:**
- Host-specific checkout binding protects portability and operator trust.

### 2026-07-28 - Implemented and verified

**By:** Codex

**Actions:**
- Promoted Projects to Workspaces & Repositories.
- Added repository configuration/validation state to workspaces.
- Added host-specific checkout binding schema, query, report mutation, and audit events.
- Enforced repository identity matching on executor reports.
- Added repository/branch/status context and a Manage action to the selector.
- Added executor checkout readiness, branch, commit, dirty state, time, and errors to workspace details.
- Added binding validation tests and ran UI/Convex type checks.
- Verified the selector and workspace management route in the browser.

**Learnings:**
- “Configured” is a more honest state than “Ready” until an execution host validates remote access and checkout health.
