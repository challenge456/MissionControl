---
title: "fix: Restore release-gate and automation schema contracts"
type: fix
status: completed
date: 2026-07-30
owner: Mission Control Platform
---

# Restore release-gate and automation schema contracts

## Finding

The last three `main` CI runs failed TypeScript and lint after commit
`3f367af` added release-gate and review-only automation consumers without their
complete Convex schema contract. Build, unit, browser E2E, and smoke remained
green.

## Repair boundary

- Add the missing `releaseGateEvaluations` table and indexes.
- Add optional deployment linkage to QC, context eval, and PR-check evidence.
- Add compatibility fields/indexes consumed by the review-only scheduler.
- Create automation definitions with all required governed fields.
- Narrow optional fields before dispatch helpers.
- Do not change release enforcement, automation autonomy, or product UI.

## Acceptance

- [x] `pnpm run ci:typecheck` passes.
- [x] Existing release and automation consumers compile without casts to
      invented table types.
- [x] Stored `releaseDeploymentId` evidence is accepted by the schema.
- [x] The repair is additive and requires no destructive migration.
- [ ] GitHub TypeScript and lint jobs pass after publication.

## Rollback

Revert the repair commit only if the release-gate and review-only automation
consumers are reverted in the same release. Removing the schema alone would
recreate the current compile and runtime failure.

## History

Repository archaeology found one primary integration point: `3f367af`
(`feat(factory): merge governed lifecycle and automation work`, 2026-07-30).
The schema file is primarily maintained by the repository owner; no earlier
complete version of these specific fields or table exists in Git history.
