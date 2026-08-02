---
status: in_progress
priority: p1
issue_id: "018"
tags: [harness, authorization, lineage, loop-engineering, convex, ui]
dependencies: ["014"]
---

# Harden Harness Authority and Exact Loop Lineage

## Problem Statement

Loop Engineering currently accepts client-authored actor labels and can display
the workspace's latest PR beside a cycle even when the records are unrelated.
That makes sensitive decisions weakly attributable and the primary operator
surface potentially misleading.

## Findings

- Loop and meta-loop mutations accept literals such as `operator`,
  `harness-ui`, and `harness-automate-ui` from the browser.
- Existing company/workspace authorization helpers are not applied consistently
  across the public Harness API surface.
- PR ingestion can fall back to the newest active WorkOrder in a repository
  when the branch does not match.
- The outer-loop panel defaults to the workspace's latest PR without clearly
  separating that unscoped view from selected-cycle evidence.
- Visible copy reverses the supplied talk's inner/autonomy and
  outer/automation definitions.

## Proposed Solutions

### Option 1: Redesign all factory telemetry and UI at once

**Pros:** Delivers the complete long-term model in one release.

**Cons:** Mixes authorization, schema, metrics, automation, and UI redesign in
one high-risk change.

**Effort:** Multi-phase.

**Risk:** High.

### Option 2: Ship the trust and lineage gate first

**Pros:** Removes unauthorized and misleading behavior before later metrics or
automation depend on it; keeps the change independently reviewable.

**Cons:** Readiness, real intervention telemetry, and automation convergence
remain follow-on work.

**Effort:** One bounded implementation phase.

**Risk:** Medium.

## Recommended Action

Implement Phase 0 of
`docs/plans/2026-08-01-feat-productionize-software-factory-harness-plan.md`:
canonical terminology, server-derived operator identity, workspace access
checks, exact PR correlation, and visibly truthful outer-loop scope. Capture
additional product ideas in a separate prioritized backlog.

## Technical Details

**Primary areas:**

- `convex/lib/companyAccess.ts`
- `convex/loopEngineering.ts`
- `convex/factory/metaLoop.ts`
- `convex/factory/prChecks.ts`
- Harness Loop Engineering components and route capability metadata
- Focused authorization, vocabulary, and lineage tests

**Database changes:** No new high-volume telemetry tables in this phase.

## Acceptance Criteria

- [x] Inner, outer, and meta copy consistently map to autonomy, automation, and quality.
- [ ] Browser-supplied actor labels cannot determine decision authority or audit identity.
- [ ] Loop and meta-loop public reads and writes enforce workspace access.
- [ ] Sensitive mutations enforce named permissions and fail closed across workspaces.
- [x] PR ingestion never attaches a PR to a WorkOrder by repository recency.
- [x] Unmatched PRs remain visibly uncorrelated.
- [x] Outer-loop evidence is scoped by explicit PR, WorkOrder, or cycle; workspace-latest mode is visibly unscoped.
- [x] Focused tests, typechecks, and browser journeys pass without critical errors.
- [x] Additional enhancements are documented and prioritized separately.

## Work Log

### 2026-08-02 - Phase 0 execution started

**By:** Codex

**Actions:**

- Confirmed Product Owner approval to proceed with the bounded first phase.
- Re-read the implementation plan, existing Loop Engineering todo, design
  standards, and current route behavior.
- Continued on the existing feature branch `codex/loopengineering` without
  creating a commit.

**Learnings:**

- The existing company-access layer and authoritative WorkOrder/PR records can
  support this phase without introducing a second identity or loop system.
- Security and lineage must be closed before adding readiness scores or new
  automation capabilities.

### 2026-08-02 - Authority and exact-lineage slice implemented

**By:** Codex

**Actions:**

- Added workspace-scoped factory permissions and server-derived operator
  identity for Loop Engineering, meta-loop decisions, human dispatch, merge
  recording, and the lightweight Harness scheduling surfaces touched by the
  Loop page.
- Removed repository-recency PR correlation. Explicit WorkOrder/run artifacts
  and unique exact repository/branch matches are the only accepted lineage;
  ambiguous and unmatched PRs remain uncorrelated.
- Scoped the outer panel to the selected cycle when one exists and labeled the
  workspace-latest fallback as unscoped when the current workspace has no
  cycles.
- Corrected canonical inner/autonomy, outer/automation, and meta/quality copy;
  retained compatibility aliases for the old reversed vocabulary.
- Added a separately prioritized enhancement backlog covering reconciliation,
  readiness, intervention telemetry, measurable experiments, drift,
  rollback, and multi-repository campaigns.
- Kept the route at `Preview` because service ingress identity, denied-action
  auditing, and remaining legacy Harness actor call sites still need a bounded
  follow-up before promotion to `Live`.

**Verification:**

- The full Convex suite passes: 53 files and 375 tests.
- The full UI suite passes: 45 files and 193 tests.
- Convex and UI TypeScript checks pass.
- The production UI build passes.
- Browser verification on the corrected Software Factory Demo workspace passes
  with no fresh page or application console errors. Evidence is in
  `docs/testing/evidence/loop-engineering-authority-lineage-2026-08-02/`.
