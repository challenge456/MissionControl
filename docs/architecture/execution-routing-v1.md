---
title: Autonomous Execution Routing V1
status: implemented
date: 2026-08-17
---

# Autonomous Execution Routing V1

## Purpose

Execution Routing recommends or selects one exact production-qualified
`Harness + Model + Execution Backend` strategy for a WorkOrder. It reduces an
operator decision without moving any authority from Factory admission,
independent verification, publication, merge, or acceptance.

The routed unit is an active immutable Factory Version. Mission Control never
constructs an arbitrary Cartesian product of harness, model, and backend.

## Control flow

1. Load at most 25 active Factory Version candidates for the WorkOrder
   repository.
2. Reuse the exact harness manifest and canonical worker admission contract.
3. Reject candidates that fail Factory/current-readiness, repository, worker,
   harness, backend, isolation, network, credential, approved-model, risk,
   budget, context, or production-certification constraints.
4. Load at most 250 recent implementation Attempts, plus bounded trace and gate
   observations, inside the policy evidence window.
5. Score only eligible candidates with `execution-routing/v1`.
6. Apply mode rules:
   - `ADVISORY`: retain the operator/current certified Factory Version;
   - `GUARDED_AUTO`: select only after policy promotion, feature enablement,
     non-RED risk, evidence coverage, sample, and score-margin gates;
   - `PINNED`: an eligible exact operator pin wins; an ineligible pin blocks.
7. Run the selected Factory Version through the unchanged canonical dispatch
   preflight.
8. Freeze the decision snapshot and SHA-256 digest onto the Attempt before the
   worker can claim it.

V1 is additive and default-off for existing execution paths. A dispatch enters
the tuple router only when it already supplies an exact Factory Version
baseline or the WorkOrder has an explicit tuple pin. Legacy non-Factory
dispatch remains on the existing model-only path.

## Eligibility before score

An ineligible candidate never receives a score. Rejection codes are stable and
stored with the decision. Cost and latency cannot compensate for a missing
capability, stale worker, scope mismatch, uncertified harness, risk violation,
or other hard constraint.

Worker freshness uses the canonical two-minute heartbeat threshold. Worker
capacity is calculated from server-side active leases; worker-reported occupied
slots are not trusted.

## Evidence and unknowns

The V1 evidence window defaults to 30 days. The scorer uses:

- independent verified success and first-pass success;
- retry avoidance;
- time from Attempt start to a current verified receipt;
- model, compute, total, and total-cost-per-verified-success observations,
  where failed and retried Attempt spend remains part of the denominator cost;
- context-miss avoidance from bounded traces;
- current quality-gate avoidance; and
- cancellation/failure avoidance.

Metrics without observations remain absent. The scorer normalizes over observed
components and records evidence coverage. It does not insert neutral priors or
treat missing telemetry as zero. A hard budget with unknown estimated cost
fails closed.

Prompts, credentials, and raw secret values are excluded from routing evidence.
Trace naming follows the existing OpenTelemetry-oriented Attempt/trace model;
model/provider/token/cost attributes remain observations rather than authority.

## Frozen decision record

`modelRoutingDecisions.executionRoutingSnapshot` stores:

- algorithm and schema version;
- policy ID/version and WorkOrder/Task identity;
- risk and fixed evidence cutoff;
- every candidate tuple;
- every rejection code and reason;
- observed raw metrics, weights, normalized component scores, total score, and
  evidence coverage;
- recommended, applied, and fallback tuple keys;
- mode, explanation, and fallback reason.

The canonical digest is copied to `workflowRuns.routingDecisionDigest`, and the
same full snapshot is copied to `workflowRuns.executionRoutingSnapshot`.
Subsequent telemetry and verification outcomes cannot update that Attempt.

## Authorization

- Factory View: catalog, policy, preview, and decision reads.
- Factory Improve: agent-specific route overrides and experiment creation.
- Factory Approve: WorkOrder model overrides and exact tuple pins.
- Factory Automation Manage: policy activation, Guarded Auto promotion,
  execution/model routing feature flags, catalog initialization, and approved
  local-model sync.

Actor attribution is derived from authenticated workspace membership. Provider
health ingestion is internal-only. Discovered local models are scoped to their
own workspace and cannot overwrite another workspace's catalog entries.
Project scope is rechecked through the parent WorkOrder, Task, or Attempt before
a decision is returned. Exact pins also retain the existing delivery-approval
boundary when team authorization is enabled.

## Guarded Auto promotion

Policy activation and Guarded Auto promotion are separate mutations. Promotion
requires at least one reviewed decision with an algorithm version and digest
and creates a new immutable policy version. Runtime enablement is a separate
default-off feature flag: `execution-routing.guarded-auto`.

RED/critical WorkOrders are never auto-routed in V1.

## Learning and experiments

Factory Learning continues to create advisory signals and improvement
candidates. It cannot update routing policy. Canonical two-variant experiments
may compare two distinct current, production-qualified exact Factory Versions;
their configuration is frozen with `acceptanceAuthority: false` and
`verificationRequired: true`. Every experimental Attempt still passes normal
dispatch and independent verification.

Failures and later verification outcomes become evidence only for future
routing decisions.

## Rollback

Disable `execution-routing.guarded-auto` first. Advisory decisions and historical
snapshots remain safe to retain. If recommendation and dispatch admission ever
disagree, revert dispatch integration and investigate the eligibility drift;
do not loosen Factory preflight.
