---
status: complete
priority: p1
issue_id: "017"
tags: [control-plane, teams, ownership, authorization]
dependencies: ["016"]
---

# Add governed teams, memberships, and delivery ownership

## Problem Statement

Free-form squad and owner strings cannot safely support five teams, multi-team membership, role permissions, or five simultaneous epics per developer.

## Findings

- `operators` and `orgMembers` already provide human identity foundations.
- Missions and WorkOrders need additive stable member, team, repository, and code-scope relationships while retaining display snapshots.
- Permission fixtures must prove both allowed and denied cases for every role.

## Proposed Solutions

### Option 1: Continue string matching

Normalize `assignedSquad` and owner names at read time. Low implementation effort, but ambiguous identities and authorization remain unsafe. Risk: high.

### Option 2: Add stable relationships with compatibility snapshots

Create teams, memberships, and Mission assignments; add stable optional IDs to delivery records; only backfill deterministic matches. Risk: low.

## Recommended Action

Implement stable additive relationships and fail ambiguous mappings into a review report rather than guessing.

## Technical Details

- Team, membership, and Mission assignment tables/indexes
- Stable Mission/WorkOrder scope fields and dual-write helpers
- Role-aware server authorization and deterministic backfills

## Resources

- SDD sections 7.5–8 and Phase 2

## Acceptance Criteria

- [x] Teams belong to one company/workspace and expose governed CRUD.
- [x] Memberships link member/operator identity, role, validity, and capacity.
- [x] Active Missions require exactly one accountable human owner before dispatch.
- [x] Mission assignments distinguish owner, contributor, reviewer, and stakeholder.
- [x] Missions and WorkOrders retain stable team/member/repository/code-scope IDs plus legacy snapshots.
- [x] Ambiguous legacy ownership is reported, never guessed.
- [x] Owner, admin, workspace lead, team lead, member, and viewer permissions pass allowed and denied tests.

## Work Log

### 2026-08-01 - Execution queued

**By:** Codex

**Actions:**
- Defined Phase 2 as dependent on the authorized repository foundation.

**Learnings:**
- Stable identity must become authoritative before role dashboards can be truthful.

### 2026-08-01 - Completed

**By:** Codex

**Actions:**
- Added governed teams, memberships, assignment roles, capacity, and stable delivery ownership.
- Added a bounded, idempotent ownership migration that reports ambiguous and unresolved records instead of guessing.
- Verified the scale fixture is fully scoped: 250 delivery records required no corrective updates.

**Learnings:**
- Stable IDs provide the authorization boundary while retained snapshots preserve compatibility and audit readability.
