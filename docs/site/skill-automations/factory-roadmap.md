# Agentic Software Factory Enhancement Roadmap

Canonical source: `docs/plans/2026-07-30-agentic-software-factory-enhancements.md`

## Current posture

Mission Control has the core governed loop: deterministic skill discovery,
conversion, immutable execution artifacts, explicit Definition review and
activation, evaluation-only triggers, approval-gated WorkOrders, bounded
adapters, independent receipts, and correlated decisions.

The next work should increase trust and operating leverage before adding
autonomy. LEVEL_1 remains the correct production boundary.

## P0 — required before broader production use

### 1. Authenticated operator identity and workspace authorization

- Replace client-asserted actor labels with authenticated operator IDs.
- Enforce workspace, repository, environment, and Definition authorization in every query and mutation.
- Prevent Definition authors from approving their own activation or execution.

### 2. Executor capability and host binding

- Bind each adapter run to an approved executor, repository checkout, runtime, network policy, and workspace host.
- Refuse dispatch when capability cannot be proven.
- Surface executor capacity, health, and drift in Queue and Agent Registry.

### 3. Secret broker integration

- Resolve references only at execution time through a scoped broker.
- Issue short-lived credentials and record access receipts without values.
- Add rotation, revocation, and missing-secret operator workflows.

### 4. Repository-backed artifact change workflow

- Generate a branch and reviewable pull request for new or edited artifacts.
- Pin Definition versions to commit SHA and content hash.
- Require CI and repository-policy receipts before activation.

### 5. Schema and migration discipline

- Add explicit migrations and compatibility checks for shared factory tables.
- Gate CI on generated Convex bindings and legacy factory consumers.
- Add seed-version assertions so demo and production projections cannot drift.

## P1 — operating confidence and measurable leverage

### Policy simulation and dry-run

Preview which Definitions would evaluate, skip, suspend, or create work, with
the exact policy version and evidence behind every decision.

### Verifier diversity

Support independent API, repository-state, schema, screenshot, and
second-workflow verifiers. Executor and verifier identities must be distinct.

### Reliability promotion

Use minimum run count, verification rate, evidence freshness, retry rate, and
incident history to create an operator promotion packet. Never promote autonomy automatically.

### Incident-driven suspension

Correlate failed runs, rejected receipts, stale evidence, and cost/runtime
breaches into Incidents with suspend, remediation WorkOrder, and resume checks.

### Provenance and supply-chain evidence

Attach commit, dependency lock, runtime image, executor, artifact hash, and
verifier hash to every run. Export SLSA-style provenance for audit and release gates.

### ROI and capacity accounting

Derive time saved from measured human-touch history, attribute costs by
Definition, and report confidence intervals rather than optimistic point estimates.

## P2 — higher-order factory capabilities

1. Visual deterministic pipeline graph with typed input and output mappings.
2. Evidence-preserving replay from any Definition version and commit.
3. Shadow and canary evaluation before activation or promotion.
4. Capacity-aware scheduling across repositories and executor pools.
5. Versioned Automation templates shared through Context Registry.
6. Cross-Definition dependency graph, cycle detection, and blast-radius view.
7. Failure clustering and suggested remediation WorkOrders.
8. Isolated LEVEL_2 research track, separated from production LEVEL_1 policy.

## Recommended next bounded enhancement

Implement authenticated operator identity, workspace authorization, and
separation of duties first. It closes the largest V1 trust gap and is required
before expanding adapter permissions or autonomy.
