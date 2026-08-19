# Production Factory Pilot V3 — Final Readiness Gate

## Executive decision

HUMAN-GOVERNED PRODUCTION PILOT READY

Mission Control satisfied the approved V3 gate for bounded, human-governed production pilot workloads. The result does not authorize Guarded Auto, automatic merge, production rollout flag changes, or any new acceptance path.

## Exact source identity and runtime

- Baseline SHA: `db44819ec59e79cdd71ba9ed36fce8064a120af3`
- Final execution-head SHA: `db44819ec59e79cdd71ba9ed36fce8064a120af3`
- `origin/main` at admission: `db44819ec59e79cdd71ba9ed36fce8064a120af3`
- Runtime contract: v30
- Pilot run ID: `9e1588dce8fc`
- Governed population runtime: 930,594 ms (15 minutes 30.594 seconds)
- Node: v24.18.1
- pnpm: 9.0.0
- Codex CLI: 0.146.0

The execution source remained exact throughout the population. The later evidence/tooling commit is publication provenance and did not alter the source used by the 15 governed executions.

## Outcome

- Workloads: 15/15 accepted after a valid terminal `factory-result/v1`, candidate creation, independent exact-candidate verification, exact-current eligibility, Review Package projection, and the canonical human acceptance operation.
- Classes: 3 bug fixes, 3 features, 3 refactors, 3 security/policy changes, and 3 data/schema migrations.
- First-pass structured-result success: 15/15 (100%).
- First-pass independent verification: 15/15 (100%).
- Eventual success: 15/15 (100%).
- Attempts: 15 total; 0 failed; 0 replacement Attempts; 0 retries; 0 cancellations.
- Context misses, stale-currentness events, worker recovery events, malformed terminal results, and review corrections: 0.

## Live Remote Sandbox gate

- Result: 3/3 first-pass across bug fix, Security Configuration D, and data/schema migration.
- Remote concurrency: sequential, maximum one.
- Result provenance: 3 canonical output files; 0 JSONL reconstructions. JSONL event streams were well formed and retained as corroborating telemetry.
- Security Configuration D was frozen per Attempt with configuration digest `sha256:6aa782139093a409608bd956cd450b6775106cbc7be5685a851383e6867569d5`.
- Migration used the workload-specific 420,000 ms sandbox ceiling and 390,000 ms executor timeout with configuration digest `sha256:496e33ed1ea0eeb08c0925540d247857275a1ab82eb2193cfb9a6abdfe61a88b`.
- Every remote Attempt used an Attempt-scoped inference credential, proved credential revocation, proved exact provider-resource absence, and finished with inventory zero.
- Management, provider-administration, GitHub, publication, Mission Control service, verification, and acceptance authority remained host-only.

## Performance and economics

- Total cycle time: median 31,616 ms; p95 230,971 ms.
- Local execution: median 29,377 ms; p95 51,858 ms (12 samples).
- Remote allocation: median 3,613 ms; p95 3,656 ms (3 samples).
- Remote readiness: median 4,385 ms; p95 4,419 ms (3 samples).
- Remote execution: median 68,886 ms; p95 210,716 ms (3 samples).
- Independent verification: median 276 ms; p95 285 ms.
- Teardown: median 3,603 ms; p95 3,856 ms (3 samples).
- Tokens: 1,223,309 input and 25,638 output across 15 executions.
- Model cost, provider cost, and cost per accepted workload: `null`. Neither Codex CLI nor exe.dev exposed complete priced scenario telemetry, so missing values were not converted to zero.

## Governance, review, learning, and routing

- Required human governance actions recorded: 51 (plan approval, high-risk review where applicable, non-accepting Review Package approval, and acceptance decision).
- Avoidable operator toil: 0.
- Acceptance authority remained exactly `workOrders.accept`; human merge remained separate and no merge was performed.
- Review Intelligence proves a linked intent → criterion → evidence → verification → implementation decision → raw diff path for representative workloads in every class. Residual AI remained default-off; Review Package approval remained non-accepting.
- Seventeen deliberate failure injections failed closed and proved recovery independently from the 15 success workloads.
- Unresolved P0/P1 reliability defects: 0. No production-code defect was reproduced on the frozen baseline.
- Factory Learning received V3 evidence and produced one evidence-backed candidate in `PROPOSED` state with automatic promotion disabled.
- Routing remained advisory. Guarded Auto applied 0 decisions. The remote tuple has 3 verified samples, below the frozen five-sample threshold for a future bounded routing experiment.

## Validation

`pnpm run qualify:factory` passed all 17 recorded gates, including full repository tests, TypeScript, skill lint, runtime guard, production build, orchestration startup smoke, dependency/security gates, repository secret scan, historical V1/V2 evidence immutability, and `git diff --check`. The automated gate runtime was 143,981 ms. Fresh GitHub CI and Vercel results are recorded on the draft PR.

## Preserved evidence

Aggregate SHA-256 was recomputed over sorted per-file SHA-256 records after V3 execution and validation:

- System Qualification V1: 14 files, `57200a1630cd3bdd2d0d7018d4215e0e80ac9fa06889645eb37131e6b2041702`
- System Qualification V2: 16 files, `3a5c85831e87940b30e0cb507d10f51e51e440746fc5c0e471a5804e5ff18949`
- Production Factory Pilot V1: 27 files, `bb8e72d7a5d70100705d977a63efd19aa57c418d05b4a049a89a5f739240ee03`
- Production Factory Pilot V2: 19 files, `060fc50538b813ee3f3a94d97e46677fcbef4135a523e02eab6017a181541694`
- Remote Codex Structured Output V1: 14 files, `ac4e657649cc10e00cad5f99274d83c212eba306549c46ca9f45b1b5e3cddc93`
- Remote Runtime Reliability V1: 16 files, `7f33c2b46329e96d13d73395be0604ca448411ac2dbd82a6db185d36308fafc8`

## Known limitations

- Remote Sandbox remains Preview with unrestricted outbound egress and ephemeral Codex installation; this pilot qualifies bounded human-governed use, not general production certification.
- Exact cost telemetry is unavailable and remains `null`.
- Three verified remote samples are insufficient for routing automation. Guarded Auto remains disabled.
- The workload repositories and provider PR identities are deterministic disposable fixtures; no external product repository was published or merged.

## Evidence index

- `run-results.json`: canonical complete pilot record and strict decision inputs.
- `execution-results.json`: execution and Attempt outcomes.
- `exact-lineage.json`: Constitution-to-acceptance identity chain per workload.
- `structured-result-provenance.json`: terminal structured-result source and criterion accounting.
- `remote-reliability.json` and `final-vm-credential-proof.json`: live remote lifecycle, identity, cleanup, and final inventory.
- `retry-data.json`: policy, budget, Attempt identity, and retry metrics.
- `cost-latency-metrics.json`: performance, tokens, and nullable economics.
- `human-intervention-analysis.json`: required governance versus avoidable toil.
- `failure-injection-results.json`: fail-closed matrix.
- `routing-shadow-analysis.json`: advisory recommendations, outcomes, and coverage.
- `factory-learning-output.json`: advisory learning signals, clustering, and proposed candidate.
- `v1-v2-v3-comparison.json`: comparable historical outcomes.
- `prior-evidence-integrity.json`: preserved evidence packet identities.
- `automated-checks.json` and `scenario-evidence.json`: repository-wide qualification output.
