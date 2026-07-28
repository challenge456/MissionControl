---
status: ready
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

- [ ] Primary routes work at 1280×800 and 1920×1080.
- [ ] Narrow layouts preserve triage actions.
- [ ] Agent Registry remains usable at 100 agents.
- [ ] Keyboard, focus, tooltip, and status semantics pass.
- [ ] Backend failures produce bounded degraded states.
- [ ] UI style and screenshot regression checks pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 6 into an implementation todo.

**Learnings:**
- Consistent contracts are safer than page-by-page polish.

