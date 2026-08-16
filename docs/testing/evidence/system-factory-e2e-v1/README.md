# Mission Control full-system E2E qualification V1

## Decision

**SYSTEM QUALIFIED WITH KNOWN LIMITATIONS**

The canonical Mission Control factory composes successfully from governed intent through exact-current human acceptance, then continues into human-gated Factory Learning without granting learning, observability, memory, workers, or sandboxes acceptance authority. The deterministic scenario, deliberate failure/recovery matrix, full repository validation, and real-browser journey pass.

This is not live-provider certification. Remote Sandbox is exercised through `FakeSandboxProvider`; the deferred PR #89 two-company identity proof is not reopened; and product pull-request lineage is represented by a deterministic provider fixture rather than a mutation to an external repository.

The exact qualified-content commit is `89416477c2ad044a268594eed16bc257cc32e7ad`, recorded with draft PR #111 in `delivery-metadata.json`. The metadata-only delivery commit does not change qualified runtime or test behavior.

## Authoritative baseline

| Item | Recorded value |
| --- | --- |
| Exact fetched `origin/main` | `3de80b97c7272f64586e5d08bc7c73fcd2114faa` |
| Branch | `codex/system-factory-e2e-qualification-v1` |
| Runtime contract | v26 (`convex/lib/runtimeContract.ts`) |
| PR #109 Remote Sandbox | Reachable from baseline at `e32444a2aecb67bfcb050cd4a92d11d8de650db8` |
| PR #110 Factory Learning | Reachable from baseline at `3de80b97c7272f64586e5d08bc7c73fcd2114faa` |
| Database/public API change | None; runtime-contract guard reports zero public changes |

The baseline was fetched before modification in a fresh isolated worktree. Existing golden-path, Policy V2, Factory Memory, Remote Sandbox, GitHub App, Progressive Factory, and Factory Learning fixtures were inspected and reused before adding the composed scenario.

## Environment

- macOS local worktree; Node and pnpm versions are the repository/CI-selected versions.
- Convex local backend with the Software Factory demo seed for browser proof.
- Mission Control UI at `http://localhost:5199` with `VITE_CONVEX_URL` pointed at the same local backend.
- Deterministic temporary TypeScript Git repository created per composed test and deleted afterward.
- Fake remote provider only. No exe.dev resource, provider credential, payment/capacity change, public ingress, external product repository mutation, or PR #89 activity.

## Canonical scenario

The isolated fixture is `sellerfi/system-factory-qualification-fixture`. Its Mission corrects an intentionally wrong integer-cent listing-fee calculation to the policy-mandated five percent. The objective Definition of Done is: `node scripts/verify.mjs` exits zero in a distinct independent checkout.

The fixture contains TypeScript source, deterministic lint/type/test scripts, acceptance tests, and an authoritative repository policy document. Its Git base, tree, intermediate candidates, final candidate, and exact verification subject are regenerated deterministically by the composed test. Agent self-report is never used as proof.

## Qualification inventory

| Capability | Canonical implementation | Existing tests/proof | This qualification coverage |
| --- | --- | --- | --- |
| Missions | `convex/missions.ts` | `missionPlan.test.ts`, Mission UI tests | Exact Mission ID/objective; browser draft creation, direct route, refresh/history |
| Plans | `convex/missions.ts`, `convex/lib/missionPlan.ts` | `missionPlan.test.ts` | Exact Plan ID/revision and submitted state |
| Plan approval | `convex/missions.ts` | `missionPlan.test.ts` | Distinct author/approver and exact approved revision |
| WorkOrders | `convex/workOrders.ts`, `convex/lib/workOrders.ts` | `workOrders.test.ts`, `missionWorkOrderContract.test.ts` | Exact approved Plan revision, repository/base SHA, quality contract, revision |
| Factory Definitions/Versions | `convex/factory/configuration.ts`, `convex/lib/factoryConfiguration.ts` | `factoryConfiguration.test.ts`, `factoryRuntimeGoldenPath.test.ts` | Exact source and independent-verifier Factory Version IDs |
| Progressive Factory recipes | `apps/mission-control-ui/src/factoryExperience/`, `convex/lib/factoryWorkflowContract.ts` | Progressive Factory UI/model tests | Frozen `progressive-software-delivery` recipe; Basic/Intermediate/Advanced browser traversal |
| Factory Memory | `packages/memory/src/factory/`, `convex/factoryMemory.ts` | memory package suite, `factoryMemory.test.ts` | Deterministic retrieval, sufficiency, provenance, context miss, browser Context surface |
| Context Packages | `packages/memory/src/factory/context.ts`, `convex/context/packages.ts` | `contextPackages.test.ts` | Frozen package bound to exact WorkOrder/Attempt/Factory Version/base SHA |
| Worker registration/capabilities | `convex/lib/factoryWorkerRuntime.ts` | `factoryWorkerRuntime.test.ts` | Capability/repository/backend admission before execution |
| Worker leases | `convex/lib/factoryAttempt.ts`, `convex/factory/attempts.ts` | `factoryAttempt.test.ts`, worker recovery tests | Exact worker/session/generation/lease and stale-generation failure |
| Local execution | `apps/orchestration-server/src/factoryAttemptWorker.ts` | `factoryAttemptWorker.test.ts` | Canonical local boundary remains covered in the focused/full matrix |
| Remote Sandbox abstraction | `apps/orchestration-server/src/remoteSandboxRuntime.ts` | remote worker, runtime, reconciler, credential tests | Fake provider lifecycle, credential revocation, result binding, teardown/absence proof |
| Attempts | `convex/factory/attempts.ts` | attempt/worker/runtime tests | Five immutable source Attempts and three distinct verification Attempts |
| Traces/observations | `convex/observability.ts`, `convex/lib/observability.ts` | `observabilityGoldenPath.test.ts`, `workflowObservability.test.ts` | Source/verification trace ledger, sandbox events, human/agent/code phase ledger, browser inspector |
| Observability/Evals | `convex/observability.ts`, `apps/mission-control-ui/src/eos/views/TraceInspectorView.tsx` | observability/eval tests | Reconstructive IDs/events, authority scan, browser Eval library and accessibility |
| Candidate integrity | sandbox result contract and `convex/lib/factoryAttempt.ts` | remote worker/result and factory golden-path tests | Every candidate SHA bound to one immutable source Attempt |
| Verification Subjects | `packages/workflow-engine/src/verificationSubject.ts` | `verificationSubject.test.ts` | Git subject binds exact candidate/tree/base/repository/PR identity |
| Verification Plans | `packages/workflow-engine/src/verificationPlan.ts`, `convex/lib/policyV2Verification.ts` | `verificationPlan.test.ts`, Policy V2 tests | Frozen plan ID/digest bound to exact subject and quality contract |
| Independent Verification Attempts | `apps/orchestration-server/src/factoryVerification.ts`, verification independence modules | `factoryVerification.test.ts`, `verificationIndependence.test.ts` | Separate checkout, verifier Attempt/Factory Version/lease; server-derived independence |
| Evidence/receipts | `convex/lib/verificationPersistence.ts` | `verificationPersistence.test.ts` | Evidence envelopes and receipt exact-bound to run/subject/plan/Attempt |
| Quality Gate Decisions | `convex/lib/qualityGateDecision.ts` | `qualityGateDecision.test.ts` | `STALE` on moved head; `ELIGIBLE` only on corrected exact head |
| GitHub App PR lineage | `apps/orchestration-server/src/githubAppPublisher.ts`, `convex/githubAppConnections.ts` | publisher, readiness, CI-ingest tests | Provider PR identity/head/CI lineage; browser displays real local fixture PR state |
| Exact-current eligibility | `packages/workflow-engine/src/verificationCurrentness.ts` | `verificationCurrentness.test.ts` | Previous eligibility invalidates on head move; only new exact lineage recovers |
| `workOrders.accept` | `convex/workOrders.ts` | `workOrderGovernance.test.ts` | Static writer scan proves sole acceptance event writer; human acceptance requires eligible current lineage |
| Factory Learning | `convex/factory/learning.ts`, `convex/factory/metaLoop.ts` | `factoryLearning.test.ts` | Deterministic evidence continuation and browser learning surfaces/empty states |
| Learning signals | `convex/lib/factoryLearning.ts` | `factoryLearning.test.ts` | Three bounded repeated corrections plus a truthful `CONTEXT_MISS`; zero model calls |
| Clusters | `convex/lib/factoryLearning.ts` | `factoryLearning.test.ts` | Exact signature/workspace/repository cluster; duplicate suppressed |
| Improvement Candidates | `convex/factory/learning.ts` | `factoryLearning.test.ts` | `ADD_DETERMINISTIC_GATE` candidate with provenance and human review |
| Experiments | canonical Observability/Evals plus Factory Learning | Factory Learning and observability tests | Approved/completed low-sample comparison, recommendation only, no auto-promotion |

## Exact lineage

`scenario-evidence.json` is the machine-readable source of truth for IDs and digests. It records:

`Mission → Plan/revision/approval → Quality Contract → WorkOrder/revision/repository/base → recipe/Factory Version → Context Package → worker/session/generation → lease → source Attempts/candidates → execution manifest/Fake Sandbox lifecycle → Verification Subject → frozen Verification Plan → separate verifier Attempt/run → evidence/receipt → provider PR exact head → Quality Gate Decision → workOrders.accept`

It then records:

`failure/context evidence → bounded Signals → exact-signature Cluster → Improvement Candidate → human review → canonical completed low-sample experiment → promotion recommendation → Mission + submitted Plan, with zero released WorkOrders`

Assertions compare exact IDs, digests, SHAs, revisions, and identity tuples. There is no “latest successful Attempt” lookup or fuzzy matching.

## Deliberate failures and recovery

| Injection | Required failure behavior | Result/recovery |
| --- | --- | --- |
| Stale worker lease/generation | Reject stale identity; current worker remains authoritative | PASS; current lease remains exact and no publication/evidence mutation occurs |
| Candidate/PR head mismatch | Invalidate eligibility; preserve old evidence/receipt | PASS; gate becomes `STALE`; new source/subject/verifier lineage restores exact-current eligibility |
| Verification failure | Persist failed evidence; remain unacceptable | PASS; trace/eval authority cannot override; repaired work uses new Attempts |
| Retry/new Attempt | Preserve history and prevent cross-binding | PASS; five unique source identities/SHAs and three distinct verifier identities |
| Context miss | Truthful missing provenance; no invented authority | PASS; insufficient package and deterministic `CONTEXT_MISS` signal |
| Deterministic gate failure | Code reports failure without agent interpretation | PASS; three failed fixture candidates, governed repair, passing independent gates |
| Sandbox teardown failure | Revoke credentials, block publication, durably record unproven absence | PASS; `SANDBOX_FAILED` cleanup event and regression test; resource is not falsely terminated |
| Repeated correction | Bounded repository-scoped learning; no duplicate explosion | PASS; 3 signals, 1 duplicate suppressed, 1 exact cluster/candidate |
| Candidate self-promotion | Human review and experiment may recommend, never enact | PASS; low-sample recommendation, `autoPromote=false`, submitted Plan only, zero WorkOrders |

## Authority boundaries

- Worker admission and lease identity are server-derived from worker ID, session, generation, capability, repository access, and active lease.
- Source execution and the sandbox cannot create authoritative verification subjects, claim verifier independence, publish, merge, or accept.
- Sandbox credentials are Attempt-scoped and secret values are excluded from manifests/journals. GitHub App and Mission Control service authority are not present in the sandbox.
- Factory Memory has `acceptanceAuthority=false`; it can retrieve and report misses but cannot establish currentness, independence, or eligibility.
- Observability/Evals persist explanatory quality information but contain no `workOrders.accept` authority.
- Factory Learning can observe, aggregate, propose, and recommend. It cannot verify, accept, publish, merge, route, modify credentials/leases/live Factory configuration, or implement its own recommendation.
- Static repository inspection finds `WORK_ORDER_ACCEPTED` emitted only from `workOrders.ts`; canonical completion is `workOrders.accept` by a human against current eligible lineage.

See `security-qualification.md` for the isolation and dependency-audit record.

## Browser and accessibility proof

The Playwright journey uses the local Convex backend and demo seed. It verifies Mission creation/detail, approved Plan, WorkOrder verification/acceptance state, execution inspector, PR exact-currentness, Factory Memory context provenance, Observability/Evals, and Factory Learning.

Coverage includes 1440 desktop, 1024 tablet, and 390 mobile; light and dark; direct URL load; refresh; back/forward; keyboard focus; horizontal overflow; and zero page errors, application console errors, or unexpected failed requests. Targeted axe WCAG A/AA scans report no serious or critical violations on five key surfaces. `browser-evidence.json` contains the exact surface matrix and scan counts; `screenshots/` contains eight captured states.

## Defects discovered and corrected

| Severity | Failing invariant | Minimal correction | Regression/proof |
| --- | --- | --- | --- |
| P1 | Sandbox cleanup failure blocked publication but did not durably expose unproven resource absence | Journal `SANDBOX_FAILED` cleanup metadata after revocation and before propagating failure | `remoteSandboxRuntime.test.ts` plus composed/focused/full suites |
| P1 trust | Acceptance panel claimed explicit acceptance was allowed while the composite gate disabled acceptance | Derive heading/reasons/summary from the same composite eligibility used by the action | `workOrdersModel.test.ts` and browser contradictory-state assertion |
| P1 navigation | Direct tablet WorkOrder URL lost the detail panel during initial query loading | Preserve route-driven detail until query resolution and focus only after selected detail exists | Direct 1024 browser load and focused Back control |
| P1 presentation | Desktop sidebar + chat rail compressed PR evidence to 345px, causing overlapping exact-currentness content | Use an auto-fitting minimum-readable-width grid and explicit width/containment guards | Browser geometry assertion requires a 600px review package and the screenshot shows readable evidence |
| P2 accessibility | WorkOrder light-theme status text lacked contrast; WorkOrder and Eval tables were not keyboard-scrollable in Safari | Use semantic color tokens; add named focusable scroll regions and visible focus rings | Targeted axe scans now have zero serious/critical violations |

No schema, navigation, public API, runtime version, architecture, provider, or product feature was added.

## Performance and cost

`scenario-evidence.json` records actual composed-test duration, source-gate duration, independent-verification duration, Fake Sandbox provider runtime, source retries, gate count, Attempt counts, and agent-step count. The scenario makes zero model calls, consumes no model tokens, and records zero model cost. Deterministic context selection, lint/type/test gates, exact-current evaluation, learning extraction/clustering, and promotion comparison avoid unnecessary model interpretation.

`automated-checks.json` records start/completion time and duration for every non-interactive validation segment. Unavailable telemetry remains `null`; no token or cost value is fabricated.

## Validation and reproduction

Run all deterministic non-browser qualification segments:

```bash
pnpm run qualify:factory
```

Run the real-browser segment while `pnpm run dev:demo` is connected to the seeded local backend:

```bash
MISSION_CONTROL_URL=http://localhost:5199 \
SYSTEM_FACTORY_WORKSPACE_ID=<demo-workspace-id> \
SYSTEM_FACTORY_PR_WORKSPACE_ID=<pr-fixture-workspace-id> \
SYSTEM_FACTORY_PR_WORK_ORDER_ID=<pr-fixture-workorder-id> \
VITE_CONVEX_URL=<matching-local-convex-url> \
pnpm exec playwright test tests/e2e/system-factory-qualification.e2e.spec.ts \
  --project=chromium --workers=1
```

The top-level command fails non-zero on the first invariant or validation failure and emits `automated-checks.json`. The browser test fails on navigation/state inconsistencies, overflow, page/console/request failures, or serious/critical targeted WCAG violations.

## Known limitations and follow-up

1. Remote Sandbox remains **Preview / Not Live Certified**. This qualification intentionally uses `FakeSandboxProvider` and creates no live exe.dev resources.
2. PR #89’s two-company live identity gate remains deferred by explicit instruction. Existing workspace/repository scoping is exercised; this packet does not claim that separate live proof.
3. Provider PR publication/currentness uses deterministic fixture lineage; the browser also reads an existing local seeded PR-lineage record. No external repository or product PR is mutated by the scenario.
4. A production dependency audit on 2026-08-16 reports four moderate advisories—one `yaml` path and three React Router/DOM advisories—and zero high or critical findings. Dependency remediation is a separate release-hardening task because React Router remediation requires a major-version assessment; it was not folded into a zero-scope qualification.

## Evidence files

- `scenario-evidence.json` — exact lineage, failure injection, authority, learning, and performance evidence
- `automated-checks.json` — non-interactive command matrix and durations
- `browser-evidence.json` — routes/surfaces, viewports/themes, screenshots, accessibility, and runtime error arrays
- `security-qualification.md` — secret, sandbox, identity, isolation, and dependency findings
- `delivery-metadata.json` — exact qualified-content SHA and draft PR delivery state, added after the qualified-content commit
- `screenshots/` — eight real-browser captures
