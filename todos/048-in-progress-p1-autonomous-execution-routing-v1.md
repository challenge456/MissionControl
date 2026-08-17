---
status: in_progress
priority: p1
issue_id: "048"
tags: [factory, routing, harness, models, evidence, security]
dependencies: []
---

# Ship Autonomous Harness and Model Routing V1

## Problem Statement

Mission Control does not yet make a deterministic, explainable, policy-bound
choice of the complete Factory execution strategy. Operators need an evidence-
backed recommendation without allowing routing to bypass hard admission,
verification, publication, or acceptance controls.

## Findings

- Factory Versions already freeze the only coherent executable tuple.
- Worker runtime admission already enforces exact harness identity, heartbeat,
  capacity, backend, model support, repository access, isolation, and sandbox
  capabilities.
- Existing model routing scores no verified outcomes and can create a model
  override that does not belong to the frozen Factory tuple.
- Attempts, traces, verification receipts, quality gates, learning signals, and
  canonical experiments already provide the required evidence/control planes.
- Existing public Model Routing operations require authorization hardening and
  server-derived actor identity.

## Proposed Solutions

### Option 1: Route arbitrary harness/model/backend combinations

**Approach:** Build a Cartesian product from catalogs and score each combination.

**Pros:** Maximum theoretical flexibility.

**Cons:** Produces unqualified combinations, duplicates Factory configuration,
and makes decisions difficult to reproduce.

**Effort:** High

**Risk:** High

### Option 2: Route exact active Factory Version tuples

**Approach:** Use each frozen Factory Version as a candidate, reuse canonical
admission, then score bounded verified outcomes.

**Pros:** Executable, reproducible, small blast radius, consistent with current
authority boundaries.

**Cons:** A new combination must first be qualified as a Factory Version.

**Effort:** Medium

**Risk:** Medium

## Recommended Action

Implement Option 2 with Advisory default, separately promoted Guarded Auto,
exact operator pins, immutable Attempt snapshots, explicit unknown evidence, and
no unrestricted Full Auto.

## Technical Details

Primary areas:

- `packages/model-router/` — pure eligibility/scoring/mode resolver.
- `convex/schema.ts` and Model Routing modules — compatible policy, decision,
  recommendation, pin, evidence, and authorization records.
- `convex/workOrders.ts` — select the exact tuple before canonical preflight and
  freeze it onto the Attempt.
- `apps/mission-control-ui/src/ModelRoutingView.tsx` and Attempt inspector —
  progressive evidence-first UX.
- Factory qualification and documentation — regression and security proof.

## Resources

- `docs/plans/2026-08-17-feat-autonomous-execution-routing-v1-plan.md`
- User-provided Autonomous Harness & Model Routing V1 brief.

## Acceptance Criteria

- [x] Hard eligibility runs before scoring and records stable rejection reasons.
- [x] Verified evidence is bounded, unknown remains unknown, and economics are
      measured through verified success.
- [x] Advisory, Guarded Auto, and Pinned modes are deterministic and policy-safe.
- [x] Every routed Attempt freezes a reproducible decision snapshot and digest.
- [x] Learning and experiments remain proposal/evaluation-only.
- [x] Authorization, project isolation, browser/a11y, Factory qualification, and
      full repository validation pass.
- [ ] Draft PR includes evidence and MERGE / PARTIALLY MERGE / HOLD recommendation.

## Work Log

### 2026-08-17 - Baseline and design

**Actions:**

- Fetched and verified exact latest `origin/main` baseline.
- Created the isolated implementation branch.
- Reviewed Factory Version, worker admission, routing, Attempt, verification,
  learning, experiment, observability, UI, design, and security architecture.
- Selected exact Factory Version tuple routing and documented flow/edge cases.

**Learnings:**

- Canonical worker admission is reusable and must remain the dispatch authority.
- Frozen Factory Versions avoid invalid cross-provider tuple composition.
- Sparse evidence must reduce confidence rather than trigger synthetic priors.

### 2026-08-17 - Implementation and local qualification

**Actions:**

- Added the shared deterministic eligibility/scoring/mode resolver and exact
  Factory Version candidate/evidence loader.
- Froze decision version, digest, candidates, rejection reasons, policy,
  evidence cutoff, scores, fallback, and selected tuple on every routed Attempt.
- Hardened Model Routing reads/writes, server-derived actor attribution, local
  model project isolation, provider-health ingestion, and delivery approval for
  exact pins.
- Kept existing non-Factory dispatch on the legacy path so V1 remains additive
  and default-off; Guarded Auto retains its separate promotion and feature gate.
- Added progressive execution-routing UI and Attempt evidence inspection.
- Completed security, TypeScript, agent-authority, and simplicity review passes.

**Validation:**

- `pnpm run qualify:factory`: all 12 gates PASS on the final implementation.
- Resolver: 13/13 PASS; focused authorization/default-off rollout: 14/14 PASS.
- Full UI: 299/299 PASS; full Convex: 657/657 PASS.
- Type/lint, runtime contract, production build, startup smoke, and whitespace:
  PASS.
- Browser: desktop/tablet, dark/light, all disclosure modes, zero console errors
  or warnings.
- axe WCAG 2.0/2.1 A/AA: zero violations.
- Dependency audit: zero high/critical; existing baseline has nine moderate and
  four low advisories.

## Notes

- Do not edit the user attachment.
- Do not add Full Auto or let routing alter quality/verification/publication.
- Keep the UI calm, dense, and evidence-first.
