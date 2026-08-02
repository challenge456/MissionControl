---
date: 2026-08-02
topic: software-factory-enhancement-backlog
status: proposed
source_plan: docs/plans/2026-08-01-feat-productionize-software-factory-harness-plan.md
---

# Software Factory Enhancement Backlog

## What We're Building

A prioritized extension backlog for Loop Engineering after the trust and
lineage gate. These features make the factory easier to operate, measure, and
improve without adding a second task lifecycle or an autonomous self-modifying
system.

The product surface remains exception-first: show the operator the decision,
missing evidence, safe options, expected impact, and recovery path. Agent
activity and token volume stay supporting detail.

## Why This Approach

Three approaches were considered:

1. Add every conference-inspired feature immediately. This produces breadth
   but mixes security, telemetry, automation, and UX risk.
2. Build a separate software-factory product area. This duplicates Mission,
   WorkOrder, Attempt, evidence, and approval state.
3. Extend the existing Loop Engineering workspace in bounded, independently
   reviewable capabilities.

Use approach 3. It preserves one operating model and lets each capability earn
`Live` status through real data, authorization, recovery, and browser evidence.

## Priority 1 — Build after the authority and lineage gate

### 1. Uncorrelated evidence reconciliation inbox

**Problem:** Signed PR, CI, review, or incident evidence can be valid but lack
proved WorkOrder/Attempt lineage.

**Feature:** One exception queue showing the unmatched record, candidate
WorkOrders, exact reasons each candidate does or does not match, and an explicit
operator reconciliation decision. Reconciliation writes an immutable artifact;
it never silently rewrites history.

**Ship gate:** Cross-workspace candidates are never exposed; ambiguous matches
remain unresolved; reconciliation is idempotent and audited.

### 2. Repository readiness blocker pack

**Problem:** Operators cannot prove a repository is ready for unattended agent
work before dispatch.

**Feature:** Read-only checks for repository access, reproducible setup,
CLI/API operability, sandbox binding, scoped credentials, logs, context,
verifiers, PR integration, and rollback controls. Show `Verified`, `Missing`,
`Stale`, `Waived`, or `Not applicable` with evidence and remediation.

**Enhancement:** Display the dependency chain so one root readiness blocker is
not presented as ten independent failures.

### 3. Intervention recorder and operator-attention budget

**Problem:** Corrections, takeovers, approvals, credential blocks, and policy
judgments are currently conflated or inferred.

**Feature:** Append-only intervention events with a small taxonomy, reason,
WorkOrder/Attempt, duration, evidence, and actor. Add an operator-defined weekly
attention budget and alert on projected breach.

**Enhancement:** Measure time-to-unblock and repeated intervention classes, not
chat volume or raw comment count.

### 4. Improvement experiment decision packet

**Problem:** Accepting a suggestion does not yet force a measurable hypothesis
and safe exit.

**Feature:** Before implementation, require baseline, target, quality floor,
owner, budget, stop condition, measurement window, and rollback trigger. The
result is `Effective`, `Ineffective`, or `Regressed`, followed by retain,
revise, roll back, or retire.

**Enhancement:** Add a compact pre-mortem: likely failure mode, detection signal,
and cheapest safe recovery.

## Priority 2 — Add after real telemetry has one stable baseline window

### 5. Shadow cohort and counterfactual comparison

Run a new verifier, skill, model route, or automation in shadow mode against a
matched historical or live cohort. Compare correction rate, gate pass rate,
quality floor, cost, and latency without changing delivery authority.

Do not call the result causal unless assignment is controlled. Label matched
historical comparisons as estimates.

### 6. Capability graph and blast-radius preview

Show which repositories, skills, verifiers, workflows, automations, model
routes, and policies depend on the component being changed. Before approval,
preview the affected surfaces and required revalidation.

This should reuse existing graph and Registry data; do not create a second
configuration database.

### 7. Model/runtime drift re-certification

Material model, runtime, dependency, or policy changes automatically mark
dependent rules and automations `Revalidation required`. The operator receives
one deduplicated decision packet with affected components and the cheapest
valid evaluation set.

### 8. Rollback package and factory incident review

Generate a reviewable rollback package containing the exact component version,
dependent Definitions, evidence, commands or UI actions, verification steps,
and recovery owner. A factory incident can create a structured postmortem and
one bounded improvement proposal without auto-accepting it.

## Priority 3 — Valuable, but wait until the golden path is proven

### 9. Improvement economics frontier

Plot only measured outcomes: accepted WorkOrders per operator hour, correction
reduction, quality-floor movement, cost per accepted result, and time to
effective improvement. Show confidence and coverage. Avoid a single opaque
factory score.

### 10. Recommendation simulator

Let the operator compare proposed inner-loop check, outer-loop gate, skill
change, or automation using expected recurrence, implementation cost,
measurement cost, risk, and reversible downside. Keep estimates visibly
separate from observed results.

### 11. Multi-repository improvement campaigns

After one repository is browser-proven, allow a campaign to fan out the same
approved improvement as independent repository-scoped experiments. Each child
keeps its own readiness, authority, PR, measurement, and rollback state.

### 12. Connector and evidence adapter SDK

Add typed, idempotent adapters for issue trackers, incidents, feedback, and
deployment systems only after the GitHub path is reliable. Every adapter must
declare authorization, data retention, redaction, replay, and provenance
contracts.

## Recommended Sequence

1. Reconciliation inbox.
2. Intervention telemetry and truthful Factory Health.
3. Repository readiness.
4. Measured improvement decision packets.
5. Shadow evaluation and drift re-certification.
6. Rollback packages and improvement economics.
7. Multi-repository campaigns and additional connectors.

## Product Recommendations

- Keep Loop Engineering the primary improvement surface; use Registry,
  Automations, Factory Health, and PR views as drill-downs.
- Limit V1 to one mutating factory improvement per repository.
- Default automations to supervised, review-only execution.
- Show `Unknown` when coverage is missing or stale.
- Treat required governance as a separate touch, not an autonomy failure.
- Require a quality floor before autonomy or automation promotion.
- Preserve every failed attempt, superseded recommendation, rollback, and
  retirement decision.

## Do Not Build Yet

- An opaque composite factory score.
- A leaderboard that rewards token volume, agent count, or PR count.
- Self-approval, self-promotion, or automatic high-risk merge.
- A chat-first factory operations surface.
- Historical intervention backfills inferred from task prose.
- Multiple issue-tracker connectors before GitHub is browser-proven.

## Open Questions

- Which current approval role should own manual PR reconciliation in
  production: Portfolio Owner, Reviewer, or a new Evidence Steward role?
- What minimum sample and coverage should permit the first supervised
  automation promotion?
- Which post-merge source will be authoritative for SellerFi defect escapes and
  rollbacks?

## Next Step

Complete and browser-prove the authority/lineage gate. Then create a bounded
implementation plan for the reconciliation inbox and intervention event
contract; do not start all Priority 1 items in one PR.
