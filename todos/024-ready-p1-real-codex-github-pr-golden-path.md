---
status: in_progress
priority: p1
issue_id: "024"
tags: [software-factory, codex, github-app, pull-request, golden-path, browser]
dependencies: ["023"]
---

# Execute the Real Codex-to-GitHub Pull Request Golden Path

## Problem Statement

Mission Control now has a signed service boundary, active Factory gate, exact
attempt binding, and `codex/v1` runtime contract, but the orchestration loop does
not yet claim a bound pending attempt, allocate the worktree/branch, run Codex,
validate changed-file scope, push with an ephemeral GitHub App token, and persist
the exact pull-request artifact.

## Recommended Action

Wire one durable orchestration worker from bound WorkflowRun to `codex/v1`, emit
events through authenticated commands, enforce the approved path/deviation gate,
mint a short-lived installation token only at the provider boundary, create the
branch and pull request through the GitHub App, and persist exact lineage without
storing credentials. Prove it from the browser against an authorized sandbox
repository.

## Acceptance Criteria

- [x] A bound pending Mission attempt is claimed once with a durable lease.
- [x] The executor allocates the bound worktree and server-owned branch, then runs `codex/v1` with the frozen prompt, model, tool, timeout, and path scope.
- [x] Ordered execution events and artifacts arrive only through signed service commands.
- [x] Changed files outside approved code scopes block PR creation and create a reviewable deviation.
- [x] A short-lived GitHub App installation token is minted just in time and never stored or logged.
- [x] Branch push and PR creation are idempotent and use exact repository/install identity.
- [x] The PR artifact binds Mission, plan/revision, WorkOrder/revision, Task, attempt, Factory version/digest, repository, branch, head SHA, PR number/URL, and changed files.
- [x] Refresh/restart preserves the run and resumes or reconciles without duplicate PRs.
- [ ] One browser-created Mission reaches a real review-ready sandbox PR with complete evidence and no direct database/script actions.
- [ ] Failure, empty, loading, blocked, retry, cancel, and success states are verified.

## Work Log

### 2026-08-02 - Ready after execution-envelope completion

**By:** Codex

**Actions:**

- Confirmed prerequisites 018–023 are complete and tested.
- Kept live GitHub/Codex execution separate from deterministic fixtures; this
  todo requires real GitHub App configuration and an authorized sandbox target.

### 2026-08-08 - Runtime implementation started

**By:** Codex

**Actions:**

- Confirmed Product Owner approval to proceed with the recommended autonomous
  factory hardening sequence.
- Started with the existing real Codex-to-GitHub golden-path todo and preserved
  unrelated Research Lab worktree changes.
- Began mapping the current orchestration, signed service-command, GitHub App,
  execution-evidence, worktree, and pull-request boundaries before editing the
  runtime.

**Learnings:**

- The next safe increment is one durable leased worker over the existing
  Mission -> WorkOrder -> Task -> WorkflowRun hierarchy, not another run model.
- Follow-on execution-manifest and bounded-context work will be tracked
  separately so the golden-path change stays reviewable.

### 2026-08-08 - Deterministic runtime complete; live proof blocked

**By:** Codex

**Actions:**

- Added signed claim, lease renewal, and terminal reporting commands with replay
  protection and exact Factory/run/repository/host binding.
- Added a disabled-by-default orchestration worker that reconciles isolated
  worktrees, enforces frozen path scopes, executes `codex/v1`, commits, pushes,
  and creates or reuses the exact GitHub pull request.
- Restricted GitHub App tokens to the bound repository, kept the token out of
  URLs/arguments/artifacts/logs, and persisted complete pull-request lineage.
- Retired unauthenticated run event/artifact ingestion and excluded Factory
  attempts from the legacy workflow executor to prevent competing consumers.
- Verified deterministic claim/reclaim, restart reconciliation, path deviation,
  Git behavior, GitHub App identity, signed ingress, build, lint, typechecks,
  and the browser-operable Factory configuration surface.

**Remaining:**

- The local environment does not provide the service-command secret, GitHub App
  id/private key, orchestration API token, or enabled Factory worker. A real
  browser-created sandbox PR and the complete live retry/cancel/success state
  matrix therefore remain intentionally unverified.

### 2026-08-08 - Live sandbox setup resumed

**By:** Codex

**Actions:**

- Generated distinct service-command and orchestration API secrets locally and
  stored them in the ignored `.env.local` file with owner-only permissions.
- Corrected the local Convex deployment-name mismatch introduced by the earlier
  backend upgrade attempt and synced the service-command secret to the preserved
  local deployment without deleting or reseeding data.
- Confirmed the database integrity check passes and identified a stale Convex
  export retry as the cause of slow local backend startup.
- Rotated the local-only Convex instance/admin credential pair after diagnostic
  process output exposed the prior instance secret; the backend remained stopped
  and bound only to localhost throughout the repair.
- Verified that the saved GitHub CLI token is invalid and the in-app GitHub
  session is signed out. Left the GitHub sign-in page open as a user handoff.

**Remaining:**

- User GitHub authentication is required before the private sandbox repository
  and GitHub App can be created/installed. GitHub credentials will not be
  requested or handled by the agent.

### 2026-08-09 - Real GitHub App pull request published and accepted

**By:** Codex

**Actions:**

- Reused the installed `Mission Control Factory JayWest` GitHub App with exact
  repository-scoped permissions for `jaydubya818/MissionControl`.
- Activated Factory version `qx73v67t0kteazq727n4b6rx0d8c2aqq` after all nine
  readiness checks passed for the repository, host, policy, verifier, workflow,
  budget, and recovery bindings.
- Diagnosed the first live Attempt hanging in `codex exec` while reading piped
  stdin and corrected the orchestration adapter to close the child process stdin
  immediately after spawn; the focused adapter suite passes.
- Preserved the failed Attempt, created a recovery Mission, and verified fail-
  closed behavior when the released WorkOrder omitted its explicit verification
  policy.
- Applied audited WorkOrder revision 2 with `git diff --check`, retried the exact
  Task in the same durable worktree, and observed the registered worker claim the
  Attempt once.
- Verified the worker changed only
  `docs/software-factory/live-github-app-proof-recovery.md`, ran
  `git diff --check` with exit code 0, committed SHA
  `2fd0a5a0773560b05174776857545d7cd3bc5f95`, pushed branch
  `mc/8aw15s8c7z3d`, and opened review-ready pull request #61 through the GitHub
  App without merging it.
- Recorded the command and pull-request artifacts as a passing verification
  receipt, accepted the WorkOrder, approved the child Task, and recorded the
  structured Mission handoff.
- Browser-verified the WorkOrder as `DONE` / `PASS`, the complete retry and
  lifecycle evidence, and the open bot-authored pull request with one changed
  file and all GitHub checks passing.

**Remaining:**

- The recovery required direct control-plane mutations because the Mission UI
  could not start an approved released plan, did not carry the WorkOrder
  implementation policy, and could not reconcile a non-independent Worker
  receipt into the Mission assertion. The browser-only acceptance criterion
  therefore remains open.
- GitHub webhook deliveries are signature-verified and persisted, but PR/check
  evidence ingestion fails on API URL normalization and an unauthenticated or
  under-authorized follow-up GitHub API lookup. Tracked separately in todo 030.
- The full loading, empty, cancel, and success browser-state matrix remains open.

**Evidence:**

- Pull request: <https://github.com/jaydubya818/MissionControl/pull/61>
- WorkflowRun: `m97skgb9r5rgc013rgdkph1gv58c728q` (`81n37kb5`)
- WorkOrder revision: `kn7pf1rh1w1r5vdre1e6y972bh8c7n0r` (r2)
- Passing verification receipt: `jx7j62bzb6cw99rk3b49sesrw98c6stm`
- Complete Mission handoff: `vd789pg8rz0hf6xtgvfevwhk858c6ka2`
