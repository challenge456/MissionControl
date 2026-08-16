---
title: Worker Runtime Leases and Recovery
status: accepted
date: 2026-08-15
decision: Extend the existing Factory Attempt runtime with session-fenced workers and fail-closed workspace ownership
---

# Worker Runtime Leases and Recovery

## Context

Mission Control already has the authoritative WorkOrder/Attempt, verification,
acceptance, evidence, GitHub publication, and release boundaries. Its current
Factory worker has a sound service-authenticated lease but does not distinguish
the orchestration service from a stable worker and restart session. It also
does not freeze the base SHA or persist enough local ownership state to prove
that a worktree and executor process can be safely reused or removed.

## Decision

Extend the current runtime instead of creating a separate worker control plane.

1. `workspaceHostBindings` remains the scoped worker registration record. Its
   additive runtime snapshot describes stable worker ID, server-derived
   generation, session ID, host/backend type, supported executors, sandbox
   capabilities, repository access, slots, readiness/draining, and heartbeat.
2. `workflowRuns.lease` remains the Attempt lease. New leases bind to the
   registered worker ID/session/generation as well as the authenticated service
   owner and random lease ID.
3. Capability and capacity checks happen in the same Convex mutation that
   acquires the lease. A current lease is the only worker mutation fence.
4. The exact base SHA and provider-neutral execution requirements are frozen in
   `factory-execution-manifest/v1`; changing compute providers does not change
   WorkOrder or Attempt identity.
5. A durable ownership manifest lives outside the agent-writable worktree. It
   records repository, Attempt, worker, session, lease, branch, exact path,
   execution-manifest digest, base SHA, process lifecycle, publication proof,
   and cleanup outcome.
6. Expired execution leases are not reclaimed on the same Attempt, even in the
   same session, because the control plane cannot independently prove local
   process state. A publication-only checkpoint may transfer sessions after
   protected-manifest, terminated-process, clean-tree, and exact-candidate
   revalidation. All other lease loss becomes `LOST`, preserves the workspace,
   and requires a new Attempt.
7. Automatic cleanup uses `git worktree remove` without `--force` only after
   complete ownership, clean-tree, exact published-head, and process-termination
   proof. Every uncertainty returns `PRESERVED`.
8. Current-state heartbeats are overwritten in place. Durable history records
   only meaningful lifecycle transitions.

## Runtime dispositions

| Disposition | Meaning | Next action |
| --- | --- | --- |
| `RETRYABLE` | Work has not started or a terminal failure permits governed retry | Create/claim a new bounded Attempt |
| `RECOVERABLE` | Active ownership remains current, or a publication-only checkpoint has complete recovery proof | Continue the current lease or reclaim publication with an explicit recovery event |
| `LOST` | Lease expired and prior process/workspace ownership cannot be proven | Preserve workspace; close old Attempt; create new lineage |
| `CANCELLED` | Operator cancellation is durable and executor termination reconciled | Preserve history; retry only through an explicit new Attempt |
| `FAILED` | Executor or runtime failed while ownership remained known | Preserve evidence; retry according to policy |

## Alternatives rejected

- New Worker/Work/Target/Attempt tables that duplicate Mission Control's
  hierarchy.
- Treating the shared orchestration service ID as worker identity.
- Resuming unknown work solely because a lease expired.
- Deleting a worktree by name/path convention or with forced/global cleanup.
- Giving a worker GitHub, verification, acceptance, merge, or release authority.
- Deploying any remote compute or inbound worker listener in this initiative.

## Consequences

- The host-report public Convex validator gains optional runtime registration
  fields, so this is a real additive public contract delta and requires one
  runtime-contract increment after the extractor confirms it.
- Cross-session recovery is deliberately conservative. Some work that could be
  manually salvaged will remain preserved and require an operator retry.
- No UI is required for the first slice. Operators continue using existing run,
  evidence, and host surfaces; runtime lifecycle appears in canonical events.
- Remote enrollment remains an interface design until capacity, credential
  vending/revocation, tenant authorization, and network exposure are separately
  approved.
