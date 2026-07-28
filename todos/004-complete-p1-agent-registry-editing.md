---
status: complete
completed_at: 2026-07-28
priority: p1
issue_id: "004"
tags: [agents, ui, operations, audit]
dependencies: ["003"]
---

# Complete Agent Registry and Editing

## Problem Statement

The operational Agent Registry is difficult to discover, does not scale visually, and lacks a complete agent detail/edit flow.

## Findings

- The sidebar currently points elsewhere.
- The settings gear is icon-only and the panel is mostly read-only.
- `agents.update`, `OrgView.tsx`, and `CreateAgentModal.tsx` contain reusable editing primitives.
- Delete ends in a not-implemented toast.

## Proposed Solutions

### Option 1: Add fields to the current settings panel

**Pros:** Small UI change.

**Cons:** Keeps fragmented information and card-grid scalability issues.

**Risk:** Medium.

### Option 2: Registry table plus URL-backed detail

**Pros:** Scales to 20+ agents; clear editing and audit model.

**Cons:** Larger focused UI change.

**Risk:** Medium.

## Recommended Action

Build a scoped table/list registry and URL-backed detail/edit experience, reusing existing form fields and replacing deletion with archive/deactivate.

## Technical Details

- `apps/mission-control-ui/src/AgentRegistryView.tsx`
- `apps/mission-control-ui/src/AgentSettingsPanel.tsx`
- `apps/mission-control-ui/src/CreateAgentModal.tsx`
- `apps/mission-control-ui/src/OrgView.tsx`
- `convex/agents.ts`
- `convex/schema.ts`

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [x] Registry is project-scoped and usable with 100 agents.
- [x] View/Edit actions are explicit.
- [x] Supported configuration can be saved and audited.
- [x] Effective workspace, capabilities, budget, and routing are visible.
- [x] Stale edits and workspace switches are handled safely.
- [x] No action ends in a not-implemented toast.
- [x] Unit tests, typechecks, and production build pass.
- [ ] Final browser regression pass (local navigation was blocked by the browser security policy).

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 3 into an implementation todo.

**Learnings:**
- The main gap is integration and discoverability, not missing backend primitives.

### 2026-07-28 - Implemented

**By:** Codex

**Actions:**
- Replaced the card grid with an exception-first operational table.
- Added explicit View/Edit, validated configuration editing, scoped optimistic concurrency, and audit events.
- Added inherited/overridden routing visibility and removed the hard-delete dead end in favor of deactivation.

**Learnings:**
- Agent lifecycle and configuration need separate controls; keeping them distinct made the detail view clearer and safer.
