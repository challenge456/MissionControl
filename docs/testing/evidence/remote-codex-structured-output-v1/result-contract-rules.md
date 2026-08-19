# Remote Codex result-contract rules

## Scope and canonical format

`factory-result/v1` remains the only executor result format. The existing
`factory-sandbox-result/v1` object is a control-plane transport envelope, not a
second executor result. It carries the immutable Attempt context, content
digests, bounded diagnostics, patch bytes, and reconstruction provenance needed
to decide whether the enclosed `factory-result/v1` is admissible.

Executor output is evidence only. It never has verification, acceptance,
publication, GitHub, or provider-management authority.

## Deterministic acceptance

A remote result is provisionally accepted for host materialization only when
all of the following are true:

1. The transport envelope is valid JSON, within the control-plane byte limit,
   schema-valid, and has a valid canonical digest.
2. `attemptId`, `workflowRunId`, WorkOrder identity and revision,
   `manifestDigest`, `profileDigest`, `sourceSha`, supervisor version, provider,
   and image exactly match the frozen request.
3. Harness adapter/version, harness identity/version, provider, and model exactly
   match the frozen execution manifest.
4. The executor did not time out or receive cancellation, exited zero, and
   produced one schema-valid terminal `factory-result/v1` with status
   `COMPLETED`.
5. The source patch is content-addressed, bounded, and its changed-file list
   agrees with the patch materialized on the host.
6. After materialization, the control plane commits the candidate itself and
   requires the observed candidate SHA to match that commit before independent
   verification. A candidate SHA never supplied by the sandbox cannot be
   invented or inherited from an earlier Attempt.
7. Publication remains separately gated on exact-current independent
   verification, a current lease and publication permit, and cleanup proof.

Process exit zero alone is never success. `BLOCKED` and `FAILED` executor
statuses are valid content but terminal failed Attempt outcomes.

## Output-file states

The supervisor records one of:

- `NOT_REQUESTED`
- `ABSENT`
- `EMPTY`
- `TRUNCATED`
- `INVALID_JSON`
- `SCHEMA_INVALID`
- `TOO_LARGE`
- `READ_ERROR`
- `VALID`

A valid output file is authoritative. JSONL is considered only as bounded
reconstruction input when the output file is not valid.

## JSONL reconstruction

JSONL reconstruction is accepted only when:

- stdout stays within the frozen byte bound;
- every non-empty line is valid JSON;
- exactly one `turn.completed` event exists;
- no `turn.failed`, `error`, or cancellation terminal event exists;
- exactly one schema-valid `item.completed`/`agent_message` candidate exists;
- the candidate precedes the terminal completion event; and
- the validated supervisor configuration binds the reconstruction to the exact
  Attempt, manifest, source, harness, model, profile, and environment.

Multiple valid candidates are rejected even if their text happens to match.
Incomplete terminal state is rejected. The envelope records
`CODEX_JSONL_RECONSTRUCTION`; it never presents reconstructed output as a file
result and never infers a successful result from exit status.

## Persistence and diagnostics

The supervisor creates parent directories without widening permissions, writes
diagnostics and the result to same-directory temporary files, fsyncs each file,
renames atomically, and fsyncs the directory. Only the final result path is
polled. Stale final, temporary, executor-output, and diagnostic files are
removed before a new supervisor starts.

Diagnostics are bounded and redacted. The durable diagnostic snapshot is
written after executor completion and result reconstruction but before patch
collection and final bundle publication, so a supervisor failure in that gap
still leaves reconstructable evidence for the control plane to collect before
teardown.

## Failure decision

Every failed remote boundary produces or is normalized to one classification:

- `RETRYABLE_INFRA`: transient allocation, readiness, SSH, upload, result-read,
  or other provider transport failure.
- `RETRYABLE_EXECUTION`: an explicitly recognized transient model/provider
  failure or an execution timeout where rerun is safe.
- `NON_RETRYABLE_RESULT`: missing, partial, oversized, malformed, ambiguous,
  context-mismatched, candidate-mismatched, or deterministic gate failure.
- `UNKNOWN`: cancellation, unrecognized execution failure, or any outcome that
  cannot be safely classified.

`UNKNOWN` is never automatically retried. Retryability is a property of the
typed failure and frozen budget, not a substring-free-form operator guess.

## Candidate and acceptance authority

The sandbox does not know the host-created candidate SHA. The candidate binding
therefore becomes authoritative only after the control plane:

1. materializes the exact content-addressed patch against the exact source SHA;
2. compares the materialized changed-file set with the envelope;
3. commits the candidate and reads the resulting SHA back from Git;
4. requires independent verification receipts for that exact source/candidate
   pair; and
5. authorizes publication for that exact candidate while the current Attempt
   lease is valid.

This preserves one executor result format while enforcing the requested
candidate identity at the boundary where that identity first exists.
