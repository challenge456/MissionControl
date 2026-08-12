# Company Control Plane Rollout Runbook

## Preconditions

- A company account and active operator role exist.
- Each workspace has `tenantId` populated.
- Convex schema and functions are deployed before any control-plane flag is enabled.
- The orchestration server has `CONVEX_URL`. For authenticated production calls, configure a server-only `CONVEX_SERVICE_AUTH_TOKEN` for a mapped, least-privileged Convex operator.

Never put the service JWT in a `VITE_*` variable.

Before an executor can bind enforced work, its service identity must report a fresh, non-secret-bearing attestation:

```bash
pnpm exec convex run workspaceHostBindings:report '{"projectId":"<workspace-id>","hostId":"<host-id>","repository":"owner/repo","checkoutRoot":"<absolute-host-path>","dirty":false,"status":"READY","runtime":"node-22","approvedModelIds":["<model-id>"],"networkPolicyStatus":"READY","secretPolicyStatus":"READY","maxConcurrentRuns":4,"currentRuns":0,"attestedAt":<unix-ms>}'
```

The attestation records readiness states and approved model identifiers, never secret values. Refresh it at least every 15 minutes and whenever repository, runtime, network, secret policy, model eligibility, or capacity changes.

## Migration and verification

Backfill one workspace at a time:

```bash
pnpm exec convex run projects:backfillLegacyRepositories '{"projectId":"<workspace-id>"}'
pnpm exec convex run softwareFactoryControlPlane:getRepositoryParityReport '{"tenantId":"<company-id>","projectId":"<workspace-id>"}'
pnpm exec convex run softwareFactoryControlPlane:backfillDeliveryOwnership '{"tenantId":"<company-id>","projectId":"<workspace-id>","apply":false}'
```

The repository backfill is idempotent and reports `migrationVersion: 1` plus created, existing, skipped, and failed counts. Do not enable repository projection unless the parity report has zero mismatches.

Ownership migration defaults to dry-run and only accepts exact, unique active member/team matches. Resolve every `AMBIGUOUS` or `UNRESOLVED` review row before applying it. Apply in bounded batches and repeat until `wouldUpdate` and `deferredByWriteLimit` are both zero:

```bash
pnpm exec convex run softwareFactoryControlPlane:backfillDeliveryOwnership '{"tenantId":"<company-id>","projectId":"<workspace-id>","apply":true,"writeLimit":100}'
```

The migration never guesses, never deactivates a conflicting owner assignment, and audits every applied batch.

## Flag activation order

Control-plane flags must be workspace-scoped; global writes are rejected. Enable them in this order:

```bash
pnpm exec convex run featureFlags:setFlag '{"key":"control-plane.repository-projection","enabled":true,"projectId":"<workspace-id>","actorId":"<operator-id>"}'
pnpm exec convex run featureFlags:setFlag '{"key":"control-plane.role-lenses","enabled":true,"projectId":"<workspace-id>","actorId":"<operator-id>"}'
pnpm exec convex run featureFlags:setFlag '{"key":"control-plane.company-rollups","enabled":true,"projectId":"<workspace-id>","actorId":"<operator-id>"}'
pnpm exec convex run featureFlags:setFlag '{"key":"control-plane.team-authorization","enabled":true,"projectId":"<workspace-id>","actorId":"<operator-id>"}'
pnpm exec convex run featureFlags:setFlag '{"key":"control-plane.dispatch-scope","enabled":true,"projectId":"<workspace-id>","actorId":"<operator-id>"}'
```

Before the final two flags, confirm every active Mission and WorkOrder has stable team, owner, repository, and code-scope fields. Treat legacy compatibility receipts as migration debt.

## Scale fixture

An idempotent fixture creates two business workspaces, five Scrum teams and twenty-five developers per workspace, five Missions per developer, representative local/cloud runs, approvals, and failures:

```bash
pnpm exec convex run softwareFactoryControlPlane:seedScaleFixture '{"tenantId":"<company-id>"}'
pnpm exec convex run softwareFactoryControlPlane:removeScaleFixture '{"tenantId":"<company-id>"}'
```

Removal targets only fixture-tagged workspaces and their dependent assignments, runs, approvals, dispatch receipts, attention states, repositories, scopes, teams, members, WorkOrders, and Missions.

## Operational checks

- Command Center exposes only role-appropriate My, Team, Workspace, and Company lenses.
- Repository and code-scope filters survive refresh and reject cross-workspace IDs with a recoverable reset action.
- A developer cannot read or mutate another team's delivery records.
- A dispatch cannot retarget a WorkOrder's canonical repository, team, owner, or code scopes.
- A cross-code-scope dispatch shows the union of owning teams, reviewers, approval policies, and verification policies; applicable approval policies block dispatch until satisfied.
- Local dispatch without a ready host binding produces a denied enforcement receipt and no workflow run.
- Executor binding revalidates environment, host checkout, declared runtime, model-routing decision, team concurrency, run budget, stop condition, checkpoint, and escalation owner.
- Company is read-oriented: drill-down changes the visible workspace scope before any workspace mutation is offered.
- Company totals equal the sum of accessible workspace totals; inaccessible workspace counts are not leaked.
- Browser console is clean at desktop, compact width, and 200% zoom.

## Rollback

Disable flags in reverse order, workspace by workspace:

1. `control-plane.dispatch-scope`
2. `control-plane.team-authorization`
3. `control-plane.company-rollups`
4. `control-plane.role-lenses`
5. `control-plane.repository-projection`

Disabling flags restores legacy behavior without deleting new records. Keep repository connections and code scopes intact until parity has remained healthy through the observation window. Data deletion is not part of rollback.
