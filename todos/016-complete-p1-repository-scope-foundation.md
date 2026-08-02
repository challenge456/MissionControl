---
status: complete
priority: p1
issue_id: "016"
tags: [control-plane, convex, repositories, authorization, migration]
dependencies: []
---

# Complete the repository and code-scope foundation

## Problem Statement

The additive repository model exists, but legacy project APIs still expose unguarded reads and writes and the migration/parity/rollback proof required by the SDD is incomplete.

## Findings

- `workspaceRepositories` and `repositoryCodeScopes` already preserve the one-to-many and monorepo contracts.
- Legacy `projects` query/mutation paths need authenticated company/workspace enforcement.
- Backfill, dual-read/write, parity reporting, and explicit rollback flags need end-to-end tests and evidence.

## Proposed Solutions

### Option 1: Replace legacy project APIs

Remove old contracts and migrate all consumers immediately. This is faster conceptually but violates the additive migration and rollback requirements. Risk: high.

### Option 2: Harden and bridge additively

Authorize old and new paths, keep legacy arguments and fields, dual-write where required, and report parity. This has more compatibility code but preserves production behavior. Risk: low.

## Recommended Action

Use the additive bridge. Treat schema, indexes, functions, generated types, migrations, and tests as one atomic boundary.

## Technical Details

- Convex schema and project/repository functions
- Company/workspace access helpers and feature flags
- Migration/parity tests and rollback report

## Resources

- `docs/plans/2026-07-31-feat-company-workspace-repository-control-plane-plan.md`
- `docs/solutions/build-errors/missing-convex-schema-contracts-ci-20260730.md`

## Acceptance Criteria

- [x] Existing project/workspace APIs enforce authenticated company and workspace access.
- [x] Zero, one, and multiple repository connections work without removing legacy fields.
- [x] Code scopes validate normalized paths, overlap policy, and workspace ownership.
- [x] Legacy repository backfill is idempotent, measurable, restartable, and non-destructive.
- [x] New and legacy projections produce a measurable parity report.
- [x] Feature flags restore legacy authoritative reads without deleting new records.
- [x] Relevant unit, integration, and type checks pass.

## Work Log

### 2026-08-01 - Execution started

**By:** Codex

**Actions:**
- Audited the SDD against `origin/main` and isolated the work in `codex/company-control-plane-complete`.

**Learnings:**
- Existing additive repository records are a strong base; authorization and evidence are the principal Phase 1 gaps.

### 2026-08-01 - Completed

**By:** Codex

**Actions:**
- Added authenticated company/workspace boundaries to legacy and additive repository APIs.
- Implemented code-scope validation, idempotent backfill, dual projection, parity reporting, and workspace-scoped rollback flags.
- Verified 3/3 repository projections with zero mismatches and passed the full automated release gate.

**Learnings:**
- Compatibility can remain additive without weakening the new authorization boundary.
