# Human and service authorization matrix

This inventory prevents a blanket human-authentication change from breaking
overnight agents, schedulers, webhooks, and receipt ingestion. It is the
boundary for incremental server enforcement.

## Enforcement status

| Domain | Representative public functions | Current callers | Authority | Status / next action |
| --- | --- | --- | --- | --- |
| Company context | `companyContext.listCompanies`, `getCompanyContext`, `updateCompany`, `createWorkspace` | Human UI | Exact Clerk membership plus named company permission; explicit local demo adapter | Enforced in this slice |
| Company members | `companyMembers.list`, `create`, `setRoles`, `setActive`, `ensureDefaultRoles` | Human UI | `members.manage`; last-owner and same-company invariants | Enforced in this slice |
| Tenant/operator registry | `registry/tenants.*`, `registry/operators.*` | Administration and legacy tools | Company membership or named administration permission | Enforced in this slice; tenant provisioning remains platform-controlled |
| Roles and assignments | `governance/roles.*`, `governance/roleAssignments.*` | Human administration | Company access or `members.manage`; role/operator tenant equality | Enforced in this slice |
| Mission planning | `missions.createDraft`, `updateDraft`, `savePlanDraft`, `submitPlan`, `approvePlan`, `start`, `accept` | Human UI | Future: workspace access plus `missions.write`/`missions.approve` | Public surface inventoried; enforcement is the next delivery-security slice |
| Work orders | `workOrders.create`, `dispatch`, governance decisions, revision/acceptance mutations | Human UI, automation scheduler, Pi bridge, mission chat, loop engineering | Split required: human workspace permission versus service capability | Do not blanket-guard; migrate service callers to internal/service functions first |
| Tasks | `tasks.create`, `update`, `assign`, `transition`, `linkToWorkOrder` | Human UI, GitHub ingest, planning, chat, loops, WorkOrder flows | Split required: human task permission versus scoped service capability | Do not blanket-guard; add internal command functions and retain audited actor provenance |
| Approvals | `approvals.request`, `approve`, `deny`, expiration/escalation | Human UI and cron | Human `approvals.decide`; internal scheduler for expiry/escalation | Split decision mutations from internal lifecycle automation |
| Evidence/receipts | WorkOrder verification receipt and Pi receipt packet paths | Human UI and orchestration/Pi bridge | Humans may attach evidence; services require signed/scoped ingestion authority | Preserve Pi flow; move ingestion behind service authentication before public exposure |
| Release/writeback | GitHub/writeback and future release mutations | Human approval and service integration | Approved human decision plus installation/service credential | Require approval linkage, idempotency, and audited integration identity |

## Rules for the follow-on delivery-security slice

1. Resolve `projectId` to its tenant and authorize that relationship on the
   server; never infer authority from a client-selected project alone.
2. Keep public mutations for browser actions small and permission-specific.
3. Move cron, scheduler, bridge, webhook, and agent-to-agent calls to
   `internalMutation`/`internalAction` or a separately authenticated service
   command boundary before requiring Clerk on the equivalent human mutation.
4. Preserve `actorType`, actor ID, source, attempt, and evidence provenance on
   every automated transition.
5. Add denial and cross-tenant tests before changing a domain from inventoried
   to enforced.
6. Do not expose global list queries to ordinary company users; require company
   or workspace scope.

This matrix deliberately limits the current change to company/workspace
administration. Mission, WorkOrder, Task, approval, evidence, and release
authorization should be implemented as one tested golden-path security slice,
not as scattered checks that strand service execution.
