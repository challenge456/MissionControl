# Baked Codex inner-sandbox root cause

## Frozen local exact-image cohort

The first local cohort used image `mc-remote-final-blocker@sha256:88e1dda3be0324fcb2c156000491a10a0003315e4ca4f46c8a3d9bb2e3af82b3`, the production restricted bootstrap, production supervisor, baked Codex CLI 0.146.0, real Attempt-scoped OpenRouter keys, and the frozen bug-fix, security/policy, and migration fixtures.

Result: 0/3 first-pass, zero retries, final container inventory 0.

Unlike the prior live failure, each supervisor stayed alive, spawned Codex, observed the first Codex event, received an exit status of 0, validated a structured result, wrote diagnostics, and atomically published a result bundle. The `SUPERVISOR_EXITED_BEFORE_RESULT` signature did not recur.

Every workload returned `BLOCKED` because every Codex shell command failed with:

```text
bwrap: No permissions to create a new namespace, likely because the kernel does not allow non-privileged user namespaces.
```

Raw per-Attempt events, timings, structured results, security proofs, cleanup receipts, and zero-inventory proof are preserved in `local-3-workload-gate.json`.

## Root cause

The remote Codex invocation requested Codex's `workspace-write` sandbox. On Linux, Codex 0.146.0 implements this boundary with bubblewrap/user namespaces. The hardened workload correctly runs as UID/GID 10001 with `no_new_privs` and every capability set empty. The environment does not permit the unprivileged namespace creation bubblewrap requires, so Codex could call the model but could not inspect, edit, or test the repository.

This is independent from the previous BusyBox `kill` defect. It appears only after the supervisor liveness false-negative is removed.

## Minimal remediation

Do not add capabilities and do not enable new kernel namespaces. For remote-sandbox invocations only, select Codex `danger-full-access` mode so it does not create a redundant inner bubblewrap sandbox. This is the Codex CLI's mode for execution inside an externally enforced sandbox; it is not Guarded Auto and does not change approval policy.

The authoritative outer controls remain unchanged:

- dedicated disposable Attempt VM/container and writable repository workspace;
- non-root UID/GID 10001;
- `no_new_privs` and empty inheritable, permitted, effective, bounding, and ambient capability sets;
- protected system paths not writable;
- package managers/installers absent;
- guest nftables default deny with only OpenRouter HTTPS allowed;
- only the Attempt inference credential in the workload environment;
- changed-file scope validation before candidate eligibility;
- exact credential revocation and exact resource teardown.

The remote adapter must not use `--dangerously-bypass-approvals-and-sandbox`; approval remains `never`, and only the redundant Codex sandbox mode changes.
