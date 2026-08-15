---
title: Worker Runtime Ownership and Recovery Adversarial Review
status: in-progress
date: 2026-08-15
review_base_sha: 78a090b576810748676336a2afe5cdc19eccc42d
candidate_head_sha: a36c8da0d35659d1c835d4723b2ce2c5b9d13be9
runtime_contract: v22
---

# Worker Runtime Ownership and Recovery Adversarial Review

## Scope

This is the final release-blocking architecture and security review for PR #102.
It challenges lease fencing, admission capacity, process ownership, worktree
cleanup, recovery, authority separation, and legacy rollout behavior. It does
not authorize merge or add remote worker infrastructure.

## Blocking findings

1. Active leases were fenced by their stored worker tuple, but renew, report,
   and publication did not re-check that the tuple was still the current host
   registration. A replacement session could register while the prior session
   retained authority until lease expiry.
2. Admission counted active leases only in the candidate repository and current
   session. A stable worker used across repository bindings could exceed its
   global slot limit, and a replacement session could overlap a still-active
   prior-session lease.
3. Expired legacy execution leases could still reclaim the same Attempt because
   LOST reconciliation was limited to hardened claims. Active legacy leases
   must remain usable, but expired or missing execution ownership must not.
4. Worktree cleanup compared canonical paths relative to a canonicalized
   worktree root without proving that the root itself remained inside the real
   checkout. A symlinked `.mission-control/worktrees` directory could escape
   the approved checkout. Origin normalization also ignored the Git host.
5. The Codex executor inherited the orchestration server environment, including
   service-command and GitHub App secrets. Its AbortSignal terminated only the
   direct child rather than an owned process group.
6. Process start records could be overwritten, and pull-request artifact
   idempotency did not reject cross-Attempt collisions or enforce exact GitHub
   repository lineage.

## Required corrections

- Re-check the current server registration for every hardened lease mutation.
- Count all unexpired leases for the stable worker ID in one serializable claim
  transaction; never use reported occupied slots as authority.
- Mark every expired or missing execution-stage lease LOST, including legacy
  runs, while keeping unexpired legacy leases readable and writable.
- Reject lease-ID reuse during publication recovery.
- Prove canonical worktree-root containment, reject symlinked roots, require an
  exact GitHub origin, and preserve on every ambiguity.
- Allow one process start per ownership manifest, run the executor in a
  dedicated process group, terminate that group on cancellation/timeout, wait
  for active shutdown, and pass only an explicit non-control-plane environment.
- Scope idempotent artifacts to the exact Attempt and validate exact GitHub App
  publication lineage before terminal completion.

## Release gate

The review becomes accepted only after focused and full tests, lint, TypeScript,
runtime-contract guard, production build, orchestration smoke, and remote PR
checks pass from a branch refreshed onto the exact latest `origin/main`.
