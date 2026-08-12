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

### 2026-08-11 — Release 1 failed closed; Release 2 recovery opened

- Merged PR #78 and recorded exact merge
  `0157d38805d7a1fa977723faa34adaf2ef0d3b75` as Release 1.
- Human-approved and deployed Vercel Preview
  `dpl_HpFJkqkg9zEyoiLyjWgzH6NvUjLN`; independent verification preserved a
  failed provenance result because CLI deployments omit runtime
  `VERCEL_GIT_COMMIT_SHA` even when Vercel deployment metadata contains it.
- Kept Release 1 in `DEPLOYED` with its failed evidence; it does not count
  toward the three-release production gate.
- Opened WorkOrder `h97j42dy2d479wg2vh5s3275bn8ca772`, inbox Task `MCF-003`,
  and Codex Attempt `tn772b1kdqv9a9g7sznx39tdq98casmy` for a constrained
  recovery receipt and Git-integration staging dispatch.

### 2026-08-11 — Release 2 merged; Preview Protection gate isolated

- Merged PR #79 at exact commit
  `cd4ea9b74df784265f3c1922d939dd199a8c635c`; GitHub ingestion created the
  second Factory release with PASS CI and exact WorkOrder/Attempt lineage.
- Created a Git-source Vercel deployment for the Release 1 merge. Its protected
  runtime endpoint returns the exact merge SHA, deployment ID, and `staging`
  environment when accessed through Vercel's automation path.
- Preserved a second failed Release 1 verification showing HTTP 401 for all
  three checks. This isolated Preview Protection—not source provenance—as the
  remaining blocker.
- Opened WorkOrder `h97hve2rx51avp45rcbanmcpqs8cby4e`, inbox Task `MCF-004`,
  and Codex Attempt `tn73s1xx015pjcnbj8h4949hps8cbeav` for a scoped protection
  bypass and the three-distinct-release production eligibility gate.

### 2026-08-12 — Three staging releases verified; production automation opened

- Release 1 `0157d38805d7a1fa977723faa34adaf2ef0d3b75` is `VERIFIED` on
  Git-sourced Vercel deployment `dpl_6VvmyQgawA3JRab4sA6suSjCMm8A`; its two
  earlier HTTP 401 failures remain immutable.
- Release 2 `cd4ea9b74df784265f3c1922d939dd199a8c635c` is `VERIFIED` on
  `dpl_2GDkEVVe7VHdJNAmLtrhDik4Zzoy` on the first verification attempt.
- Release 3 `b36cb2bdedf435bc289c623009a3a29f2290a5f4` is `VERIFIED` on
  `dpl_6zb9tQum7NfuCc8NtkwRHigtv99e` on the first verification attempt.
- Production eligibility returns `eligible: true`, candidate verified, and
  three distinct qualifying release IDs for Release 3.
- Opened WorkOrder `h97qsfwqza28zk8jve1wzyxzth8casyw`, inbox Task `MCF-005`,
  and Codex Attempt `tn74zxnrzg7zmzp3s0pd1z3ey98cb6ya` for governed staged
  production deployment, verification, promotion, and rollback evidence.
