---
status: complete
priority: p1
issue_id: "055"
tags: [factory, production-pilot, remote-sandbox, governance, reliability, evidence]
dependencies: ["052", "053", "054"]
---

# Run Production Factory Pilot V3 Final Readiness Gate

## Problem Statement

Remote Runtime Reliability has met its narrow qualification bar, but the complete current Factory has not yet passed a final full-system pilot across all five production workload classes. Mission Control needs evidence that human-governed production pilot workloads can complete end to end without hidden manual repair, authority leakage, cleanup failures, or retry masking.

## Findings

- Exact starting baseline is the latest `origin/main` at `db44819ec59e79cdd71ba9ed36fce8064a120af3`, runtime contract v30.
- Prior System Qualification V1/V2, Pilot V1/V2, Remote Codex Structured Output, and Remote Runtime Reliability evidence live in separate preserved locations and must remain unchanged.
- Security Configuration D and the migration 420-second ceiling are qualified workload-specific candidates, not global defaults.
- Guarded Auto is disabled and remains out of scope.

## Proposed Solutions

1. **Test-and-measure V3 pilot (recommended).** Reuse materially comparable workloads and current production contracts, run the full governed matrix, inject failures separately, and change only qualification tooling/evidence unless a reproducible production defect is proven.
2. **Broaden the architecture before piloting.** Rejected because it would invalidate the final-readiness objective and add risk without evidence of a defect.
3. **Rely on earlier pilot evidence.** Rejected because current-main full-system readiness requires a fresh 15-workload matrix and fresh CI/Vercel.

## Recommended Action

Run option 1 from the isolated V3 worktree. Require 15/15 valid terminal structured results and 15/15 accepted expected-success workloads, including a 3/3 first-pass remote bug/security/migration gate, with all remote credentials revoked and final VM inventory zero.

## Acceptance Criteria

- [x] Prior qualification evidence identities are recorded before and after V3 and remain unchanged.
- [x] Five materially comparable workload classes run at least three times each for at least 15 governed executions.
- [x] Local and live Remote Sandbox execution are both covered; remote concurrency never exceeds one.
- [x] Security Configuration D and migration 420-second settings remain explicit, digest-bound, and workload-specific.
- [x] All 15 intended workloads produce valid terminal `factory-result/v1` and reach candidate, independent verification, exact-current eligibility, and human acceptance.
- [x] First-pass structured result, first-pass verification, eventual success, retries, and failed Attempts are reported separately.
- [x] At least one remote bug, security, and migration workload pass first-pass; result provenance distinguishes canonical output from JSONL reconstruction.
- [x] Every retry, if any, follows the typed allowlist and creates fresh Attempt, lease, credential, workspace, and provider resource within frozen budgets.
- [x] Full lifecycle lineage is recorded through Review Package, acceptance, and advisory Factory Learning without faking unused stages.
- [x] Required operational metrics, median/p95 performance, V1/V2/V3 comparison, economics with null preservation, human interventions, and shadow routing are recorded.
- [x] Deliberate failure injection covers every required fail-closed case separately from the 15 success executions.
- [x] Review Intelligence proves Intent-to-Raw-Diff traversal, residual AI default-off, and non-accepting Review Package approval.
- [x] All remote credentials are Attempt-scoped, host-only authorities remain outside the VM, cleanup/revocation succeeds, and final exe.dev inventory is zero.
- [x] Pilot V3 and the complete requested validation matrix pass; immutable checksummed evidence is frozen.
- [x] Durable changes are committed and pushed to a draft PR with fresh CI/Vercel; no auto-merge or rollout flag change occurs.
- [x] Guarded Auto remains disabled and the final response returns exactly one permitted decision and one next milestone if ready.

## Work Log

### 2026-08-19 - Isolation and scope freeze

- Read the complete V3 specification and selected the test-and-measure path.
- Used the required worktree manager to create `codex/production-factory-pilot-v3-final-readiness-gate` from exact latest `origin/main` `db44819ec59e79cdd71ba9ed36fce8064a120af3`.
- Preserved the dirty thread root and all prior pilot/reliability worktrees without modification.
- Established that production code changes are prohibited unless a reproducible defect is found.

### 2026-08-19 - Production identity concern reproduced and closed

- Re-tested the public workflow-run ID versus Convex document-ID boundary through the current remote Factory worker contract.
- Confirmed current `origin/main` uses the manifest public run ID for resource/supervisor/result identity while retaining the document ID only for host journal and credential allocation identity.
- The focused production worker remote test passed. The earlier concern is not a current reproducible defect, so no production code changed.

### 2026-08-19 - Governed V3 population

- Ran 15 sequential governed executions: three each for bug fix, feature, refactor, security/policy, and data/schema migration.
- Ran 12 local persistent-worker and three live exe.dev Remote Sandbox workloads with maximum remote concurrency one.
- Achieved 15/15 terminal `factory-result/v1`, 15/15 first-pass independent exact-candidate verification, and 15/15 canonical human acceptance eligibility with 15 Attempts, zero failures, and zero retries.
- Achieved the 3/3 first-pass remote bug/security/migration gate. All three used the canonical output file; none required JSONL reconstruction.
- Preserved Security Configuration D and the migration 420-second ceiling as explicit workload-specific, digest-bound configuration.
- Proved per-Attempt inference credential revocation, exact resource absence, and final exe.dev inventory zero.

### 2026-08-19 - Evidence audit and validation

- Tightened the V3 evidence harness after its first audit showed Review Package traversal metadata without linked verification-check and evidence-envelope rows. This was an evidence-tooling gap, not a production runtime defect.
- Re-finalized the immutable 15-execution population and proved complete non-accepting Review Intelligence traversal across all five workload classes.
- Recorded 17/17 deliberate failure injections failing closed, zero avoidable operator toil, nullable cost telemetry, median/p95 timing, advisory routing, and advisory Factory Learning with no self-promotion.
- Ran `pnpm run qualify:factory` into the V3 evidence directory. All 17 repository gates passed in 143,981 ms, including full tests, TypeScript, skill lint, runtime guard, production build, orchestration smoke, dependency/security gates, secret scan, and `git diff --check`.
- Recomputed every preserved evidence packet aggregate; all six identities matched the pre-pilot values exactly.
- Final decision: `HUMAN-GOVERNED PRODUCTION PILOT READY`. Guarded Auto remains disabled and production rollout flags remain unchanged.
