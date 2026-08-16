---
title: Factory Self-Improvement Governance
status: accepted
date: 2026-08-16
decision: The Factory may propose and measure improvements, but repository or governance changes require explicit human review and a governed WorkOrder
---

# Factory Self-Improvement Governance

## Context

Mission Control can observe enough evidence to identify repeated verification
failures, retries, corrections, context misses, routing mismatches, and
deterministic automation opportunities. That evidence can improve the Factory,
but the same system must not be allowed to change the rules that judge or
authorize its work.

## Decision

The Factory's learning loop is proposal-only.

1. Signals, clusters, candidates, experiments, scores, recommendations, and
   Factory Memory all declare `acceptanceAuthority: false` where persisted.
2. Learning may create or enrich an Improvement Candidate but may not change a
   Factory Definition Version, recipe, prompt, skill, rule, context policy,
   model route, retry policy, tool permission, or automation definition.
3. An operator must inspect retained evidence before approving an experiment,
   dismissing, snoozing, rejecting, promoting, or rolling back a candidate.
4. Experiment approval freezes dataset, evaluators, and both configurations in
   the canonical Observability/Evals system.
5. Actual repository/configuration modification occurs only through a new
   Mission/Plan/WorkOrder/Task path with normal approval, worker, verification,
   publication, and acceptance controls.
   Factory Learning creates and submits the Mission Plan; a separate ordinary
   Plan approval releases WorkOrders and execution remains a later decision.
6. Learning outputs can never satisfy WorkOrder acceptance, create a
   verification receipt/evidence envelope, claim independent verification,
   alter historical Attempts, merge a PR, or call `workOrders.accept`.
7. Changes to verification, authorization, acceptance, worker fencing,
   credential handling, or policy are `HIGH` or `CRITICAL` risk and require
   human approval even when an experiment recommends them.

## Risk classification

| Risk | Example | Minimum treatment |
| --- | --- | --- |
| Low | Documentation clarification | Human review; governed WorkOrder |
| Medium | Prompt, skill, context-priority, or deterministic build gate | Experiment where measurable; governed WorkOrder |
| High | Model routing, retry policy, tool permissions, verification logic | Explicit human approval, independent review, experiment, governed WorkOrder |
| Critical | Acceptance, credentials, worker fencing, authorization policy | Separate high-risk plan, security/governance review, explicit operator approval |

## Consequences

- Improvement delivery is slower than silent self-editing and materially safer.
- Low-sample experiments can inform judgment but cannot claim significance.
- A candidate may remain open or snoozed indefinitely without affecting active
  execution.
- Existing authority code paths need no fallback to learning data.

## Rejected alternatives

- Directly applying a prompt, rule, skill, route, or policy when confidence
  exceeds a threshold.
- Letting the learning subsystem manufacture verification evidence for its own
  changes.
- A separate acceptance or experiment framework owned by Factory Learning.
- A mandatory canonical Agent Intent DSL in V1.
