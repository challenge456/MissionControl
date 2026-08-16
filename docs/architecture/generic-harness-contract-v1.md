# Generic Harness Contract V1

## Decision

Mission Control integrates a provider-neutral execution contract beneath its
existing governed Factory lifecycle. Codex and DeepSeek Harness implement the
same opaque lifecycle and normalized result. DeepSeek remains optional,
experimental, disabled by default, and local persistent-worker only.

Harnesses are replaceable execution infrastructure. Mission Control remains
authoritative for WorkOrders, Attempts, worker admission and leases, sandbox
policy, Verification Subjects and Plans, evidence/currentness, publication
permits, GitHub publication, acceptance, memory, observability, and learning.

The implementation started from `origin/main`
`3de80b97c7272f64586e5d08bc7c73fcd2114faa` and was later reconciled onto
`6800ab39b09691c3b64b3f621d6d00be293e87c9`, which already contained the
smaller generic lifecycle and registry from PR #112. This initiative extends
that seam; it does not introduce a second executor framework and does not copy
the standalone Harness Lab into Mission Control.

## Existing architecture audit

| Existing concept | Generic Harness equivalent | Disposition |
| --- | --- | --- |
| `HarnessExecutorAdapter` and `runHarnessExecution` | Opaque `prepare -> execute -> collectResult -> cleanup`, with handle-scoped `cancel` | Keep as the single lifecycle |
| `HarnessAdapterRegistry` | Exact adapter/version runtime selection | Keep and extend with validated adapter-effective manifests |
| `CodexV1ExecutorAdapter` | Concrete real harness adapter | Consolidate behind the shared result and capability contracts |
| `FactoryAttemptWorker` | Governed host around the adapter | Keep worker lease, candidate checks, verification, and publication outside adapters |
| `factory-execution-manifest/v1` | Frozen harness/model/backend/requirements snapshot | Add manifest and effective-config provenance without creating a parallel manifest |
| `workspaceHostBindings.workerRuntime` | #102-style capability advertisement | Extend exact executor admission with manifest/config/model/capability matching |
| `RemoteSandboxRuntime` | Execution backend and external sandbox | Keep unchanged; only Codex advertises the existing remote invocation builder |
| canonical traces and trace observations | Harness lifecycle/usage diagnostics | Reuse; do not add a telemetry store |
| Factory Learning signals | Advisory harness context | Reuse as diagnostic metadata with no routing mutation authority |
| agent configuration registry `.loom/**` discovery | Loom configuration inventory | Keep separate; it is not a Loom runtime adapter |

The older durable Codex worker remains compatible and calls the same lifecycle
runner, but new governed Factory dispatch uses the exact registry and frozen
manifest admission path.

## Generic contract

`HarnessExecutorAdapter<TPrepared, THandle>` retains the already-merged methods:

1. `prepare(request, context)` validates and freezes adapter-private launch
   state;
2. `execute(prepared)` starts one exact execution and returns an opaque handle;
3. `collectResult(handle)` returns the provider-neutral executor result;
4. `cancel(handle, reason)` requests cancellation of that handle and reports
   whether a new request was issued;
5. `cleanup(handle)` disposes owned resources idempotently.

Capability discovery, validation, estimation, remote invocation construction,
and health remain supporting methods because current readiness and worker
composition already use them. The generic contract contains no local process,
DeepSeek patch, Codex JSONL, provider SDK, or credential-home fields.

Each adapter declares `generic-harness-contract/v1` and an all-`NONE` authority
profile. The registry rejects malformed identities, duplicates, authority
claims, backend/invocation mismatches, and disagreement between the concise
runtime capabilities and the full adapter-effective manifest.

## Capability manifest

`harness-capability-manifest/v1` describes effective adapter behavior, not all
features that an upstream harness might theoretically expose. It includes:

- exact harness, source commit, adapter, version, and effective configuration
  digest;
- admitted provider/model routes and reasoning controls;
- filesystem, shell, Git, browser, tools, and subagent support;
- event streaming, structured output, context, headless, cancellation, and
  cleanup behavior;
- sandbox, network, and credential requirements;
- telemetry availability, including explicitly unsupported values;
- maturity, supported backends, required external controls, prohibited
  authorities, and limitations.

The Factory Version stores the full manifest plus its canonical digest and the
effective configuration digest. The Attempt execution manifest repeats the
exact identity, provider/model route, backend, isolation, and required generic
capabilities. A canonical worker must advertise the same adapter/version,
manifest digest, effective config digest, model route, isolation, backend, and
minimum capability levels before server-owned admission succeeds.

Legacy stored Factory versions may resolve the known exact `codex/v1` manifest;
new versions always freeze the explicit manifest. Legacy host reports without
manifest provenance remain readable but are ineligible for new exact admission.

## Normalized result

Concrete adapters attach `harness-result/v1` to the existing `ExecutorResult`.
The bundle contains:

- execution status and timing;
- exact harness/config/request provenance;
- changed files, Git baseline/head, and scope deviations observed by the host;
- bounded lifecycle events and tool activity;
- input/output/cache token usage, cost, model requests, retries, and session
  count where available;
- exit code, signal, cancellation, cleanup outcome, structured summary, output,
  and bounded scalar provider metadata.

Unavailable telemetry is `null`; adapters never manufacture a zero. Provider
metadata accepts at most 50 scalar entries with bounded keys and values. The
worker validates result schema and frozen identity before storing a redacted,
bounded diagnostic artifact. Repository state is still recomputed by Mission
Control, and harness `COMPLETED` status never counts as verification evidence.

## Concrete adapters

| Adapter | Exact runtime | Effective route | Backend and limitations |
| --- | --- | --- | --- |
| `codex/v1` | Codex CLI `0.146.0`, source `e363b08c9175ac1cbe5893615dd2cb9ddf95043b`, evaluated Darwin arm64 binary digest | `openai/gpt-5.6-terra`; controlled existing model pass-through remains explicit | Persistent worker and existing remote sandbox; cost/model-request/retry telemetry unavailable; cancellation is process-signal based |
| `deepseek-harness/0.2.0` | DeepSeek Harness `0.1.0-rc.5`, source `47f943859bef60e4160492346772ded9b24f765a`, exact built CLI digest | Ollama `0.32.6`, `local-ollama/qwen3.5:35b-a3b-q8_0`, exact model digest | Experimental persistent worker only; disabled unless explicitly enabled; weaker headless streaming, no cost, process-signal cancellation, host-enforced scope |

Both adapters use allowlisted child environments, owned process groups,
SIGTERM-to-SIGKILL escalation, canonical cancellation results, and idempotent
cleanup. Neither receives Mission Control service secrets, GitHub App
credentials, publication permits, acceptance authority, or unrelated
provider-admin credentials.

The integrated Codex identity remains `codex/v1` to preserve existing Factory
versions and Attempts. This compatibility ID is distinct from the standalone
lab adapter package version `0.2.0` used to establish conformance.

## Loom compatibility

Loom is **requires future work** at the runtime boundary.

- Clean fit: current executor identity, observations, learning source enums, and
  `.loom/**` configuration discovery are already provider-neutral.
- Adapter fit: an exact Loom runtime could implement the shared opaque lifecycle,
  manifest, normalized result, and health/remote invocation declarations without
  changing the worker control plane.
- Future work: there is no installed, pinned, authenticated real Loom runtime
  adapter in this repository, so cancellation, cleanup, result provenance,
  credentials, sandbox behavior, and model telemetry are unproven.

Loom fixtures remain contract and observability tests only. V1 does not register
or advertise Loom and does not destabilize its external path to claim parity.

## Product and data changes

- Basic Factory mode hides harness implementation detail.
- Intermediate shows a concise harness strategy alongside model, verification,
  retries, and backend.
- Advanced allows exact eligible selection and shows adapter/source identity,
  backend, cancellation mode, telemetry availability, and limitations.
- Existing run inspection shows frozen harness/config provenance. No top-level
  navigation area is added.
- Factory Learning receives bounded harness identity as advisory metadata only;
  it cannot change routing or configuration.

Factory Version schema additions are optional for stored-record compatibility.
The canonical worker report adds exact manifest/config fields, so the public
`workspaceHostBindings.report` contract advances the dynamically extracted
runtime contract from `v26` to `v27`.

## Failure behavior and rollback

- Unsupported or stale exact identities never fall back to Codex.
- Experimental DeepSeek selection requires a current eligible worker at version
  creation and again at readiness, dispatch, and claim.
- Invalid configuration, spawn failure, timeout, cancellation, malformed output,
  normalized-result mismatch, scope deviation, or cleanup failure cannot reach
  publication.
- Independent Verification Attempts, exact-current receipts, and publication
  permits remain mandatory before GitHub App publication and acceptance.

DeepSeek can be disabled independently by clearing
`DEEPSEEK_HARNESS_EXECUTOR_ENABLED`. An orphan process, credential-redaction
failure, manifest mismatch, worker lease anomaly, or authority regression is a
rollback trigger.

## Deliberate V1 limits

- DeepSeek is developer-preview infrastructure and is not a remote-sandbox
  executor.
- The existing remote supervisor still has a Codex-oriented invocation/result
  wire contract even though admission and the host lifecycle are generic.
- The exact Codex executable integrity check currently admits Darwin arm64.
- Autonomous harness routing is not introduced. Factory Version selection keeps
  harness routing separate from model routing.
- No live Loom conformance claim is made.
