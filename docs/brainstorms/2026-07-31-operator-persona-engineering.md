---
date: 2026-07-31
topic: operator-persona-engineering
---

# Operator Persona Engineering

## What We're Building

Mission Control will expose one coherent operator loop over the existing
WorkOrder control plane: identify the highest-priority exception, inspect a
complete decision packet, record a governed decision, explicitly dispatch
eligible work, and inspect verification receipts before acceptance.

The same loop will be pressure-tested by an internal Operator Evals harness.
V1 uses one grounded Fleet Operator persona, eight fixed scenarios, explicit
human-authored rubrics, and durability variants that reorder, reword, remove,
or adversarially frame information. Synthetic results are forecasts, never
authorization or proof of usability.

## Why This Approach

The repository already has the required durable primitives:
`approvalDecisions`, WorkOrder governance, explicit dispatch, acceptance
criteria, independent verification receipts, and mission evidence. Building a
second decision or execution system would create hidden coupling and competing
truth.

The persona harness belongs in Intelligence because it evaluates whether the
operator control plane is understandable and stable. It should not appear in
the operator's production attention queue.

## Key Decisions

- One Fleet Operator persona first: depth and calibration are more valuable
  than several decorative biographies.
- Real control flow first: enhance `control-approvals` and link directly to the
  existing WorkOrder dispatch and proof surfaces.
- No one-click approval from Command Center: governed actions require review of
  the decision packet and a recorded reason.
- Fixed context contract: missing facts remain unknown and are surfaced rather
  than inferred.
- Proxy mode is structural only: it checks scenario/rubric completeness and
  cannot be presented as synthetic-human accuracy.
- Model and human runs are separate result types with visible provenance.
- No autonomous production action may be triggered from an evaluation.

## Open Questions

- The external model runner is an adapter boundary after the durable eval
  contract. V1 ships a submission contract and proxy execution without hiding
  that limitation.
- Human calibration will begin when real operator sessions exist; the harness
  must support recording the noise floor without inventing one.

## Next Steps

Implement the plan in
`docs/plans/2026-07-31-feat-operator-persona-control-loop-plan.md`.
