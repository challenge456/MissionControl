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

The repository root should be an attempt-specific worktree. The adapter records
approved path boundaries in its start event and prompt, but exact post-run changed
file enforcement remains a dispatch/golden-path responsibility before PR creation.

## Event and secret rules

Events are ordered per execution and use these stable types: execution start,
command start/completion, artifact produced, execution completion/failure/cancel.
Successful event metadata contains runtime facts, not process environment or
credentials. Failure text is bounded and redacts common credential labels.

The child process may receive runtime credentials required by Codex. Those values
must never be written to Mission Control records, artifacts, command receipts,
or application logs.

## Recovery

`codex/v1` supports cancel and does not claim resume support. Recovery creates a
new bounded WorkOrder attempt referencing the prior failed/canceled attempt. A
future adapter version may implement resume only with deterministic checkpoint
and evidence semantics; that is not implied by this V1 contract.
