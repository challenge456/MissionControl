---
status: complete
priority: p1
issue_id: "019"
tags: [control-plane, seed, repositories, teams, browser]
dependencies: ["017"]
---

# Complete administration UI and deterministic scale fixture

## Problem Statement

The control plane cannot be approved without truthful multi-repository/team administration and evidence that its projections remain usable at the target two-workspace, ten-team, fifty-member scale.

## Findings

- The settings page already has additive repository and code-scope controls.
- Team roster/ownership management, complete failure states, compact layouts, and the removable scale seed remain incomplete.

## Proposed Solutions

### Option 1: Extend the existing settings surface

Keep Workspace registry/detail, add repositories, code scopes, teams, health, and validation in context. This preserves navigation and compatibility. Risk: low.

### Option 2: Create a new administration domain

Split teams and repositories into new top-level pages. This expands navigation and duplicates workspace context. Risk: medium.

## Recommended Action

Evolve Settings → Workspaces & Repositories and add a deterministic, tagged, removable control-plane scale fixture.

## Technical Details

- Existing settings page and navigation
- Seed/reset functions for 2 workspaces, 10 teams, 50 members, 250 active assignments
- Repository/code-scope/team validation and responsive states

## Resources

- SDD sections 6.4, 11, 15

## Acceptance Criteria

- [x] Settings supports zero, one, and multiple repositories plus monorepo code scopes.
- [x] Settings supports teams, memberships, ownership, setup, degraded, error, and success states.
- [x] All user copy says workspace while internal `projectId` compatibility remains.
- [x] Deterministic tagged seed creates two workspaces, ten teams, fifty members, and 250 active assignments.
- [x] Fixture removal cannot touch non-fixture records.
- [x] Aggregate latency and usability are measured at fixture scale.
- [x] Existing single-repository and new monorepo journeys pass at desktop and compact widths.

## Work Log

### 2026-08-01 - Execution queued

**By:** Codex

**Actions:**
- Bound fixture and administration work to the approved Phase 3/4 contracts.

**Learnings:**
- Scale proof must use deterministic governed data rather than fabricated UI-only cards.

### 2026-08-01 - Completed

**By:** Codex

**Actions:**
- Completed repository, code-scope, team, membership, ownership, validation, and status handling in workspace administration.
- Seeded and re-seeded the tagged two-workspace fixture; the second run created no duplicate records.
- Measured Company at 0.92s and Workspace at 0.77s including Convex CLI startup, then verified desktop and compact layouts.

**Learnings:**
- A removable, governed fixture exposes aggregation and responsive-layout failures that small fabricated examples hide.
