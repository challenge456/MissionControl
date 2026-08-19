# Original Production Factory Pilot V1 failure analysis

## Evidence boundary

This analysis preserves the Production Factory Pilot V1 failure before any
qualification change. The authoritative pilot packet is on PR #120 at commit
`604e2c482bc1b87d8a2cbca35f4c09ca13264e13`. It was inspected read-only from
its existing worktree. This directory does not overwrite or rewrite that
packet.

The pilot ran from baseline
`75981d8ae1bd49e235cc1478bac3d0f853fc717f`. It scheduled 15 governed
executions, accepted 13, preserved 29 Attempts, failed 16 Attempts, revoked all
observed Attempt credentials, terminated all sandboxes, and ended with zero
exe.dev VMs. Guarded Auto remained disabled.

## Blocked workloads

| Workload | WorkOrder | Factory Version | Risk | Result |
| --- | --- | --- | --- | --- |
| `bug-fix-3` — correct integer-cent listing fee behavior | `work-order-bug-fix-3` revision 1 | `factory-codex-exedev-certified-v1` | Low | 8/8 Attempts failed; not verified or accepted |
| `data-migration-3` — migrate listing ownership with compatibility and rollback | `work-order-data-migration-3` revision 1 | `factory-codex-exedev-certified-v1` | High | 8/8 Attempts failed; not verified or accepted |

Both workloads used Codex CLI `0.146.0`, the `codex/v1` adapter, remote-sandbox
execution, OpenRouter, and model `openai/gpt-5.1-codex-mini`. Each retry used a
new Attempt, lease, disposable fixture repository, source commit, Attempt
credential, and exe.dev resource identity.

## Frozen execution boundary

The pilot script constructed one `factory-execution-manifest/v1` per Attempt.
It bound:

- mission, Plan, WorkOrder, WorkOrder revision, and workflow-run identities;
- exact fixture repository, base SHA, allowed paths, and excluded paths;
- workload title;
- `codex/v1`, Codex `0.146.0`, `remote-sandbox`, `WORKSPACE_WRITE`, a 270-second
  timeout, and control-plane-only pull-request authority;
- the exact sandbox profile digest and `mission-control-supervisor/v1`; and
- one inference grant with no embedded secret and no GitHub/provider authority.

The remote invocation was:

```text
npx -y @openai/codex@0.146.0
  -a never
  -c model_provider="mission-control-openrouter"
  -c model_providers.mission-control-openrouter.name="OpenRouter"
  -c model_providers.mission-control-openrouter.base_url="https://openrouter.ai/api/v1"
  -c model_providers.mission-control-openrouter.env_key="OPENAI_API_KEY"
  -c model_providers.mission-control-openrouter.wire_api="responses"
  -c model_providers.mission-control-openrouter.supports_websockets=false
  exec --json --ephemeral --ignore-user-config --ignore-rules
  --sandbox workspace-write --color never
  -C /var/lib/mission-control/attempt/repository
  -o /var/lib/mission-control/attempt/executor-result.json
  --output-schema /var/lib/mission-control/attempt/factory-result.schema.json
  -m openai/gpt-5.1-codex-mini
  <frozen workload prompt and repository boundaries>
```

The `--output-schema` upload and argument were added during pilot recovery and
therefore apply to the final output-boundary Attempts, not necessarily every
earlier Attempt. The schema required exactly these fields: `status`, `summary`,
`completedAcceptanceCriterionIds`, `incompleteAcceptanceCriterionIds`,
`unknownAcceptanceCriterionIds`, `verificationCommands`, `knownRisks`, and
`nextAction`.

## Failure table

`Expected output` is a schema-valid terminal `factory-result/v1`, an allowed
non-empty candidate when status is `COMPLETED`, and a valid
`factory-sandbox-result/v1` bound to the exact frozen Attempt. “Retryable?” is
the policy decision justified by preserved evidence, not what the pilot's
generic recovery loop did.

| Attempt | Stage | Observed output | Expected output | Classification | Retryable? |
| --- | --- | --- | --- | --- | --- |
| `attempt-bug-fix-3-1` | Host sandbox-bundle validation | Outer bundle rejected as schema-invalid; raw bundle not retained | Valid exact-identity sandbox bundle | `NON_RETRYABLE_RESULT` | No |
| `attempt-bug-fix-3-2` | Candidate gate | Supervisor reported completion, but candidate diff was empty | Non-empty in-scope listing-fee fix | `NON_RETRYABLE_RESULT` | No |
| `attempt-bug-fix-3-3` | Supervisor result | `FAILED`; raw structured output not retained | Valid terminal result and candidate | `UNKNOWN` | No; fail closed |
| `attempt-bug-fix-3-4` | Supervisor result | `FAILED`; raw structured output not retained | Valid terminal result and candidate | `UNKNOWN` | No; fail closed |
| `attempt-bug-fix-3-5` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `ac2acbba…`; stderr reports stdin read/npm notice | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-bug-fix-3-6` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `1b4d9850…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-bug-fix-3-7` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `014bf447…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-bug-fix-3-8` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `40ecba1e…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-data-migration-3-1` | Remote execution deadline | Frozen Attempt timeout; no result bundle | Terminal result within 270-second executor / 300-second VM limit | `RETRYABLE_EXECUTION` | Yes, within budget |
| `attempt-data-migration-3-2` | Remote execution deadline | Frozen Attempt timeout; no result bundle | Terminal result within frozen deadline | `RETRYABLE_EXECUTION` | Yes, budget then exhausted |
| `attempt-data-migration-3-3` | Supervisor result | `FAILED`; raw structured output not retained | Valid terminal result and candidate | `UNKNOWN` | No; fail closed |
| `attempt-data-migration-3-4` | SSH transport | `Permission denied (publickey,keyboard-interactive)` | Authenticated bounded provider command | `RETRYABLE_INFRA` | Yes, within budget |
| `attempt-data-migration-3-5` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `2f0d6b83…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-data-migration-3-6` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `8c8f877e…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-data-migration-3-7` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `7db51044…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |
| `attempt-data-migration-3-8` | Structured-result reconstruction | Exit 0; no schema-valid result found; stdout digest `49e7d724…`; same stderr digest | Valid terminal result from file or unambiguous terminal JSONL | `NON_RETRYABLE_RESULT` | No |

## Retry lineage and reconstructed manifest digests

Retry parents are linear and immutable:

- `attempt-bug-fix-3-1` → `-2` → `-3` → `-4` → `-5` → `-6` → `-7` → `-8`
- `attempt-data-migration-3-1` → `-2` → `-3` → `-4` → `-5` → `-6` → `-7` → `-8`

Where the pilot retained the profile digest, the exact manifest can be
reconstructed from the committed pilot constructor and the Attempt source SHA.
The resulting manifest digests are:

| Attempt | Source SHA | Manifest digest |
| --- | --- | --- |
| `attempt-bug-fix-3-1` | `ccb041c26fc691e446987f857dd3198c5a86cbe7` | Unavailable: profile digest was not retained |
| `attempt-bug-fix-3-2` | `9dc05bdde410fc17ac6603269b6deb198459bcfb` | `sha256:e3e71f7f2be8af2bdb870191ce76a480eb9632fa18b1fa3bcf359d8a0725af0b` |
| `attempt-bug-fix-3-3` | `4f315da07c8dba8cfc328c16f467f6e762d120e3` | `sha256:a9ffdc0d7abd92697acc30c210f0e9802f478c60dda5171bc26736e987d18b9a` |
| `attempt-bug-fix-3-4` | `555a106b88ad1727f7cf003effe33a7742771002` | `sha256:5df5bd285f73b54b9cd8aed6bc34cc3619b2b55c2b0670c425e28b5cb14b2937` |
| `attempt-bug-fix-3-5` | `44d0e1f642b61b77b33a2802d9298b788e549dd6` | `sha256:e9b4f5a202b4c1e4096810b2cee3834194cc6764ea44a01d51c5b0ad760f4c96` |
| `attempt-bug-fix-3-6` | `978c2c03a3c965661a8a7c9de37e7df0ad2daf49` | `sha256:0f7cc59c60bee79f91c09b69dd911437a3e4e2c176c081d8a1b9c6afb9894277` |
| `attempt-bug-fix-3-7` | `62e11469be98f4de673fa4b8fccb6ec75c337f78` | `sha256:77675341d534e7d6102ab5766dbcfc64fd40463264ea3c21c1467ec8e7e4fa7d` |
| `attempt-bug-fix-3-8` | `0159652cafeddea68099d929f411022e9ea4c7fa` | `sha256:c2a03b364306b71e581e08196ec2407f6941ab2468f1543f03491f327afc5450` |
| `attempt-data-migration-3-1` | `386bd1349a0561d264ea392c98f1318b4bdb262b` | Unavailable: profile digest was not retained |
| `attempt-data-migration-3-2` | `21e11ab14e6d263cb1732e23c1c9c89f60781de0` | Unavailable: profile digest was not retained |
| `attempt-data-migration-3-3` | `db6ac525b34a477776088e1acf1baf27c9e778a8` | `sha256:b0451ce2534a549b254b123af7f8cee22bb0b65e5d3ea96476b1a517db4a6ecd` |
| `attempt-data-migration-3-4` | `fab6343db9d278eff0499cea23397dbf2fc2ef58` | `sha256:94ff8a01c9d6642d4f583b7119952051375251ad11363ad884522f90a55342b8` |
| `attempt-data-migration-3-5` | `b63b320c6dc468b436d5fa2f73160cfb2024f400` | `sha256:d7f84b8177216d915d4d0f9092890f65a7902340b56b9e5d60ff03da8f4756e4` |
| `attempt-data-migration-3-6` | `63216c796b153db11486c118451433b730272fba` | `sha256:6a1220f8d9808993c78ee4443fc14e7747417c3664321cd9b23711129ec1dbd1` |
| `attempt-data-migration-3-7` | `190621d3549258ba6171880f8a3c3f4e53aafc12` | `sha256:fd3400f148d4cc786c5235cda57c1e5a386481bee7fdd14321c3a906ad4bb8c3` |
| `attempt-data-migration-3-8` | `4cd3537b60b97ab91e2462b230f451314759fe99` | `sha256:fc58f61ad88be0ec97b4b376b06e7001608677075e7f49133686b52eee545afd` |

These reconstructed digests are derived from the final committed pilot
constructor. The packet does not contain serialized per-Attempt manifests, so
the analysis records the derivation instead of presenting them as independently
preserved bytes.

## Result, JSONL, persistence, and cleanup findings

- The final standalone supervisor tried the explicit result file first, then
  each Codex `item.completed`/`agent_message` in reverse order.
- It did not require a `turn.completed` terminal event, reject multiple valid
  agent-message candidates, bind reconstruction provenance, or record whether
  the file was absent, empty, truncated, unreadable, or schema-invalid.
- The pilot packet retained only result digests and bounded tails. Raw result
  file bytes and raw JSONL for the failed live Attempts are unavailable after
  teardown. They cannot be reconstructed from cryptographic digests.
- The standalone supervisor wrote the outer result bundle directly to
  `result.json`; the provider polled that final path. A partial file could be
  observed and rejected before the write completed.
- All Attempts with allocated resources retained termination events. Every
  observed Attempt credential was revoked, every recorded sandbox was absent,
  and the final independent exe.dev inventory was zero.

## Preserved conclusion

The pilot correctly returned `BLOCKED`. The strongest supported root cause is a
remote structured-result contract and persistence/diagnostic boundary that
cannot distinguish several invalid/missing result modes. Process exit zero was
correctly insufficient for success, but generic retry behavior repeated
non-retryable result failures. No stronger sub-cause is claimed from evidence
that the pilot did not retain.
