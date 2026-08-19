# Validation record

Final local validation ran on 2026-08-18/19 from branch `codex/remote-codex-structured-output-v1`, rooted at exact `origin/main` SHA `75981d8ae1bd49e235cc1478bac3d0f853fc717f`.

## Focused and compatibility gates

| Gate | Result |
| --- | --- |
| Structured-result parser, JSONL recovery, taxonomy, and budgets | PASS |
| Remote Sandbox runtime, supervisor, provider, credentials, and reconciliation | PASS |
| Generic Harness and Codex/DeepSeek adapters | PASS |
| Worker leases, durable recovery, and Factory Attempt lifecycle | PASS |
| Verification Factory and Policy V2 exact-current checks | PASS |
| Review Intelligence authority and golden path | PASS |
| Autonomous Execution Routing compatibility | PASS |
| Factory Learning and system Factory qualification | PASS |

The final post-review focused orchestration run passed 44 tests, including 17 structured-result tests, 15 Remote Sandbox runtime tests, and the remote/local Factory worker lifecycle tests. The final composed execution-boundary qualification passed 65 tests, and the named compatibility run passed 83 orchestration tests and 162 Convex policy/governance tests before the final full qualification.

## Authoritative full command

```text
pnpm run qualify:factory
```

Result: PASS on the final reviewed code. The command completed all requested local gates:

- release dependency and credential gates;
- repository secret scan;
- release hardening contract tests;
- historical V1 evidence immutability;
- canonical workspace preparation;
- composed Factory/system and execution-boundary tests;
- Mission, WorkOrder, Memory, Observability, GitHub, Learning, Review Intelligence, and Policy V2 contracts;
- Generic Harness contract;
- Verification Factory exact-current contracts;
- complete repository test suite;
- TypeScript across all workspaces;
- skill lint: 10 skills, all 100/100, zero warnings/errors;
- runtime-contract guard: PASS, no public Convex validator drift across 915 functions;
- production build;
- orchestration startup smoke under Node ESM;
- repository secret scan; and
- `git diff --check`.

Notable final counts include 150 passed orchestration tests (one opt-in integration skipped), 681 passed Convex tests, and 303 passed UI tests. The generated system-qualification timestamp files were mechanically restored after the command because this qualification owns only the remote-specific evidence directory.

## Live gate

```text
MC_REMOTE_CODEX_QUALIFICATION=1 \
MISSION_CONTROL_SANDBOX_LIVE=1 \
node --env-file-if-exists=/Users/jaywest/MissionControl/.env.local \
  --import tsx scripts/remote-codex-structured-output-qualification.mts
```

Result: `REMOTE CODEX STRUCTURED OUTPUT QUALIFIED`.

- Qualification: 5/5 across two workload classes.
- Pilot regression: 3/3 through candidate, independent verification, and acceptance eligibility.
- Eligible final Attempts: 8; retries: 0.
- Maximum concurrent VMs: 1.
- Attempt credential revocation: 8/8.
- VM absence: 8/8.
- Final exe.dev inventory: 0.
- Total remote execution time: 1,251,395 ms.
- Model/provider cost: `null`/`null` because the providers did not supply priced telemetry.

Fresh GitHub CI and Vercel results are recorded in the draft pull request after publication. Guarded Auto remained disabled, and no merge or automatic publication was performed.
