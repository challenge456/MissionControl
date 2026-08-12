---
status: complete
priority: p1
issue_id: "022"
tags: [harness, authorization, lineage, reconciliation, loop-engineering, convex, ui]
dependencies: ["014"]
---

# Complete Loop Engineering for Live Promotion

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

Complete the remaining production boundary after Phase 0 of
`docs/plans/2026-08-01-feat-productionize-software-factory-harness-plan.md`:
trusted service ingress, durable authorization-denial evidence, removal of
residual browser-authored identity, and an audited reconciliation inbox for
valid but uncorrelated PR/CI evidence. Promote the route to Live only after the
automated and browser-operable acceptance gates pass.

## Technical Details

**Primary areas:**

- `convex/lib/companyAccess.ts`
- `convex/loopEngineering.ts`
- `convex/factory/metaLoop.ts`
- `convex/factory/prChecks.ts`
- Harness Loop Engineering components and route capability metadata
- Focused authorization, vocabulary, and lineage tests

**Database changes:** Add a low-volume, append-only reconciliation decision
record. Reuse the existing audit/activity model where it can safely retain
denied authorization decisions.

## Acceptance Criteria

- [x] Inner, outer, and meta copy consistently map to autonomy, automation, and quality.
- [x] Browser-supplied actor labels cannot determine decision authority or audit identity.
- [x] Loop and meta-loop public reads and writes enforce workspace access.
- [x] Sensitive mutations enforce named permissions and fail closed across workspaces.
- [x] Service ingress cannot be invoked without a trusted server credential or internal Convex boundary.
- [x] Denied sensitive actions retain safe, workspace-scoped audit evidence.
- [x] PR ingestion never attaches a PR to a WorkOrder by repository recency.
- [x] Unmatched PRs remain visibly uncorrelated.
- [x] Outer-loop evidence is scoped by explicit PR, WorkOrder, or cycle; workspace-latest mode is visibly unscoped.
- [x] Valid but uncorrelated PR/CI evidence appears in an exception-first reconciliation inbox.
- [x] Reconciliation candidates explain exact match and mismatch signals without leaking another workspace.
- [x] An authorized operator can create an idempotent, immutable reconciliation decision that links exact evidence lineage.
- [x] Loading, empty, error, denied, success, and refresh/restart behavior are verified.
- [x] Full tests, typechecks, production build, accessibility checks, and browser journeys pass without critical errors.
- [x] Loop Engineering is promoted from Preview to Live only after all gates above pass.
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

### 2026-08-02 - Live-promotion phase started

**By:** Codex

**Actions:**

- Isolated the remaining work on `codex/loop-engineering-live` from the clean,
  already-hardened local `main` worktree.
- Bounded completion to the production trust boundary and reconciliation
  workflow required to make the existing Loop Engineering feature honest and
  operable as Live.
- Preserved intervention telemetry, readiness scoring, experiments, and other
  expansion work as separate roadmap phases so this release remains
  independently testable and shippable.

### 2026-08-02 - Live-promotion phase completed

**By:** Codex

**Actions:**

- Added a trusted action authorization boundary that derives operator identity
  on the server and records denied factory actions in a separate, durable audit
  transaction.
- Kept GitHub ingestion behind the verified webhook route and moved workflow
  executor service authority to the existing server-only Convex JWT.
- Removed the remaining browser-authored actor labels from the Harness surfaces
  touched by this release.
- Added the workspace-scoped evidence reconciliation inbox, deterministic
  repository/branch/WorkOrder/Attempt signals, exact Attempt selection,
  confirmation, idempotency, immutable history, and same-head decision
  preservation.
- Promoted Loop Engineering from Preview to Live after the acceptance gates passed.

**Verification:**

- All repository tests pass, including 197 UI tests, 389 Convex tests, and 76
  workflow-engine tests.
- Repository typechecks and production builds pass.
- The final Chromium journey passes exact selection, confirmation, persistence,
  navigation, isolation, responsive overflow, and accessibility checks with
  zero Axe violations or application errors.
- Evidence is recorded in
  `docs/testing/evidence/loop-engineering-live-2026-08-02/README.md`.
