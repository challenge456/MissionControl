# Remote Sandbox Live Certification V1

## Decision

**LIVE CERTIFIED WITH KNOWN LIMITATIONS**

The Remote Sandbox N=1 security and cleanup boundaries passed against live exe.dev on 2026-08-17 from exact `origin/main` `e9d6b93e2edd5cf81beddd627abfbb67e7f85086`. This is a production-certification result, not a rollout decision. Remote Sandbox remains Preview, globally disabled, and unavailable to Guarded Auto routing.

The limitations are:

1. The certified exe.dev profile has unrestricted outbound egress and therefore remains `DEGRADED`; public ingress and exposed ports remain forbidden.
2. The approved `node:24-bookworm` image did not include a preinstalled `codex` executable. The bounded real Attempt used the official `@openai/codex@0.146.0` package through ephemeral `npx`, so the model execution was real but the production image still needs a reviewed pinned Codex installation before rollout.
3. The live deterministic scenarios exercised the real provider through `RemoteSandboxRuntime`. The complete canonical `FactoryAttemptWorker` lease, independent-verification, publication-permit, and owned-worktree path remains proven by the post-fix `FakeSandboxProvider` golden path rather than by an external product PR.
4. exe.dev exposes an account subscription price but no per-VM scenario charge in the inspected interfaces. Provider cost and an exact total certification cost are therefore unavailable and are not estimated.
5. The supervisor-failure terminal payload was lost by the local terminal channel. Its fail-closed outcome was independently proven by exact VM inventory and exact Attempt-key inventory after the frozen deadline.

## Baseline and readiness

| Check | Evidence | Result |
| --- | --- | --- |
| Git baseline | `HEAD = origin/main = e9d6b93e2edd5cf81beddd627abfbb67e7f85086` | PASS |
| Host runtime | macOS 26.5.1 arm64; Node 24.18.1; pnpm 9.0.0; OpenSSH 10.2 | PASS |
| OpenRouter management API | Authenticated `GET /api/v1/keys?offset=0` returned HTTP 200 | PASS |
| exe.dev account | `jaydubya818@gmail.com`, LAX, Individual Small, active/paid, $20/month | PASS |
| Capacity | `max_vms=50`, initial `vmCount=0`, available capacity 50 | PASS |
| Automatic integrations | Empty | PASS |
| Dedicated SSH identity | `/Users/jaywest/.ssh/id_ed25519_exe_mission_control`, mode 0600, Ed25519 fingerprint `SHA256:L5itzmZwaxF52475kTRWu1EXBl6QtxlAmLyEHtLpLUk` | PASS |
| Pinned host identity | exe.dev RSA fingerprint `SHA256:JJOP/lwiBGOMilfONPWZCXUrfK154cnJFXcqlsi6lPo` under strict host checking | PASS |
| Runtime opt-in | `EXEDEV_IDENTITY_FILE` present; `CODEX_WORKER_REMOTE_SANDBOX_ENABLED=1`; live opt-in used only on authorized commands | PASS |

No billing setting, plan, production default, repository, deployment, product PR, or Guarded Auto route was mutated.

## Lifecycle checkpoint

The credential-free canary used VM `mc-sbx-doctor-20260817t235452z-18903e1b`.

| Measurement | Actual |
| --- | ---: |
| Allocation | 1,847 ms |
| Readiness | 596 ms |
| Authenticated inspection | 830 ms |
| Termination | 1,111 ms |
| Absence confirmation | 508 ms |
| Total | 5,478 ms |
| Model cost | $0 |
| Provider cost | Unavailable; subscription is not itemized per VM |

The workload ran as uid 1000 with passwordless sudo. The exact VM was removed and the independently queried inventory returned to `vmCount=0` before certification continued.

## Credential canary

The bounded credential canary minted grant `mc-attempt-33a7345bae210f63fa1c`, persisted only external identifier/fingerprint `2a244c85820182aef43cd940a12bee871fd2652736d8f67fe0fe228e866652e5`, revoked it, and received HTTP 404 from the post-delete exact-key lookup.

| Measurement | Actual |
| --- | ---: |
| Mint | 501 ms |
| Revoke | 418 ms |
| Exact post-delete lookup | 302 ms |

No management key value or Attempt-key value was printed, persisted, committed, or included in evidence.

## Deterministic live fixture

| Field | Evidence |
| --- | --- |
| WorkOrder | `work-order-live-deterministic-v1` |
| Workflow | `workflow-live-deterministic-v1` |
| Attempt / lease | `attempt-live-deterministic-v1` / `lease-live-deterministic-v1` |
| VM | `mc-attempt-864ccc23a55ab5d2` |
| Source SHA | `c322b0e9bebb7bd925a6b74e91109274d17ff976` |
| Manifest digest | `sha256:d84527f3e2e1c6530f865b58356cc14c7730de887d673f6bcedd3f22d58da400` |
| Profile digest | `sha256:1f99860096f1030b1a10e6e0ee3e8302b99b065bb6adbc9aafa79763edd3736f` |
| Result-bundle digest | `sha256:13f67165091b65e673671d84dc15a5567f094d8482e30f4b77bbb17384f1a8cc` |
| Patch digest | `sha256:43003bc50552082b3303cf340679a658248747aeaed3b7733b5e1d9da713cc3e` |
| Attempt grant | `mc-attempt-c16e0a66b592debd2685` |
| External credential ID/fingerprint | `4b6efebae88d45a54212cca6b961865f493899a75121bb0a06e2a94ac5432c14` |

The sandbox verified the frozen manifest and source SHA, ran the standalone supervisor, emitted a normalized result bundle, and returned the patch to the host. Host-side independent verification returned `VERIFIED`. Credential revocation returned HTTP 404 on exact lookup, exact VM absence was proven, and final inventory was zero.

Timings were 2,767 ms allocation, 1,155 ms readiness, 545 ms credential mint, 2,242 ms transport/start, 450 ms execution, 467 ms revocation, 2,213 ms teardown/absence, 54 ms verification, and 10,707 ms total. Model cost was $0; provider cost was unavailable.

## Bounded real Codex Attempt

| Field | Evidence |
| --- | --- |
| WorkOrder | `work-order-live-codex-v1` |
| Workflow | `workflow-live-codex-v1-r3` |
| Attempt / lease | `attempt-live-codex-v1-r3` / `lease-live-codex-v1-r3` |
| VM | `mc-attempt-c57e3c69763842bf` |
| Source SHA | `3add50071c765e7858e5a1087b58cd55f0a0d069` |
| Manifest digest | `sha256:e3fa0bad327477f673c76472be73b58593567abaa830e21d6d1cc008ccae23a8` |
| Profile digest | `sha256:f708bd6eb1d5c83322cad86d49261c824d7e5e20ce5a356e6146ce7752410f0e` |
| Result-bundle digest | `sha256:cadd4c68f46a3435b2ea4492b5ebf865d235b395b3d505636c11a71237e14359` |
| Patch digest | `sha256:5d31874b856c17e7ff7fd6d60d8dd861d42db1deaa232cf541a4c10d124ac2db` |
| Executor | `@openai/codex 0.146.0` through ephemeral `npx` |
| Model | `openai/gpt-5.1-codex-mini` through OpenRouter Responses API |
| Attempt grant | `mc-attempt-6fd7be745e993135b985` |
| External credential ID/fingerprint | `a6a723424f366f6599761d1bb796bbcec7c154c2ce65158cd73b3eb225b0821b` |

The disposable fixture completed and host verification returned `VERIFIED`. Exact key lookup returned HTTP 404 after revocation; exact VM absence and `vmCount=0` were independently confirmed.

| Measurement | Actual |
| --- | ---: |
| Allocation | 2,876 ms |
| Readiness | 1,555 ms |
| Credential mint | 583 ms |
| Transport/start | 2,039 ms |
| Execution | 47,124 ms |
| Verification | 47 ms |
| Credential revocation | 384 ms |
| Teardown/absence | 2,426 ms |
| Total | 58,952 ms |
| Input tokens | 34,640 |
| Cached input tokens | 26,880 |
| Output tokens | 750 |
| Reasoning tokens | 351 |
| Model cost | $0.00348453 |
| Provider cost | Unavailable |

## Failure and recovery proof

| Scenario | Exact proof | Result |
| --- | --- | --- |
| Cancellation | `attempt-live-cancel-v1-r2`, VM `mc-attempt-ccf80b3531f88479`; supervisor and child probes both `absent`; grant `mc-attempt-8e96125c9f305bc6fdd3` returned HTTP 404; VM absent; inventory zero | PASS |
| Execution failure | `attempt-live-exec-fail-v1`, VM `mc-attempt-84880db89ccaa120`; executor exit 42; normalized/structured `FAILED`; no changed files or publication candidate; result `sha256:be66ee9efc40ab3bb620d438402b1be82811f325e4b86211f78baf4231afa615`; key HTTP 404; VM absent | PASS |
| Executor timeout | `attempt-live-timeout-v1`, VM `mc-attempt-fc5d9315c5593dc0`; result `sha256:68e558d8d9f916d7976f160d817e2d0bc68c674200d50a8e8dd77dab24f65e23`; normalized `TIMED_OUT`; command `timedOut=true`; key HTTP 404; VM absent | PASS |
| Worker restart/reconciliation | `attempt-live-reconcile-v1-r3`, stale lease, VM `mc-attempt-ae72035845d33df8`; `ORPHAN_RECONCILED`; grant `mc-attempt-be68788e980f86778bba` HTTP 404; exact absence; inventory zero | PASS |
| Supervisor failure | `attempt-live-supervisor-fail-v1`, VM `mc-attempt-5f2d9121eeabd67d`; no result/publication candidate; exact grant `mc-attempt-12ae1b739124d439185c` absent from key inventory; VM absent; inventory zero after frozen deadline | PASS WITH EVIDENCE LIMITATION |

Cancellation process-tree termination took 1,765 ms and teardown took 2,238 ms. Execution-failure teardown took 2,162 ms. Reconciliation took 3,252 ms and 8,569 ms total. Timeout execution took 1,023 ms and 11,495 ms total. Exact supervisor-failure duration is unavailable because its terminal payload was lost.

## Security result

| Invariant | Result |
| --- | --- |
| No public ingress or exposed ports | PASS |
| Strict pinned SSH host verification and dedicated batch-only identity | PASS |
| Exact Attempt-derived resource identity | PASS |
| Immutable source SHA and frozen manifest verification inside VM | PASS |
| Attempt-scoped inference credential only | PASS |
| No exe.dev administrator credential in VM | PASS |
| No OpenRouter management credential in VM | PASS |
| No GitHub App private key or installation token in VM | PASS |
| No Mission Control/Convex service credential in VM | PASS |
| No merge, acceptance, verification, or publication authority in VM | PASS |
| Credential revocation before publication eligibility | PASS |
| Exact VM absence and zero inventory after every continued scenario | PASS |
| No surviving cancellation process tree | PASS after provider correction |
| Persisted evidence contains identifiers/fingerprints, not secret values | PASS; repository secret scan checked 2,325 tracked files |

No external product PR was published. Publication eligibility was re-proven after the live fixes with `./scripts/factory-remote-sandbox-golden-path.sh`; the Fake provider path passed canonical worker admission, renewable lease, independent verification, cleanup-before-publication, one publication permit, and owned-worktree cleanup.

## Live-discovered incompatibilities and corrections

The initial live probes exposed provider-boundary defects. Each failing resource and credential was removed before another scenario continued.

1. The lifecycle-canary comment contained shell whitespace and a semicolon. The invariant is that every remote CLI argument must remain one shell-safe token. The comment is now shell-safe and regression-tested.
2. The supervisor command joined a background operator with `;`, producing invalid `&;`. The launch now uses newline-delimited commands.
3. Immediate post-allocation SSH uploads can fail transiently. Exact-path uploads are idempotent and now retry three times with bounded backoff; no non-idempotent provider mutation is retried.
4. Codex reserves the built-in `openai` provider and did not honor the desired OpenRouter route. Remote Codex now receives an explicit named provider using the Responses API, and the frozen effective harness configuration records it.
5. Cancellation originally killed only the supervisor PID and left the executor tree alive. The supervisor now starts in a dedicated session and cancellation targets the process group with bounded TERM/KILL fallback.
6. exe.dev rejected the 1 CPU/512 MB/5 GB live profile combination. Dispatch now enforces the live-proven 2 CPU/2,048 MB/10 GB floor and preserves provider diagnostics emitted on stdout.

## Provider resources

The following unique exe.dev resource identities were observed during certification. Deterministic Attempt names were reused for controlled retries only after exact prior absence was proven.

- `mc-sbx-doctor-20260817t235452z-18903e1b` — lifecycle canary
- `mc-attempt-864ccc23a55ab5d2` — deterministic fixture and controlled retries
- `mc-attempt-6978934e3c37d69d` — image/runtime diagnostic
- `mc-attempt-26b0bfd3da7398b4` — SSH upload diagnostic
- `mc-attempt-db5f63ba11b06102` — bounded upload-size diagnostic
- `mc-attempt-a0c05a7d1fd7681a` — initial real Codex routing diagnosis and controlled retries
- `mc-attempt-5bb95f37a382c5d8` — real Codex retry before custom-provider correction
- `mc-attempt-c57e3c69763842bf` — successful bounded real Codex Attempt
- `mc-attempt-d27ac7b75bb91791` — initial cancellation process-tree diagnosis
- `mc-attempt-ccf80b3531f88479` — successful cancellation proof
- `mc-attempt-84880db89ccaa120` — execution-failure proof
- `mc-attempt-a0657beebf4da5d0` — initial reconciliation proof whose local payload was truncated
- `mc-attempt-ae72035845d33df8` — captured restart/reconciliation proof
- `mc-attempt-fc5d9315c5593dc0` — timeout proof
- `mc-attempt-5f2d9121eeabd67d` — supervisor-failure proof

The undersized reconciliation retry `mc-attempt-e5f1f76bc5903ff9` failed before allocation and was not created. Final exe.dev inventory was independently queried as `vmCount=0`; billing usage reported zero current VMs, zero used disk, and zero 24-hour transfer at the final check.

## Regression result

`pnpm run qualify:factory` passed from the exact baseline. It covered security gates, Remote Sandbox suites, worker/lease/recovery, Generic Harness, Verification Factory, full repository tests, TypeScript, skill lint, runtime-contract guard, production build, orchestration startup smoke, and `git diff --check`. The generated automated-check packet records 16/16 checks as PASS.

Focused post-fix checks also passed:

- 25 provider/runtime/credential/reconciliation/Codex adapter tests
- 12 exe.dev doctor contract tests
- the `FakeSandboxProvider` Remote Sandbox golden path

## Cost

Actual model cost was **$0.00348453**. The exe.dev account subscription is **$20/month**, but the provider did not expose per-resource charges, so certification provider cost is **unavailable**. The exact total certification cost is therefore **$0.00348453 plus an unitemized share of the existing exe.dev subscription**. No unavailable amount is estimated.
