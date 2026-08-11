---
status: complete
priority: p1
issue_id: "030"
tags: [software-factory, research-lab, continuous-learning, sources, governance]
dependencies: ["028"]
---

# Governed Research Source Registry and Policy Envelope

## Problem Statement

The Research Lab can now execute one governed read-only workflow, but it has no
canonical registry for operator-approved X, YouTube, website, or RSS sources.
Without a tenant-scoped source record, deterministic validation, activation
policy, and immutable decision history, continuous polling would have ambiguous
authority and unsafe network targets.

## Findings

- Phase 0 is complete and continuous scheduling remains off.
- Existing Factory permissions provide the correct server-side authorization
  boundary: view, improve, and manage Automation.
- Convex schema and function consumers must ship atomically; prior CI failures
  were caused by adding consumers without their complete persisted contract.
- Phase 1 should prove one website/feed lifecycle without fetching content or
  adding provider credentials.

## Proposed Solutions

### Option 1: Store source URLs in Automation metadata

**Pros:** Small change.

**Cons:** No provider identity, cursor/deduplication contract, retention,
tenant isolation, or source decision history.

**Risk:** High.

### Option 2: Canonical source and observation tables with a governed UI

**Pros:** Matches the approved plan, preserves authority and provenance, and
keeps provider adapters read-only and replaceable.

**Cons:** Adds a focused schema and lifecycle surface.

**Risk:** Low.

## Recommended Action

Implement Option 2. Use deterministic, no-network preview validation in Phase
1. Only exact public HTTPS website/RSS targets can become `VERIFIED` without a
provider adapter; X and YouTube handles remain drafts until a stable provider ID
is resolved in their later phases.

## Acceptance Criteria

- [x] `researchSources`, `researchSourceEvents`, and `researchObservations`
  define tenant, project, identity, cursor, artifact, retention, idempotency,
  and audit indexes.
- [x] Every public query and mutation enforces workspace permission and exact
  project ownership.
- [x] Lifecycle supports `DRAFT`, `VERIFIED`, `ACTIVE`, `PAUSED`, `DEGRADED`,
  `REVOKED`, and `RETIRED` with fail-closed transitions.
- [x] Preview rejects credentials, non-HTTPS URLs, localhost, private/link-local
  network targets, unsupported ports, and malformed provider locators.
- [x] Activation requires canonical identity, schedule, item cap, spend cap,
  retention, exclusions, and policy acknowledgement.
- [x] Creation, validation, activation, pause/resume, credential failure,
  policy drift, deletion request, and retirement create immutable events.
- [x] Loop Engineering contains a Research Watchlist panel with loading, empty,
  validation, success, degraded, and retired states; no primary nav is added.
- [x] An authorized Research Lab operator can add, preview, validate, activate,
  pause, resume, and retire one public website/feed in the browser.
- [x] Cross-workspace source access and invalid/private network targets fail
  closed in focused tests.
- [x] Continuous scheduling and provider fetching remain off.

## Work Log

### 2026-08-11 - Authorized Start

**By:** Codex

**Actions:**

- Published the completed Phase 0 foundation as draft PR #64.
- Created a clean stacked worktree from the Phase 0 commit.
- Reviewed the approved continuous-learning plan, existing Factory permission
  boundary, Loop Engineering UI, and prior Convex schema-contract learning.

**Learnings:**

- Phase 1 can prove source authority without provider credentials or network
  fetching.
- Schema, validators, functions, generated API, UI consumers, and tests must be
  delivered as one atomic slice.

### 2026-08-11 - Completed

**By:** Codex

**Actions:**

- Added the tenant-scoped source, event, and observation contracts with bounded
  public functions and an immutable lifecycle audit trail.
- Added the Research Watchlist UI and documentation without enabling collection
  or introducing a primary navigation domain.
- Exercised the full public-source lifecycle in an isolated browser environment,
  including private-target rejection, reload persistence, keyboard behavior,
  and light/dark accessibility checks.

**Validation:**

- Focused policy and UI tests pass.
- Repository typecheck and production build pass.
- Browser Axe checks report zero violations and zero incomplete checks in light
  and dark themes.

**Outcome:**

- Phase 1 source authority is complete. Continuous scheduling, provider
  fetching, credentials, ingestion, synthesis, and implementation remain off
  until their later governed phases.

## Notes

- Do not edit the approved implementation plan.
- Do not enable scheduled discovery or start a provider adapter in this todo.
- Do not store credentials, tokens, raw copyrighted content, or fetched pages.
