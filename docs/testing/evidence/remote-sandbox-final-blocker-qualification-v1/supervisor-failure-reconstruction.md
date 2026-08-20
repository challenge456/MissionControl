# Hardened supervisor failure reconstruction

## Evidence boundary

This reconstruction precedes every implementation change in this worktree. It
uses the preserved canonical artifact from qualification run `141033a1192e`:

- source artifact: `docs/testing/evidence/remote-sandbox-hardening-blockers-v1/live-3-workload-gate.json`
- source artifact SHA-256: `e810af0265fbe40817bb62ddfb682caa5810013235faa6cb0aab2f6c4f548029`
- frozen repository baseline: `11a51cac1e446488cddf34781cc9663b922c7684`
- image: `ghcr.io/jaydubya818/mission-control-remote-sandbox@sha256:ce142e3f1782d921e54203c748db590dd0f2650cc12cf801002729f07bb0f4ec`
- profile digest: `sha256:59199021bb3d496beec7e70476df01e0d6b14424dd4a5bdb23d07af960275bbd`
- factory definition/version: `factory-remote-sandbox-hardening` / `factory-remote-sandbox-hardening-v1`, version `1`
- factory configuration digest: `sha256:409d50666d74538a941428a021b53b469b674051480593393a0c63e6b0854e3b`
- supervisor version: `mission-control-supervisor/v1`
- attempts/retries/concurrency: `3 / 0 / 1`

No worker ID, worker generation, durable session ID, or separate context-package
identity exists in the qualification artifact. The runner called
`RemoteSandboxRuntime` directly with a frozen source bundle, synthetic workflow
and lease IDs, and an inline execution manifest. Those fields cannot be
reconstructed without inventing evidence.

## Failure table

| Attempt | Last successful stage | Failing stage | Exit status | Diagnostics | Suspected cause before differential audit |
| --- | --- | --- | --- | --- | --- |
| `attempt-141033a1192e-hardening-bug-fix-1` | `SANDBOX_STARTED`; immutable image/toolchain plus network, privilege, and filesystem proof accepted at `2026-08-20T05:28:11Z` | `RESULT_READ`; `SUPERVISOR_EXITED_BEFORE_RESULT` at `05:28:12Z` | Not captured; process reported not running | `supervisorLogTail=""`; final result fetch absent. Cleanup also failed because all six stale-key probes returned `200`. | Common supervisor startup exception before executor diagnostics/result persistence. Exact cause unknown because exit status and fatal startup diagnostics were not retained. |
| `attempt-141033a1192e-hardening-security-policy-1` | `SANDBOX_STARTED`; full hardened security proof accepted at `2026-08-20T05:28:41Z` | `RESULT_READ`; `SUPERVISOR_EXITED_BEFORE_RESULT` at `05:28:43Z` | Not captured; process reported not running | `supervisorLogTail=""`; final result fetch absent. Exact key revoked and stale probe returned `401`. | Same common supervisor startup exception; workload-specific prompt/code is unlikely because no Codex event or executor diagnostics were persisted. |
| `attempt-141033a1192e-hardening-data-migration-1` | `SANDBOX_STARTED`; full hardened security proof accepted at `2026-08-20T05:29:07Z` | `RESULT_READ`; `SUPERVISOR_EXITED_BEFORE_RESULT` at `05:29:09Z` | Not captured; process reported not running | `supervisorLogTail=""`; final result fetch absent. Exact key revoked and stale probe returned `401`. | Same common supervisor startup exception; failure timing and evidence match the other two Attempts. |

The evidence confirms the reported issue as a **reproduced high-severity bug**:
three independent workloads reached the same supervisor boundary and failed
within 1.6–1.8 seconds, before any structured result, candidate, verification,
or acceptance-eligibility record existed.

## Attempt identities

| Field | Bug fix | Security/policy | Data/schema migration |
| --- | --- | --- | --- |
| WorkOrder | `work-order-141033a1192e-hardening-bug-fix-1` rev 1 | `work-order-141033a1192e-hardening-security-policy-1` rev 1 | `work-order-141033a1192e-hardening-data-migration-1` rev 1 |
| WorkOrder title | Correct integer-cent listing fee behavior | Fail closed when authorization context is missing | Migrate listing ownership with compatibility and rollback |
| Workflow run | `workflow-141033a1192e-hardening-bug-fix-1` | `workflow-141033a1192e-hardening-security-policy-1` | `workflow-141033a1192e-hardening-data-migration-1` |
| Lease | `lease-141033a1192e-hardening-bug-fix-1` | `lease-141033a1192e-hardening-security-policy-1` | `lease-141033a1192e-hardening-data-migration-1` |
| Sandbox | `mc-attempt-ef6cf70e0d68c09d` | `mc-attempt-bc9154bfec3f3e63` | `mc-attempt-ab8e762aae111a33` |
| Source SHA | `013d0be0851d2b7cc2f38835f7300e698db5087c` | `1b62234032e8b03a75f55a4bea513dff0f54880b` | `a09426f1f06ba22b2799b4f0eef12a1c70dd5429` |
| Manifest digest | `sha256:e6dfd31628ab3f470dff7828c8774437ac14af8ad506c10899738f8f7f450822` | `sha256:7383d389306d0ef3c095e1f3a46c6817d347b87dbcf5ccbb96f832f03f70778d` | `sha256:bdb5d3242c9764fe73f5eabb0158bc1c72bd2eec8d22f74f636287b26fac700d` |
| Process identity | resource + `:supervisor`; executor UID/GID 10001 | same | same |
| Exact resource absent | yes; inventory after 0 | yes; inventory after 0 | yes; inventory after 0 |

## Reconstructed launch boundary

The provider command was:

```sh
nohup setsid node /var/lib/mission-control/attempt/supervisor.mjs \
  /var/lib/mission-control/attempt/config.json \
  >/var/lib/mission-control/attempt/supervisor.log 2>&1 &
```

The supervisor ran as image login user `root`; repository Git and Codex were
launched through `setpriv` as UID/GID 10001 with `no_new_privs` and all
capability sets removed. The Codex environment contained only the names
`OPENAI_API_KEY` and `OPENAI_BASE_URL`; secret material was not persisted.

Common Codex arguments were:

```text
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
```

Paths were identical across all Attempts:

- repository: `/var/lib/mission-control/attempt/repository`
- HOME: `/var/lib/mission-control/attempt/home`
- TMPDIR: `/var/lib/mission-control/attempt/tmp`
- executor output: `/var/lib/mission-control/attempt/executor-result.json`
- output schema: `/var/lib/mission-control/attempt/factory-result.schema.json`
- supervisor result: `/var/lib/mission-control/attempt/result.json`
- supervisor diagnostics: `/var/lib/mission-control/attempt/diagnostics.json`
- supervisor log: `/var/lib/mission-control/attempt/supervisor.log`

## Terminal and cleanup state

All three Attempts emitted `SANDBOX_FAILED` with
`SUPERVISOR_EXITED_BEFORE_RESULT`, then exact termination and confirmed resource
absence. The security and migration credentials emitted exact external-key
revocation events and returned `401` on the first stale probe. The bug-fix key's
external ID was not durably journaled because the probing broker threw before
returning its revocation receipt; every recorded stale probe returned `200`.

## Evidence gaps that tracing must close

- supervisor process exit code/signal
- fatal startup exception before executor diagnostics exist
- exact result/diagnostics/log file stat and permission state at failure
- whether Codex was spawned
- first Codex stdout/stderr event timestamp
- actual attempted network destinations
- worker/session/generation and context-package fields, or an explicit
  `NOT_APPLICABLE` marker for direct qualification runs
