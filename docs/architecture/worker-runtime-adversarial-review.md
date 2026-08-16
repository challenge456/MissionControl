---
title: Worker Runtime Ownership and Recovery Adversarial Review
status: accepted
date: 2026-08-15
review_base_sha: 376505033ac1de56415a33305ba7e20696230d9f
reviewed_code_sha: e629601d852d1b0a3c7e6e5fc8f59f6b0a85abe7
runtime_contract: v23
---

# Worker Runtime Ownership and Recovery Adversarial Review

## Scope

This is the final release-blocking architecture and security review for PR #102.
It challenges lease fencing, admission capacity, process ownership, worktree
cleanup, recovery, authority separation, and legacy rollout behavior. It does
not authorize merge or add remote worker infrastructure.

The review began from runtime `v21`, but `origin/main` advanced during the
review to `376505033ac1de56415a33305ba7e20696230d9f` and runtime `v22` through
Factory Memory PR #100. The branch was rebased onto that exact commit. The
worker host-report change remains the only public delta, so this candidate is
runtime `v23`.

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

The architecture and security review is accepted after the following local
gates passed from a branch refreshed onto the exact latest `origin/main`:

- focused worker/runtime suites: 55 tests passed;
- full repository suites: all enabled tests passed (one pre-existing optional
  orchestration integration test remained skipped);
- lint and full-workspace TypeScript: passed;
- runtime-contract guard: passed with only `workspaceHostBindings:report`
  changing from `v22` to `v23`;
- production build: passed;
- orchestration startup smoke: passed;
- `git diff --check`: passed.

The release commits on top of `reviewed_code_sha` contain this review record,
the runtime version bump, aligned operations/todo documentation, direct POSIX
process-group signaling without an external `/bin/kill` dependency, and a
Linux-portable process-tree assertion that treats a reparented zombie as
terminated rather than runnable. GitHub CI and Vercel must still pass on the
exact pushed head before the PR is changed from draft to ready. This review does
not authorize automatic merge.
