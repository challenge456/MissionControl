---
status: complete
priority: p1
issue_id: "018"
tags: [control-plane, command-center, frontend, attention, accessibility]
dependencies: ["017"]
---

# Build role-aware operating lenses and attention projection

## Problem Statement

Operators need one canonical Command Center that answers different jobs for developers, teams, workspace leads, and company owners without duplicating business state.

## Findings

- The v2 shell and canonical delivery drill-downs already exist.
- Lens availability and aggregates must be authorized on the server, deep-linkable, truthful about unknown/stale data, and driven by one deterministic attention projection.

## Proposed Solutions

### Option 1: Separate dashboards per persona

Build independent pages and data models. This is easy to customize but creates drift and competing state. Risk: high.

### Option 2: One route with four governed lenses

Use shared canonical records, server projections, URL scope, and lens-specific layouts. This matches the SDD and keeps drill-down consistent. Risk: low.

## Recommended Action

Evolve the existing Command Center route with My, Team, Workspace, and Company lenses, a compact scope bar, ranked attention, and proof-first drill-down.

## Technical Details

- Deterministic attention and delivery-confidence projections
- Authorized role-lens query contract
- Scope/repository/code-scope URL state
- Loading, empty, partial, stale, unauthorized, error, and success states

## Resources

- SDD sections 5–6, 9.3–9.4, Phase 4
- `docs/design.md`

## Acceptance Criteria

- [x] My, Team, Workspace, and Company lenses are deep-linkable and role-gated.
- [x] My Work distinguishes owned, contributed, and review assignments.
- [x] Team view exposes member capacity, epic ownership, attention, and proof.
- [x] Workspace and Company rollups drill into canonical Mission → WorkOrder → run → evidence records.
- [x] Company drill-down visibly enters the owning workspace before mutation.
- [x] Metrics expose formula, source, freshness, and Unknown/Needs setup states.
- [x] Attention ranking is deterministic, explainable, correlated, and action-oriented.
- [x] Every new UI mutation has an equivalent governed backend/agent capability.
- [x] Desktop, compact width, keyboard, and 200% zoom browser journeys pass.

## Work Log

### 2026-08-01 - Execution queued

**By:** Codex

**Actions:**
- Selected the single-route lens design already approved in the SDD.

**Learnings:**
- Exceptions and evidence remain the default; raw agent activity is supporting detail.

### 2026-08-01 - Completed

**By:** Codex

**Actions:**
- Delivered the four governed lenses with canonical proof drill-down and recoverable URL scope errors.
- Expanded Team into a five-person capacity and proof matrix plus all twenty-five owned epics.
- Verified cross-workspace Company drill-down visibly enters Workspace scope before mutation controls appear.

**Learnings:**
- Direct route navigation is required when workspace context and lens scope change together; otherwise stale client state can win the transition race.
