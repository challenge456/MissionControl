# Live root-cause analysis and repair

## Observed failures

The first live qualification Attempt exited `0` but returned a 468-byte schema-invalid result. Cleanup passed: its Attempt key was revoked, its VM was absent, and final inventory was zero. The first evidence writer retained only the beginning of the bounded JSONL tail, so that Attempt remains preserved in `live-initial-failure.json` without a stronger field-level claim.

A new diagnostic execution reproduced the failure and retained the exact redacted output in `live-schema-root-cause.json`:

```json
{
  "schema": "factory-result/v1",
  "status": "success",
  "knownRisks": "None."
}
```

The omitted fields above were present but are not repeated here. The deterministic validator reported `STATUS_INVALID` and `KNOWNRISKS_INVALID`. The terminal Codex JSONL contained the same invalid object followed by exactly one `turn.completed`; therefore JSONL recovery correctly rejected it rather than inventing a valid result. Codex also emitted a model-metadata warning for `openai/gpt-5.1-codex-mini`. The evidence proves that this OpenRouter-routed execution did not honor two output-schema constraints; it does not prove which upstream component ignored the schema.

The pre-final live run then exposed a separate host polling race. Supervisor diagnostics showed:

- executor exit `0`;
- valid `factory-result/v1` output;
- one valid terminal JSONL candidate;
- `failure: null`; and
- `supervisorProcessRunning: false`.

The host had read the result path immediately before the supervisor's atomic rename, then read process state immediately after supervisor exit. It classified the empty first read as `SUPERVISOR_EXITED_BEFORE_RESULT` without re-reading the final path.

## Repairs

1. The prompt now states every output type, uppercase terminal values, empty-array behavior, exact acceptance-criterion accounting, and one literal valid JSON shape. This does not coerce an invalid response; invalid content still fails closed.
2. Result diagnostics now preserve a bounded redacted output tail, digest, byte length, file state, and exact validation issue codes. Terminal stdout/stderr tails retain their ends rather than their beginnings.
3. The supervisor and host require every frozen acceptance criterion to be accounted for exactly once. `COMPLETED` cannot contain incomplete or unknown criteria.
4. After observing supervisor exit, the host performs exactly one final read of the atomic result path. A valid exact-context bundle is accepted; continued absence still produces fail-closed `UNKNOWN / SUPERVISOR_EXITED_BEFORE_RESULT`.
5. The qualification runner now uses a random run scope in every Mission, Plan, WorkOrder, workflow, lease, Attempt, credential, and VM identity. `live-excluded-identity-reuse.json` preserves and explicitly excludes the earlier runner execution that reused a diagnostic Attempt ID.

## Final observation

The eligible final run (`qualificationRunId: 9b75d5ccb92d`) completed eight distinct Attempts with no retries:

- structured-output qualification: 5/5 across `BUG_FIX` and `DATA_SCHEMA_MIGRATION`;
- pilot remote regression: 3/3 across bug fix, security policy, and data/schema migration;
- all eight results used `OUTPUT_FILE` provenance and `factory-result/v1`;
- all eight candidates passed independent exact-candidate verification and acceptance eligibility;
- all eight Attempt keys were revoked;
- all eight VMs were proven absent; and
- final exe.dev inventory was zero.

Model and provider costs were not supplied by the observed telemetry and remain `null`. Token counts and wall-clock timings are retained in `costs-timings.md` and `live-run-results.json`.
