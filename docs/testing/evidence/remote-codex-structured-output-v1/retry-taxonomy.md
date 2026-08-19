# Remote retry taxonomy and frozen budget

## Policy

Remote retry policy is frozen into each Factory execution manifest. The V1
policy contains:

- `maxAttempts`: the Factory Version attempt ceiling;
- `maxTotalWallClockMs`: the Factory Version wall-clock ceiling for the full
  Attempt lineage;
- `maxModelSpendUsd`: the Factory Version cost ceiling;
- `maxProviderResources`: `1` for this qualification;
- retryable failure classes: `RETRYABLE_INFRA` and
  `RETRYABLE_EXECUTION`; and
- fail-closed classes: `NON_RETRYABLE_RESULT` and `UNKNOWN`.

An automatic retry is allowed only when the source Attempt is terminal, its
typed failure class is retryable, all four budget checks pass, and the
replacement has a new Attempt/run identity, lease, credential grant, sandbox
resource identity, result artifact key, and exact-current verification state.

Unknown token or cost telemetry is recorded as `null`, never `0`. Provider-key
spend enforcement and the frozen maximum Attempt count bound exposure even when
post-run cost telemetry is unavailable.

## Failure codes

| Class | Representative codes | Automatic retry |
| --- | --- | --- |
| `RETRYABLE_INFRA` | `PROVIDER_ALLOCATION`, `PROVIDER_READINESS`, `TRANSPORT_UPLOAD`, `TRANSPORT_RESULT_READ`, `PROVIDER_TERMINAL_WITHOUT_RESULT` | Yes, inside every budget |
| `RETRYABLE_EXECUTION` | `EXECUTOR_TIMEOUT`, `MODEL_RATE_LIMIT`, `MODEL_TRANSIENT_PROVIDER` | Yes, inside every budget |
| `NON_RETRYABLE_RESULT` | `RESULT_FILE_MISSING`, `RESULT_FILE_TRUNCATED`, `RESULT_INVALID_JSON`, `RESULT_SCHEMA_INVALID`, `JSONL_INCOMPLETE`, `JSONL_AMBIGUOUS`, `RESULT_IDENTITY_MISMATCH`, `CANDIDATE_SHA_MISMATCH`, `DETERMINISTIC_GATE_FAILURE` | No |
| `UNKNOWN` | `ATTEMPT_CANCELED`, `EXECUTOR_UNCLASSIFIED`, `SUPERVISOR_UNCLASSIFIED` | No |

## Retry lineage invariants

- A retry appends evidence; it never patches the failed Attempt into a new
  identity.
- Artifact idempotency keys include the new Attempt identity and cannot bind to
  another Attempt.
- Attempt credentials and sandbox names are derived from the replacement
  identity and cannot equal the source Attempt's values.
- Worker claim recovery within one live Attempt is lease recovery, not a remote
  execution retry. It cannot reset the frozen Attempt budget or publish without
  the current lease.
- Exact-current verification makes all earlier candidate receipts ineligible
  for a replacement Attempt.
- Existing owned workspaces reject a different workflow-run/lease/manifest
  owner. A replacement cannot silently inherit an old candidate.
