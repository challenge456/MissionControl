---
title: Mission Control North Star
status: active
owner: product
updated: 2026-07-31
---

# Mission Control North Star

Mission Control is the operating system for human-directed, agent-executed
software development. Humans own intent, judgment, governance, and approval.
Agents own execution, iteration, validation, and evidence collection.

The product is not a task launcher or chat wrapper. It coordinates the complete
delivery lifecycle from approved intent to a validated, review-ready pull
request, including work that continues safely outside business hours.

## Product promise

A developer can define an outcome, approve a plan, let specialized agents work
independently, receive alerts only when judgment is required, and return to a
concise evidence package that supports a confident merge decision.

## Governing workflow

1. A human defines the objective, business outcome, constraints, and acceptance
   criteria.
2. An agent researches the repository and proposes an implementation plan.
3. A human reviews and approves the plan.
4. Mission Control converts the approved plan into bounded WorkOrders.
5. Specialized agents implement, test, review, recover, and prepare the pull
   request.
6. Mission Control independently evaluates required quality gates.
7. A human reviews the evidence package and approves, rejects, or requests
   revision.
8. Deployment and production verification proceed through their own governed
   states and controls.

Significant implementation cannot start without an approved plan. Expedited
paths are allowed only when policy classifies the work as low risk.

## Governed WorkOrder contract

Every agent action must trace to a WorkOrder that defines:

- problem and expected business outcome;
- scope, constraints, authorized repositories, tools, and agents;
- acceptance criteria, required tests, and quality gates;
- risk level, approval requirements, and escalation conditions;
- execution and recovery budget;
- definition of done and required completion evidence.

Work attempted, completed, validated, approved, merged, deployed, and verified
in production are distinct states. No state implies the next.

## Risk-proportional autonomy

- **Green:** bounded, reversible work with strong automated coverage may proceed
  through implementation and pull-request preparation automatically.
- **Yellow:** business logic, APIs, migrations, authentication, or shared-system
  changes require human plan approval and human merge approval.
- **Red:** destructive, financial, security-sensitive, privacy, regulatory, or
  major architectural work requires restricted execution and additional
  reviewers or approvals.

Risk must be visible, policy-derived, and enforced by the control plane.

## Evidence and review package

Completion claims require verifiable evidence. Depending on the WorkOrder this
can include diffs, test and build receipts, coverage, security and performance
results, UI captures, API validation, deployment checks, logs, commits, pull
requests, and artifact links.

The final review package must summarize:

- original objective and approved plan;
- files and systems changed, with the reason for each material change;
- key technical decisions and reviewer focus areas;
- acceptance-criteria and quality-gate results;
- known risks, unresolved questions, uncertainty, and rollback strategy;
- pull-request, artifact, deployment, and production-verification state.

Developers should evaluate decisions and risk, not reconstruct work from logs.

## Recovery and durability

Agents classify failures, collect diagnostics, form a new hypothesis, and make
bounded recovery attempts. Repeating the same failed action without new
evidence is prohibited. Budget exhaustion, unclear authority, policy conflicts,
and unresolved ambiguity escalate to a human.

Objectives, plans, decisions, WorkOrders, assignments, executions, evidence,
costs, errors, approvals, artifacts, pull requests, and deployment state remain
durable and resumable across agents, models, sessions, and handoffs.

## Production experimentation

Where appropriate, changes use feature flags, kill switches, progressive
delivery, limited cohorts, automated rollback, health monitoring, and
production validation. Passing implementation tests does not authorize rollout.

## Measures of success

Mission Control optimizes for delivery outcomes and trust:

- time from approved plan to review-ready pull request;
- autonomous completion and overnight completion rates;
- first-pass approval and acceptance-criteria pass rates;
- test pass, defect escape, rollback, rework, and recovery rates;
- developer review time;
- cost per completed WorkOrder;
- percentage of changes with complete evidence and safe flagging;
- developer trust and satisfaction.

Agent activity volume and generated lines of code are not success metrics.

## Product decision filter

Prioritize a feature only when it materially improves at least one of these:
clearer human intent, safer autonomous execution, stronger validation,
evidence and traceability, faster approved-plan-to-PR flow, reliable overnight
work, or developer trust.

## North Star statement

Mission Control enables developers to direct software development during
business hours while governed AI agents continuously plan, implement, test,
validate, and prepare changes throughout the day and overnight. Developers
return to evidence-backed, review-ready pull requests they can confidently
approve and merge.
