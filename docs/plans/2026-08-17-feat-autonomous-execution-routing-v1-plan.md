---
title: "feat: Autonomous Harness and Model Routing V1"
type: feat
status: in_progress
date: 2026-08-17
---

# Autonomous Harness and Model Routing V1

## Baseline

- Origin baseline: `b7b1ee6983dca500d0828af240907033b9d91fc2`
- Branch: `codex/autonomous-execution-routing-v1`
- Runtime contract: `v29`, advanced once from `v28` for the deliberate atomic
  execution-routing and Model Routing authorization API change.
- System/security baseline: latest fetched `origin/main` at implementation start.
- Required invariant: routing has no verification, publication, merge, or
  acceptance authority.

## Problem

Mission Control can freeze an operator-selected Factory Version and can route a
model inside that binding, but it cannot yet recommend or safely select the
complete `Harness + Model + Execution Backend` strategy. The existing router
also treats estimated cost and health as enough evidence for model selection;
it does not compare verified Factory outcomes, preserve unknown telemetry, or
explain why a potentially cheaper route was rejected before scoring.

This leaves operators making a high-consequence execution choice without a
reproducible eligibility record, evidence window, or conservative cold-start
behavior.

## Proposed solution

Add a deterministic execution-routing layer over the existing Factory control
plane. A candidate is an exact active Factory Version tuple, including its
frozen harness identity, primary approved model/provider, execution backend,
policy and sandbox identity. The router will:

1. reject ineligible tuples using existing Factory readiness, worker admission,
   model policy, risk, budget, context, repository, isolation, network, secret,
   and certification controls;
2. score only eligible tuples from bounded verified Attempt evidence;
3. keep unobserved metrics as `unknown`, never invented priors;
4. fall back to the current certified Factory Version when evidence is
   insufficient;
5. persist an immutable, digest-bound decision snapshot on the Attempt; and
6. expose the same authorized recommendation, pinning, policy, and evidence
   operations to the UI and agent callers.

The rollout modes are `ADVISORY`, `GUARDED_AUTO`, and `PINNED`. Advisory is the
default. Guarded Auto requires a separately promoted policy, the feature flag,
sufficient evidence coverage, and a safe score margin. A pin wins ranking but
never bypasses eligibility. There is no unrestricted Full Auto mode.

## Why exact Factory Version tuples

Factory Versions already freeze the execution binding and are the only
production-qualified unit that can prove a harness, model, backend, repository,
policy, verifier, budget, and recovery configuration belong together. Routing
arbitrary independent harness/model/backend values would create combinations
that may be impossible to execute or impossible to reproduce. Exact tuples keep
the change small, auditable, and consistent with the existing Factory source of
truth.

## Spec-flow analysis

### Advisory

1. An authorized operator or agent requests a recommendation for a WorkOrder.
2. Mission Control derives exact candidate tuples from active Factory Versions
   for the WorkOrder repository and workflow.
3. Hard eligibility evaluates every candidate and records stable reason codes.
4. Eligible tuples receive a deterministic score plus evidence coverage.
5. The recommendation is persisted with policy version, evidence cutoff/window,
   algorithm version, candidates, scores, rejections, fallback, and digest.
6. Dispatch uses the operator-provided/current Factory Version unless an exact
   eligible pin exists. The Advisory recommendation does not silently change
   execution.

### Guarded Auto

1. The policy must have an explicit promotion record and the separate guarded
   feature flag must be enabled.
2. RED/critical work and uncertified/experimental tuples remain excluded from
   autonomous selection.
3. The winning tuple must meet minimum verified-attempt and evidence-coverage
   thresholds and exceed the conservative fallback by the configured margin.
4. Otherwise dispatch stays on the certified fallback and records why auto
   selection was withheld.

### Pinned

1. An authorized operator pins an exact Factory Version to the WorkOrder with a
   reason.
2. Dispatch reevaluates the pin against current eligibility.
3. An eligible pin wins without scoring authority; an ineligible pin blocks
   dispatch with the exact remediation instead of falling through silently.

### Attempt freeze and learning

1. The selected decision digest and full routing snapshot are copied onto the
   Attempt before execution.
2. Later telemetry, policy, or health changes cannot mutate historical scores
   or the selected tuple.
3. Run, trace, gate, verification, retry, cancellation, and cost outcomes feed
   only future evidence windows.
4. Factory Learning may propose a policy change or bounded experiment; it may
   not activate a policy or bypass independent verification.

### Failure and unknown states

- No eligible candidates: block guarded dispatch and show all rejection reasons.
- Stale/missing worker: reject before scoring using the canonical heartbeat
  threshold.
- Missing telemetry: display `unknown`, reduce coverage, and use the certified
  fallback when thresholds are not met.
- Missing model/provider availability or cost estimates: reject before scoring;
  every exact Factory Version has a frozen cost budget. Missing optional outcome
  telemetry remains `unknown` and prevents unsupported economic claims.
- Cheaper but ineligible: remains rejected even if its hypothetical score would
  be higher.
- Fast but uncertified: remains advisory-only or rejected according to risk and
  production-certification policy.
- Failed verification: never rewrites the frozen decision; it becomes evidence
  for later decisions.
- Stale policy or changed Factory Version: decision remains reproducible by its
  frozen snapshot and digest.

## Deterministic scoring V1

Only observed components contribute. Component weights are fixed by
`execution-routing/v1`; the final normalized score is the weighted mean of
observed components and always ships with evidence coverage.

| Component | Weight | Evidence source |
| --- | ---: | --- |
| Verified success rate | 30 | current independent verification receipts |
| First-pass success rate | 20 | verification plus Attempt retry lineage |
| Retry avoidance | 10 | Attempt step and dispatch retry counts |
| Time to verified candidate | 10 | Attempt start to current verification |
| Total cost per verified success | 10 | model plus compute cost observations |
| Context-miss avoidance | 5 | trace/eval context failure observations |
| Quality-gate avoidance | 10 | current quality-gate decisions |
| Cancellation/failure avoidance | 5 | terminal Attempt outcomes |

Repository-local evidence is preferred. Domain-wide evidence is reported
separately and is used only when policy permits it. Economics distinguish model
cost, compute cost, total cost, cost per verified success, retry count, and time
to a verified candidate. Unknown values remain null with a reason.

## Risk and rollout policy

- Existing WorkOrder risk maps deterministically: `LOW -> GREEN`, `MEDIUM ->
  YELLOW`, `HIGH/CRITICAL -> RED`.
- A Factory Version's risk boundary must be at least the WorkOrder tier.
- Remote sandbox constraints and production harness maturity remain canonical.
- Default evidence window: 30 days.
- Default guarded threshold: at least 5 verified Attempts, 60% component
  coverage, and a 5-point score margin over the certified fallback.
- Defaults are policy configuration, not performance priors.
- `ADVISORY` is default-on as a read-only recommendation. `GUARDED_AUTO` is
  default-off and needs both explicit policy promotion and a feature flag.

## Implementation tasks

- [x] Add shared execution-routing types, eligibility reason codes, scoring,
      conservative fallback, mode resolution, stable digest input, and tests.
- [x] Extend the existing routing policy and decision records with optional V1
      execution-routing configuration and immutable tuple evidence snapshots.
- [x] Build the Convex candidate/evidence loader from Factory Versions, worker
      admission, model catalog, Attempts, verification, gates, traces, and costs.
- [x] Add authorized recommendation and exact pin operations with audit records;
      remove caller-supplied actor trust from Model Routing writes.
- [x] Integrate selection before Factory preflight so the selected exact Factory
      Version drives the existing dispatch path.
- [x] Freeze the routing decision snapshot and digest onto `workflowRuns` and
      preserve later-outcome-only learning semantics.
- [x] Validate canonical experiment variants as eligible frozen tuples without
      giving experiments verification or policy activation authority.
- [x] Update Model Routing and Attempt UI for Basic, Intermediate, and Advanced
      progressive disclosure, including loading, empty, error, unknown, rejected,
      success, and recovery states.
- [x] Update architecture, security, operations, and qualification docs.
- [ ] Run focused unit/contract tests, Generic Harness and worker admission,
      Remote Sandbox, authorization, Factory Learning, Observability/Evals,
      Verification Factory, `pnpm run qualify:factory`, full repository checks,
      browser/a11y checks, and CI/Vercel evidence review.

## Acceptance criteria

- [x] A known-good eligible tuple is recommended deterministically.
- [x] Cheaper, faster, stale-worker, uncertified, risk-incompatible, or otherwise
      ineligible tuples are rejected before scoring with stable reason codes.
- [x] Missing evidence remains unknown and forces the conservative fallback when
      guarded thresholds are unmet.
- [x] An eligible exact pin wins; an ineligible pin blocks with remediation.
- [x] RED/critical work cannot use Guarded Auto in V1.
- [x] Every decision freezes candidates, rejections, metrics, weights, scores,
      policy, evidence window/cutoff, selected/fallback tuples, reason, digest,
      and algorithm version onto the Attempt.
- [x] Later evidence and failures affect only future decisions.
- [x] Routing cannot alter scope, quality contracts, verification, publication,
      merge, or acceptance authority.
- [x] Guarded Auto stays separately gated and default-off.
- [x] Operators can understand the recommendation in Basic view and inspect
      candidate evidence and raw policy inputs in Intermediate/Advanced views.

## Agent-native capability and authority map

| Capability | Shared operation | Authority |
| --- | --- | --- |
| Request recommendation | authorized Convex query | operator or scoped service caller |
| Inspect candidates/reasons | authorized decision query | operator or scoped service caller |
| Propose a routing improvement | Factory Learning signal/candidate | agent or operator; proposal-only |
| Pin/clear exact tuple | authorized Convex mutation | operator approval only |
| Change routing policy | authorized Convex mutation | operator automation-management only |
| Promote Guarded Auto | separate authorized mutation | operator automation-management only |
| Create bounded experiment | canonical experiment mutation | authorized experiment owner |

The React UI is a client of the same shared read/write operations. Intentional
non-parity protects governance: agents can inspect and propose, but cannot pin,
activate, promote, publish, merge, verify, or accept their own routing changes.

## Security and authority invariants

- Require workspace view permission for catalog, policy, recommendation, and
  decision reads.
- Require automation-management permission for policy and promotion writes.
- Require delivery-approval permission for WorkOrder pins.
- Derive actor identity server-side; trusted health/catalog ingestion becomes
  internal-only.
- Preserve least privilege and separation between recommendation, execution,
  verification, publication, and acceptance.
- Persist bounded evidence, avoid raw prompts/credentials, and never log secret
  material in routing reasons.

## Validation plan

- Pure resolver tests for all ten required qualification cases plus ordering,
  digest stability, unknown telemetry, score ties, and bounded inputs.
- Convex authorization and cross-project isolation tests.
- Dispatch integration tests proving the selected tuple is exact, frozen, and
  still passes existing Factory preflight.
- Factory Learning and experiment tests proving proposal-only authority.
- Existing Generic Harness, worker runtime, remote sandbox, observability,
  verification, Factory lifecycle, and publication tests.
- `pnpm run qualify:factory` and the full repository qualification path.
- Browser verification on the V2 Model Routing and Attempt surfaces at desktop
  and narrow widths, keyboard navigation, axe scan, dark/light themes, and
  console/network error review.

## Risks and mitigations

- **Sparse evidence creates false confidence:** surface coverage and use the
  certified fallback below policy thresholds.
- **Tuple explosion:** route only among exact active Factory Versions, not an
  arbitrary Cartesian product.
- **Eligibility logic drifts from dispatch:** reuse canonical worker and Factory
  preflight primitives and assert the selected version again at dispatch.
- **Historical decisions change:** persist immutable inputs plus a canonical
  digest on the Attempt.
- **Learning gains authority:** limit it to signals, proposals, and experiments;
  policy activation stays operator-authorized.
- **Large public schema blast radius:** add optional compatibility fields and
  preserve legacy model-only decisions during migration.

## References

- `docs/product/mission-control-north-star.md`
- `docs/product/mission-control-v1-product-strategy.md`
- `docs/design.md`
- `docs/architecture/executor-adapter-contract.md`
- `packages/model-router/src/policy.ts`
- `convex/lib/factoryWorkerRuntime.ts`
- `convex/lib/executionManifest.ts`
- `convex/workOrders.ts`
- `convex/modelRoutingPolicies.ts`
- `convex/modelRoutingDecisions.ts`
- `apps/mission-control-ui/src/ModelRoutingView.tsx`
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final)
- [OpenTelemetry generative AI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)

## Post-deploy monitoring and rollback

- **Healthy:** recommendations are reproducible, guarded selection only occurs
  above thresholds, eligibility reasons align with dispatch, and verification/
  publication gates remain unchanged.
- **Failure:** unexplained route change, ineligible selection, decision digest
  mismatch, cross-project read/write, guarded execution without promotion, or
  any verification/publication authority regression.
- **Rollback trigger:** any authority regression, qualification failure, or
  mismatch between recommendation and canonical dispatch admission. Disable the
  guarded feature flag first, then revert execution-routing integration while
  retaining immutable historical decisions.
- **Owner/window:** Mission Control operator for the first 24 hours after
  deployment and through the first five verified routed Attempts.

## Validation results

- `pnpm run qualify:factory`: PASS on the final implementation; all 12 gates
  passed from `2026-08-17T19:48:13.915Z` through
  `2026-08-17T19:49:44.797Z`.
- Focused execution-routing resolver tests: 13/13 PASS.
- Focused authorization and default-off rollout tests: 14/14 PASS.
- Full repository UI tests: 299/299 PASS.
- Full Convex tests: 657/657 PASS.
- TypeScript, skill lint, runtime-contract v29 guard, production build,
  orchestration startup smoke, and whitespace integrity: PASS.
- Browser verification: PASS at desktop and tablet widths in dark and light
  themes; Basic, Intermediate, and Advanced disclosure modes are operable.
- Accessibility: axe WCAG 2.0/2.1 A/AA reports zero violations; keyboard focus,
  form labels, and scroll regions were checked.
- Browser console: zero errors and zero warnings.
- Dependency audit: zero high or critical advisories; the existing repository
  baseline retains nine moderate and four low advisories.
- Review passes: no feature-level critical/high security finding, no unresolved
  TypeScript correctness finding, no agent-governance parity gap, and no
  simplification required before V1 review.
- Remote GitHub/Vercel checks: pending draft PR creation.
