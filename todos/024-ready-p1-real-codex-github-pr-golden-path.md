---
status: ready
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

- [ ] A bound pending Mission attempt is claimed once with a durable lease.
- [ ] The executor allocates the bound worktree and server-owned branch, then runs `codex/v1` with the frozen prompt, model, tool, timeout, and path scope.
- [ ] Ordered execution events and artifacts arrive only through signed service commands.
- [ ] Changed files outside approved code scopes block PR creation and create a reviewable deviation.
- [ ] A short-lived GitHub App installation token is minted just in time and never stored or logged.
- [ ] Branch push and PR creation are idempotent and use exact repository/install identity.
- [ ] The PR artifact binds Mission, plan/revision, WorkOrder/revision, Task, attempt, Factory version/digest, repository, branch, head SHA, PR number/URL, and changed files.
- [ ] Refresh/restart preserves the run and resumes or reconciles without duplicate PRs.
- [ ] One browser-created Mission reaches a real review-ready sandbox PR with complete evidence and no direct database/script actions.
- [ ] Failure, empty, loading, blocked, retry, cancel, and success states are verified.

## Work Log

### 2026-08-02 - Ready after execution-envelope completion

**By:** Codex

**Actions:**

- Confirmed prerequisites 018–023 are complete and tested.
- Kept live GitHub/Codex execution separate from deterministic fixtures; this
  todo requires real GitHub App configuration and an authorized sandbox target.
