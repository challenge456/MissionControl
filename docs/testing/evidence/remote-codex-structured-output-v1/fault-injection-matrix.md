# Fault-injection matrix

The deterministic qualification suite ran on 2026-08-18 from the isolated branch rooted at `75981d8ae1bd49e235cc1478bac3d0f853fc717f`. The focused command is recorded in the final validation evidence. All scenarios fail closed unless the exact typed retry policy explicitly permits a replacement Attempt.

| Injection | Expected classification | Retry | False success | Cleanup / revocation | Deterministic evidence |
| --- | --- | --- | --- | --- | --- |
| Missing result file, no complete JSONL | `NON_RETRYABLE_RESULT / RESULT_FILE_MISSING` | Blocked | No | Covered by runtime terminal cleanup | `remoteStructuredResult.test.ts` — exit zero without result |
| Truncated result file | `NON_RETRYABLE_RESULT / RESULT_FILE_TRUNCATED` | Blocked | No | Covered by runtime terminal cleanup | `remoteStructuredResult.test.ts` — truncated output |
| Invalid result schema | `NON_RETRYABLE_RESULT / RESULT_SCHEMA_INVALID` | Blocked | No | Covered by runtime terminal cleanup | `remoteStructuredResult.test.ts` — schema-invalid output |
| Valid JSONL, no result file | Accepted only with one valid candidate followed by exactly one `turn.completed` | Not needed | No invented fields | Normal success cleanup | `remoteStructuredResult.test.ts` and standalone supervisor JSONL reconstruction test |
| Result transport interruption | `RETRYABLE_INFRA / TRANSPORT_RESULT_READ` | Allowed only inside all frozen bounds | No | VM absent and Attempt key revoked | `remoteSandboxRuntime.test.ts` — result transport interruption |
| Supervisor crash after executor diagnostics | `UNKNOWN / SUPERVISOR_EXITED_BEFORE_RESULT` | Blocked | No | Diagnostics retained before VM teardown; key revoked | `remoteSandboxRuntime.test.ts` — crash after execution |
| Stale Attempt identity | `NON_RETRYABLE_RESULT / RESULT_BUNDLE_INVALID` | Blocked | No | VM absent and Attempt key revoked | `remoteSandboxRuntime.test.ts` — stale Attempt identity |
| Wrong candidate SHA | `NON_RETRYABLE_RESULT / CANDIDATE_SHA_MISMATCH` | Blocked | No publication | Host cleanup remains authoritative | `factoryAttemptWorkerRemote.test.ts` — wrong candidate SHA |
| Frozen execution timeout | `RETRYABLE_EXECUTION / EXECUTOR_TIMEOUT` | Allowed only inside all frozen bounds | No | VM absent and Attempt key revoked | `remoteSandboxRuntime.test.ts` and `remoteStructuredResult.test.ts` |
| Cancellation / lease loss | `UNKNOWN / ATTEMPT_CANCELED` | Blocked | No | Process canceled, VM absent, key revoked | `remoteSandboxRuntime.test.ts` and `remoteStructuredResult.test.ts` |

Retry-budget injections additionally prove fail-closed behavior for maximum Attempts, total wall-clock, known model spend, active provider resources, invalid policy, `NON_RETRYABLE_RESULT`, and `UNKNOWN`. A permitted retry has no inherited branch/worktree binding, and therefore cannot inherit a failed candidate or verification state.
