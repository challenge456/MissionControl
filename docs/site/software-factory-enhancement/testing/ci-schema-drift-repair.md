# CI Schema Drift Repair

Status: **LOCALLY VERIFIED**
Date: 2026-07-30

The TypeScript and lint failures on `main` were caused by an incomplete Convex
schema contract for release-gate evidence and review-only automation
definitions.

## Repair

- Added the shadow release-gate table and required indexes.
- Linked QC, context-eval, and PR-check evidence to deployments.
- Restored review-only automation compatibility fields.
- Required new automation definitions to satisfy the governed definition
  contract.
- Narrowed optional legacy fields before scheduling.

This is an additive contract repair. It does not enforce release gates,
increase automation autonomy, delete records, or change operator UI.

## Verification

- Root CI TypeScript command: PASS.
- Focused automation dispatch test: 4 passed.
- Root production build: PASS.
- GitHub TypeScript and lint: release authority.

Full resolution:
`docs/solutions/build-errors/missing-convex-schema-contracts-ci-20260730.md`.
