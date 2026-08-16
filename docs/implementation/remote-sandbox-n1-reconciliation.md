# Remote Sandbox N=1 Reconciliation

**Preserved implementation source:** `78d7e417d1a32af24ede61991b219459a1db897f`
**Original base:** `3673dd9a1d2c3e3e13da2ead7cbc7fd9c1de8bb4`
**Exact merged PR #102 / main baseline:** `c97b31d59911543c6f95b2cd35fded957b2eddc6`
**Exact merged PR #95 / final main baseline:** `d0e5ff2ff57da7e5037da6f6ee8083ed275d911f`

## Decision

Remote Sandbox is an execution backend selected by an immutable Factory version. PR #102 owns worker admission and execution continuity. The sandbox implementation owns provider normalization, one Attempt-scoped resource, result transport, narrow runtime credentials, and provider teardown evidence.

PR #95 remains authoritative for the Mission-to-PR lifecycle, policy-v2 Verification Attempts, exact-candidate review package, and `workOrders.accept` eligibility. Remote execution supplies an immutable candidate to that lifecycle; it does not replace or weaken it.

## Canonical runtime reused

| Concern | Reused authority |
| --- | --- |
| Worker identity | `workspaceHostBindings.workerRuntime` stable worker ID |
| Incarnation fencing | worker session ID and monotonic generation |
| Admission | canonical backend, executor, isolation, and required-capability eligibility |
| Capacity | canonical active-lease slot counting and `maxConcurrentRuns` |
| Attempt ownership | `workflowRuns.lease` and worker tuple on claim/renew/report/publication |
| Heartbeats | canonical worker registration plus Attempt lease renewal |
| Stale workers | current-registration predicate from PR #102 |
| Recovery | LOST/replacement Attempt semantics; publication checkpoint is the only resumable boundary |
| Process/worktree ownership | protected `factory-workspace-ownership/v1` manifest |
| Cleanup | exact owner, terminated process, clean candidate, publication proof, then fail-closed worktree removal |

## Duplicate concepts removed

- No remote worker table, session, generation, admission gate, capacity counter, Attempt lease, or heartbeat event stream.
- No remote Attempt recovery/resume model. Sandbox profiles freeze `supportsResume=false`.
- No remote process/worktree owner. Provider process identity is recorded in the canonical ownership manifest.
- No sandbox acceptance, verification verdict, publication permit, Git, pull-request, merge, or deployment mutation.
- No second observability store. Allocation/credential projections and sandbox events extend the existing Attempt inspector.
- No second Factory mode selector. Remote settings follow the shared progressive experience level.
- No manifest v2. The optional remote contract extends `factory-execution-manifest/v1`.

## New backend-owned projections

- `factorySandboxProfiles`: immutable configuration/readiness evidence.
- `sandboxAllocations`: current provider resource, result, cost, and teardown evidence for one Attempt.
- `sandboxCredentialGrants`: non-secret Attempt credential identity and revocation state.

These are not worker or lease authorities. Reconciliation candidates include a control-plane-computed `attemptLeaseCurrent` boolean based on the canonical lease and current worker registration.

## Compatibility preserved

- Factory Memory / Context Packages continue to attach to the same WorkflowRun and WorkOrder.
- Canonical Observability/Evals continue to own run events, artifacts, verification, and usage rollups.
- Verification Factory policy-v2 remains the independent verifier and gate.
- Local persistent-worker Factory versions remain compatible; the remote sandbox contract is optional and forbidden on local manifests.
- `workOrders.accept` is unchanged and remains the sole acceptance mutation.

## Certification boundary

The deterministic Fake-provider golden path is implementation proof. It has no provider spend and no external capacity dependency. Live exe.dev certification remains a separate, explicitly authorized activity. The normal Factory configuration path cannot assert certification and freezes new production profiles as `liveCertified=false`; until a separately authorized control-plane certification flow exists and succeeds, production remains **Preview / Not Live Certified**.

## Final runtime contract

PR #95 advanced the exact main baseline from runtime v23 to v24. The post-merge extractor still identifies the same four Remote Sandbox public changes, so this reconciliation advances the combined runtime atomically from v24 to v25:

- `factory/configuration:createSandboxProfile` added
- `factory/configuration:createVersion` arguments changed
- `serviceCommands:listFactorySandboxReconcileCandidates` added
- `serviceCommands:reportFactorySandboxReconcile` added
