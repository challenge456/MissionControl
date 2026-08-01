---
date: 2026-07-31
topic: mission-control-north-star-product-expansion
status: accepted
---

# Mission Control North Star Product Expansion

## What We Are Building

Mission Control remains a focused operating system for human-directed,
agent-executed software development. The product direction is being expanded
with the minimum additional capabilities required to make that promise
operational: intent definition, plan governance, safe execution, independent
evidence, fast human decisions, overnight continuity, recovery, and governed
release.

This is a product-definition change, not authorization to build every proposed
surface at once. Each runtime capability still requires a bounded plan,
explicit Product Owner approval, implementation evidence, and a release gate.

## Approaches Considered

### A. Expand only the North Star

This would keep one concise document but would mix durable doctrine with
temporary sequencing and detailed feature recommendations. It would be easy to
read and difficult to execute consistently.

### B. Separate doctrine from V1 strategy — selected

Keep the North Star short and durable. Add a V1 strategy that defines the
golden path, capability priorities, consolidations, non-goals, ship gate, and
open Product Owner decisions. Persist a short version in project guidance so
future work is evaluated against the same product standard.

### C. Implement the additional features immediately

This would create feature sprawl before the primary Mission lifecycle is
complete. It was rejected because the current risk is not a lack of surfaces;
it is the lack of one fully authoritative end-to-end delivery journey.

## Key Decisions

- The primary product object hierarchy is `Mission → WorkOrder → Task → Attempt
  → evidence → pull request → release`.
- The Command Center is an exception and decision surface, not an agent activity
  dashboard.
- Chat, generated summaries, and worker handoffs are not sources of truth.
- Independent evidence is required for completion; worker self-report is never
  sufficient.
- Autonomy increases only after identity, authorization, executor binding,
  quality gates, recovery budgets, and auditability are enforced.
- Older features are consolidated into the golden path before any standalone
  surface is promoted.
- One real repository journey must pass before multi-repository scale and
  optimization work becomes a priority.

## Product Expansion Themes

1. Intent and acceptance-criteria quality.
2. Versioned plan review, diff, approval, and WorkOrder release.
3. Repository, environment, executor, tool, and secret readiness preflight.
4. Overnight shift planning, bounded execution, and morning review packages.
5. One evidence model spanning tests, CI, UI proof, security, performance, and
   production validation.
6. Decision packets that expose authority, risk, missing evidence, uncertainty,
   rollback, and reviewer focus.
7. Classified failures, bounded recovery, incidents, and resumable handoffs.
8. Commit, pull-request, deployment, feature-flag, and production-verification
   traceability.
9. Provenance-rich memory and reusable learning candidates after accepted work.
10. Outcome, trust, cost, review-time, recovery, and overnight-completion
    measures rather than activity metrics.

## Boundaries

- No broad company operating system in V1.
- No primary chat-first workflow.
- No autonomous merge or production rollout for Yellow or Red work.
- No demo-backed analytics presented as measured production truth.
- No duplicate Mission, pipeline, quality, approval, or evidence authority.
- No promotion of Labs pages without real scoped data, authorized writes,
  audit, recovery, refresh, browser proof, and a named capability owner.

## Next Steps

1. Use the expanded North Star as the product decision filter.
2. Use the V1 strategy to select one bounded P0 plan at a time.
3. Complete the Mission golden path before adding another primary navigation
   domain.
4. Require Product Owner decisions for the remaining merge, deployment,
   notification, identity-provider, and initial-runtime boundaries.
