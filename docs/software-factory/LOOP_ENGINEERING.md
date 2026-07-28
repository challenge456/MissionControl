# Loop Engineering

## Purpose

Loop Engineering turns verified product evidence into a bounded, governed
improvement cycle:

`research -> verify -> recommend -> approve -> implement -> validate -> measure -> learn`

The loop is continuous because a completed cycle can create the next cycle from
measured gaps. It is not an unbounded autonomous process. Every cycle has a
declared objective, stop condition, maximum iteration count, durable state, and
an approval gate before repository-changing work.

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

Creating a cycle creates one root Task and one governed WorkOrder. Dispatching
that WorkOrder materializes the bounded Graph Engineering nodes:

1. Independent research lanes run in parallel.
2. Verification nodes independently decide evidence and conflicts.
3. A synthesis node produces evidence-linked recommendations.
4. The graph stops at an explicit approval gate.

This avoids duplicate phase Tasks and duplicate WorkOrders. The graph executor
creates each concrete node Task only when its dependencies are satisfied.

Approval creates implementation and validation work only for approved
recommendations. A runtime may claim and execute the work, but it must write
progress, artifacts, costs, failures, and verification receipts back through
Mission Control. If no runtime is configured, the UI says so and leaves work
actionable; it must not fabricate completion.

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
