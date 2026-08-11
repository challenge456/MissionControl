# Durable Codex-to-GitHub Pull Request Worker

## Purpose

This is the single V1 mutation path from an approved Mission Task Attempt to a
review-ready GitHub pull request. It targets the repository already bound to
the active Factory; it does not create repositories, merge pull requests, or
deploy code.

## Authoritative flow

`Mission → approved plan → released WorkOrder → Task → workflowRun Attempt → Factory version → Git commit → pull-request artifact`

Dispatch freezes the repository, code scopes, worktree, branch, executor,
model, tool list, timeout, budget, Factory digest, and current WorkOrder
revision. The durable worker then:

1. Claims one `PENDING` `codex/v1` Attempt through a signed service command and
   records a renewable lease.
2. Revalidates current Mission, WorkOrder, Factory assessment, policy, host,
   repository, scope, and GitHub App readiness.
3. Creates or recovers the exact linked worktree and server-owned branch.
4. Runs Codex with the frozen request and a credential-free environment.
5. Computes the complete committed and uncommitted Git change set.
6. Blocks publication and records a policy-deviation artifact if any path is
   outside or excluded by the approved repository scopes.
7. Runs every approved verification command and fails closed when no command
   is bound.
8. Commits the exact staged change set, mints a repository-scoped installation
   token, pushes the exact branch, and finds or creates the pull request.
9. Persists commit, pull request, changed files, installation identity, and the
   complete Mission-to-Factory lineage before marking the Attempt complete.

The GitHub installation token is held only in worker memory during push and PR
publication. Codex never inherits the App private key, installation token,
service-command secret, or Convex service credential.

## Recovery and idempotency

The worker heartbeats before and during execution, validation, and publication.
It closes the Codex child process stdin immediately after launch so the CLI can
resolve the argv prompt instead of waiting on the long-lived server input.
If the process exits, the durable worktree and branch remain. When the lease
expires, another worker can reclaim the same Attempt and:

- continue partial work without resetting it;
- reuse an existing local commit;
- safely repeat a non-force push;
- reuse the open PR for the exact head branch; and
- finalize an already-published identity without creating a duplicate PR.

Graceful process shutdown aborts only the local child process. It does not mark
the Attempt canceled; the run remains non-terminal until its lease expires and
the same or another worker reclaims it. Only an explicit operator cancellation
request produces a terminal `CANCELED` Attempt.

An Attempt stops after its Factory recovery limit. Operator cancellation is a
durable field on the Attempt. Unclaimed work cancels immediately; active Codex
execution receives an abort signal after the next signed heartbeat.
A canceled Work Order remains terminal until an authorized operator explicitly
reopens it. Reopening restores only the Task owned by the latest canceled
Attempt to `READY`; a reasoned retry then creates a new immutable Attempt while
preserving the canceled Attempt in the lineage.

Verification commands are frozen into the claim from the narrowest approved
source: Work Order implementation policy, then policy-envelope commands, then
constraints explicitly labeled `Verification command:`. Unlabeled prose is
never promoted into an executable command.

## Runtime configuration

The App must be installed only on the selected existing repository with this
permission envelope:

- Metadata: read
- Contents: write
- Pull requests: write
- Checks: read

Required configurable webhook events are `check_run`, `pull_request`, and
`pull_request_review`. GitHub delivers `installation` and
`installation_repositories` to every GitHub App automatically; those lifecycle
events cannot be manually selected.

Set these on the orchestration runtime:

```text
CODEX_FACTORY_WORKER_ENABLED=true
CODEX_WORKER_PROJECT_ID=<Convex project ID>
CODEX_WORKER_REPOSITORY_ID=<Convex workspaceRepositories ID>
CODEX_WORKER_REPOSITORY_ROOT=<absolute local checkout>
CODEX_WORKER_ID=codex-worker:<host identity>
MISSION_CONTROL_SERVICE_ID=orchestration-server
MISSION_CONTROL_SERVICE_COMMAND_SECRET=<server-only HMAC secret>
GITHUB_APP_ID=<bound GitHub App ID>
GITHUB_APP_PRIVATE_KEY=<server-only PEM>
```

Configure the same service ID and HMAC secret on the Convex deployment. Keep
all credentials out of `VITE_*` variables. The worker intentionally handles one
repository in V1; repository scheduling and hundred-agent fan-out wait until
this path has complete browser and restart evidence.

## Operator-visible states

The Execution Run Inspector shows the worker, phase, last heartbeat, base/head
commit, cancellation request, and pull-request identity. Its explicit states
are:

- loading while the live Attempt projection resolves;
- awaiting claim when no lease exists;
- running with phase and heartbeat evidence;
- cancellation requested while the worker aborts;
- failed or policy-blocked with immutable evidence and bounded retry;
- canceled with the reason preserved; and
- completed with a clickable PR number, URL, and commit lineage.

## Fail-closed conditions

No branch push or PR request occurs when the GitHub App is absent or stale,
Factory readiness expired, the host is dirty/stale, governance changed after
dispatch, code scope is incomplete, a changed file violates scope, no approved
verification command exists, a verification command fails, budget estimate is
over limit, cancellation is requested, or the lease is lost.
