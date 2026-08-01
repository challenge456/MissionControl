---
title: Mission Control V1 Product Strategy
status: active
owner: product
updated: 2026-07-31
source: docs/product/mission-control-north-star.md
---

# Mission Control V1 Product Strategy

## Outcome

Mission Control V1 must let a developer define an outcome, approve a plan,
allow governed agents to execute safely through the day or overnight, and
return to a review-ready pull request with sufficient evidence for a confident
decision.

The strategy is intentionally narrower than the historical application shell.
The first product is a trustworthy software-delivery control plane. It is not a
general company operating system, a chat product, or a showcase of agent
activity.

## Primary users and jobs

### Developer / operator

- Clarify intent and acceptance criteria.
- Review plans, risk, tradeoffs, and execution scope.
- Approve only the decisions that require human authority.
- Triage blockers and ambiguous conditions quickly.
- Review a concise change and evidence package.
- Approve, reject, revise, merge, deploy, or roll back with confidence.

### Agent worker

- Receive a bounded, authorized WorkOrder.
- Understand repository and environment context without reconstructing it from
  chat.
- Implement, test, record decisions, and emit artifacts.
- Classify failures and attempt bounded recovery.
- Hand off durable state to another authorized worker or validator.

### Independent validator

- Verify frozen acceptance assertions against current artifacts and
  environments.
- Record pass, fail, stale, unknown, or waiver-required evidence.
- Remain independent from the worker that created the change.

## Canonical hierarchy

```text
Workspace / Repository
└── Mission — governed outcome
    └── Approved Plan — versioned execution contract
        └── WorkOrder — authorized unit of value and acceptance
            └── Task — bounded operational unit
                └── Attempt — immutable execution try
                    ├── Steps and tool calls
                    ├── Artifacts and changed files
                    └── Evidence receipts
Pull Request → Merge → Deployment → Production Verification
```

No lower-level record may silently complete or accept its parent.

## V1 golden path

1. **Define:** Capture outcome, business reason, constraints, source references,
   risk hints, stop condition, and measurable acceptance criteria.
2. **Research:** An agent inspects the repository, dependencies, history,
   tests, runtime, and relevant documentation.
3. **Plan:** The agent proposes a versioned plan, dependency graph, WorkOrder
   blueprints, validation assertions, budget, and rollback approach.
4. **Decide:** A human diffs, revises, approves, or rejects the plan with a
   reason. Authority and separation of duties are enforced server-side.
5. **Preflight:** Mission Control verifies repository access, executor health,
   environment, worktree, tools, secrets, policy, model route, capacity, and
   budget before releasing execution.
6. **Execute:** Specialized agents perform bounded Tasks and immutable Attempts.
   Progress survives restart, handoff, and model replacement.
7. **Recover:** Failures are classified; diagnostics and new hypotheses are
   recorded; retries are bounded; unresolved ambiguity escalates.
8. **Validate:** Independent validators produce criterion-level evidence. Failed,
   stale, missing, conflicting, or unknown evidence blocks progression.
9. **Package:** Mission Control links commits, changed files, tests, decisions,
   risks, uncertainty, rollback, PR, CI, and reviewer focus areas.
10. **Approve:** A human accepts, rejects, or requests revision. Merge remains a
    distinct decision.
11. **Release:** Deployment, flag activation, production validation, health
    monitoring, rollback, and verification use separate governed states.
12. **Learn:** Accepted work may propose provenance-rich reusable context,
    workflow, verifier, or policy improvements. Promotion requires review.

## P0 — required for the V1 promise

### 1. Mission intent and planning studio

Enhancements:

- Structured outcome, context, constraints, source-of-truth references, risk,
  owner, budget, stop condition, and acceptance criteria.
- Repository research packet with citations and explicit unknowns.
- Versioned plan builder with WorkOrder blueprints, dependencies, assertions,
  execution modes, estimated cost, and rollback.
- Human-readable diff, comments, rejection reason, revision, approval, and
  idempotent WorkOrder release.

Done when a Mission can move from Draft through approved WorkOrder release
without direct database mutation.

### 2. Authenticated identity and authorization

Enhancements:

- Authenticated human and agent identities.
- Workspace, repository, environment, tool, secret, and action permissions.
- Role and separation-of-duties enforcement for author, approver, worker,
  validator, merger, and deployer.
- Denied-action audit and emergency operator controls.

Done when client-provided labels cannot grant authority and every sensitive
mutation is enforced and attributable server-side.

### 3. Execution readiness and isolation

Enhancements:

- Repository and workspace health checks.
- Approved executor and host binding with capability attestation.
- Branch/worktree allocation, concurrency locks, and collision detection.
- Scoped secret broker, short-lived credentials, network policy, tool
  allowlists, runtime version, disk/time limits, and redacted receipts.
- Preflight explanation showing exactly why dispatch is allowed or blocked.

Done when unsafe or incapable execution fails closed before an agent mutates a
repository.

### 4. Durable execution and overnight shift control

Enhancements:

- An operator-defined overnight window, allowed Missions, budgets, concurrency,
  escalation channel, and stop conditions.
- Durable queues, heartbeats, leases, pause, resume, cancel, retry, and handoff.
- Missed-run, stuck-run, capacity, policy, budget, and executor-health incidents.
- Morning briefing showing completed work, pending decisions, failures,
  recoveries, spend, risks, and review-ready PRs.

Done when execution can survive process restart and continue unattended without
silently exceeding authority or budget.

### 5. Unified evidence and quality gate

Enhancements:

- One evidence envelope for commands, tests, CI, security, performance,
  accessibility, UI captures, API checks, deployments, and manual verification.
- Criterion/assertion traceability, verifier identity, environment, commit,
  artifact hash, freshness, confidence, and contradictory evidence.
- Explicit pass, fail, stale, unknown, waived, and not-applicable semantics.
- Expiring waivers with approver, reason, compensating control, and scope.
- One evaluator that blocks WorkOrder acceptance, Mission acceptance, merge,
  deployment, or activation as required by policy.

Done when a worker cannot self-certify and missing or stale evidence cannot be
presented as completion.

### 6. Repository, pull-request, and review package

Enhancements:

- Canonical repository, worktree, branch, commit, changed-file, PR, review,
  check, merge, and deployment linkage.
- Change-risk and blast-radius summary based on affected systems and ownership.
- Plan-versus-implementation deviations and decisions made during execution.
- Required reviewer focus areas, unresolved questions, uncertainty, and
  rollback strategy.
- Acceptance-criteria matrix with direct links to evidence.

Done when a reviewer can make a confident decision without reconstructing the
change from conversations or raw logs.

### 7. Recovery and incident workspace

Enhancements:

- Failure taxonomy for requirements, policy, environment, dependency, tool,
  test, flaky test, code, merge conflict, rate limit, budget, and infrastructure.
- Diagnostic evidence, hypotheses, attempted remediation, learned facts, and
  remaining recovery budget.
- Duplicate-attempt detection and prohibition on repeating a failed action
  without new evidence.
- Actionable incidents with owner, urgency, impact, safe options, and resume
  behavior.

Done when failed work either recovers within policy or reaches a human with a
specific decision packet.

### 8. Governed release and production verification

Enhancements:

- Environment promotion policy and deployment approval.
- Feature flags, kill switches, limited cohorts, canaries, and progressive
  delivery.
- Health thresholds, smoke tests, monitoring window, automatic disable/rollback,
  and explicit production verification.
- Traceable separation between merged, deployed, activated, and verified.

Done when passing implementation tests cannot accidentally authorize a broad
production rollout.

## P1 — strengthen trust and operating leverage

### Context and memory

- Versioned Context Registry packages with provenance, security checks, evals,
  activation receipts, and run snapshots.
- Durable episodic memory for accepted outcomes, failures, decisions, and
  recovery patterns.
- Explainable retrieval with workspace permissions, citations, freshness,
  correction, conflict, and supersession.
- Learning candidates proposed after accepted work; never auto-promoted from a
  single run.

### Agent workforce and capacity

- Governed Agent Template → Version → Instance → Identity profiles.
- Skills, permissions, health, capacity, cost, reliability, current assignment,
  quarantine, and retirement.
- Compatibility checks before assignment and capacity-aware scheduling.
- Queue & Capacity view replacing ATC/Office/Fleet activity wallpaper.

### Operator decision quality

- Policy simulation and dry-run explaining exact inputs and versions.
- Decision packets with safe options, consequences, recommendation, confidence,
  and uncertainty.
- Aging/SLO measurements for approvals and reviews without automating approval
  to improve the metric.
- Saved attention views and notification preferences by risk and role.

### Search and navigation

- Unified scoped search across Mission, WorkOrder, Task, Attempt, decision,
  evidence, PR, deployment, incident, agent, context, and documentation.
- Stable canonical URLs and breadcrumb navigation through the delivery chain.
- Six or fewer job-oriented primary navigation domains; preview and demo routes
  hidden by default.

### Outcome analytics

- Approved-plan-to-review-ready time.
- Autonomous and overnight completion rates.
- First-pass approval, rework, defect escape, rollback, recovery, and evidence
  completeness.
- Human attention minutes and decision latency.
- Cost per accepted WorkOrder and validated outcome.
- Every measure has a definition, sample size, provenance, and drill-down.

## P2 — scale after the golden path is proven

- Multi-repository Missions and cross-repository dependency coordination.
- Portfolio forecasting across 20+ active Missions.
- Change-impact and organizational ownership graphs.
- Shadow/canary policy and model experiments.
- Evidence-preserving replay from prior workflow, context, and artifact versions.
- Controlled continuous research that proposes one bounded next-cycle Mission.
- Failure clustering and suggested remediation WorkOrders.
- Model/provider routing optimized for accepted outcome quality, not token price.
- Compliance exports and supply-chain provenance packages.

## Consolidation of older features

| Older capability | V1 disposition |
| --- | --- |
| Home, Radar, Feedback | One exception-first Command Center |
| Goals | Missions |
| Tasks | Governed execution units under WorkOrders |
| DAG and Graph Engineering | Plan graph and runtime graph, clearly separated |
| Calendar, Run Schedule, Agent Schedules, Automations | Scheduled Operations |
| ATC, Fleet, Office, Live Office | Queue & Capacity |
| Chat, Live Chat, Command | Contextual Mission/WorkOrder interaction only |
| Skills pages and registry previews | One Context Registry with lifecycle tabs |
| Pipeline, Build Pipeline, Factory Board, Execution | One Delivery Pipeline and Run Inspector |
| Recorder | Evidence capture capability |
| Test Generation | Worker capability governed by acceptance criteria |
| Flaky Steps | Quality finding and Incident type |
| Gherkin Studio | Acceptance-criteria authoring mode |
| CodeGen | Worker capability, not a primary page |
| QC Dashboard, Runs, Findings, Metrics, Rulesets, Environments | One Quality surface |
| Approvals and Audit | One entity-aware Decision Center with immutable history |
| Deployments | Governed Release |
| Database/System | Restricted administration |
| Content, CRM, Meetings, Voice, People, Org, Hiring | Outside V1 primary product |

## Product interaction requirements

Every production capability must include:

- loading, empty, degraded, error, success, and permission-denied states;
- required action, owner, reason, age, and next automatic behavior;
- keyboard, narrow-screen, zoom, and non-color accessibility;
- idempotent mutation behavior and visible confirmation;
- immutable history and stable entity links;
- workspace isolation and server-side authorization;
- refresh/restart durability;
- explicit real, preview, demo, proxy, or synthetic provenance; and
- browser evidence using real scoped data before promotion.

## Recommendations

1. **Stop adding primary navigation domains.** Complete the Mission golden path
   before promoting another surface.
2. **Prove one repository first.** Use Mission Control itself as the initial
   production-quality fixture before multi-repository coordination.
3. **Make authorization the autonomy ceiling.** Do not expand mutating autonomy
   until authenticated identity, executor binding, and separation of duties are
   enforced.
4. **Build the evidence evaluator before analytics.** Trustworthy decisions are
   more valuable than dashboards derived from ambiguous completion states.
5. **Generate the review package from durable records.** Do not rely on an agent
   to reconstruct it at the end of a run.
6. **Use the same contract in UI, CLI, and API.** No interface may provide a
   hidden execution or acceptance bypass.
7. **Hide before deleting.** Preserve experimental code behind flags while
   measuring use and migrating links; remove it only after the authoritative
   replacement is proven.
8. **Treat graceful failure as core product work.** Overnight trust depends more
   on correct blocking, escalation, and resumption than on maximum autonomy.

## V1 ship gate

V1 is ready when one real Mission can complete the full golden path with:

- authenticated and authorized actors;
- an approved versioned plan and idempotently released WorkOrders;
- bound repository, executor, environment, tools, and budget;
- at least one preserved failure and bounded corrective retry;
- independent criterion-level evidence;
- a review-ready PR and complete review package;
- merge, deployment, and production states kept distinct;
- refresh and process-restart durability;
- actionable loading, empty, error, permission, and recovery states;
- desktop, narrow, keyboard, and accessibility browser proof; and
- no direct database mutation or hidden operational bypass.

## Open Product Owner decisions

These decisions must be explicit before their capabilities are enabled:

1. Which identity provider and bootstrap-owner migration define V1 authority?
2. Which Git provider and executor runtime are supported first?
3. Can Green work ever auto-merge, or only prepare a pull request?
4. Can Mission Control deploy to a disabled flag automatically after merge?
5. Which channels may wake an operator overnight, and for which risk levels?
6. What are the default overnight cost, concurrency, retry, and duration limits?
7. Which evidence types require a distinct validator identity?
8. What production health thresholds authorize automatic disable or rollback?
