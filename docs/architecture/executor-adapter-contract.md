# Executor adapter contract

## V1 identity

Production executors implement `generic-harness-contract/v1`. `codex/v1` remains
the default adapter. Exact `deepseek-harness/0.2.0` can be registered only when
its experimental feature flag is enabled; Loom identities remain contract
fixtures because no real pinned Loom adapter is installed.
The exact adapter/version is selected by the immutable Factory version,
advertised by a current canonical worker, frozen in the Attempt manifest, and
resolved without fallback from the worker's adapter registry.

An adapter executes an already-approved, already-dispatched WorkOrder Attempt.
Its declared worker, verification, publication, acceptance, memory,
observability, and learning authority must all be `NONE`. The registry rejects
any adapter that claims otherwise. See [Generic Harness Contract
V1](generic-harness-contract-v1.md) for the integration decision and evidence.

## Required surface

`HarnessExecutorAdapter` defines:

- capability discovery, including mutation and isolation support;
- configuration validation before process start;
- an explicitly low-confidence cost/runtime estimate;
- opaque `prepare -> execute -> collectResult -> cleanup` lifecycle values;
- cancellation of the exact opaque live handle;
- ordered structured execution events;
- health/readiness reporting.

The contract lives in `packages/workflow-engine/src/executorAdapter.ts`. The real
runtime implementations are `CodexV1ExecutorAdapter` and the optional
`DeepSeekHarnessExecutorAdapter` in the orchestration server.
The orchestration registry owns exact runtime selection and an optional bounded
remote-sandbox invocation builder; it does not own control-plane policy.

## Repository sandbox

Each request carries an absolute repository root, an absolute working directory
inside that root, repository-relative allowed paths, timeout, model, and explicit
`READ_ONLY` or `WORKSPACE_WRITE` isolation. Validation rejects path traversal,
work outside the repository root, empty scope, missing prompts, and unbounded
timeouts. Codex runs ephemerally with the matching CLI sandbox mode.

The Factory worker creates or reconciles the exact server-owned `mc/` branch in
the frozen attempt worktree. After Codex returns, it compares both committed and
uncommitted changes to the frozen include/exclude scopes. Any deviation creates
a reviewable artifact, fails the attempt, and blocks GitHub token issuance and
PR creation.

## Frozen execution manifest

Every new Factory version binds active repository code scopes and one approved
agent version for each workflow agent. Dispatch compiles one immutable
`factory-execution-manifest/v1` containing causation IDs, WorkOrder revision,
Factory digest, repository/branch/worktree authority, prompt and context hashes,
per-step agent genome/prompt/tool/model identities, timeout, isolation, and the
`factory-result/v1` completion contract. The full compiled prompt is available
only through the signed claim boundary; public run queries and the inspector
return its hash but redact its content.

## Event and secret rules

Events are ordered per execution and use these stable types: execution start,
command start/completion, artifact produced, execution completion/failure/cancel.
Successful event metadata contains runtime facts, not process environment or
credentials. Failure text is bounded and redacts common credential labels.

The child process may receive runtime credentials required by Codex. Those values
must never be written to Mission Control records, artifacts, command receipts,
or application logs.

## Recovery

Generic Harness Contract V1 preserves the qualified recovery policy: cancel and
bounded retry are enabled, while pause and in-process resume remain disabled.
An individual adapter may describe richer native capabilities, but this
initiative does not grant the Factory new recovery authority.
The control plane does support crash reconciliation: an expired durable lease
can be reclaimed against the same immutable manifest, branch, and worktree, and
branch push / PR creation are idempotent. Once an attempt reaches a terminal
state, recovery creates a new bounded WorkOrder attempt referencing the prior
failed/canceled attempt.

Set `FACTORY_EXECUTION_ENABLED=1` on the orchestration server to enable the
polling worker. `FACTORY_EXECUTION_POLL_MS` may be set between 5 seconds and 5
minutes; the default is 15 seconds. Startup polls both pending and running bound
attempts, while the durable lease prevents duplicate execution across workers.
