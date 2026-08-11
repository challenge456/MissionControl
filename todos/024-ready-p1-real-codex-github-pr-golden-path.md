---
status: complete
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
- [x] One browser-created Mission reaches a real review-ready sandbox PR with complete evidence and no direct database/script actions.
- [x] Failure, empty, loading, blocked, retry, cancel, and success states are verified.

## Work Log

### 2026-08-02 - Ready after execution-envelope completion

**By:** Codex

**Actions:**

- Confirmed prerequisites 018–023 are complete and tested.
- Kept live GitHub/Codex execution separate from deterministic fixtures; this
  todo requires real GitHub App configuration and an authorized sandbox target.

### 2026-08-07 - Implementation started against MissionControl

**By:** Codex

**Actions:**

- Product Owner approved the complete golden-path sequence while explicitly
  choosing the existing `jaydubya818/MissionControl` repository as the governed
  target; no second repository will be created.
- Started the isolated `codex/real-codex-github-pr-golden-path` branch from the
  synchronized `main` branch.
- Preserved the approved program plan and began auditing the existing execution,
  GitHub App, service-command, and evidence contracts before adding behavior.

### 2026-08-08 - Durable worker and browser states implemented

**By:** Codex

**Actions:**

- Added signed execution claim, heartbeat, event/artifact report, and finalization
  commands backed by an atomic Convex lease and restart checkpoint.
- Added the long-lived `codex/v1` worker with an isolated durable worktree,
  server-owned branch, frozen prompt, sanitized child environment, bounded
  verification commands, cancellation, and lease-loss recovery.
- Added shared changed-file scope enforcement before staging or publication.
  Violations now persist a reviewable policy-deviation event and artifact.
- Added just-in-time GitHub App installation-token minting, in-memory authenticated
  push, and idempotent pull-request lookup/creation without storing the token.
- Added terminal lineage persistence for Mission, approved plan, WorkOrder
  revision, Task, Attempt, Factory version/digest, repository, installation,
  branch, commit, changed files, and pull request.
- Removed the legacy one-shot worker's public-mutation bypass; the script now
  invokes the same signed durable worker for one cycle.
- Added execution lease, phase, commit, pull-request, and durable cancellation
  controls to the run inspector.
- Fixed scheduled mission prompting so generated suggestions are idempotent,
  unassigned `INBOX` intake with suggested-assignee planning context. They no
  longer attempt to enter `READY` before a governed WorkOrder exists.
- Incremented the runtime contract from v4 to v5 for the new public Convex
  commands; the contract guard passes.
- Verified the real browser dispatch/cancel path using local demo run `b398efrx`.
  Cancellation moved the unclaimed Attempt and WorkOrder to `CANCELED`, retained
  the operator reason, and emitted `RUN_CANCELED`.
- Verified desktop, 760 × 900, loading, empty, failed, retry, canceled, completed,
  refresh, and deterministic runtime-error states; durable screenshots and the
  browser log are in `docs/testing/evidence/real-codex-github-pr-golden-path/`.
- Passed the full repository typecheck, production build, full test command,
  runtime-contract guard, 14 focused orchestration tests, 3 focused
  repository-scope tests, and 6 mission-prompt scheduling tests.

**At this checkpoint:**

- The GitHub App manifest uses the minimum required repository permissions:
  Metadata read, Contents write, Pull requests write, and Checks read. The live
  registration/install flow reached GitHub's sign-in screen and stopped there;
  automation did not request or enter owner credentials.
- No second repository was created. The intended installation target remains the
  existing private `jaydubya818/MissionControl` repository.
- Keep every acceptance criterion above open until an authenticated owner installs
  the App and one browser-created, Factory-bound Mission Attempt produces and
  reconciles a real review-ready pull request. Todo 017 remains in progress for
  the same reason.

### 2026-08-09 - Live GitHub App golden path completed

**By:** Codex

**Actions:**

- Registered and installed the private Mission Control GitHub App only on the
  existing private `jaydubya818/MissionControl` repository. Confirmed the exact
  permission grant: Metadata read, Checks read, Contents write, and Pull
  requests write.
- Completed the authoritative recovered chain:
  Mission `vn71r4fwfze37ke4scakt5xt8s8c7eg2` → approved plan
  `vh7a7dxeds8p8nxw7c70rjj19s8c7a88` → WorkOrder
  `kx7sm5meb0d1n9frm3v28aw15s8c7z3d` → Task
  `hn7p4kczscg86e0k6bc8p9n94n8c6zxq` → Attempt 2/run `81n37kb5` → commit
  `2fd0a5a0773560b05174776857545d7cd3bc5f95` → review-ready PR
  [#61](https://github.com/jaydubya818/MissionControl/pull/61).
- Verified PR #61 changes exactly
  `docs/software-factory/live-github-app-proof-recovery.md`, was authored by the
  GitHub App, and has all nine repository checks passing.
- Completed the recovery-state chain on a second browser-operated WorkOrder:
  canceled run `uz2zfs2y`, failed retries `hj8fvx2k` and `tq3574qq`, then
  successful run `d4zexeg5`, commit
  `53aadd7f91d100bc7cc6333ac8f81619b1958879`, and review-ready PR
  [#62](https://github.com/jaydubya818/MissionControl/pull/62).
- Fixed root-attempt branch/worktree inheritance, canceled WorkOrder reopen,
  failed Task retry, approved verification-command projection, Codex child stdin
  closure, and non-terminal graceful worker shutdown. Explicit cancellation
  remains terminal and audited.
- Restarted the orchestration process after real publication and confirmed the
  persisted run/commit/PR lineage reconciles to one existing PR per branch with
  no duplicate creation.
- Verified loading, empty, blocked/error, retry, cancel, success, refresh,
  restart, desktop, and narrow states through the browser. Lifecycle writes in
  the completed flow used the product UI; shell access was limited to services,
  tests, and read-only verification.
- Passed `pnpm run ci:typecheck`, `pnpm run build`, `pnpm run test`,
  `pnpm run ci:runtime-contract`, and all 16 focused orchestration worker,
  publisher, signed-client, and Codex adapter tests.

**Evidence:**

- `docs/testing/evidence/real-codex-github-pr-golden-path/README.md`
- `docs/testing/evidence/real-codex-github-pr-golden-path/recovered-completed-attempt-pr-61.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/github-pr-61-lineage.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/mission-validated-pr-61.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/completed-attempt-pr-62.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/accepted-work-order-pr-62.png`
- `docs/testing/evidence/real-codex-github-pr-golden-path/github-pr-62-lineage.png`

**Deliberate boundary:**

- PRs #61 and #62 remain open and unmerged. Merge and deployment remain explicit
  human decisions outside this execution proof.
