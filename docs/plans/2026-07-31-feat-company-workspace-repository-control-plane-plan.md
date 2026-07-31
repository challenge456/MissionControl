---
title: "feat: Add company, workspace, repository, and team operating scopes"
type: feat
status: proposed-for-approval
date: 2026-07-31
owner: Product Architecture
implementation_status: not-started
---

# Company, Workspace, Repository, and Team Control Plane Specification

> This document is the SDD source of truth for the operating-scope change.
> Implementation must preserve existing workspace behavior, URLs, records, and
> governed delivery flows while the new hierarchy is introduced incrementally.

## 1. Outcome

Mission Control will support one company account containing multiple
workspaces. Each workspace may connect one or more repositories, including a
monorepo divided into explicit code scopes. People operate through role-aware
views at company, workspace, team, individual, epic, WorkOrder, run, and
evidence levels.

The system must let developers, product managers, engineering leads, QA leads,
and owners run fleets of software agents across multiple simultaneous epics
without turning the UI into an agent-activity feed.

The product promise remains:

> An operator can see what needs attention, make a governed decision, dispatch
> work, and inspect proof.

## 2. Why this is needed

The current product has a useful workspace boundary and a working
**Settings → Workspaces & Repositories** page. However, its persistent model is
still project-centric:

- `tenants` provide an early company-account foundation;
- `projects` act as workspaces throughout the UI and Convex APIs;
- a project stores only one optional `githubRepo` and branch;
- people can have per-project access, but there is no first-class scrum-team or
  team-membership model;
- `assignedSquad` is free-form text rather than a governed relationship;
- Missions, WorkOrders, Tasks, runs, approvals, and evidence already carry
  project/workspace scope in many paths.

This is enough for one operator and a few projects, but not for the target
operating model:

- one company account;
- two or more business workspaces;
- five scrum teams per workspace;
- five developers per team;
- approximately five active epics per developer;
- local and cloud agent execution across local/open-weight and frontier models;
- cross-workspace leadership visibility without cross-scope data ambiguity.

At the example scale, one workspace can have 125 active developer–epic
assignments. The product must aggregate attention, delivery confidence,
capacity, cost, and proof rather than require manual inspection of every run.

## 3. Product principles

1. **Workspace remains the primary operating context.** Keep the existing name
   and persistent sidebar selector.
2. **Company account is the identity and policy boundary.** Do not force a
   company-selection step when the operator belongs to only one account.
3. **A workspace is not a repository.** A workspace may connect zero, one, or
   many repositories.
4. **A monorepo is one repository.** Its internal apps, services, and packages
   are modeled as code scopes, not fake repositories.
5. **Scope must be enforced by the server.** UI filters are not authorization.
6. **Exceptions and evidence come first.** Activity volume is supporting
   context, not the primary operator experience.
7. **Preserve canonical delivery objects.** Do not introduce a second execution
   engine or duplicate Mission/WorkOrder/Task state.
8. **Migrate additively.** Existing `projectId`, `githubRepo`, deep links,
   local-storage selection, demo data, and Convex consumers remain functional
   until their replacements are proven.

## 4. Canonical hierarchy

```text
Company Account (existing tenant foundation)
  └─ Workspace (existing project record and projectId contract)
      ├─ Repository Connection (zero to many)
      │   └─ Code Scope (monorepo app/service/package/path boundary)
      ├─ Scrum Team (zero to many)
      │   └─ Team Membership (human member + role + validity)
      └─ Mission / Epic
          └─ WorkOrder
              └─ Task
                  └─ Agent/Workflow Run
                      └─ Evidence, decision, lineage, and retained knowledge
```

### 4.1 Terminology contract

| Product term | Initial implementation | Meaning |
| --- | --- | --- |
| Company account | `tenants` | Identity, policy, authorization, and future billing boundary |
| Workspace | `projects` | Business/product operating boundary selected in the sidebar |
| Repository | new workspace-repository record | A connected source repository |
| Code scope | new repository-scope record | A governed path/component inside a repository or monorepo |
| Scrum team | new team record | Stable delivery group inside one workspace |
| Operator | existing `operators` | Authenticated human identity inside the company account |
| Member profile | existing `orgMembers`, linked to an operator | Organizational profile, reporting context, and workspace access |
| Epic/feature | existing Mission for this phase | Outcome-level delivery unit above WorkOrders |
| WorkOrder | existing WorkOrder | Governed, dispatchable unit of work |
| Task | existing Task | Execution step under a WorkOrder, or explicitly standalone legacy work |

Do not add a separate `epics` table in this slice. Missions are the existing
outcome-level parent and must remain the canonical object. A later terminology
decision may change user-facing labels without splitting the underlying state.

## 5. Primary users and views

### 5.0 Scope semantics

The product must distinguish access scope, operating context, and personal
filtering:

| Scope/lens | Purpose | Security boundary? |
| --- | --- | --- |
| Company account | Identity, policy, and authorized workspace rollup | Yes |
| Workspace | Primary operational and data boundary | Yes |
| Repository/code scope | Source and executor permission boundary | Yes |
| Team | Membership, management, and shared delivery visibility | Yes |
| My Work | Personal ownership/attention lens | No; it is a default filtered view of authorized work |

“My Work” does not imply that a developer can never inspect authorized team
work. It is the developer’s default focus. Team membership determines whether
the broader Team Delivery lens is available. Company and workspace leaders may
inspect wider rollups without changing the ownership of underlying records.

The recommended V1 UI is one canonical Command Center route with four durable,
deep-linkable lenses:

- **My Work**;
- **Team**;
- **Workspace**;
- **Company**.

The available lenses and default lens depend on the operator’s role. Each lens
may have a tailored layout, but all use the same Missions, WorkOrders, Tasks,
runs, decisions, and evidence. Do not create separate state or competing
dashboards for each role.

### 5.1 Developer — My Work

The developer sees authorized work assigned to them across their teams and,
when permitted, across workspaces.

The default view answers:

- Which epics am I accountable for?
- What requires my decision, review, unblocking, or verification now?
- Which agents and runs are executing my WorkOrders?
- Which model and execution environment were selected, and why?
- What passed, failed, is stale, or lacks proof?
- Where am I over capacity or over budget?

The view groups by epic first, not by raw agent. It must distinguish human
ownership from agent assignment.

### 5.2 Team member or team lead — Team Delivery

The team view covers the five team members and their authorized delivery work.
It answers:

- Who owns each epic and next action?
- Which people or agents are over capacity?
- Which epics are blocked, awaiting approval, or losing delivery confidence?
- Which dependencies cross teams, repositories, or code scopes?
- Which WorkOrders lack current verification evidence?

Team leads may change team-scoped assignments and capacity limits when their
permission allows it. Ordinary members receive the same operational visibility
but not management mutations by default.

### 5.3 Product manager / workspace lead — Workspace Portfolio

This view aggregates all teams, epics, repositories, costs, risks, decisions,
and delivery confidence inside one workspace. It provides drill-down from team
to person to epic to WorkOrder to run to evidence.

### 5.4 Owner / company operator — Company Command Center

This is the cross-workspace exception view. It answers:

- Which workspace, team, or epic needs attention?
- What is off track, blocked, over budget, or waiting for governance?
- Which local or cloud execution pools are constrained or unhealthy?
- Which risks or dependencies cross workspace boundaries?
- What proof supports the current delivery-confidence rollup?

The company view is not a permanent unscoped mode for every page. Selecting an
item must enter the owning workspace before any mutation or detailed operation.

### 5.5 Read-only stakeholder

Read-only users can inspect authorized outcomes and evidence but cannot
dispatch, approve, reassign, change policy, or alter repository configuration.

## 6. Navigation and scope selection

### 6.1 Persistent sidebar behavior

Keep the existing sidebar **Workspace** selector and its current placement.

For a user with one company account:

- show the company name in the account/profile area;
- do not require account selection during normal navigation;
- retain the workspace selector as the primary scope control.

For a user with multiple accessible company accounts in the future:

- show an account switcher above the workspace selector;
- clear or recover inaccessible workspace state on account change;
- never carry a workspace or repository selection across account boundaries.

### 6.2 Workspace selector

Each option should communicate at least:

- workspace name;
- health/attention indicator when material;
- repository connection count or setup-required state;
- whether the workspace is paused or archived.

Selecting a workspace scopes all workspace routes, queries, mutations, counts,
approvals, chat context, agents, runs, context, memory, and evidence. Existing
`?workspace=<projectId>` URLs remain canonical during the migration.

### 6.3 Repository scope

Repository selection is secondary to workspace selection. It is normally a
filter within a workspace—not another mandatory global selector.

- `All repositories` is the default workspace view.
- A selected repository filters relevant delivery and execution surfaces.
- A code-scope filter becomes available for monorepos.
- Repository filtering must be encoded in URL query state and survive refresh,
  back/forward navigation, and shared links.
- A repository or code scope outside the active workspace produces an explicit
  scope error; it must not silently fall back.

### 6.4 Settings surface

Evolve the existing **Settings → Workspaces & Repositories** page. Do not add a
second workspace-management page.

The page will contain:

1. Workspace registry and existing operational summary.
2. Selected workspace contract: purpose, owner, status, default policy, swarm
   settings, and team count.
3. Repository connections: zero-to-many repositories, default branch,
   connection health, webhook health, and execution readiness.
4. Monorepo code scopes: paths/components, owning team, allowed execution
   environments, and review/verification policy.
5. Team roster and workspace access summary.

The current single-repository status must remain visible and functional while
the new repository collection is rolled out.

All user-facing labels on this page must use **workspace** consistently. Legacy
internal `project` naming may remain in code, but cards such as “Project
registry,” “Project detail,” and “tracked projects” must not contradict the page
title or the workspace selector.

### 6.5 Target section architecture

Keep the existing shell sections visible in the supplied product UI. Evolve
their contents and labels incrementally rather than replacing the entire
navigation.

| Existing section | Target responsibility | Required enhancements |
| --- | --- | --- |
| Overview | Role- and scope-aware Command Center | My/Team/Workspace/Company lenses, ranked attention, delivery confidence, proof drill-down |
| Strategy | Outcomes and investment | Goals, Missions/Epics, ownership, dependencies, budgets, acceptance state |
| Delivery | Governed work execution | WorkOrders, Tasks, runs, pipelines, dependency graph, repository/code-scope context |
| Operations | Fleet and factory operations | Agent fleet, queue/capacity, automations, decisions, incidents, cost, local/cloud execution |
| Intelligence | Measured factory improvement | Loop performance, effectiveness, readiness, friction, recommendations, evidence dossiers |
| Knowledge | Durable context and memory | Context Registry, RAG, memory, graph, documentation, provenance and retrieval explanation |
| Governance | Guardrails and trust | Policies, identities/access, quality gates, deployments, waivers, audit and separation of duties |
| Settings | Operating structure and integrations | Company profile, Workspaces & Repositories, teams/members, model routing, executors/providers, database/admin tools |

Navigation rules:

- preserve existing live route IDs and deep links during the migration;
- introduce new views behind route-capability and rollout flags;
- prefer contextual tabs/lenses over adding a top-level route for every metric;
- make every new production surface reachable from the left navigation or a
  clearly visible canonical parent surface;
- hide preview/demo capabilities by default unless their data is real and their
  operating contract is complete;
- keep repository and team administration under the selected workspace;
- keep company-wide rollups read-oriented until the operator enters a concrete
  workspace for mutation.

### 6.6 Command Center information design

The Command Center should not show the same cards at every scope. Each lens has
a specific operator job.

#### My Work lens

Default for developers and individual contributors:

- ranked **Needs my attention** queue;
- five active epics with owner/contributor status and next milestone;
- WorkOrders awaiting input, review, approval, or verification;
- agent runs in progress, blocked, failed, or ready for inspection;
- model/executor choice with local/cloud status and rationale;
- personal WIP, budget, review load, and evidence freshness;
- scheduled overnight/weekend work and the next expected checkpoint.

#### Team lens

Default for team leads when a team is selected:

- five-member roster with human WIP and agent capacity;
- epic ownership and contributor matrix;
- blocked/aging work and missing next owner;
- shared dependencies and repository/code-scope conflicts;
- review, approval, and QA queues;
- local/cloud executor availability and model mix;
- sprint/goal confidence derived from governed state and current evidence.

#### Workspace lens

Default for workspace leads and product managers:

- team comparison and workspace attention queue;
- goals → Missions/Epics → WorkOrders delivery rollup;
- cross-team and cross-repository dependencies;
- budget, model, executor, and quality posture;
- repository readiness and monorepo code-scope health;
- approvals, waivers, incidents, and stale evidence;
- drill-down to team, person, epic, WorkOrder, run, and proof.

#### Company lens

Default for company owners:

- workspace comparison with delivery confidence and trend;
- exceptions requiring owner or cross-workspace decisions;
- budget and model/executor allocation by workspace;
- capacity, risk, incident, and quality rollups;
- shared-repository or cross-workspace dependency warnings;
- direct drill-down that visibly enters the selected workspace.

Every metric must provide a defined formula, freshness indicator, source, and
drill-down. If the underlying data is missing or stale, the UI must say
**Unknown** or **Needs setup**, never infer health from absence.

### 6.7 Shared scope bar and saved operating views

Inside the main content area, provide a compact scope bar appropriate to the
current route:

```text
Company / Workspace / Team / Repository / Code scope / Time window
```

Only applicable controls appear. The persistent sidebar continues to own the
workspace context; the content scope bar refines it.

Operators may save named views such as:

- My blocked work;
- Team review queue;
- Workspace release risk;
- Monorepo scope conflicts;
- Overnight cloud runs;
- Local-model QA failures.

Saved views store filters, grouping, sorting, and columns—not copied business
data. They are private by default and may be shared with a team or workspace by
an authorized operator. URLs remain sufficient to reproduce a view without the
saved-view record.

## 7. Data model

Names below describe the target contract. Exact Convex table names may follow
repository conventions, but the relationships and invariants are required.

### 7.1 Company account

Reuse and harden the existing `tenants` foundation.

Required behavior:

- stable company identifier;
- active/inactive status;
- company-level operator membership and role;
- company policy defaults;
- authorization checks on every scoped server operation.

Existing records with optional `tenantId` must be backfilled before the field is
made required. No mutation should infer an arbitrary company after enforcement
is enabled.

### 7.2 Workspace

Keep `projects` and `projectId` as the internal compatibility contract during
this initiative. User-facing copy should consistently say **workspace**.

Required additions or clarified fields:

- company account (`tenantId`);
- name, slug, purpose, owner, lifecycle status;
- default policy and swarm/capacity policy;
- optional default repository connection;
- created/updated timestamps and audit actor.

Do not rename `projects` or replace `projectId` across the codebase in the same
release. That refactor has a high blast radius and provides no user value.

### 7.3 Workspace repository connection

Add a first-class one-to-many relationship from workspace to repository.

Minimum fields:

- company account ID;
- workspace/project ID;
- provider (`GITHUB` initially; extensible later);
- repository identity (`owner/name` and stable provider ID when available);
- display name;
- default branch;
- connection, validation, webhook, and execution-readiness status;
- default-for-workspace flag;
- repository policy overrides;
- created/updated timestamps and audit actor.

Invariants:

- the same provider repository cannot be duplicated inside one workspace;
- exactly zero or one connection is the workspace default;
- removing a repository is blocked while active Missions, WorkOrders, runs, or
  policies reference it, unless the operator explicitly migrates those links;
- repository secrets are referenced, not displayed or copied into evidence.

### 7.4 Code scope

A code scope represents an allowed monorepo component or path boundary.

Minimum fields:

- repository connection ID;
- stable name and display label;
- include paths;
- exclude paths;
- optional owning team ID;
- optional CODEOWNERS/reviewer mapping;
- allowed execution environments;
- required verification and approval policy;
- active/archived status.

Invariants:

- paths are normalized and repository-relative;
- overlapping scopes are allowed only when priority/ownership is explicit;
- an agent may read or mutate only the scopes authorized by its WorkOrder and
  execution policy;
- cross-scope changes require the union of applicable review and verification
  requirements;
- a worktree or local checkout path is host-specific and remains separate from
  the portable repository connection.

### 7.5 Scrum team and membership

Add first-class teams and memberships; do not continue using free-form
`assignedSquad` as authority.

Identity decision:

- `operators` are the canonical authenticated human identities;
- `orgMembers` are the organizational profiles used by people/team UI;
- add an optional `operatorId` link to `orgMembers` during migration and require
  it for active, login-capable members after backfill;
- team memberships reference the member profile and derive authenticated
  authority through its operator link;
- duplicate or ambiguous email/name matches require human resolution and are
  never joined automatically.

Team fields:

- company account ID;
- workspace/project ID;
- name, slug, purpose;
- team lead member ID;
- capacity policy;
- status and timestamps.

Membership fields:

- team ID;
- member/operator identity;
- role (`LEAD`, `DEVELOPER`, `QA`, `PM`, `VIEWER` initially);
- active-from and optional active-until timestamps;
- optional capacity allocation.

Invariants:

- a team belongs to exactly one workspace;
- a person may belong to multiple teams and workspaces when authorized;
- membership does not itself grant company-owner privileges;
- team mutations require workspace access plus the relevant team permission;
- deactivating a member does not delete historical ownership or evidence.

### 7.6 Epic ownership and participation

One owner string is insufficient for developers working across multiple epics.
Add a stable Mission/Epic assignment relationship.

Minimum fields:

- Mission ID;
- member profile ID;
- team ID;
- assignment role (`OWNER`, `CONTRIBUTOR`, `REVIEWER`, `STAKEHOLDER`);
- optional capacity allocation and effective dates;
- active status and audit actor.

Invariants:

- every active Mission has exactly one accountable human owner before dispatch;
- a Mission may have multiple contributors and reviewers;
- a person’s My Work lens includes owned and contributed Missions, clearly
  distinguished;
- historical assignments remain visible after membership or ownership changes;
- workspace and team scope must match the Mission unless an explicit
  cross-team contribution is authorized and audited.

### 7.7 Delivery ownership and scope

Missions and WorkOrders must progressively gain stable relationships for:

- human owner member/operator ID;
- owning team ID;
- repository connection ID;
- zero or more code-scope IDs;
- requesting actor ID;
- execution environment class (`LOCAL`, `CLOUD`, or policy-selected);
- model-routing decision reference when dispatched.

Legacy string fields such as `owner`, `assignedAgent`, `assignedSquad`, and
`repository` remain readable during migration. New writes should dual-write
human-readable snapshots for audit/display while treating stable IDs as
authority after the compatibility gate is enabled.

## 8. Authorization model

### 8.1 Initial roles

| Role | Default scope | Core capability |
| --- | --- | --- |
| Company Owner | Company | All workspaces, policy, access, budgets, and decisions |
| Company Admin | Company | Administration without ownership transfer |
| Workspace Lead / PM | Workspace | Portfolio, teams, assignments, priorities, and workspace decisions |
| Team Lead | Team | Team capacity, assignments, reviews, and governed dispatch |
| Team Member | Assigned workspace/team | Own/team work, permitted dispatch and evidence actions |
| Viewer | Assigned scope | Read-only outcomes and proof |

### 8.2 Enforcement rules

- Every query and mutation resolves authenticated operator identity server-side.
- Company membership is checked before workspace access.
- Workspace access is checked before team, repository, epic, WorkOrder, run,
  approval, or evidence access.
- Repository and code-scope authorization is checked at dispatch and again at
  executor binding.
- Approvals and waivers preserve separation of duties where policy requires it.
- Client-provided role, actor label, workspace, team, or repository scope is
  never trusted without server validation.
- Unauthorized aggregate counts must not reveal the existence of inaccessible
  workspaces or work.

Authentication and server-side authorization are required before this feature
can be considered production-ready. Existing optional tenant/project fields are
a migration state, not an acceptable final security posture.

## 9. Model and execution routing implications

The scope hierarchy must feed the existing model-routing control plane rather
than create another routing system.

Each dispatch decision should consider:

- workspace policy;
- repository and code-scope policy;
- team capacity and permissions;
- WorkOrder complexity and risk;
- required capabilities and context window;
- local or cloud executor health and availability;
- budget and expected duration;
- review and verification independence.

The decision record must explain:

- selected model and provider;
- local versus cloud execution;
- selection rationale and policy version;
- authorized override, if any;
- expected cost/duration class;
- fallback behavior;
- resulting receipts and verification evidence.

The UI may recommend frontier models for complex planning/review, strong coding
models for execution, local/open-weight models for suitable QA, automation, and
documentation, and cloud agents for bounded long-running work. These are policy
examples, not hard-coded vendor assignments.

### 9.1 Fleet and executor control plane

Managing a fleet requires separate visibility into people, logical agents,
running agent instances, and execution hosts. These must not be collapsed into
one “Agents active” count.

The control plane should expose:

- **Human capacity:** owned epics, pending reviews/decisions, WIP limits, and
  declared availability;
- **Agent definitions:** identity, role, version, skills, permissions, approved
  models, and evaluation history;
- **Agent instances:** current assignment, status, heartbeat, context version,
  model, cost, and failure/retry state;
- **Execution hosts:** local workstation, approved server, or cloud executor;
  health, capacity, checkout, runtime, network policy, and last attestation;
- **Queues:** eligible work, scheduling reason, age, blocked reason, and next
  owner;
- **Runs:** planned/running/paused/failed/completed state, checkpoint, remaining
  budget, and evidence status.

Dispatch must fail closed when the selected executor cannot prove repository,
code-scope, model, runtime, secret, network, or capacity eligibility.

### 9.2 Long-running local and cloud work

The OS must treat long-running work as scheduled, checkpointed operations—not
as a chat tab left open.

Required behavior:

- choose local or cloud execution through policy and operator confirmation;
- show expected duration, budget, checkpoints, stop condition, and escalation
  owner before dispatch;
- schedule permitted overnight or weekend execution windows;
- persist progress outside a conversational transcript;
- survive browser closure and operator handoff;
- pause safely on budget, policy, environment, or verification failure;
- produce a morning/return handoff summarizing completed work, failed checks,
  changed artifacts, spend, unresolved risks, and next decision;
- require fresh authorization before resuming expired or materially changed
  work.

Local execution must report through an approved host binding. Convex does not
directly reach a developer workstation; the orchestration/executor layer owns
that connection and reports bounded receipts.

### 9.3 Attention and decision engine

All role-aware dashboards should consume one canonical attention projection.
An attention item contains:

- company, workspace, team, repository, epic, and WorkOrder relationships;
- attention type and severity;
- reason and supporting evidence;
- current owner and required next action;
- age, deadline, and escalation policy;
- allowed actions for the current operator;
- deduplication/correlation key;
- resolved/snoozed state with audit history.

Initial attention types:

- blocked work;
- approval or review waiting;
- failing, missing, unknown, or stale evidence;
- agent/executor unhealthy;
- budget or runtime threshold breached;
- repository/code-scope conflict;
- cross-team dependency at risk;
- no accountable human owner;
- long-running work missing a checkpoint;
- policy or model-routing override requiring review.

Ranking must be deterministic and explainable. Recommendations may influence
ranking later, but they may not silently hide governed exceptions.

### 9.4 Delivery confidence

Delivery confidence is a transparent projection, not a fabricated AI score.
Its initial inputs should be limited to observable facts:

- dependency state;
- blocked age;
- WorkOrder progress against the approved plan;
- current verification evidence;
- review/approval aging;
- executor health;
- remaining budget and time window;
- unresolved incidents or scope conflicts.

The UI must show the contributing signals and their freshness. Predictive
forecasting may be added only after the deterministic projection is validated
against historical outcomes.

### 9.5 Knowledge, RAG, graph, and lineage

The new hierarchy must be reflected in retrieval and graph relationships:

- company → workspace → team → member;
- workspace → repository → code scope;
- goal → Mission/Epic → WorkOrder → Task → run → evidence;
- WorkOrder/run → model decision → executor → artifacts;
- code scope → owning team → reviewers/policies;
- run → learnings, incidents, recommendations, and superseding runs.

Retrieval must filter by authorization before ranking. Every retrieved item must
retain source, workspace, repository/code scope, version, freshness, and
provenance. Retrieved instructions are context, not automatically authorized
actions.

### 9.6 Recommendations and continuous improvement

Recommendations are advisory until an authorized operator accepts them. Each
recommendation must state:

- the observed problem or opportunity;
- affected workspace/team/repository/code scope;
- evidence and measurement window;
- expected benefit and confidence;
- cost, risk, and potential blast radius;
- proposed action and required approver;
- how success will be measured;
- whether the recommendation was accepted, rejected, deferred, or expired.

Recommended initial categories:

- rebalance human or agent capacity;
- split or reorder an oversized WorkOrder;
- change model tier based on measured task performance/cost;
- move suitable deterministic QA/docs/automation to an approved local model;
- move bounded long-running work to an approved cloud executor;
- add or improve verification for a repeatedly failing code scope;
- repair stale repository, context, or host configuration;
- automate a repeated manual pattern through a governed Definition;
- create a root-cause WorkOrder from clustered failures;
- retain a measured loop improvement through a versioned ratchet.

No recommendation may auto-approve its own policy, bypass independent review,
or make a mutating change merely because confidence is high.

### 9.7 Progressive autonomy

Autonomy is configured per workspace and capability, with a visible ceiling:

| Level | Behavior |
| --- | --- |
| Observe | Measure and recommend only |
| Propose | Draft Missions, plans, WorkOrders, or policy changes for review |
| Execute with approval | Dispatch approved bounded work and stop at gates |
| Auto-execute bounded work | Execute pre-approved low-risk definitions within explicit limits |

Higher autonomy does not weaken verification, audit, budget, identity, or scope
requirements. The current production target remains approval-gated bounded
execution; broader autonomy is a later, evidence-dependent promotion.

### 9.8 Notifications and handoffs

Notifications should be generated from attention and decision records, not
from every agent event.

Operators need:

- in-product attention inbox;
- configurable immediate alerts for critical failures or security/policy
  breaches;
- daily/team digest for aging reviews, blocked work, and overnight outcomes;
- clean handoff packets when work changes human owner or team;
- acknowledgement, snooze, escalation, and resolution tracking.

External Slack/email/Teams delivery is an integration phase, not required for
the first operating view. The in-product record remains authoritative.

### 9.9 Cost, capacity, and performance accounting

Every rollup should be attributable through the hierarchy:

```text
Company → Workspace → Team → Epic → WorkOrder → Run
                         ↘ Repository / Code scope
```

Track model, executor, verification, and retry cost separately. Show estimated
versus actual cost, budget remaining, duration, failure/rework, and evidence
quality. Avoid claiming labor savings until a defensible human baseline exists.

### 9.10 Feature priority and release boundary

The new structure is a platform change, so not every enhancement belongs in the
first release.

### P0 — foundation required before role dashboards

- authenticated company membership and server-side authorization;
- workspace compatibility contract;
- zero-to-many repository connections;
- monorepo code scopes;
- first-class teams and memberships;
- stable human/team/repository ownership on delivery records;
- additive migration, dual reads/writes, parity reporting, and rollback flags;
- deterministic attention projection contract.

### P1 — first shippable operating experience

- one Command Center with My, Team, Workspace, and Company lenses;
- ranked attention and decision queues;
- workspace/team/member/epic drill-down;
- fleet and executor capacity view;
- local/cloud/model-routing explanation;
- long-running work checkpoints and handoff summaries;
- evidence and delivery-confidence projection;
- enhanced Workspaces & Repositories administration.

### P2 — leverage and factory improvement

- saved and shared operating views;
- explainable recommendations with accept/reject/defer lifecycle;
- cross-team/repository dependency risk;
- loop experiment ratchets and measured improvement history;
- cost/quality/model comparisons by work type;
- governed recurring automations from repeated patterns;
- notification digests and external channel integrations;
- graph-assisted investigation and recommendation context.

### P3 — only after measured demand

- predictive delivery forecasts;
- automated capacity rebalancing;
- broader pre-authorized autonomy levels;
- cross-company benchmarking;
- advanced portfolio simulation and what-if planning.

P2 and P3 items must not delay the P0 foundation or the P1 operator loop.

## 10. User flows

### 10.1 Returning developer

1. Authenticate into the company account.
2. Restore the last accessible workspace.
3. Open **My Work** with the developer’s authorized assignments.
4. Review the ranked attention queue across their active epics.
5. Drill into Epic → WorkOrder → run → evidence.
6. Take an authorized action and receive explicit success/failure feedback.

If the saved workspace is no longer accessible, retain the current recovery
behavior: select an accessible workspace, explain the recovery, and allow the
notice to be dismissed.

### 10.2 Team lead

1. Select a workspace.
2. Select Team Delivery and one team.
3. Compare member ownership, capacity, epic health, blockers, decisions, and
   evidence freshness.
4. Reassign or reprioritize authorized work.
5. Confirm the mutation and resulting audit event.

### 10.3 Company owner

1. Open Company Command Center.
2. Review exception rollups across all authorized workspaces.
3. Select an at-risk workspace/team/epic.
4. Enter that workspace context automatically and visibly.
5. Inspect the governing decision and proof before acting.

### 10.4 Workspace repository administration

1. Open **Settings → Workspaces & Repositories**.
2. Select or create a workspace.
3. Connect a repository or preserve the existing unconfigured state.
4. Validate credentials, default branch, webhook, and executor readiness.
5. For a monorepo, define code scopes and team ownership.
6. Save only after validation succeeds or explicitly retain a clearly labeled
   incomplete/setup-required state.

### 10.5 Cross-scope work

1. Create or plan a Mission/WorkOrder that touches multiple code scopes.
2. Show the combined ownership, approval, and verification requirements before
   dispatch.
3. Reject dispatch if any required scope is unauthorized or unavailable.
4. Record all affected scopes in the execution and evidence lineage.

## 11. Required UI states

Every new or changed surface must define and test:

- initial loading;
- no company membership;
- no accessible workspace;
- workspace setup required;
- zero connected repositories;
- one connected repository;
- multiple connected repositories;
- monorepo with no code scopes;
- monorepo with valid/overlapping/invalid code scopes;
- no teams or memberships;
- empty My Work and Team Delivery;
- partial data/backfill state;
- inaccessible or archived selected workspace;
- repository validation degraded/error;
- slow/offline query behavior;
- unauthorized action;
- validation failure;
- mutation in progress and duplicate submission;
- successful save/action with confirmation;
- stale concurrent edit with recovery guidance.

The UI must never present missing backend data as zero or healthy when the
actual state is unknown.

## 12. Backward compatibility requirements

The change is not shippable if it breaks existing workspace flows.

### 12.1 Contracts to preserve

- Existing `projects` records remain valid workspaces.
- Existing `projectId` arguments, indexes, and UI context remain functional.
- Existing `?workspace=<projectId>` links continue to load and recover safely.
- `mc.last_project` and `mc.last_view` continue to restore accessible state.
- Existing single `githubRepo` values remain visible and operational.
- Existing WorkOrders with string `repository` and `assignedSquad` continue to
  render and dispatch under the legacy compatibility path.
- Existing Tasks, Missions, approvals, runs, evidence, demo seed, and local
  host bindings retain their relationships.
- Existing v2 and legacy-shell capability flags continue to work.
- No existing live route is removed or silently redirected to an unrelated
  surface.

### 12.2 Compatibility strategy

1. Add new tables/fields and indexes without deleting or renaming old ones.
2. Backfill tenant, repository connection, team, and stable ownership links in
   deterministic, restartable batches.
3. Read new records first and fall back to legacy project fields.
4. Dual-write repository and ownership data during the compatibility window.
5. Compare new and legacy projections and record mismatches.
6. Enable new UI and authoritative reads per workspace behind flags.
7. Stop legacy writes only after parity and browser tests pass.
8. Remove legacy fields in a separate approved migration—not this initiative.

### 12.3 Backfill rules

- For each project with `githubRepo`, create one default repository connection.
- Copy `githubBranch`, connection status, validation timestamps, and errors.
- Do not invent code scopes for monorepos; mark scope setup as optional or
  required by workspace policy.
- Preserve host-specific checkout bindings and associate them with the matched
  repository connection without moving local paths onto portable records.
- Map `assignedSquad` to a team only on deterministic normalized-name match;
  otherwise retain it as legacy text and flag it for review.
- Map string owners/assignees to member IDs only on deterministic identity
  match; never guess between duplicate names.
- Every backfill writes a version marker and produces counts for created,
  matched, skipped, ambiguous, and failed records.

## 13. Delivery phases

### Phase 0 — Contract and baseline

- Approve this specification and terminology.
- Inventory all `projectId`, `githubRepo`, `repository`, `assignedSquad`, owner,
  and project-access consumers.
- Capture baseline tests for workspace switching, recovery, repository setup,
  WorkOrder dispatch, run inspection, approvals, and evidence.
- Define feature flags and rollback ownership.

Exit gate: baseline is reproducible and no schema mutation has shipped.

### Phase 1 — Additive company and repository foundation

- Harden tenant/company association for new writes.
- Add repository-connection and code-scope tables/indexes.
- Backfill existing single-repository projects.
- Add compatibility queries while leaving the current UI behavior unchanged.
- Add scope-integrity and migration tests.

Exit gate: new and legacy repository projections match for every migrated
workspace, and rollback requires no destructive data operation.

### Phase 2 — Teams, memberships, and stable ownership

- Add team and membership tables/indexes.
- Add stable team/member ownership to Mission and WorkOrder contracts.
- Backfill deterministic assignments; surface ambiguous rows for review.
- Enforce read/write permissions server-side.

Exit gate: developer, team lead, workspace lead, owner, and viewer permission
fixtures pass denied and allowed cases.

### Phase 3 — Evolve Workspaces & Repositories UI

- Extend the existing settings page for multiple repositories and code scopes.
- Preserve the existing workspace registry and details.
- Add setup, validation, degraded, error, and success states.
- Add repository/code-scope URL filters where operationally relevant.

Exit gate: existing single-repository workflow and new monorepo workflow both
pass browser verification at desktop and compact widths.

### Phase 4 — Role-aware operating views

- Add My Work.
- Add Team Delivery.
- Add workspace portfolio rollups.
- Add owner-level Company Command Center.
- Ensure every aggregate drills into canonical Mission, WorkOrder, run, and
  evidence records.

Exit gate: seeded scale equivalent to at least two workspaces, ten teams, fifty
members, and 250 active member–epic assignments remains usable and truthful.

### Phase 5 — Enforced dispatch scope and rollout

- Feed repository/code-scope/team policy into model and executor routing.
- Enforce scope again at executor binding.
- Record selection rationale and receipts.
- Run shadow comparison before enabling authoritative enforcement.
- Roll out per workspace with rollback flags and monitoring.

Exit gate: unauthorized repository or code-scope mutation is blocked server-side
and produces an actionable, non-secret-bearing audit record.

## 14. Acceptance criteria

### Scope and navigation

- [ ] A user with one company account enters it without an unnecessary account-selection step.
- [ ] A user with multiple accounts cannot carry workspace state across accounts.
- [ ] The existing sidebar workspace selector remains the primary operating-context selector.
- [ ] Existing workspace links, persistence, and inaccessible-workspace recovery continue to work.
- [ ] Repository and code-scope filters survive refresh and browser back/forward.
- [ ] An out-of-workspace repository or entity link shows an explicit scope error.

### Repository and monorepo support

- [ ] A workspace can have zero, one, or multiple repository connections.
- [ ] Every existing `githubRepo` value is represented by one default connection after backfill.
- [ ] A monorepo can define multiple governed code scopes without creating fake repositories.
- [ ] Cross-scope WorkOrders show combined ownership, review, and verification requirements.
- [ ] Host checkout paths remain host-specific and are never treated as portable workspace configuration.

### Team and role views

- [ ] A developer can see only authorized work and a useful My Work rollup.
- [ ] My Work distinguishes owned, contributed, and review assignments.
- [ ] A team view shows all five example members, their epic ownership, attention, capacity, and proof status.
- [ ] A workspace lead can roll up five teams and drill to canonical records.
- [ ] A company owner can compare workspaces and enter the correct workspace before mutation.
- [ ] A viewer cannot dispatch, approve, waive, reassign, or alter policy.
- [ ] My, Team, Workspace, and Company lenses are deep-linkable and use the same canonical delivery records.
- [ ] Company and workspace aggregate metrics expose formula, source, and freshness.
- [ ] Unknown or stale inputs never render as zero, healthy, or complete.

### Fleet and long-running work

- [ ] The UI distinguishes human capacity, agent definitions, agent instances, and executor hosts.
- [ ] Every active run exposes model, executor, environment, checkpoint, budget, and evidence state.
- [ ] Overnight/weekend work has an explicit stop condition, escalation owner, and return handoff.
- [ ] Closing the browser does not lose long-running work state.
- [ ] Unhealthy or ineligible hosts cannot receive new dispatches.
- [ ] Local execution requires an approved host and repository checkout binding.

### Attention and recommendations

- [ ] Attention ranking is deterministic, explainable, and consistent across role lenses.
- [ ] Attention items identify the current owner, required action, age, and supporting evidence.
- [ ] Duplicate symptoms correlate into one actionable item where the correlation key matches.
- [ ] Recommendations retain evidence, expected benefit, confidence, risk, cost, and decision history.
- [ ] Recommendations remain advisory until accepted by an authorized operator.
- [ ] Recommendation generation cannot hide governed exceptions or satisfy its own approval.

### Governance and proof

- [ ] Every dispatch records workspace, repository, code scopes, team/owner, model-routing decision, and execution environment.
- [ ] Unauthorized scope is rejected server-side, even if a client crafts the request.
- [ ] Cross-scope changes require all applicable approvals and verification.
- [ ] Rollups distinguish passing, failing, stale, missing, and unknown evidence.
- [ ] No worker can satisfy an independent-review requirement with its own unverified result.

### Compatibility and reliability

- [ ] Existing single-repository workspace creation, selection, setup, dispatch, approvals, and run inspection pass unchanged.
- [ ] Legacy WorkOrders without new IDs continue to render and operate through the compatibility path.
- [ ] Backfill is idempotent, restartable, measurable, and non-destructive.
- [ ] New writes are dual-written until projection parity is proven.
- [ ] Feature flags can disable new authoritative reads without deleting data.
- [ ] Loading, empty, partial, degraded, error, unauthorized, success, and concurrent-edit states are tested.
- [ ] Settings copy uses “workspace” consistently while preserving internal `projectId` compatibility.

## 15. Verification plan

### Automated tests

- schema validator and index tests;
- tenant/workspace/repository/team scope-integrity tests;
- permission matrix tests for every role;
- idempotent backfill and dual-write tests;
- workspace selection/recovery tests;
- repository and code-scope validation tests;
- WorkOrder dispatch denial tests for unauthorized scope;
- aggregate projection tests that prevent inaccessible data leakage;
- direct-link, query-state, refresh, and back/forward tests;
- model/executor routing policy tests.

### Browser journeys

1. Existing user selects an existing single-repository workspace and completes
   the current WorkOrder → run → evidence flow.
2. Owner creates a workspace with no repository and sees truthful setup state.
3. Admin connects one repository and validates it.
4. Admin connects a monorepo, defines code scopes, assigns teams, and detects an
   invalid overlap.
5. Developer opens My Work and drills into one of five active epics.
6. Team lead reviews five members and resolves an attention item.
7. Workspace lead compares five teams and drills into failing evidence.
8. Company owner compares two workspaces and enters the correct workspace.
9. Viewer attempts prohibited mutations and is denied without data leakage.
10. Direct link with a mismatched workspace/repository returns an explicit
    scope error.
11. Compact-width navigation, keyboard operation, and 200% zoom remain usable.

### Scale fixture

Create a deterministic, removable test fixture with:

- one company account;
- two workspaces;
- at least one monorepo and one ordinary repository;
- five teams and twenty-five members per workspace;
- five active Missions/epics per member assignment;
- representative WorkOrders, local/cloud runs, approvals, blockers, costs, and
  evidence states.

The fixture must be tagged and removable without touching non-fixture data.

### Evidence required for approval

- migration/backfill report;
- scope and permission test results;
- before/after workspace and repository screenshots;
- browser trace for each primary role;
- denied-request evidence for cross-workspace and cross-scope attempts;
- aggregate parity report;
- performance measurements at the scale fixture;
- rollback rehearsal and result.

## 16. Observability and success measures

Operational measures:

- workspace/repository projection mismatches;
- inaccessible-scope query and mutation attempts;
- repository validation failures;
- ambiguous ownership/team backfills;
- routing denials by reason;
- aggregate query latency and error rate;
- stale/missing evidence by workspace and team.

Product success measures:

- median time to find the next required human action;
- median time from blocked status to named owner/action;
- approval and review aging;
- percentage of active WorkOrders with stable workspace, repository, team,
  human-owner, and evidence lineage;
- percentage of completed work with current passing evidence;
- operator drill-down success from company rollup to proof;
- reduction in manual agent/run inspection for routine healthy work.

Do not use raw agent activity, message volume, or token volume as primary
success metrics.

## 17. Rollout and rollback

Use separate flags for:

- new repository data projection;
- multiple-repository settings UI;
- team/membership authorization;
- role-aware operating views;
- repository/code-scope dispatch enforcement;
- company-level rollups.

Roll out one internal workspace at a time. Run new projections in shadow mode
before making them authoritative. A rollback must restore legacy reads and UI
without deleting new records or reversing a schema migration.

Do not remove legacy fields, legacy dispatch compatibility, or existing route
aliases in this implementation. Their removal requires a separate, evidence-
backed deprecation specification.

## 18. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Renaming project concepts breaks broad consumers | Preserve `projects`/`projectId`; change user-facing terminology only |
| UI filters are mistaken for access control | Enforce company/workspace/repository/team scope in Convex functions |
| Monorepo scopes overlap or become stale | Validate paths, expose overlap, version policy, require explicit ownership |
| Owner rollups leak inaccessible data | Authorize before aggregation and test count leakage |
| Legacy string assignments map incorrectly | Only deterministic matches; otherwise flag for human review |
| New dashboards become activity wallpaper | Rank exceptions, decisions, capacity, risk, and proof |
| Migration breaks current repository setup | Additive tables, fallback reads, dual writes, parity checks, feature flags |
| Developer cognitive load remains too high | Group by epic and next human action; do not make raw runs the default |
| Cross-workspace mode permits accidental mutation | Enter and display one workspace context before detailed mutation |

## 19. Non-goals

This initiative does not:

- rename every `projectId` symbol or the `projects` table;
- create a second multi-tenant SaaS billing architecture;
- introduce a separate Epic execution engine;
- replace Missions, WorkOrders, Tasks, WorkflowRuns, approvals, or evidence;
- hard-code a specific model vendor for a work type;
- automatically infer monorepo boundaries without operator review;
- allow company-wide unscoped mutations;
- redesign every Mission Control route;
- remove legacy fields in the same release;
- treat more parallel activity as success by itself.

## 20. Implementation starting point

After product approval, create execution todos from the delivery phases. The
first bounded implementation must be Phase 0 and Phase 1 only: baseline the
existing behavior, add the one-to-many repository foundation, backfill current
`githubRepo` records, and prove compatibility before team dashboards or
company-level rollups are built.

No implementation should begin from a chat summary alone; it must reference
this approved specification and preserve its acceptance and evidence gates.
