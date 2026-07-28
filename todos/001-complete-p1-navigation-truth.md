---
status: complete
priority: p1
issue_id: "001"
tags: [ui, navigation, v2, trust]
dependencies: []
---

# Establish Navigation Truth

## Problem Statement

The v2 sidebar presents live, preview, demo, global, and hidden routes as equivalent. Operations → Agents opens the preview capability catalog rather than the operational Agent Registry.

## Findings

- `eosNavConfig.ts` routes Agents to `agent-catalog`.
- `navFilter.ts` hides only two known stubs.
- Demo and preview surfaces remain visible without consistent maturity labels.
- URL, breadcrumb, title, and active navigation can describe different destinations.

## Proposed Solutions

### Option 1: Wire every route

**Pros:** Preserves the current menu.

**Cons:** Large scope; promotes incomplete features; delays workspace isolation.

**Risk:** High.

### Option 2: Capability metadata and progressive disclosure

**Pros:** Makes maturity explicit; enables a smaller trustworthy V1.

**Cons:** Some current links move to Labs or become hidden.

**Risk:** Low.

## Recommended Action

Create a route capability registry, route Agents to `/v2/agents`, and hide or label incomplete surfaces according to the approved plan.

## Technical Details

- `apps/mission-control-ui/src/shellV2/eosNavConfig.ts`
- `apps/mission-control-ui/src/shellV2/navFilter.ts`
- `apps/mission-control-ui/src/shellV2/AppShellV2.tsx`
- `apps/mission-control-ui/src/eos/EosSection.tsx`

## Resources

- `docs/plans/2026-07-28-feat-software-factory-ui-coherence-plan.md`

## Acceptance Criteria

- [x] Agent Registry is reachable in one click from Operations.
- [x] Every visible route declares scope and maturity.
- [x] Demo-only pages are absent from primary navigation.
- [x] URL, breadcrumb, title, and active navigation agree.
- [x] Navigation tests pass.

## Work Log

### 2026-07-28 - Approved

**By:** Codex

**Actions:**
- Converted approved Phase 0 into an implementation todo.

**Learnings:**
- Hiding incomplete routes is the lowest-risk path to a trustworthy V1.

### 2026-07-28 - Implemented and verified

**By:** Codex

**Actions:**
- Added the EOS route scope/maturity registry and fail-closed filtering.
- Routed Operations to `/v2/agents`.
- Added Global, Preview, and Demo navigation badges.
- Added explicit preview/demo feature flags and guarded hidden direct routes.
- Limited the EOS demo tour to explicit demo-route mode.
- Ran 19 targeted tests and the Mission Control UI TypeScript check.

**Learnings:**
- Capability filtering can preserve future direct routes without presenting them as production-ready.
