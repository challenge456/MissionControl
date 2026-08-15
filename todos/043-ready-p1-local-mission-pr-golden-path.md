---
status: complete
priority: p1
issue_id: "043"
tags: [missions, software-factory, work-orders, verification, github-app, browser, v1]
dependencies: ["041", "042"]
---

# Complete the local Mission-to-PR golden path

## Problem Statement

Mission Control has the local Factory execution, verification, evidence, and
GitHub App publication primitives, but an approved Mission plan does not yet
compile into their full executable contract. Acceptance also does not enforce
the existing exact-candidate review package for Factory Attempts.

## Recommended Action

Implement
`docs/plans/2026-08-15-feat-local-mission-pr-golden-path-plan.md`. Reuse the
existing local executor and browser surfaces. Keep remote sandbox execution
behind exe.dev `max_vms: 0` and do not create a parallel VM or acceptance path.

## Acceptance Criteria

- [x] Mission plan release produces an enforced, bounded, independently
      verified WorkOrder contract.
- [x] One immutable candidate SHA is verified before GitHub App publication.
- [x] Durable evidence, exact PR/CI lineage, and acceptance eligibility are
      visible from the browser and authoritative after refresh.
- [x] `workOrders.accept` rejects mismatched or incomplete Factory lineage.
- [x] A safe mismatch persists failure evidence; a retry creates a new Attempt
      and corrected independently verified candidate without rewriting history.
- [x] Full repository and browser validation passes.
- [x] Draft PR #95 is opened; it is not merged automatically.

## Work Log

### 2026-08-15 - Architecture audit and plan

**By:** Codex

**Actions:**

- Created an isolated worktree from current `origin/main` on
  `codex/local-mission-pr-golden-path`.
- Audited Mission planning, WorkOrder creation/acceptance, immutable Factory
  versions, durable Attempt worker, local Git runtime, server-owned verifier,
  evidence envelopes, GitHub App publication, exact-head review package,
  retry lineage, and existing browser surfaces.
- Selected the existing committed candidate SHA as the immutable verification
  subject and retained provider publication after verification.
- Confirmed the local GitHub App private-key prerequisite is not currently
  present in the isolated environment; no user PAT will be substituted.

**Learnings:**

- Most lifecycle components are already production-shaped. The core defect is
  compilation and acceptance integration, not missing execution machinery.
- Independent validation can be proven by executor/verifier identity separation
  on the exact Attempt; a redundant second coding WorkOrder is not inherently
  more independent.
- Remote provider work is unrelated and remains gated at exe.dev `max_vms: 0`.

### 2026-08-15 - Integrated lifecycle and live browser gate

**By:** Codex

**Actions:**

- Compiled approved Mission intent into the existing bounded Factory WorkOrder
  contract and made exact-candidate review eligibility authoritative at
  `workOrders.accept`.
- Added immutable candidate mismatch evidence plus corrected retry coverage,
  preserving the historical Attempt packets and PR attribution.
- Created Mission `w1736wgsxhbt2r1cpjzp6ssnmd8ch2e4`, released WorkOrder
  `mx7xsgzq5b6kwgrbb6m9et3zcx8cg3d0`, and revised it through the browser to the
  structured `feature-dev` workflow with a new human approval.
- Created Factory Version `r177edfe0pmdav1mwd9vhcm1m58ch907`; its workflow,
  repository, executor, code scope, agent manifests, policy, budget, verifier,
  local host, and recovery checks passed.
- Confirmed the remaining GitHub App readiness check is `MISSING`. Activation,
  dispatch, live Attempt creation, and real PR publication remain fail-closed;
  no user PAT or synthetic installation was substituted.

**Validation:**

- Focused Convex, orchestration-worker, and UI tests pass. The full repository
  suite, lint, TypeScript typecheck, runtime-contract guard, production build,
  orchestration smoke, and real-backend browser gate test also pass.
- The browser proof survives refresh and reflects the authoritative backend
  blocker. The provider-backed Attempt/PR leg cannot be truthfully marked green
  until the configured GitHub App prerequisite is available.

**Blocker:**

- The repository-scoped Mission Control GitHub App installation/private-key
  boundary is not configured in the isolated local environment. Completing the
  real GitHub App PR leg requires that existing external prerequisite; it must
  not be faked or replaced with the operator's personal GitHub token.

### 2026-08-15 - Draft publication

**By:** Codex

**Actions:**

- Rebased the completed feature onto current `origin/main`.
- Re-ran the complete repository validation matrix and the authoritative local
  browser gate proof successfully.
- Opened draft PR #95 without enabling auto-merge. The PR records the missing
  GitHub App prerequisite and remains intentionally draft until the real
  provider-backed Attempt and PR evidence can be captured.

### 2026-08-15 - Live GitHub App proof and recovery completion

**By:** Codex

**Actions:**

- Verified existing GitHub App `mission-control-factory-jaywest` (App ID
  `4543062`), installation `152563527`, and write access to
  `jaydubya818/MissionControl` through the file-path-only private-key boundary.
- Preserved the first verified candidate
  `fce59feebea4b252475a85e457308cd6d17e7d1d` and product PR #99 as immutable
  mismatch history after GitHub reported the PR merged before WorkOrder
  acceptance. The exact provider state blocked acceptance as designed.
- Persisted failed corrective Attempt `my58fx3y`, including its executor/control
  plane handoff failure, then created corrected Attempt `wpojr68o` from approved
  WorkOrder revision 4 without rewriting the failed Attempt.
- Published corrected candidate
  `5cdf9ce9443419002de0fecb9a49b19f0fb3b398` as App-authored product PR #101.
  PR #101 remains open and is attributable to Attempt `wpojr68o`.
- Independently verified the exact candidate with verification run
  `kx7m4n43x67c10da2frwaat5958cg0tz`, receipts
  `ks7z6x4ej0rvys108yseem7wes8ch85y` and
  `ks7ttrfgfhfbqdf2zj8n0yvqcs8cgs2f`, and evidence envelopes
  `qh76tvaqyw9f2at07hds94520s8cg6xe`,
  `qh775vem58t3k4gcb0thzyef4h8cg8g0`, and
  `qh799rtr79ebvaq2c1694adem98ch1rd`.
- Ingested exact GitHub CI evidence `sn7ew5c29xb5r43jdxjtwwvfys8ch584`.
  The authoritative review package is `READY` and acceptance eligibility is
  true, while `workOrders.accept` remains an uninvoked explicit boundary.

**Validation:**

- Focused Convex governance/contract tests: 59 passed.
- Focused UI tests: 12 passed; focused orchestration lifecycle tests: 5 passed.
- Full repository test suite: all workspace suites passed, including 256 UI,
  59 orchestration (1 integration skipped), and 566 Convex tests.
- Real-backend Chromium E2E passed after refresh against the durable Mission,
  WorkOrder, Attempt, candidate, evidence, PR, and eligibility records.
- Lint, TypeScript, skill lint, runtime-contract guard (v20 to v21), production
  build, and orchestration startup smoke passed.
- Read-only exe.dev doctor confirmed authentication, zero live VMs, and capacity
  `0/0`; the remote rollout remains blocked with no allocation attempted.

**Outcome:**

- The local Mission-to-PR V1 golden path is complete. No WorkOrder acceptance,
  product PR merge, remote VM creation, paid-capacity change, or remote provider
  integration was performed by this completion pass.
