---
status: complete
priority: p0
issue_id: "042"
tags: [software-factory, canary, github, review-evidence, production]
dependencies: ["041"]
---

# Prove a current-main governed canary before production go-live

## Problem Statement

V1 review hardening is merged and three distinct staging releases are verified,
but the preserved Research Lab has no fresh current-main Attempt that satisfies
the strict `READY` contract. The verified staged production deployment also has
not been recorded as the promoted provider target.

## Findings

- Staging releases `0157d38`, `cd4ea9b`, and `b36cb2b` are independently
  `VERIFIED` in the isolated Factory control plane.
- Production candidate `623047c` has exact approval, deployment, provenance,
  smoke, and health evidence, but its release remains `VERIFIED`, not
  `PROMOTED`.
- Vercel currently targets a different deployment ID from the Factory-verified
  staged deployment. Production is therefore NO-GO until the mismatch is
  resolved through the governed lifecycle.
- The staging release control plane intentionally has no worker or GitHub App;
  the real PR canary belongs in the preserved Research Lab and its merged commit
  then enters the isolated staging-release control plane.

## Proposed Solutions

### Option 1: Promote the older verified deployment

**Pros:** Minimal provider work.

**Cons:** Does not prove the current-main Factory PR path or strict browser
`READY` contract.

**Risk:** High; it leaves the requested canary unproven.

### Option 2: Run a new governed canary, stage it, then decide production

**Pros:** Proves exact Attempt, independent verification, publication permit,
real PR/CI, browser refresh, staging verification, and exact production
promotion as one lineage.

**Cons:** Requires a new minimal canary commit and provider deployments.

**Risk:** Medium and bounded by fail-closed release states.

## Recommended Action

Use Option 2. Keep Vercel production auto-assignment disabled, preserve every
failed receipt, and promote only the provider deployment independently verified
for the exact merged canary commit.

## Acceptance Criteria

- [x] A current-main WorkOrder and Attempt produce a real GitHub PR through a
  consumed publication permit and independent verification receipt.
- [x] Exact-run GitHub CI and rollback guidance make the inspector `READY`
  after browser refresh.
- [x] The merged canary commit becomes a real independently `VERIFIED` staging
  release with provider provenance, smoke, and health evidence.
- [x] Production remains disabled until a fresh exact-candidate approval and
  independently verified staged production deployment exist.
- [x] GO requires the same verified provider deployment to be the current
  Vercel production target and to have immutable promotion evidence.
- [x] Full tests, deployment checks, browser evidence, PR review, and GitHub CI
  pass before merge.

## Work Log

### 2026-08-12 - Release audit

**By:** Codex

**Actions:**

- Isolated the work from the root continuous-research changes.
- Confirmed three distinct staging releases are verified.
- Compared Factory production evidence with Vercel's current production target.
- Issued a fail-closed NO-GO because verified and promoted deployment IDs do
  not match and no production promotion receipt exists.

**Learnings:**

- Provider commit equality is insufficient; the exact verified deployment ID
  must be the promoted target.
- The next canary must traverse the Research Lab execution authority first,
  then the isolated release authority.

### 2026-08-12 - Current-main canary passed

**By:** Codex

**Actions:**

- Dispatched WorkOrder `yh741dqfydd6kxw2dsj7ynjfzn8caqp8` from exact base
  `55512d4c718e9bf5311931604279b3d87e785cbc`.
- Preserved two fail-closed recovery records: an invalid GitHub App key and a
  frozen-branch mismatch. Neither failure pushed a branch or created a PR.
- Reclaimed the expired lease after a local backend restart and completed
  Attempt `6abbzp3n` (`ys7d4pdqp0pcqxmzcxwm8c9jvx8cbqcx`).
- Recorded independent receipt `xh75jxzzjnnpwrrf91dq485r7n8caa7t`, human
  approval `ks7b0ncwkn4kk2t9rsdkxjn81x8caxf9`, and a single-use publication
  permit for candidate `4f18d161be0fe7955f1ae995e88803a161df9f9f`.
- Published PR #84, bound GitHub Actions run `31627775839`, ingested exact-head
  PASS evaluation `zh76zxqqzkpnn39r22yjr7gzks8cb5r6`, and verified `READY`
  after a full browser refresh.
- Merged PR #84 as `59b2ec2bfc91539dbba6fe71237d3cacb04957f8`.

### 2026-08-12 - Staging and production qualification passed

**By:** Codex

**Actions:**

- Recorded staging WorkOrder `h97r65apkmcr8dmq73gt2cn0q18ca9r2`, Attempt
  `tn7f68m2c3rh96xyr3hq81p76d8cb92v`, and release
  `k17ye5t202bep0sefxeehf2fjx8camsf` for the exact PR #84 merge.
- Independently verified Vercel staging deployment
  `dpl_51z4DdbVJDPWbC1JdfB8qQ5HJkwH`; provenance, smoke, and health passed.
- Approved production only after eligibility reported five distinct verified
  releases and the exact current candidate.
- Staged, independently verified, and promoted production deployment
  `dpl_9rjCjXX6m8FKUPVrMKRZk44fP2DH`. Vercel's current production target is
  the same deployment ID and exact merge SHA.
- Preserved READY-after-refresh browser evidence and the full qualification
  receipt in `docs/testing/evidence/v1-production-qualification/`.

**Decision:** GO for exact commit `59b2ec2` only. Hundred-agent scheduling and
additional connectors remain deferred pending an operational soak period.
