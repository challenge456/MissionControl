# Structured-result criterion-accounting root cause

## Frozen final-image cohort

With image `mc-remote-final-blocker@sha256:41a66f1d6f7b90618a6c58fb9a1a336ef69ab2794fc1322233e4a5d9788782b8`, the first cohort after restoring the minimal coding utilities produced:

- bug fix: implementation and `node --test` succeeded, but the `COMPLETED` result listed only `BUG-001`; the supervisor failed it with `RESULT_ACCEPTANCE_CONTEXT_INVALID`;
- security/policy: first-pass completed, independently verified, acceptance eligible;
- migration: first-pass completed in 236,483 ms, independently verified, acceptance eligible;
- retries: 0;
- final container inventory: 0.

Raw evidence is preserved in `local-3-workload-gate-pre-dynamic-criterion-contract.json`.

## Root cause

The qualification wrapper correctly stated that all listed acceptance criterion IDs must be included for a `COMPLETED` result and listed the allowed IDs. It then supplied a generic JSON example whose completed array contained only one placeholder (`"criterion-id"`). The model followed the one-element shape for the bug-fix workload and omitted `BUG-002`, even though it implemented strict validation and both tests passed.

The supervisor behaved correctly: it did not infer, add, or repair acceptance evidence, and it rejected the bundle before candidate verification.

## Minimal remediation

Keep the frozen workload and supervisor validation unchanged. Replace the generic placeholder example with an example generated from the exact frozen WorkOrder criterion IDs, and state that a `COMPLETED` result must contain that exact ordered array. The model must still emit the result itself. Missing, extra, duplicated, incomplete, or unknown IDs continue to fail closed; no post-execution normalization or retry masking is allowed.
