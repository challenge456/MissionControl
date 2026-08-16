---
status: complete
priority: p1
issue_id: "046"
tags: [software-factory, remote-sandbox, mission-to-pr, policy-v2, runtime-contract]
dependencies: []
---

# Reconcile Remote Sandbox after Mission-to-PR merge

## Problem Statement

PR #109 was reconciled against the PR #102 worker-runtime baseline at runtime v24. PR #95 subsequently merged the canonical Mission-to-PR and live policy-v2 lifecycle and advanced main from runtime v23 to v24. Remote Sandbox must be rebased onto that exact main without replacing either canonical authority model.

## Findings

- PR #95 merged as `d0e5ff2ff57da7e5037da6f6ee8083ed275d911f`.
- Exact latest `origin/main` is the same merge commit and declares runtime v24.
- The pre-bump contract extractor identifies the same four Remote Sandbox public changes and no others.
- The only rebase conflicts are additive overlaps in Factory execution, Verification Attempt reporting, service capabilities, tests, and generated API typing.

## Proposed Solutions

### Option 1: Preserve runtime v24

**Approach:** Rebase the implementation but retain its prior version.

**Pros:** No version-number change.

**Cons:** Invalid because main already owns v24 and the Remote Sandbox branch still changes four public contracts.

**Effort:** Small

**Risk:** High

### Option 2: Reconcile canonically and advance to v25

**Approach:** Keep #95's Mission/policy-v2 lifecycle authoritative, retain Remote Sandbox beneath #102's worker runtime, and increment the combined runtime only after extractor proof.

**Pros:** Preserves both authority models and makes deployment sequencing explicit.

**Cons:** Requires complete compatibility and hosted validation after the history rewrite.

**Effort:** Medium

**Risk:** Medium

## Recommended Action

Use Option 2. Rebase onto exact merged main, preserve the same four Remote Sandbox contracts, advance runtime v24 to v25, and rerun the complete requested validation matrix before marking PR #109 ready.

## Acceptance Criteria

- [x] PR #109 remained unchanged until PR #95 merged
- [x] Exact latest main and runtime v24 baseline confirmed
- [x] #95 Mission-to-PR and policy-v2 contracts audited
- [x] Rebase conflicts resolved without duplicate authority
- [x] Contract extractor confirms exactly four Remote Sandbox public changes
- [x] Runtime advances from v24 to v25
- [x] Remote Sandbox and #102 worker-runtime suites pass
- [x] #95 Mission-to-PR / policy-v2 compatibility passes
- [x] Factory Memory and Progressive Factory UI compatibility passes
- [x] Full repository tests, lint, TypeScript, runtime guard, and production build pass
- [x] Orchestration smoke and FakeSandboxProvider golden path pass
- [x] Browser verification passes without live provider mutation
- [x] PR #109 is pushed, CI/Vercel are green, and the PR is marked ready without auto-merge

## Work Log

### 2026-08-16 - Dependency merge and contract audit

**By:** Repository operator via Codex execution

**Actions:**
- Held PR #109 at `2419de7245802901d35a3fb18ad02a60ac0a6232` until GitHub recorded PR #95 merged.
- Fetched exact main `d0e5ff2ff57da7e5037da6f6ee8083ed275d911f` and confirmed runtime v24.
- Rebased the Remote Sandbox commits and retained both #95 Verification Attempt commands and Remote Sandbox reconciliation commands at shared conflict points.
- Ran the contract extractor before changing the version; it failed closed on exactly the expected four Remote Sandbox contracts.

**Learnings:**
- Runtime v24 now belongs to #95, so Remote Sandbox must use v25.
- The two features compose cleanly when Mission/policy-v2 owns verification and acceptance while Remote Sandbox owns only execution-provider lifecycle.

### 2026-08-16 - Local validation and browser proof

**By:** Repository operator via Codex execution

**Actions:**
- Passed 42 focused orchestration tests covering Remote Sandbox and canonical worker-runtime behavior.
- Passed 120 focused Convex compatibility tests and 62 Progressive Factory/Mission UI tests.
- Passed the full repository test suite, lint and TypeScript checks, runtime guard, production build, orchestration smoke, and deterministic FakeSandboxProvider golden path.
- Verified Basic, Intermediate, and Advanced Factory experiences plus #95 Mission list/detail/execution surfaces in light and dark themes at 1440 pixels.
- Confirmed clean browser page errors, no horizontal overflow, and keyboard-operable execution-boundary/profile controls.

**Learnings:**
- #95 fixtures needed canonical manifest digests and the shared verification-worktree dependency now required by the merged worker path; production authority did not need to change.
- The final extractor output remains exactly the four intended Remote Sandbox contracts on top of main runtime v24.

### 2026-08-16 - Hosted validation

**By:** Repository operator via Codex execution

**Actions:**
- Force-updated the existing PR #109 branch after the authorized rebase, retaining draft state and disabled auto-merge.
- Passed GitHub Build, E2E, Lint, Smoke, TypeScript, and Unit checks.
- Passed Vercel Preview Comments and both Vercel preview deployments.
- Updated the existing PR description with exact baselines, authority boundaries, runtime v25, certification state, and post-deploy monitoring.

**Learnings:**
- The post-#95 reconciliation is mergeable and hosted validation reproduces the complete local result.

## Resources

- PR #95: `https://github.com/jaydubya818/MissionControl/pull/95`
- PR #109: `https://github.com/jaydubya818/MissionControl/pull/109`
- Reconciliation contract: `docs/implementation/remote-sandbox-n1-reconciliation.md`

## Notes

- Do not invoke `workOrders.accept` during proof.
- Do not run live exe.dev certification or mutate provider capacity, VMs, account/payment state, or credentials.
- Do not auto-merge PR #109.
