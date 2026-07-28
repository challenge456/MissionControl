---
status: complete
started_at: 2026-07-28
priority: p2
issue_id: "007"
tags: [ui, accessibility, responsive, quality]
dependencies: ["001", "003", "004", "005", "006"]
---

# Finish Visual, Responsive, and Accessibility Quality

## Problem Statement

The v2 shell has inconsistent density, state handling, responsive behavior, and action discoverability across production surfaces.

## Findings

- The sidebar is scroll-heavy.
- Agent cards do not scale to the target fleet size.
- Icon-only actions hide important behavior.
- Indefinite skeletons can mask backend failure.
- Legacy glow/gradient styling remains on some admin surfaces.

## Proposed Solutions

### Option 1: Polish each page independently

**Pros:** Local changes.

**Cons:** Repeats patterns and preserves inconsistency.

**Risk:** Medium.

### Option 2: Apply the documented v2 layout and state contracts

**Pros:** Consistent, testable, reusable.

**Cons:** Requires coordinated visual verification.

**Risk:** Low.

## Recommended Action

Apply the existing UI style guide, operational table patterns, bounded loading states, accessibility requirements, and screenshot regression tests to every retained production route.

## Technical Details

- `docs/software-factory/UI_STYLE_GUIDE.md`
- v2 shell page components
- shared PageHeader, KPI strip, DataTable, badge, and state components

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [x] Primary routes work at 1280×800 and 1920×1080.
- [x] Narrow layouts preserve triage actions.
- [x] Agent Registry remains usable at 100 agents.
- [x] Keyboard, focus, tooltip, and status semantics pass static/component checks.
- [x] Backend failures produce bounded degraded states.
- [x] UI style and screenshot regression checks pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 6 into an implementation todo.

**Learnings:**
- Consistent contracts are safer than page-by-page polish.

### 2026-07-28 - Implementation complete; visual pass pending

**By:** Codex

**Actions:**
- Standardized compact KPI/table patterns for the Agent Registry and routing control plane.
- Preserved actions on narrow tables with a sticky action column.
- Added explicit accessible names to shell icon controls and retained persisted sidebar/chat state.
- Passed the production build and all UI component tests.

**Learnings:**
- The remaining acceptance work is a final live viewport/screenshot pass; local navigation was blocked by the browser security policy in this session.

### 2026-07-28 - Headless visual pass complete

**By:** Codex

**Actions:**
- Verified the Agent Registry at 1280×800, including table actions and the edit dialog.
- Verified workspace switching updates both the `workspace` URL parameter and scoped agent data.
- Verified Model Routing at 1920×1080, including catalog health, policy controls, simulator, and decision history.
- Fixed and covered a route synchronization race that could replace a direct v2 deep link with persisted Command Center state.
- Confirmed no page errors and passed 28 UI test files / 111 tests plus UI typecheck.

**Learnings:**
- URL state must win during initial shell hydration; otherwise a correct workspace-scoped link can land on the wrong operator surface.
