---
status: in_progress
priority: p0
issue_id: "040"
tags: [software-factory, release, staging, production, vercel, verification]
dependencies: ["039"]
---

# Qualify Production Automation with Three Staging Releases

Execute `docs/plans/2026-08-11-feat-three-staging-release-production-automation-plan.md`.

## Acceptance Criteria

- [ ] Staging control plane is bootstrapped without changing the legacy public
      Convex backend.
- [ ] Release 1 verifies provider-native provenance, smoke, and health.
- [ ] Release 2 verifies approval-gated provider dispatch and receipt capture.
- [ ] Release 3 verifies a three-distinct-release production eligibility gate.
- [ ] Production automation remains disabled until all three releases pass.
- [ ] Production requires exact human approval, staged deployment, independent
      verification, promotion evidence, and explicit rollback.
- [ ] Full tests and browser evidence cover the complete golden path.

## Work Log

### 2026-08-11 — Rollout opened

- Confirmed PR #77 is merged at `ecf5420669b2a835235f067bd76395fe437ce002`.
- Confirmed the Factory production target `gallant-cassowary-27` is empty and
  can serve as an isolated staging control plane.
- Detected that Vercel Production uses legacy dev backend
  `different-gopher-55`; no write was made to it.
- Passed a Convex dry run with no index deletion and an additive schema diff.
- Selected three distinct staging releases as the production automation gate.

### 2026-08-11 — Staging bootstrap started

- Added fail-closed Vercel provenance and health endpoints for Release 1.
- Passed focused tests, the full TypeScript gate, and the production build.
- Confirmed the Convex deployment diff is additive and removes no indexes.

### 2026-08-11 — Release 1 candidate validated

- Deployed the v12 governed-release backend to the isolated staging control
  plane and registered the MissionControl repository and staging environment.
- Configured Vercel Preview to use `gallant-cassowary-27`; Production remains on
  the unchanged legacy backend.
- Created WorkOrder `h97x2qk9g7ch3bfzjp48pwkvvn8ca3sm`, inbox Task `MCF-002`,
  and Codex Attempt `tn70ad4s18sdg9y7dp99v5ypr58cbnmg`.
- Added provider-authored provenance/health, credential-free public GitHub
  provider ingestion, and immutable manual-Codex attempt binding.
- Passed lint/typecheck, all package and UI tests, 506 Convex tests, the app
  build, and Vercel's Preview build with both API functions packaged.
