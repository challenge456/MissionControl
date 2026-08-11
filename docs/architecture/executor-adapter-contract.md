# Executor adapter contract

## V1 identity

The only production executor selected for V1 is `codex/v1`. Deterministic fake
adapters are test fixtures only. The adapter executes an already-approved,
already-dispatched WorkOrder attempt; it cannot approve a plan, widen repository
scope, activate a Factory, accept evidence, merge a pull request, or release.

## Required surface

`ExecutorAdapter` defines:

- capability discovery, including mutation and isolation support;
- configuration validation before process start;
- an explicitly low-confidence cost/runtime estimate;
- execution with ordered structured events;
- cancellation and declared resume support;
- health/readiness reporting.

The contract lives in `packages/workflow-engine/src/executorAdapter.ts`. The first
runtime implementation is `CodexV1ExecutorAdapter` in the orchestration server.

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

`codex/v1` supports cancel and does not claim pause or in-process resume support.
Factory readiness rejects configurations that advertise those capabilities.
The control plane does support crash reconciliation: an expired durable lease
can be reclaimed against the same immutable manifest, branch, and worktree, and
branch push / PR creation are idempotent. Once an attempt reaches a terminal
state, recovery creates a new bounded WorkOrder attempt referencing the prior
failed/canceled attempt.

Set `FACTORY_EXECUTION_ENABLED=1` on the orchestration server to enable the
polling worker. `FACTORY_EXECUTION_POLL_MS` may be set between 5 seconds and 5
minutes; the default is 15 seconds. Startup polls both pending and running bound
attempts, while the durable lease prevents duplicate execution across workers.
