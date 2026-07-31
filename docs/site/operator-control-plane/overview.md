# Operator control plane

Mission Control is the operating system for human-directed, agent-executed
software development. Humans own intent, judgment, governance, and approval;
agents own bounded execution, recovery, validation, and evidence collection.

The operator control plane is built around one loop:

1. See the exceptions that require human attention.
2. Inspect a complete, governed decision packet.
3. Authorize, condition, reject, revise, or escalate bounded work.
4. Dispatch execution separately from approval.
5. Inspect independent proof before accepting completion.

Approval, dispatch, completion, validation, acceptance, merge, deployment, and
production verification remain separate states. No state silently implies the
next.

## Decision Center

Open **Governance → Approvals** to review pending `approvalDecisions` in risk
and urgency order. Each decision packet includes:

- the requested action and reason it needs attention;
- authorized repository, branch strategy, constraints, and assigned agent;
- operator authority and applicable policy requirements;
- evidence on hand, failed or stale receipts, and explicit unknowns;
- the expected dispatch effect;
- proof required before the WorkOrder can be accepted.

Every decision requires a reason. Conditional approval also requires explicit,
enforceable conditions. Approval records authority only; the operator must open
the WorkOrder to dispatch it through the existing guards.

Command Center attention rows intentionally provide only **Open** actions.
Context-free approve and unblock shortcuts are prohibited.

## Operator Evals

Open **Intelligence → Operator Evals** to pressure-test the operator workflow.
The V1 contract includes one grounded Fleet Operator persona and eight fixed
software-delivery scenarios covering missing tests, scope violations, external
blockers, conflicting conclusions, missing artifacts, retry loops, approved
scope drift, and security findings.

Every scenario defines a fixed operating world, permitted and prohibited
decisions, required evidence, prohibited assumptions, completion proof, and
four durability variants:

- reordered information;
- equivalent rewording;
- missing evidence;
- an unsupported, confident agent recommendation.

The structural proxy verifies scenario grounding and rubric coverage only. It
does not predict model accuracy or human behavior. Model and human runs retain
their own provenance, and behavioral claims require repeated human calibration.

Evaluation functions cannot approve, dispatch, waive, accept, merge, or deploy
production work.

## North Star alignment

The complete product contract is in
[`docs/product/mission-control-north-star.md`](../../product/mission-control-north-star.md).
The control plane operationalizes its core boundary: significant execution
starts from approved intent, autonomy scales with risk, recovery is bounded,
and completion requires a concise, evidence-backed review package.

## Verification

The integrated validation record is in
[`docs/validation/2026-07-31-integrated-control-plane-evidence.md`](../../validation/2026-07-31-integrated-control-plane-evidence.md).
