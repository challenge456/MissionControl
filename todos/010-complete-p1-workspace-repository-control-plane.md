---
status: complete
priority: p1
issue_id: "010"
tags: [workspace, repositories, monorepo, control-plane, ui, migration]
dependencies: []
completed_at: 2026-07-31
---

# Add the workspace repository control-plane foundation

## Problem Statement

Mission Control treats a workspace as one project with one optional GitHub
repository. The target operating model requires one company account with
multiple workspaces, zero-to-many repositories per workspace, and governed code
scopes for monorepos without breaking existing workspace selection, dispatch,
or repository setup.

## Findings

- `tenants` already provide the company-account foundation.
- `projects` and `projectId` are the established workspace compatibility contract.
- `projects.githubRepo` and related status fields support only one repository.
- `workspaceHostBindings` correctly keep local checkout paths host-specific.
- The existing Settings → Workspaces & Repositories surface should be extended,
  not duplicated.
- The source specification is
  `docs/plans/2026-07-31-feat-company-workspace-repository-control-plane-plan.md`.

## Proposed Solutions

### Option 1: Replace projects and repository fields immediately

**Pros:** Clean target model immediately.

**Cons:** High blast radius; breaks existing APIs, URLs, seed data, and UI.

**Risk:** Unacceptable.

### Option 2: Add repository connections and code scopes compatibly

**Pros:** Preserves current behavior, supports gradual backfill, and provides a
safe rollback path.

**Cons:** Temporary dual-read/dual-write complexity.

**Risk:** Controlled.

## Recommended Action

Implement Option 2. Keep `projects`/`projectId` and existing single-repository
fields as compatibility data. Add first-class repository connections and code
scopes, deterministic backfill, compatibility APIs, and an enhanced existing
settings surface.

## Acceptance Criteria

- [x] Existing workspace selection and `?workspace=<projectId>` behavior remain unchanged.
- [x] A workspace can list zero, one, or multiple repository connections.
- [x] Existing `githubRepo` data can be backfilled idempotently as the default repository.
- [x] A repository can define validated monorepo code scopes.
- [x] Host checkout paths remain separate from portable repository configuration.
- [x] Existing single-repository connect/update paths continue to work and dual-write safely.
- [x] Settings → Workspaces & Repositories manages the new data without losing current states.
- [x] Loading, empty, setup-required, degraded, validation-error, and success states are explicit.
- [x] Backend, UI model, typecheck, tests, and browser verification pass.

## Work Log

### 2026-07-31 - Started isolated implementation

**By:** Codex

**Actions:**

- Created `codex/workspace-control-plane` in an isolated worktree.
- Selected the additive compatibility approach from the approved SDD spec.

**Learnings:**

- The main checkout contains unrelated uncommitted automation/model-routing
  changes, so implementation must remain isolated until integration review.

### 2026-07-31 - Completed implementation and verification

**By:** Codex

**Actions:**

- Added additive repository connection and monorepo code-scope records.
- Added compatibility reads, dual writes, an idempotent legacy backfill, and
  atomic cleanup when a workspace is deleted.
- Enhanced the existing workspace settings surface with multi-repository
  management, code-scope controls, and deterministic setup recommendations.
- Added the SDD specification, operator guide, and browser evidence.
- Verified an isolated SellerFi workspace with two repositories and overlap
  protection in the live V2 shell.

**Evidence:**

- 36 UI test files and 150 UI tests passed.
- 2 focused backend test files and 8 tests passed.
- UI typecheck and production build passed.
- Headless browser verification passed with no page errors or feature-related
  console errors after a clean reload.
- Screenshot: `docs/testing/evidence/workspace-repository-control-plane/workspaces-repositories.png`.
