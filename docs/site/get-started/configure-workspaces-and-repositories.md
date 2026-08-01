# Configure company workspaces and repositories

Mission Control organizes software-factory work with three durable boundaries:

1. **Company account** — the people, policies, billing, and governance boundary.
2. **Workspace** — a business, product, or operating portfolio inside the company.
3. **Repository** — a connected source repository used by work orders and agents.

A workspace can have no repository while it is being planned, one repository for a focused product, or several repositories for a broader operating group. Every workspace with repositories has one default repository for compatibility with existing work orders and integrations.

## Select a company account

Mission Control enters a single accessible company automatically. When an
operator belongs to multiple companies, a **Company account** selector appears
above **Workspace** in the sidebar. Changing company clears the previous
workspace before restoring an accessible workspace from the new account.

The selection is stored in the URL and locally for navigation convenience, but
the server authorizes the company again from the authenticated operator
identity. A tenant ID supplied by the browser is never sufficient proof of
membership.

Company administrators can edit the company name, description, and mission on
**Settings → Workspaces & Repositories**. New workspaces created there are
always attached to the selected company.

## Choose the right workspace boundary

Create a separate workspace when the work needs a distinct portfolio view, team structure, governance policy, budget, or operating rhythm. Do not create a workspace merely because code lives in another folder.

Examples:

- `Mission Control` workspace → Mission Control application and orchestration repositories.
- `SellerFi` workspace → SellerFi monorepo plus an infrastructure repository.
- `Software Factory Research` workspace → experimental harness and evaluation repositories.

The current workspace selector remains the primary operating control inside the selected company.

## Connect repositories

Open **Settings → Workspaces & Repositories**, select a workspace, and use **Add repository**.

For each connection, provide:

- GitHub repository in `owner/repository` form
- default branch
- whether it should become the workspace default

The default repository continues to populate the existing workspace repository fields, so current dispatch, validation, webhook, and work-order behavior remains compatible. Additional repositories are additive and do not replace it.

Repository cards show a truthful operating state:

- **Configured** — saved but not yet proven ready
- **Ready** — validation succeeded
- **Degraded** — partially usable and needs attention
- **Error** — validation failed
- **Webhook missing/configured** — event delivery posture

## Model a monorepo with code scopes

Keep a monorepo as one repository connection. Use code scopes to define governed ownership and execution boundaries within it.

Example SellerFi scopes:

| Scope | Included paths | Owner | Execution |
|---|---|---|---|
| Marketplace web | `apps/marketplace/**` | Buyer experience | Local + cloud |
| Deal services | `services/deals/**` | Transactions | Cloud |
| Shared contracts | `packages/contracts/**` | Platform | Local + cloud |

A code scope can define:

- included and excluded paths
- owning team label
- required reviewers
- allowed local or cloud execution
- verification policy

Mission Control rejects overlapping paths by default because unclear ownership creates unsafe dispatch and review behavior. Resolve the boundary before saving. An explicit overlap override exists for governed exceptions.

## Follow setup recommendations

The workspace detail view provides deterministic recommendations instead of generic advice. It calls out the next missing prerequisite, including:

- workspace purpose, owner, or default policy
- repository connection or failed validation
- fleet capacity
- executor checkout registration

When the prerequisites are complete, the view reports that the workspace is ready for governed dispatch. These recommendations are derived from stored configuration; they do not require an LLM.

## Compatibility and migration

Existing workspaces that use the original single `githubRepo` field continue to work. Mission Control presents that repository as a **legacy connection** until an administrator selects **Prepare for code scopes** or runs the idempotent backfill mutation.

The migration is additive:

- existing `projects` records remain the internal workspace records
- existing `projectId` references remain valid
- the default repository is mirrored to the legacy fields
- no repository is silently split into multiple repositories
- code scopes are opt-in

## Current release boundary

This release delivers the company, repository, and monorepo administration foundation. The following remain planned follow-on work:

- production authentication-provider integration and full delivery-function authorization enforcement
- first-class scrum teams and membership
- My Work, Team, Workspace, and Company command-center lenses
- repository-aware work-order targeting and policy enforcement
- capacity, cost, recommendation, and overnight-run controls across the full fleet

See the [company/workspace/repository control-plane SDD](../../plans/2026-07-31-feat-company-workspace-repository-control-plane-plan.md) for the complete phased design.
