# Generic Harness Contract V1

## Decision

Mission Control will treat a coding harness as replaceable execution
infrastructure beneath the existing `WorkOrder -> Attempt -> canonical worker ->
independent verification -> publication -> acceptance` lifecycle.

The generic boundary is intentionally smaller than the control plane. A harness
may prepare and run an already-approved Attempt, emit diagnostic events, return
a normalized candidate result, accept cancellation, and clean up its own runtime
resources. It cannot claim a worker lease, change the frozen WorkOrder or
execution manifest, certify verification, publish a branch or pull request,
accept evidence, merge, release, write authoritative memory, define
observability truth, or approve learning changes.

`codex/v1` remains the only adapter registered by the production orchestration
server in this initiative. DeepSeek Harness, Loom, and future harnesses become
integrable by implementing and registering the same contract; this change does
not claim that those production adapters are shipped.

## Evidence used

The standalone lab at `/Users/jaywest/mission-control-harness-lab` was inspected
read-only. It demonstrated that two independently implemented real harnesses can
conform to the same five-stage lifecycle:

```text
prepare -> execute -> collectResult -> cleanup
                  \-> cancel
```

The lab also showed that capability differences must remain explicit and that
harness completion or final prose must never become verification. None of the
lab source, manifests, schemas, process wrappers, or provider configuration is
copied into Mission Control.

Mission Control's existing production seams remain authoritative:

- `factory-execution-manifest/v1` freezes the exact adapter/version, repository
  scope, prompt, model route, isolation, timeout, and control-plane-only pull
  request authority.
- Factory worker registration advertises supported adapter/version pairs and
  isolation modes.
- Factory readiness and dispatch bind an exact current worker to the selected
  immutable Factory version.
- The canonical worker owns the Attempt lease and independently checks changed
  file scope.
- Verification, publication permits, pull-request creation, acceptance, release,
  memory, observability, and learning remain outside the harness.

No relevant institutional solution documents exist under `docs/solutions/` on
the qualified baseline.

## Contract

`HarnessExecutorAdapter<TPrepared, THandle>` owns two adapter-private values:

- a prepared execution created from the bounded `ExecutorRequest` and runtime
  callbacks;
- a live handle returned after execution starts.

It implements:

1. `prepare` to validate and freeze adapter-private launch input;
2. `execute` to start the harness and return an opaque handle;
3. `collectResult` to normalize the terminal candidate result;
4. `cancel` to request bounded cancellation of that exact handle;
5. `cleanup` to dispose owned resources idempotently.

Capability discovery, configuration validation, estimation, and health remain
part of the boundary because existing Factory readiness and operator surfaces
depend on them.

Every adapter declares `generic-harness-contract/v1` and an all-`NONE` authority
profile. The registry rejects duplicate identities, malformed capabilities, or
any adapter claiming worker, verification, publication, acceptance, memory,
observability, or learning authority.

## Runtime selection

The orchestration server owns an immutable adapter registry keyed by the exact
`adapter/version` pair. The Factory worker resolves the adapter only after the
claimed manifest is proven to match the Attempt's frozen executor binding. An
unsupported or mismatched run is not claimed by that worker.

The registry also carries an optional remote-sandbox invocation builder. This is
transport configuration only: the existing sandbox provider, credential broker,
supervisor, result validation, teardown proof, and publication gate remain
unchanged. A worker that advertises the remote backend must not register an
adapter without that builder.

## Compatibility

- Runtime contract remains `v26`; no Convex public argument or return contract
  changes.
- `factory-execution-manifest/v1` and `factory-result/v1` remain unchanged.
- Existing persisted `codex/v1` Factory versions and Attempts remain valid.
- Default UI creation continues to select `codex/v1`; generic harness selection
  UI and production DeepSeek/Loom adapters are separate initiatives.
- The full `pnpm run qualify:factory` suite remains the release gate.

## Failure behavior

- Duplicate or authority-bearing adapter registrations fail at process startup.
- Unsupported adapter/version pairs remain unclaimed for another eligible
  worker; they cannot fall back to Codex.
- A run/manifest/registry identity mismatch fails before harness execution.
- Adapter failure, cancellation, timeout, malformed output, scope violation, or
  cleanup failure remains an Attempt failure and cannot reach verification or
  publication.
- Harness events and results are diagnostic candidate data. Existing independent
  receipts remain the only verification authority.

## Known limitation

This initiative proves the production contract and Codex migration, not the
operational readiness of DeepSeek Harness or Loom. Each future production
adapter still requires pinned runtime provenance, credential brokering, sandbox
compatibility, cancellation and cleanup conformance, worker health evidence, and
the unchanged System Qualification gate.
