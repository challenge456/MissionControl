---
status: complete
priority: p1
issue_id: "031"
tags: [software-factory, recovery, evidence, browser, v1]
dependencies: ["024"]
---

# Complete V1 Operational Hardening

## Problem Statement

The Mission golden path can create a governed review-ready pull request, but V1
still needs explicit stale-lease recovery evidence, one fail-closed review
package, and final browser-state hardening before unattended overnight work is
trustworthy.

## Findings

- The durable worker already reclaims expired leases and reuses its worktree,
  branch, commit, and pull request idempotently.
- Recovery lineage fields exist on `workflowRuns` but the durable worker does not
  currently populate or present them.
- Verification receipts, PR checks, artifacts, events, file changes, and lineage
  are durable but fragmented in the inspector.
- A missing inspector record is currently indistinguishable from loading.
- The single-repository V1 path should be hardened before scaling or adding
  providers.

## Proposed Solutions

### Option 1: Add separate recovery and evidence services

**Pros:** Independent ownership and future scale boundaries.

**Cons:** Duplicates the authoritative run and evidence state before V1 needs it.

**Risk:** High.

### Option 2: Extend the existing run lease and derive one review package

**Pros:** Preserves one lifecycle, one evidence source, and the proven browser
surface while closing the operational gaps directly.

**Cons:** The inspector query and UI gain a bounded amount of responsibility.

**Risk:** Medium.

## Recommended Action

Implement Option 2 using
`docs/plans/2026-08-11-feat-v1-operational-hardening-plan.md`. Keep merge,
deployment, additional connectors, and hundred-agent scheduling outside scope.

## Acceptance Criteria

- [x] Expired execution leases create a bounded, reasoned, idempotent recovery record.
- [x] Recovery preserves the exact authority, checkpoint, worktree, branch, and publication lineage.
- [x] Recovery count, prior claim, reason, lease state, and next action are visible after refresh.
- [x] A deterministic review package binds the exact WorkOrder revision, run, commit, PR, CI, files, deviations, risks, rollback guidance, and criterion evidence.
- [x] Missing, failed, stale, pending, or conflicting evidence blocks review readiness.
- [x] The worker cannot self-certify independent evidence or merge readiness.
- [x] Loading, missing, blocked, recovery, canceled, failed, success, and review-ready browser states are explicit and actionable.
- [x] Desktop, narrow, keyboard, refresh, console, and critical accessibility verification pass.
- [x] Focused tests, full CI-equivalent checks, production build, and browser evidence pass.

## Work Log

### 2026-08-11 - Implementation started

**By:** Codex

**Actions:**

- Reconciled and merged the durable Mission-to-GitHub golden path in PR #67.
- Confirmed PR #64 was already merged and PR #68 was already contained in main.
- Closed proof PRs #61–#63 as preserved, superseded audit artifacts.
- Audited the current lease recovery, run inspector, verification receipt, PR
  check, artifact, and evidence-lineage contracts.
- Selected the bounded extension in the linked implementation plan.

**Learnings:**

- Restart recovery mechanics exist; the missing work is truthful recovery
  provenance and operator presentation, not another worker.
- The review package should be derived from durable records so no execution
  identity can overstate completion.

### 2026-08-11 - Implementation completed

**By:** Codex

**Actions:**

- Added reasoned, idempotent stale-lease recovery records and checkpoint
  artifacts without expanding the original Attempt authority.
- Added one derived review package with exact revision, commit, pull request,
  open-state, CI, file, risk, rollback, and acceptance-evidence binding.
- Enforced independent verification and open pull-request state before review
  readiness.
- Added authorized, refresh-stable inspector deep links and explicit missing-run
  handling.
- Verified completed, incomplete, blocked, failed, canceled, missing, refresh,
  keyboard, narrow, and console states in the browser.
- Recorded screenshots and the complete verification matrix in
  `docs/testing/evidence/v1-operational-hardening/README.md`.
- Passed the Node 20 full test suite, typecheck, runtime-contract guard, lint,
  and production build.

**Learnings:**

- Historical proof artifacts are useful audit evidence but must not be treated
  as active review candidates after their pull requests close.
- Exact-head CI alone is insufficient: review readiness also needs current
  provider PR state and verification identity separation.
