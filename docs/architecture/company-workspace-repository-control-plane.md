# Company, Workspace, and Repository Control Plane

## Problem solved

Mission Control needs one operating model for a developer managing five simultaneous epics, a Scrum team lead managing five developers, and a company operator managing several business portfolios. The same model must support one repository, several repositories, and monorepos without using local checkout paths as durable identity.

## Authoritative hierarchy

```text
Company account (tenant)
└── Workspace (business, product, or portfolio boundary)
    ├── Scrum teams and members
    ├── Repository connection(s)
    │   └── Code scopes (monorepo paths/components with stable ownership)
    └── Mission → WorkOrder → workflow run → evidence → approval/release
```

- Company account is the security and top-level portfolio boundary.
- Workspace is the operating boundary used by Missions, WorkOrders, agents, runs, policies, and context.
- Repository connection is portable provider identity plus the default branch. The legacy `projects.githubRepo` and `githubBranch` fields remain the default-repository projection during migration.
- Code scope is a governed monorepo boundary. It stores repository-relative include/exclude paths, owning team, allowed execution environments, review requirements, and overlap policy. It never stores a developer's local checkout path.
- Host binding maps a repository to a specific executor host and local checkout. Local execution requires a ready host binding.

## Role lenses

| Lens | Intended operator | Server scope |
|---|---|---|
| My Work | Developer, QA, individual owner | Member-owned or assigned Missions and WorkOrders |
| Team | Team lead, PM, team member | Active team memberships only |
| Workspace | Workspace lead, PM, company admin | One authorized workspace |
| Company | Company owner/admin | All accessible workspaces in one company account |

Counts, attention items, repository filters, and drill-downs use the same server-derived scope. The UI does not supply an authorization predicate. Missing source data is shown as `UNKNOWN`; it is not replaced with a synthetic zero.

## Governed delivery contract

Missions and WorkOrders carry stable `tenantId`, `projectId`, `owningTeamId`, `ownerMemberId`, `repositoryId`, and `codeScopeIds`. Dispatch also carries execution environment and optional host identity. The server performs these checks before a workflow run exists:

1. Authenticate the operator or service identity and resolve company, workspace, and team membership.
2. Authorize the specific Mission or WorkOrder, not only its workspace.
3. Require dispatch input to match the WorkOrder's canonical repository, team, owner, and code scopes.
4. Validate that every referenced record belongs to the same workspace and repository.
5. Enforce code-scope environment policy and require a ready host binding for local execution.
6. Union reviewer, approval, verification, and owning-team requirements across every selected code scope.
7. Persist an allowed, denied, mismatch, or legacy compatibility receipt.

Executor binding repeats scope validation and revalidates the selected environment, host checkout, runtime declaration, model-routing decision, team concurrency, budget, checkpoint, stop condition, and escalation owner. A server-side `CONVEX_SERVICE_AUTH_TOKEN` may authenticate the orchestration service as a mapped Convex operator; it must never enter the browser bundle.

## Attention and proof

Attention is derived from canonical records and ranked deterministically by severity, overdue condition, age, and correlation key. Correlated symptoms collapse into one row. Every row names the human owner, required decision/action, and evidence source. Resolving or snoozing attention is an audited server mutation and is constrained to the same delivery record authorization.

Company is an aggregate, read-oriented lens. Opening proof or selecting a workspace row first changes the URL and visible context to that owning workspace; only then are workspace mutation controls available.

## Agent-native capability map

| Operator capability | UI surface | Agent/server capability | Authorization and evidence |
|---|---|---|---|
| Change lens and scope | Command Center controls and URL state | `getOperatingView` query arguments | Server computes available lenses and returns recoverable scope errors |
| Create a team | Workspaces & Repositories | `createTeam` mutation | Workspace-management permission and activity record |
| Manage team membership | Workspace team panel | `setTeamMembership` mutation | Team lead limited to own team; workspace leads may manage all teams |
| Assign Mission ownership | Team/Mission administration | `assignMissionMember` mutation | Team and existing Mission scope checks; assignment history retained |
| Connect repositories/scopes | Repository settings | repository and code-scope mutations | Workspace repository permission; overlap needs explicit priority and approval policy |
| Dispatch work | WorkOrder control | `dispatch` mutation / orchestration bridge | Record authorization, canonical-scope match, host policy, enforcement receipt |
| Bind an executor | Orchestration service | `bindExecutor` mutation | Server service identity, host validation, enforcement receipt |
| Inspect proof | Attention and WorkOrder drill-down | scoped WorkOrder/Mission queries | Mission → WorkOrder → run → evidence lineage |
| Resolve attention | Attention action | `setAttentionState` mutation | Record-level authorization and audited state change |
| Backfill legacy ownership | Operations runbook | `backfillDeliveryOwnership` mutation | Dry-run default, exact matching only, bounded writes, ambiguity report, audit event |

## Compatibility and rollout

The model is additive. Repository projection, team authorization, role lenses, dispatch scope, and company rollups are independently default-off. Legacy callers continue to use `projectId`, `githubRepo`, and `githubBranch` until their workspace is backfilled and its flags are enabled. See the operations runbook for activation, parity checks, rollback, and fixture cleanup.
