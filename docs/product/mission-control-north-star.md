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

## Operating doctrine

- **Intent over activity.** The primary object is the requested outcome, not an
  agent session, message, token count, or generated task list.
- **Exceptions over feeds.** Default views show decisions, blockers, failed or
  stale evidence, unsafe conditions, and aging work before routine activity.
- **Evidence over assertions.** A worker report, chat response, or status label
  never proves completion. Independent receipts and source-linked artifacts do.
- **Durable state over conversation.** Work must survive model changes, context
  limits, process restarts, agent handoffs, and the end of a chat session.
- **Policy before autonomy.** Identity, authority, repository scope, tools,
  budgets, risk, and recovery limits are resolved before execution begins.
- **Independent validation.** The actor that produced a material change cannot
  be the sole authority that certifies it.
- **One authoritative lifecycle.** Mission, WorkOrder, Task, run, approval,
  evidence, pull-request, deployment, and production states remain distinct and
  are never compressed into one optimistic status.

The canonical product hierarchy is:

`Mission → WorkOrder → Task → Attempt → evidence → pull request → release`

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

## Required product capabilities

Mission Control must provide:

1. an intent workspace for outcomes, constraints, sources, risks, and
   acceptance criteria;
2. repository research and a versioned plan that humans can diff, revise,
   approve, or reject;
3. idempotent conversion of approved plans into governed WorkOrders and Tasks;
4. execution preflight for repository, branch/worktree, environment, executor,
   tools, secrets, capacity, policy, and budget;
5. durable orchestration with bounded retries, classified failure recovery,
   pause/resume, escalation, and handoff;
6. criterion-level evidence and independently enforced quality gates;
7. repository-to-PR traceability and a concise, evidence-backed review package;
8. governed deployment, feature-flag, rollback, and production-verification
   states; and
9. outcome, trust, attention, cost, recovery, and overnight-completion metrics.

These capabilities may share pages. A capability does not earn a standalone
navigation destination merely because it exists in code.

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

## Operator attention contract

Mission Control should interrupt a developer only when human judgment,
authority, or credentials are required. Every attention item must state:

- the decision or action needed;
- why it cannot proceed autonomously;
- the affected Mission, WorkOrder, repository, and environment;
- risk, urgency, age, and deadline;
- evidence available, missing, conflicting, or stale;
- safe options and their consequences;
- the default recommendation and its uncertainty; and
- what resumes automatically after the decision.

Routine progress remains available for inspection but does not compete with
work requiring attention.

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

## V1 boundary and ship gate

V1 is one trustworthy golden path, not a broad company operating suite. The
product is ready to claim the North Star only when a real repository can
complete this browser-operable journey without direct database intervention:

`draft → researched plan → human approval → released WorkOrders → governed
Tasks and Attempts → failed validation → bounded corrective work → independent
pass → review-ready pull request → human acceptance`

The journey must survive refresh and process restart, enforce authorization and
workspace isolation, preserve immutable history, show actionable failure and
empty states, and produce a complete review package.

Content operations, CRM, meetings, voice, virtual offices, hiring, general team
management, and demo-only intelligence are not V1 product pillars. They remain
outside primary navigation unless they become necessary to the governed
delivery lifecycle and meet the same production maturity bar.

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

Before promoting a feature, also ask:

- Does it have one authoritative data owner and lifecycle?
- Is its required human action obvious without reading logs or chat?
- Does it fail closed when authority or evidence is missing?
- Can the work resume safely after interruption?
- Is it proven with real scoped data, authorized writes, audit, refresh,
  recovery, and browser evidence?

If the answer is no, the feature stays internal, preview, or Labs.

## North Star statement

Mission Control enables developers to direct software development during
business hours while governed AI agents continuously plan, implement, test,
validate, and prepare changes throughout the day and overnight. Developers
return to evidence-backed, review-ready pull requests they can confidently
approve and merge.
