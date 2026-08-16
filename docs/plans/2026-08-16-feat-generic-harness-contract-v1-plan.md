---
title: "feat: Generic Harness Contract V1"
type: feat
status: completed
date: 2026-08-16
---

# Generic Harness Contract V1

## Baseline

- Origin baseline: `b3247cbbb7a06ccf5bae17b03fe1f67baa2ff248`
- Runtime contract: `v26`
- System Qualification V1: PASS WITH KNOWN LIMITATIONS
- Factory qualification: 12/12 segments passed
- Required invariant: `pnpm run qualify:factory` remains green

## Problem

The frozen Factory manifest and worker capability model already name executors
by provider-neutral `adapter/version` pairs, but production execution still
hard-codes `codex/v1` in worker composition, claim validation, readiness, and
dispatch. That prevents a conforming harness from replacing Codex without
editing the canonical lifecycle.

## Proposed solution

Introduce a five-stage, execution-only generic harness adapter contract and an
exact-identity orchestration registry. Migrate Codex to the contract, resolve the
frozen adapter per Attempt, and remove only the hard-coded Codex admission
checks. Preserve all existing worker, verification, publication, acceptance,
memory, observability, and learning authorities.

## Spec-flow analysis

The material flows and edge cases are:

1. A current worker advertises one or more exact adapter/version capabilities.
2. Readiness and dispatch select a worker supporting the Factory version's exact
   binding; no vendor name is inferred.
3. The canonical worker claims the Attempt under the existing lease.
4. The worker proves run, manifest, and registry identities agree before
   preparation.
5. The adapter prepares, starts, returns a normalized candidate result, and
   cleans up. Cancellation targets the opaque live handle.
6. Existing scope, independent verification, publication-permit, and terminal
   gates consume the candidate exactly as before.

Failure permutations that must be deterministic: duplicate registration,
unsupported identity, manifest mismatch, adapter failure, cancellation, cleanup
failure, malformed output, repository scope violation, remote adapter without a
remote builder, and process restart/reclaim. None may fall back to another
adapter or bypass the existing gates.

## Implementation tasks

- [x] Define and test `generic-harness-contract/v1`, opaque lifecycle types,
      explicit zero-authority capabilities, and the lifecycle runner in the
      workflow engine.
- [x] Add and test an immutable exact-identity harness adapter registry,
      including duplicate, authority, and remote-backend rejection.
- [x] Migrate `CodexV1ExecutorAdapter` to the generic lifecycle without changing
      its sandbox, environment filtering, cancellation, process ownership,
      result, or event behavior.
- [x] Resolve the frozen adapter in `FactoryAttemptWorker`, make event and trace
      projection harness-neutral, and preserve all scope/verification/
      publication behavior.
- [x] Generalize Factory version validation, readiness, dispatch, and claim
      checks to the exact worker-supported adapter binding while keeping the
      existing V1 recovery policy.
- [x] Compose and advertise the registry from the orchestration server; Codex is
      the only default production registration.
- [x] Update architecture and operational documentation without changing
      runtime contract `v26`.
- [x] Run focused workflow-engine, orchestration, and Convex contract tests.
- [x] Run `pnpm run qualify:factory` and record all 12 segment results.
- [x] Review the final diff for authority expansion, scope creep, generated
      evidence churn, and runtime-contract drift.

## Acceptance criteria

- [x] Codex executes through the generic five-stage contract.
- [x] Independent fixture adapters using DeepSeek and Loom identities can be
      registered and selected without worker lifecycle code changes.
- [x] Unsupported or mismatched identities never fall back to Codex.
- [x] Adapter capabilities cannot claim any canonical authority.
- [x] Existing remote-sandbox Codex execution remains supported through a
      bounded adapter-owned invocation builder.
- [x] Persisted manifest/result schemas and runtime contract stay unchanged.
- [x] No new primary UI, navigation, provider dependency, credential, model, or
      production harness is added.
- [x] `pnpm run qualify:factory` passes all 12 segments.

## Validation record

- Focused workflow-engine, orchestration registry/adapter/worker, durable-worker,
  observability, and Convex configuration/dispatch tests: PASS.
- Full repository typecheck: PASS.
- `pnpm run qualify:factory`: PASS, 12/12 segments.
- Runtime-contract guard: PASS; no public Convex validator changes across 899
  functions and runtime contract remains `v26`.
- Production build and orchestration startup smoke: PASS.

## Risks and mitigations

- **Authority leakage:** enforce an all-`NONE` authority profile in the registry
  and retain all existing control-plane gates.
- **Silent fallback:** resolve exact frozen identities and reject duplicates.
- **Lifecycle cleanup regression:** make cleanup mandatory/idempotent and retain
  Codex process-group tests.
- **Remote/local capability mismatch:** require a remote invocation builder when
  a registry is used by a worker advertising the remote backend.
- **Runtime drift:** avoid Convex public contract changes and run the v26 guard in
  the full qualification suite.

## References

- `docs/architecture/executor-adapter-contract.md`
- `packages/workflow-engine/src/executorAdapter.ts`
- `apps/orchestration-server/src/codexExecutorAdapter.ts`
- `apps/orchestration-server/src/factoryAttemptWorker.ts`
- `convex/lib/executionManifest.ts`
- `convex/lib/factoryWorkerRuntime.ts`
- `/Users/jaywest/mission-control-harness-lab/docs/recommendation.md`
- `/Users/jaywest/mission-control-harness-lab/docs/real-harness-conformance-v2.md`

## Post-Deploy Monitoring & Validation

- **Logs:** search orchestration logs for `factory-worker`, `harness adapter`,
  `unsupported`, `manifest is invalid`, and cleanup failures.
- **Healthy signals:** worker heartbeat advertises `codex/v1`, Factory readiness
  passes, Attempt claims retain exact executor identity, and qualification stays
  12/12.
- **Failure signals:** duplicate registration, a manifest/Attempt identity
  mismatch, an eligible Attempt remaining unclaimed, cleanup failure, or any
  publication without a current verification receipt.
- **Rollback trigger:** any authority-gate regression, runtime-contract drift, or
  Factory qualification failure. Revert this change and restore the single
  Codex adapter composition.
- **Window and owner:** first 24 hours after deployment; Mission Control operator.
