---
status: complete
priority: p1
issue_id: "045"
tags: [software-factory, remote-sandbox, worker-runtime, reconciliation, security]
dependencies: []
---

# Reconcile Remote Sandbox N=1 with Canonical Worker Runtime

## Problem Statement

The completed Remote Sandbox N=1 branch was built from `3673dd9a1d2c3e3e13da2ead7cbc7fd9c1de8bb4`. Main now includes PR #102's canonical worker-runtime admission, lease, heartbeat, recovery, process, worktree, capacity, and cleanup contracts. Remote sandbox execution must be rebased conceptually beneath that runtime without preserving parallel ownership.

## Findings

- PR #102 merged to main as `c97b31d59911543c6f95b2cd35fded957b2eddc6`.
- The completed source branch remains clean and frozen at `78d7e417d1a32af24ede61991b219459a1db897f` in its original worktree.
- Reconciliation is isolated in `codex/remote-sandbox-factory-n1-reconcile` from exact post-#102 `origin/main`.
- Live exe.dev certification is separately authorized work and remains excluded.

## Proposed Solutions

### Option 1: Reapply the old branch wholesale

**Approach:** Cherry-pick or merge all Remote Sandbox commits and resolve conflicts mechanically.

**Pros:** Fast initial code transfer.

**Cons:** Likely preserves duplicate lease, heartbeat, recovery, process, worktree, and cleanup ownership that PR #102 made canonical.

**Effort:** Medium

**Risk:** High

### Option 2: Contract-led reconciliation

**Approach:** Audit post-#102 runtime/product contracts, selectively port sandbox backend/profile/provider/result behavior, and bind it beneath canonical worker admission and recovery.

**Pros:** Preserves one authority model and current product behavior; makes duplicate concepts explicit and removable.

**Cons:** Requires careful file-by-file reconciliation and broader compatibility validation.

**Effort:** Large

**Risk:** Medium

## Recommended Action

Use Option 2. Treat merged main as authoritative. Reuse #102 worker identity/session/capability/slots/lease fencing/heartbeat/stale rejection/LOST recovery/process/worktree/cleanup semantics, preserve current Factory Memory, Observability/Evals, progressive Factory UX, and Verification Factory policy-v2, and keep Remote Sandbox as an execution backend only.

## Technical Details

**Affected areas:**
- Canonical Factory worker runtime and execution backend seam
- Sandbox provider/profile/supervisor/result/credentials/reconciliation contracts
- Convex Factory manifests, Attempt projections, readiness, and service commands
- Existing progressive Factory configuration and Run Inspector
- Runtime-contract extraction and compatibility validation

**Database changes:**
- Additive sandbox profile/allocation/credential/result fields only where current main lacks them.
- No competing worker, lease, heartbeat, recovery, observability, or verification tables.

## Resources

- PR #102: `https://github.com/jaydubya818/MissionControl/pull/102`
- Frozen implementation head: `78d7e417d1a32af24ede61991b219459a1db897f`
- Governing plan: `docs/plans/2026-08-10-feat-remote-sandbox-factory-cohorts-plan.md`

## Acceptance Criteria

- [x] Exact post-#102 main SHA and runtime contracts audited
- [x] Remote Sandbox implemented beneath canonical worker admission and Attempt lease fencing
- [x] Duplicate worker identity/session/capacity/lease/heartbeat/recovery/process/worktree/cleanup concepts removed
- [x] Sandbox authority invariants remain fail-closed
- [x] Current Factory Memory and Context Packages preserved
- [x] Current Observability/Evals preserved
- [x] Progressive Factory Basic/Intermediate/Advanced UX extended without a competing mode model
- [x] Verification Factory policy-v2 remains compatible
- [x] Runtime contract extracted and impact documented; version changed only if required
- [x] Focused remote sandbox and worker lease/recovery suites pass
- [x] Factory Memory, Verification Factory, progressive UI, and full repository suites pass
- [x] TypeScript, lint, runtime-contract guard, production build, and orchestration smoke pass
- [x] FakeSandboxProvider golden path passes
- [x] Browser validation passes in dark/light themes with accessibility and console checks
- [x] Branch pushed and draft PR created without merge
- [x] GitHub CI and Vercel results recorded
- [x] Live exe.dev remains Preview / Not Live Certified without external mutation

## Work Log

### 2026-08-15 - Dependency merged and reconciliation isolated

**By:** Codex

**Actions:**
- Monitored PR #102 until GitHub recorded merge commit `c97b31d59911543c6f95b2cd35fded957b2eddc6`.
- Confirmed all PR #102 GitHub Actions and Vercel checks were green before merge.
- Fetched exact `origin/main` and confirmed the merge commit is an ancestor.
- Preserved the completed Remote Sandbox worktree at `78d7e417d1a32af24ede61991b219459a1db897f`.
- Created this separate reconciliation worktree and branch from exact merged main.

**Learnings:**
- Reconciliation must be contract-led; a wholesale cherry-pick would risk retaining obsolete ownership concepts.
- Live provider certification remains operationally separate from code integration.

### 2026-08-15 - Canonical runtime audit completed

**By:** Codex

**Actions:**
- Audited PR #102's worker registration, session/generation fencing, capability and capacity admission, Attempt lease renewal, heartbeat, LOST recovery, process observation, workspace ownership, publication recovery, and fail-closed cleanup contracts.
- Confirmed `workspaceHostBindings` and `workflowRuns.lease` are the only worker-registration and Attempt-lease authorities the Remote Sandbox backend may use.
- Confirmed the canonical worker manifest is already provider-neutral and the workspace ownership record already has an optional exact `sandboxId` binding.
- Mapped Remote Sandbox to the current progressive Factory experience instead of retaining the source branch's separate configuration-level selector.

**Learnings:**
- Remote provider lifecycle state must be subordinate to the canonical Attempt lease and must not introduce worker identity, lease, heartbeat, LOST, recovery, process, worktree, or cleanup ownership.
- Sandbox lifecycle transitions may be durable evidence; routine liveness belongs in current-state allocation data, not an unbounded heartbeat event stream.
- Host materialization, independent verification, credential revocation, exact resource-absence proof, and canonical publication permission must all complete in that order before GitHub App publication.

### 2026-08-15 - Backend reconciliation implemented

**By:** Codex

**Actions:**
- Added immutable Sandbox Profiles and allocation/credential projections without adding worker or Attempt lease authorities.
- Extended `factory-execution-manifest/v1` with an optional frozen remote contract and bound dispatch to canonical worker backend/capability/capacity admission.
- Implemented `SandboxProvider`, deterministic Fake and production exe.dev adapters, supervisor/result validation, Attempt credentials, control-plane journaling, and exact teardown reconciliation.
- Routed remote execution through the existing `FactoryAttemptWorker`, canonical ownership manifest, host materialization, independent verification, publication permit, GitHub App, and owned-worktree cleanup.
- Integrated configuration into the shared progressive Factory level and added non-secret sandbox evidence to the existing Run Inspector.
- Added deterministic provider, reconciler, ownership, runtime, UI, and end-to-end worker tests.
- Ran the runtime contract extractor against `c97b31d`; public contracts changed, so the runtime version advances from v23 to v24.

**Learnings:**
- Stable provider resource identity must hash only project, WorkflowRun, and Attempt identifiers; passing the larger runtime request object produced an ownership mismatch and was corrected.
- Provider teardown ambiguity correctly blocks publication and preserves the canonical worktree.

### 2026-08-15 - Final local validation and browser proof completed

**By:** Codex

**Actions:**
- Removed routine UI/API authority to self-assert live exe.dev certification; Factory-created production profiles freeze `liveCertified=false` and remain blocked pending a separate authorized certification workflow.
- Replaced viewport-responsive Factory field grids with container-responsive grids and deferred the workspace registry/detail split so the configuration remains readable with the persistent sidebar and chat open at 1440px.
- Validated Basic, Intermediate, and Advanced disclosure, Local/Isolated keyboard selection, expandable Advanced profile settings, named accessibility controls, visible keyboard focus, and dark/light themes without submitting a mutation.
- Recorded browser captures and the local test-environment constraint in `docs/testing/evidence/remote-sandbox-reconciliation/README.md`.
- Re-ran the complete repository tests, lint, TypeScript, production build, runtime-contract guard, orchestration artifact smoke, and deterministic FakeSandboxProvider golden path after the browser-driven fixes.

**Learnings:**
- Certification evidence must be minted by a separately authorized control-plane workflow, not accepted as an operator checkbox in routine configuration.
- Workspace pages with persistent sidebars and chat cannot select dense layouts from total viewport width alone; container-aware disclosure and a later parent split preserve readable operator controls.

### 2026-08-15 - Draft PR opened and hosted validation passed

**By:** Codex

**Actions:**
- Pushed `codex/remote-sandbox-factory-n1-reconcile` without changing the preserved source worktree.
- Opened draft PR #109 against exact base `c97b31d59911543c6f95b2cd35fded957b2eddc6`; auto-merge remains disabled.
- Confirmed all six GitHub CI jobs passed: Smoke Test, TypeScript Type Check, Lint, Unit Tests, Build (UI + workspaces), and E2E Tests.
- Confirmed Vercel Preview Comments and both Vercel deployments passed.

**Learnings:**
- Hosted validation agrees with the local full-suite, build, runtime-contract, golden-path, and browser evidence.
- Live exe.dev certification remains separate authorized operational work and is not a prerequisite for merging the Preview implementation.

## Notes

- Do not allocate exe.dev resources, change account/payment/capacity, or mutate credentials.
- Create a draft PR only; never auto-merge.
