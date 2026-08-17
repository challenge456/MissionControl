# System Qualification V2 evidence packet

Decision: **SYSTEM QUALIFIED V2 WITH KNOWN LIMITATIONS**

Release recommendation: **MERGE** after the draft PR's required GitHub and Vercel checks pass.

This packet qualifies one coherent governed Software Factory after Release & Dependency Hardening V1, Generic Harness Contract Phase 2, and Spec-Driven Mission Intake V1. It does not certify live Remote Sandbox/exe.dev, PR #89 cross-company identity, Loom production admission, or autonomous model/harness routing.

## Delivery identity

| Field | Value |
| --- | --- |
| Starting `origin/main` | `ed2a8a9d686a7c1109aab381efa7eba369f8e996` |
| Starting runtime | Convex runtime contract v28; local Node 24.18.1; pnpm 9.0.0 |
| Qualified source SHA | `fda98924eb0ad4ab3b95cab16c8049e9df804d29` |
| Final branch | `codex/release-dependency-hardening-v1` |
| Final head | Current head of draft PR #116; exact delivery head is recorded in the final operator report to avoid a self-referential commit |
| Draft PR | [#116](https://github.com/jaydubya818/MissionControl/pull/116) |
| GitHub CI | Fresh required checks on draft PR #116; terminal status is recorded in the final operator report |
| Vercel preview | Draft PR #116 deployment check; terminal URL/status is recorded in the final operator report |

The baseline contains merge commits for PRs #111, #112, #113, and #114. `origin/main` advanced to `b7b1ee6983dca500d0828af240907033b9d91fc2` during qualification through PR #115 (README capability refresh); the qualification base remains the exact fork point above and the PR reports the later main delta.

## Qualification decisions

### Hardening V1

**HARDENING V1 PASSED.** Production advisories moved from 4 moderate / 0 high / 0 critical to 3 moderate / 0 high / 0 critical. The complete graph moved from 4 low / 9 moderate / 0 high / 0 critical to 2 low / 4 moderate / 0 high / 0 critical. Every remaining moderate is exact-version, exact-advisory, owner-assigned, controlled, time-bounded, and fail-closed by the dependency gate. See [hardening-v1.md](hardening-v1.md) and [security-qualification.md](security-qualification.md).

### System Qualification V2

**SYSTEM QUALIFIED V2 WITH KNOWN LIMITATIONS.** The full deterministic golden path, required failure matrix, authority boundaries, security gates, exact Specification lineage, generic harness admission, independent verification, exact-current PR eligibility, human acceptance, and advisory learning continuation passed. The limitations are approved boundary deferrals, not failed invariants.

## Exact governed lineage

| Domain | Frozen identity |
| --- | --- |
| Constitution | `constitution-revision-system-factory-e2e-v2-r1`; `sha256:95aa75c012aa1d9ee910d41f3cc5b652e519bddb21c71156fce88c04002e002c` |
| Spec r1, blocking | `mission-spec-system-factory-e2e-v2-r1`; `sha256:fa04cfd6c6b301f8de2638d98f7c115a0c300c74a9b730440df92b4dbda20077` |
| Spec r2, PASS/finalized | `mission-spec-system-factory-e2e-v2-r2`; `sha256:3187eba71569bb50e9893bd14eeb59d80929476bae7b10d56ca5af78e348b3dc`; evaluation `mission-spec-evaluation-system-factory-e2e-v2-r2` |
| Spec consistency / coverage | `sha256:37adf4c756baabe243d35973805b973709bcc6755066ffa77ee9204bdf5f05f9`; `sha256:8dd1620c637d5259d8ccffb2340019bb9f22e52aa337d8de1bc3befd9b465b3c` |
| Spec r3, later/current | `mission-spec-system-factory-e2e-v2-r3`; `sha256:ae8415db4835972738609e2181788ad74e16ada5d1ce21f91599f02e94a5569c` |
| Mission / Plan | `mission-system-factory-e2e-v2`; `plan-system-factory-e2e-v2` revision 1, authored by `operator-author`, separately approved by `operator-approver` |
| Quality Contract | schema v2; `sha256:244de22b4a25143e45a8753ec7fbc291d660b5ec2e7e2c1c6baf76cc38f5151c` |
| WorkOrder | `work-order-system-factory-e2e-v2` revision 1; recipe `progressive-software-delivery` |
| Factory | `factory-version-progressive-software-v1`; verification `factory-version-independent-verification-v1` |

The approved Plan, Quality Contract, WorkOrder, candidates, evidence, and acceptance stayed bound to Spec r2 after r3 was created. No silent rebinding occurred.

## Harness capability and configuration lineage

The canonical execution adapter was Codex v1 with capability manifest `sha256:4837270edf70ebb3efdc9e23b24ac2fe6c5eaf454f6c8f53a1ea2902c7b6226f`, effective configuration `703467cc06f69929e44fd57043ca6fc8a5388620139d727811f348e94a6454ef`, and the Fake Remote Sandbox backend.

The generic contract segment admitted only the exact DeepSeek experimental tuple: contract `generic-harness-contract/v1`, adapter `deepseek-harness` v0.2.0, manifest `sha256:ba1347c88193af3170adda3e6d7f7c76806b174fea27d669d24f8b1b53017259`, configuration `3a2e1bfde534d1168f886c09c3f2fed86adb5a02a3c312043b34a01549225cec`, provider `local-ollama`, model `qwen3.5:35b-a3b-q8_0`, persistent-worker backend, worker `worker-generic-harness-v2`, session `worker-generic-harness-session-v2`, generation 1. Mismatched manifest, model, backend, identity, session, or generation failed closed. Harness authority remained `NONE`; normalized results remained untrusted.

## Execution, verification, PR, and acceptance

| Domain | Frozen identity |
| --- | --- |
| Worker | `worker-system-factory-v2`; session `worker-session-current`; generation 2 |
| Lease | `lease-source-current-head` |
| Context Package | `d855eccfc7176fed31fe1ff4` |
| Execution manifest | `sha256:8d6577b85cedea978d95d31fc4d21cc0b7fa73274d520df14eaed606d3788902` |
| Source Attempts | `attempt-source-failed-1`, `-2`, `-3`, `attempt-source-repaired`, `attempt-source-current-head` |
| Exact candidate | `9ba871d9efad9b224b2f2cd432fbfb5cfbc9d461` |
| Verification Attempts | `attempt-verification-failed-3`, `attempt-verification-repaired`, `attempt-verification-current-head` |
| Verification Subject | `verification-subject:3c09429b8a87ce4b3e748d185b1b1417cf1397e7a6e178c991d2e6c2bb40f4be` |
| Verification Plan | `verification-plan:b821ce55b9523c9f15f6cf7be550746853da86ca755557bd2a401d379638171f`; digest `sha256:b821ce55b9523c9f15f6cf7be550746853da86ca755557bd2a401d379638171f` |
| Evidence | negative constraints, change budget, independent verification, and `spec:VERIFY-001` under `attempt-verification-current-head` |
| Receipt | `receipt:attempt-verification-current-head` |
| Provider PR | deterministic fixture `provider-pr-system-factory-v2`; exact head `9ba871d9efad9b224b2f2cd432fbfb5cfbc9d461` |
| Acceptance | `WORK_ORDER_ACCEPTED` written through `workOrders.accept` by a human operator only |

Verification stayed independent. Quality Gate Decisions, Observability/Evals, Factory Memory, Spec finalization, sandbox execution, harness output, and Factory Learning did not gain acceptance authority.

## Factory Learning continuation

Three `HUMAN_CORRECTION`/context-miss signals produced one deduplicated cluster and `improvement-candidate-listing-fee-gate`. A human approved experiment `experiment-listing-fee-gate`; the low-sample result recommended promotion but was not statistically significant and `autoPromote` remained false. Continuation created only Mission `mission-learning-followup` and proposed Plan `plan-learning-followup`; it released zero WorkOrders.

## Failure injection

All required failures passed: incomplete Spec r1, Spec repository mismatch, stale Spec/Plan lineage, r3 no-rebind, stale lease/session/generation, capability digest mismatch, configuration/model/backend/identity mismatch, Context miss, deterministic gate failure, verification failure, candidate/PR-head mismatch, retry/new Attempt, sandbox teardown failure, repeated correction learning, and Improvement Candidate self-promotion denial. Historical V1 evidence remained byte-for-byte unchanged.

## Browser and accessibility

The live Convex-backed browser qualification passed in Chromium across 1440×900, 1024×768, and 390×844; light/dark; Basic/Intermediate/Advanced; direct URLs; refresh; back/forward; keyboard focus; and overflow checks. It captured ten screenshots over Mission, approved Plan, Spec r1/r2/r3 plus Constitution and coverage, frozen r2 Plan, WorkOrder/Run Inspector, PR currentness, Factory Memory, Observability/Evals, and Factory Learning.

Targeted axe WCAG A/AA scans found zero serious or critical violations on all six audited surfaces. There were no console errors, page errors, or failed requests. The independent data-free CI browser gate passed 9/9 and additionally proved one `main` landmark, critical route rendering, PRD dialog naming/focus, mobile off-canvas navigation/chat, and unknown data empty states. See [browser-evidence.json](browser-evidence.json) and [screenshots/](screenshots/).

## Performance and cost

The composed scenario ran in 8.562 seconds: source gates 3.380 seconds, independent verification 4.738 seconds, Fake Sandbox provider 1 ms. It performed seven deterministic gate runs, five source Attempts/four retries, three verification Attempts, one agent step, zero model calls, no token count, and $0 cost. The complete automated qualification ran from `2026-08-17T17:28:11.566Z` to `2026-08-17T17:30:05.764Z` on exact source SHA `fda98924eb0ad4ab3b95cab16c8049e9df804d29`.

## Full validation

- Release security: production 0 critical / 0 high / 3 accepted moderate; full graph 0 critical / 0 high / 4 accepted moderate / 2 low; repository secret scan 2,313 tracked files clean; built asset scan 51 files clean.
- Focused composed/authority suites: 12 files / 56 tests; Mission/WorkOrder/security contracts 22 / 144; generic harness 2 / 8; Verification Factory 6 / 44; Memory 4 / 27; Progressive/Learning UI 7 / 25.
- Full repository: 1,727 passed, one explicitly skipped live integration (1,084 workspace tests plus 643 Convex tests).
- TypeScript passed in every workspace; ten skills linted at 100/100; runtime guard passed with no public validator delta across 906 functions.
- Production build passed with no source maps; orchestration Node ESM startup smoke passed; `git diff --check` passed.

Machine-readable details are in [automated-checks.json](automated-checks.json) and [scenario-evidence.json](scenario-evidence.json).

## Remaining limitations

- Remote Sandbox qualification used `FakeSandboxProvider`; live exe.dev remains Preview / Not Live Certified.
- PR #89 two-company live identity proof remains deferred by instruction.
- DeepSeek is exact-contract admitted but experimental and explicitly routed; autonomous routing was not started.
- Loom production admission remains deferred.
- Provider PR lineage is a deterministic fixture and does not mutate an external product repository.
- HSTS was not set without a qualified canonical production-domain/subdomain policy; Vercel TLS and the other deterministic response protections remain in force.

No required security, release, authority, lineage, execution, verification, acceptance, or recovery invariant failed.
