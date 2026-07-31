# Agentic Software Factory enhancement roadmap

## Current posture

Mission Control now has the core governed loop: deterministic skill discovery,
conversion, immutable execution artifacts, explicit Definition review and
activation, evaluation-only triggers, approval-gated WorkOrders, bounded
adapters, independent receipts, and correlated decisions.

The next work should strengthen trust and operating leverage before adding more
autonomy. LEVEL_1 remains the correct production boundary.

## P0 — required before broader production use

1. **Authenticated operator identity and workspace authorization**
   - Replace client-asserted actor labels with authenticated operator IDs.
   - Enforce workspace, repository, environment, and Definition permissions in
     every query and mutation.
   - Add separation-of-duties policy so Definition authors cannot approve their
     own activation or execution.

2. **Executor capability and host binding**
   - Bind every adapter run to an approved executor, repository checkout,
     runtime version, network policy, and workspace host.
   - Refuse dispatch when the executor cannot prove the declared capability.
   - Surface capacity, health, and drift in Queue and Agent Registry.

3. **Secret broker integration**
   - Resolve references only at execution time through a scoped broker.
   - Issue short-lived credentials and record access receipts without values.
   - Add rotation, revocation, and missing-secret operator workflows.

4. **Repository-backed artifact change workflow**
   - Generate a branch and reviewable pull request for new or edited artifacts.
   - Pin Definition versions to commit SHA and content hash.
   - Require CI and repository policy receipts before activation.

5. **Schema and migration discipline**
   - Add explicit migrations and compatibility checks for shared factory tables.
   - Gate CI on generated Convex bindings and legacy factory consumers.
   - Add seed-version assertions so demo and production projections cannot
     silently drift.

## P1 — operating confidence and measurable leverage

1. **Policy simulation and dry-run**
   - Preview which Definitions would evaluate, skip, suspend, or create work.
   - Explain each policy decision with the exact version and evidence inputs.

2. **Verifier diversity**
   - Support independent API, repository-state, schema, screenshot, and
     second-workflow verifiers.
   - Enforce that executor and verifier identities/capabilities are distinct.

3. **Reliability promotion**
   - Promote Definitions from probation using minimum run count, verification
     rate, freshness, retry rate, and incident history.
   - Never promote autonomy automatically; produce an operator decision packet.

4. **Incident-driven suspension**
   - Correlate failed runs, rejected receipts, stale evidence, and cost/runtime
     breaches into Incidents.
   - Provide one-click suspend, root-cause WorkOrder, and safe resume checks.

5. **Provenance and supply-chain evidence**
   - Attach commit, dependency lock, runtime image, executor, artifact hash, and
     verifier hash to each run.
   - Export SLSA-style provenance for audit and release gates.

6. **ROI and capacity accounting**
   - Derive time saved from measured historical human touch time.
   - Attribute adapter, model, executor, and verification cost per Definition.
   - Show confidence intervals rather than optimistic point estimates.

## P2 — higher-order factory capabilities

1. Visual deterministic pipeline graph with typed input/output mappings.
2. Evidence-preserving replay from any prior Definition version and commit.
3. Shadow and canary evaluations before activation or version promotion.
4. Capacity-aware scheduling across repositories and executor pools.
5. Versioned Automation templates shared through the Context Registry.
6. Cross-Definition dependency graph, cycle detection, and blast-radius view.
7. Failure clustering and suggested remediation WorkOrders.
8. Controlled LEVEL_2 research track, isolated from production LEVEL_1 policy.

## Recommended next bounded enhancement

Implement authenticated operator identity, workspace authorization, and
separation of duties first. It closes the largest stated V1 trust gap and is a
prerequisite for safely expanding adapter permissions or autonomy.
