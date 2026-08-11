# PR #67 Security and Architecture Review

## Decision

**Go after the fixes in this review pass.** The implementation preserves the
V1 boundary of one governed repository and one durable Codex-to-pull-request
path. Authentication, lease ownership, repository mutation, GitHub publication,
and lineage persistence now fail closed at their material trust boundaries.

Reviewed surfaces include the orchestration HTTP boundary, signed Convex
service commands, execution claims and heartbeats, worktree recovery, approved
file scope, verification commands, Git commit/push behavior, GitHub App token
minting, webhook ingestion, and Mission-to-PR lineage.

## Resolved findings

### SEC-67-01 — High — Verification could mutate publication after the policy scan

- **Evidence:** `durableCodexWorker.ts` staged and scanned the change set before
  executing approved shell commands. A command could change files, the index,
  HEAD, branch, or local Git configuration after that check.
- **Impact:** Published content or Git identity could diverge from the evidence
  recorded as approved.
- **Resolution:** Verification now runs before final staging in an isolated
  temporary home. The worker records and rechecks repository identity, branch,
  HEAD, ancestry, and local Git configuration; recomputes the complete changed
  set; reruns scope enforcement and secret scanning; and only then stages the
  exact final content. Adversarial tests cover history mutation and post-check
  out-of-scope file creation.

### SEC-67-02 — High — New orchestration routes could bypass authentication

- **Evidence:** Authentication middleware covered selected prefixes. Mission
  and approval-decision mutations were outside those prefixes.
- **Impact:** In a production deployment with those routes reachable, an
  unauthenticated caller could attempt governance mutations.
- **Resolution:** Authentication is now default-deny for every route. Only the
  health probe, non-secret gateway status probe, and CORS preflight are explicit
  public exceptions. Bearer comparison uses a timing-safe equality check.

### SEC-67-03 — High — Git hooks or local configuration could intercept publication

- **Evidence:** Verification commands could write local Git configuration or a
  pre-push hook before the installation token was supplied to `git push`.
- **Impact:** A hook, URL rewrite, proxy, credential helper, or executable Git
  filter could redirect publication or expose the ephemeral token.
- **Resolution:** The worker fingerprints local Git configuration, rejects
  executable or transport-affecting settings, disables hooks and credential
  helpers for commit/push, disables system/global Git configuration for push,
  requires TLS verification, validates the GitHub owner/repository identifier,
  and aborts publication if the trusted Git boundary changes.

### SEC-67-04 — Medium — Recovery and verification inputs lacked upper bounds

- **Evidence:** Plan validation required positive retry/runtime values but did
  not cap them; signed lease duration values were not range checked.
- **Impact:** A malformed approved plan or service caller could retain a lease
  or consume execution capacity far beyond the V1 operating envelope.
- **Resolution:** Leases are limited to 10 seconds through 5 minutes;
  implementation attempts to 1–10; runtime to 1–480 minutes; and verification
  policy to 20 commands of at most 1,000 characters each.

### SEC-67-05 — Medium — GitHub publication accepted weak identities and unbounded requests

- **Evidence:** Repository parsing required only one slash, provider repository
  IDs could exceed JavaScript's safe integer range, and GitHub API calls had no
  timeout/cancellation propagation.
- **Impact:** Malformed identities could produce an unintended publication URL,
  and a stuck provider request could delay cancellation or recovery.
- **Resolution:** Repository owner/name and numeric identities are validated,
  expired tokens are rejected, GitHub requests have a 30-second timeout, and
  worker cancellation propagates through token minting, push, and PR creation.

## Architecture assessment

- **Authority separation:** Human plan approval, the orchestration bearer
  credential, signed service capabilities, and the GitHub App installation are
  separate authorities. No browser input can claim the service identity.
- **Lease safety:** Claims are repository-scoped, renewable, attempt-bounded,
  and rejected after expiry or ownership change. Graceful shutdown leaves the
  Attempt recoverable instead of manufacturing a terminal result.
- **Mutation safety:** The exact durable worktree, branch, base ancestry, code
  scope, final staged content, and publication destination are revalidated.
  Push is non-force and PR creation is idempotent for the exact branch/base.
- **Lineage:** Mission, plan, WorkOrder revision, Task attempt, workflow run,
  Factory digest, repository, installation, commit, changed files, and PR are
  persisted before the Attempt becomes complete.
- **V1 scope:** The single-repository worker is the correct reliability target.
  Multi-repository scheduling and hundred-agent fan-out remain deferred.

## Accepted residual risks and required follow-up

1. **Cost is preflight-estimated, not authoritatively reconciled.** The current
   Codex CLI adapter does not return provider-grade actual cost. Runtime and
   retry limits are enforced, and the UI/docs must not describe `maxCostUsd` as
   an actual hard stop until usage receipts exist.
2. **Approved verification remains code execution.** It is intentionally
   authorized by the approved plan. The isolated environment and post-command
   boundary checks protect publication, but the worker host still requires OS
   process isolation and a repository containing no ambient production secrets.
3. **Secret scanning is defense in depth.** It detects known token/private-key
   patterns and rejects oversized changed files; it is not a replacement for
   GitHub secret scanning, review, or organization policy.
4. **Executor events are buffered until Codex exits.** Lease/cancellation state
   stays live, but unified streaming review evidence belongs in the next
   operational-hardening phase.

These residual items do not expand publication authority and do not block this
single-path V1 merge. They must be visible in operational guidance and the
hardening backlog.
