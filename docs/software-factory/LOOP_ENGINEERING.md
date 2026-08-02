# Loop Engineering

## Purpose

Loop Engineering turns verified product evidence into a bounded, governed
improvement cycle:

`research -> verify -> recommend -> approve -> implement -> validate -> measure -> learn`

The loop is continuous because a completed cycle can create the next cycle from
measured gaps. It is not an unbounded autonomous process. Every cycle has a
declared objective, stop condition, maximum iteration count, durable state, and
an approval gate before repository-changing work.

The operating horizons use one vocabulary everywhere:

- the **inner loop drives autonomy** by reducing corrective human intervention through bounded edit, run, check, and correction Attempts;
- the **outer loop drives automation** by proving merge readiness through immutable PR-head evaluations, CI, review, policy, and merge authority;
- the **meta loop drives quality** by turning real failures and measurements into governed improvement work.

The prior `innerAutomation` and `outerAutonomy` names are deprecated read
aliases only. New UI, telemetry, and policy code must use the canonical pillar
names above.

## Product principles

1. Evidence precedes recommendations.
2. Recommendations precede implementation.
3. Repository-changing work requires an explicit approval.
4. Tests and measurements determine whether work is accepted.
5. Failures and rejected evidence remain visible.
6. Creating the next cycle is deliberate and idempotent.
7. The UI must never present queued or simulated work as completed execution.

## Cycle state

| Phase | Required output | Exit gate |
| --- | --- | --- |
| Research | Questions and collected sources | At least one source is recorded |
| Verify | Accepted/rejected source decisions and limitations | At least one accepted source |
| Recommend | Evidence-linked recommendations | At least one recommendation |
| Awaiting approval | Human decision with actor and timestamp | Explicit approval |
| Implement | Linked implementation tasks/work orders | All linked implementation work submitted |
| Validate | Test and acceptance evidence | Required checks pass |
| Measure | Baseline/current metrics and observed result | Measurements recorded |
| Ready for next cycle | Retained findings and remaining gaps | Stop or create one next cycle |
| Complete | Immutable cycle summary | No further transition |
| Blocked | Failure reason and recovery action | Explicit resume |

## First production slice

The first slice reuses the existing WorkOrder, Task, approval, activity, and
verification contracts. A `loopEngineeringCycle` is the orchestration record
that links those durable objects and stores:

- objective, hypothesis, iteration, stop condition, and maximum iterations;
- a research brief containing the question, scope, exclusions, freshness
  window, preferred source types, required output, and approval policy;
- current phase and phase history;
- research sources with publication/retrieval dates, freshness, source type,
  vendor-claim status, canonical URL, and syndicated-source metadata;
- evidence decisions and limitations;
- material claims with supporting and contradictory evidence, confidence, and
  an explicit unsupported state;
- recommendations and their approval/implementation status;
- baseline and result measurements;
- child task and WorkOrder identifiers;
- the parent/next cycle relationship.

The UI is an exception-and-evidence surface. It shows the current gate, missing
evidence, required human action, and links to the underlying Tasks and Work
Orders. Agent activity is supporting evidence, not the primary content.

## Runtime contract

Creating a cycle idempotently provisions the project-scoped `Research Scout`
and `Evidence Reviewer` identities, then creates one root Task and one governed
WorkOrder. The operator reviews that WorkOrder and explicitly dispatches it;
dispatch materializes the bounded Graph Engineering nodes:

1. Independent research lanes run in parallel.
2. Verification nodes independently decide evidence and conflicts.
3. A synthesis node produces evidence-linked recommendations.
4. The graph stops at an explicit approval gate.

This avoids duplicate phase Tasks and duplicate WorkOrders. The graph executor
creates each concrete node Task only when its dependencies are satisfied.
Every new run stores the exact workflow version and executable definition used
at dispatch, so later workflow updates cannot alter an in-flight graph.

Approval creates implementation and validation work only for approved
recommendations. A runtime may claim and execute the work, but it must write
progress, artifacts, costs, failures, and verification receipts back through
Mission Control. If no runtime is configured, the UI says so and leaves work
actionable; it must not fabricate completion.

Completed research workflows project their structured source, claim,
recommendation, approval, conflict, limitation, and measurement output into the
cycle exactly once. A zero-recommendation result is a valid clean stop. The
workflow gate approval and evidence digest are the single implementation
authority; the cycle does not invent a second approval.

Repository-changing Tasks are executed only by the separate implementation
worker. It requires an approved mutating WorkOrder, matching workspace and
revision, explicit repository, isolated Git worktree, allowlisted targeted
checks, cost and time limits, maximum Attempts, and a stop condition. The
read-only research worker rejects worktree Tasks.

Every GitHub head SHA is retained as an outer-loop evaluation. A failed
required check blocks the linked WorkOrder and requests one bounded correction;
passing CI does not equal approval. Merge recording requires passing configured
gates, WorkOrder approval, explicit human confirmation, actor, timestamp, PR,
and commit SHA.

PR evidence is correlated only through an explicit WorkOrder/run artifact or
an exact recorded branch match. Repository recency is never lineage. A PR that
cannot be proved remains visibly uncorrelated and cannot block, advance, or
complete a WorkOrder.

Human Loop Engineering decisions derive their operator identity and permission
from the authenticated company/workspace membership in Convex. Browser-supplied
actor labels are compatibility inputs only and cannot determine authority or
audit attribution.

Meta suggestions are created from real workflow, CI, review, approval,
verification, measurement, and repeated-work signals. Suggestions are
deduplicated by workspace, signal class, affected target, and evidence window.
Acceptance creates an approval-gated WorkOrder and Task; it never directly
activates a verifier, skill, rule, policy, or automation.

## Acceptance criteria

- A cycle can be created from the UI with a non-empty objective and stop
  condition.
- The research brief is defined through the UI and persists its question,
  scope, exclusions, freshness window, preferred sources, required output, and
  approval policy.
- Cycle creation is idempotent and creates one linked root Task and WorkOrder;
  dispatch materializes dependency-ready graph node Tasks exactly once.
- Phase transitions reject missing required evidence.
- Source records retain publication date, retrieval date, freshness,
  source type, vendor-claim status, canonical URL, syndicated origin,
  acceptance decision, and rejection reason.
- Duplicate normalized URLs are rejected with an actionable message.
- Every material claim links to accepted supporting evidence or is explicitly
  marked unsupported; contradictory evidence and confidence remain visible.
- Recommendations link to evidence and cannot enter implementation without an
  approval actor and timestamp.
- Validation records test results and evidence locations.
- Measurement records baseline, result, unit, and pass/fail.
- Refresh preserves the selected project, cycle, phase, and all evidence.
- Completing a cycle can create at most one next cycle for the same iteration.
- The next cycle inherits remaining gaps, not a duplicate of completed work.
- Activity records are emitted once for cycle creation, phase changes,
  approvals, evidence decisions, and next-cycle creation.

## Deliberate exclusions

- No infinite timer that creates work without an operator-visible stop
  condition.
- No self-approval.
- No silent repository writes.
- No second task lifecycle; Loop Engineering references the canonical Task and
  WorkOrder state machines.
- No separate chat-only memory. Durable evidence belongs to the cycle and its
  linked records.
