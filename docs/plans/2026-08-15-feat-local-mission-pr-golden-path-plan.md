---
title: "feat: Complete the local Mission-to-PR golden path"
type: feat
status: active
date: 2026-08-15
---

# Complete the Local Mission-to-PR Golden Path

## Overview

Finish one browser-operable V1 delivery path using the existing local Factory
executor and hardened local Docker validation substrate. The path starts from
an approved Mission plan, freezes one Factory version into each Attempt,
commits an immutable candidate before independent verification, persists
attributable evidence, publishes through the configured GitHub App, and leaves
final acceptance at the existing `workOrders.accept` boundary.

The remote provider remains parked behind the existing exe.dev rollout gate.
This work does not introduce a VM abstraction, remote execution, paid capacity,
provider credentials, or public networking.

## Problem Statement

The repository already contains the difficult execution pieces: immutable
Factory versions, durable Attempts, a local executor, candidate commits,
server-owned verification, evidence envelopes, GitHub App publication, exact
PR/head CI lineage, retry history, and an evidence-first run inspector.

The remaining V1 gap is integration:

- Mission-plan release records an implementation policy as metadata but does
  not materialize the enforced verification contract and change budget needed
  by the existing Factory worker.
- Mission assertion governance recognizes only a separate Validator WorkOrder,
  even when the Factory verifier is demonstrably independent from the worker
  that generated the candidate.
- WorkOrder acceptance evaluates approvals and criterion receipts, but does not
  yet require the unified exact-candidate PR review package for Factory-owned
  Attempts.
- The browser exposes the individual records, but the operator needs a single
  evidence-first decision summary connecting Factory version, Attempt,
  candidate SHA, verification, evidence, GitHub PR, retry lineage, and
  acceptance eligibility.

## Architecture Decisions

### Immutable candidate identity

Use the existing local commit created by `factoryGitRuntime` as the immutable
candidate identity. The worker records the exact candidate SHA before invoking
the independent verifier and asserts that the SHA is unchanged before GitHub
publication. Verification must never bind to a mutable worktree or an
unresolved branch head.

Do not add a draft-PR-before-verification lifecycle in this pass. The current
authority model deliberately withholds provider publication until local
verification and any required human publication review pass. The resulting PR
must still point to the exact verified candidate SHA.

### Independent verification

Add one structured, exact-argv independent verification definition to the
Mission implementation policy. Plan approval materializes that definition into
the WorkOrder's enforced `verificationContract`, evidence requirements, change
budget, and human-review gate.

A Mission assertion that requires independent validation may be satisfied by a
Factory verification receipt only when the receipt is bound to the completed
Attempt and current WorkOrder revision, carries durable evidence, and the
verifier identity differs from the executor identity. A separate Validator
WorkOrder remains supported for plans that choose it; it is no longer required
solely to represent a verification process the Factory already separates.

### Acceptance boundary

Keep `workOrders.accept` as the only WorkOrder acceptance mutation. For a
Factory-bound Attempt it must additionally require a `READY` unified review
package: completed current Attempt, exact candidate gate receipt, durable
criterion evidence, expected repository and branch, open GitHub App PR, exact
head CI pass, changed-file lineage, and rollback guidance. The browser may
explain eligibility but may not calculate or override it.

### Recovery

A mismatched candidate, PR head, Attempt identity, or CI record blocks
acceptance and remains durable evidence on the failed historical Attempt. A
retry creates a new immutable Attempt using the existing retry lineage. The new
candidate is independently verified and published without mutating the prior
Attempt, receipts, envelopes, or PR attribution.

## Implementation Phases

### Phase 1 — Compile Mission intent into an executable WorkOrder

- [ ] Add a structured independent-verification command to the Mission plan
      contract, validators, schema, and browser editor.
- [ ] Materialize requirements, independent evidence requirements, a bounded
      change budget, negative constraints, the enforced verification contract,
      rollback guidance, and explicit human review at plan release.
- [ ] Permit the server-owned independent verifier to satisfy Mission assertion
      independence only when executor/verifier separation and exact Attempt
      lineage are proven.
- [ ] Preserve explicit Validator WorkOrders as a supported stronger plan shape.

### Phase 2 — Make candidate eligibility authoritative

- [ ] Reuse one server-side review-package loader for the run inspector,
      WorkOrder read model, and acceptance mutation.
- [ ] Return an authoritative acceptance-eligibility projection with actionable
      blockers.
- [ ] Require a `READY` exact-candidate review package in `workOrders.accept`
      for governed Factory Attempts while preserving legacy behavior elsewhere.
- [ ] Keep GitHub App installation identity as PR identity and treat minted
      installation tokens as opaque values.

### Phase 3 — Complete the browser operator path

- [ ] Show the selected active Factory version before dispatch and persist it
      immutably on the Attempt.
- [ ] Add an evidence-first candidate decision summary to the existing
      WorkOrder/Mission execution flow; do not add another navigation domain.
- [ ] Show Attempt/executor/runtime status, independent verification, evidence
      IDs, exact candidate SHA, GitHub PR lineage, CI head, retry lineage, and
      acceptance eligibility from backend records.
- [ ] Make mismatch, blocked acceptance, retry, recovered candidate, and
      retained historical evidence understandable after refresh.

### Phase 4 — Prove happy path and recovery

- [ ] Add focused contract, Convex, orchestration, UI, and browser coverage for
      Mission creation through acceptance eligibility.
- [ ] Exercise one real local success path with a GitHub App PR.
- [ ] Exercise one safe candidate/PR mismatch, prove acceptance is blocked,
      persist failure evidence, create a new Attempt, independently verify the
      corrected candidate, and retain prior evidence and PR lineage.
- [ ] Capture durable IDs and browser evidence for the final report.

### Phase 5 — Validate and publish

- [ ] Run focused tests, Convex tests, orchestration tests, UI tests, browser
      E2E, lint, TypeScript typecheck, runtime-contract guard, production build,
      and repository-standard smoke checks.
- [ ] Confirm exe.dev remains `max_vms: 0` with zero live VMs and no remote
      Phase 1 activity.
- [ ] Commit on `codex/local-mission-pr-golden-path`, push, and open a draft PR.
- [ ] Mark the PR ready only when the complete golden-path evidence is green;
      do not merge it automatically.

## Acceptance Criteria

- [ ] An operator can create/select a Mission, approve its plan, inspect the
      intended Factory version, dispatch the released WorkOrder, and follow the
      real backend Attempt from the browser.
- [ ] The exact candidate SHA exists before independent verification and remains
      unchanged through publication.
- [ ] Verification is performed by an identity distinct from the executor and
      persists attributable evidence envelopes and receipts.
- [ ] The GitHub App publishes the PR and the recorded open PR/CI head matches
      the verified candidate SHA.
- [ ] Acceptance eligibility is computed server-side and `workOrders.accept`
      rejects incomplete or mismatched Factory lineage.
- [ ] The mismatch path retains immutable failure evidence and creates a new
      retry Attempt with attributable corrected lineage.
- [ ] Browser state survives refresh because Convex records, not local UI state,
      remain authoritative.
- [ ] Remote sandbox/provider integration stays gated at exe.dev
      `max_vms: 0`; no paid or production-provider action occurs.

## Risks and Mitigations

- **Accidental governance weakening:** add Factory review-package checks inside
  the acceptance mutation; UI readiness is explanatory only.
- **Verifier identity ambiguity:** persist and compare executor and verifier
  identities before Mission assertion synchronization and acceptance.
- **Mutable provider lineage:** exact Attempt, repository, branch, PR URL,
  candidate SHA, and CI head must all match in one review package.
- **Legacy plan compatibility:** retain the existing Validator WorkOrder path
  and fail old incomplete mutating plans closed at submission/release.
- **External GitHub App prerequisite:** never substitute a user PAT. If the
  repository-scoped App installation/private key is unavailable, complete all
  local work and report the real provider proof as a blocker.
- **Scope expansion:** reuse the existing executor, worker, verifier, evidence,
  PR publisher, retry, Mission, and WorkOrder surfaces. Do not build a new
  scheduler, VM layer, or acceptance mechanism.

## References

- `docs/product/mission-control-north-star.md`
- `docs/plans/2026-08-12-feat-browser-governed-factory-dispatch-plan.md`
- `docs/plans/2026-08-11-feat-verification-first-completion-plan.md`
- `docs/software-factory/domain-contracts.md`
- `docs/software-factory/verification-first-workorder-contract.md`
- `docs/software-factory/durable-codex-github-pr.md`
- `docs/architecture/remote-sandbox-execution.md`
- `docs/security/remote-sandbox-threat-model.md`
- `docs/solutions/build-errors/missing-convex-schema-contracts-ci-20260730.md`
