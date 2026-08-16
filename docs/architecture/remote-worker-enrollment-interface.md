---
title: Remote Worker Enrollment Interface
status: proposed
date: 2026-08-15
implementation: interface-only
---

# Remote Worker Enrollment Interface

## Decision boundary

This document defines a future interface. This initiative does not add a
public listener, mint a new credential, deploy a worker, purchase capacity,
provision a VM, or change the current service authentication path.

## Proposed exchange

1. An authorized workspace administrator creates a one-time, short-lived,
   repository-scoped bootstrap grant. Store only its digest, scope, expiry,
   creator, and unused/revoked state.
2. A worker generates its stable worker ID locally and sends the bootstrap
   grant, worker ID, public credential material, runtime type, and requested
   repository scopes over an authenticated outbound HTTPS request.
3. The server atomically consumes the one-time grant and returns a narrow,
   revocable worker credential plus non-secret worker registration ID. The
   credential permits only registration, outbound polling, claim, renewal,
   cancellation observation, and lease-fenced reporting for its exact tenant,
   project, and repositories.
4. The worker starts a new random session on every process start. The server
   increments generation and records the bounded capability snapshot.
5. The worker polls outbound. Developer machines require no inbound public
   port. Capability changes are server-validated and cannot broaden the
   credential's repository scope.
6. Revocation immediately blocks registration, claim, renewal, and report.
   Existing leases expire normally or are explicitly canceled by the control
   plane; possession of a local lease ID does not bypass revocation.

## Credential and authority invariants

- Bootstrap grants are one-time and short-lived; worker credentials are
  narrow, rotatable, and revocable.
- Raw bootstrap grants and worker credentials are never stored in Convex,
  run events, traces, artifacts, ownership manifests, logs, or lease fields.
- Stable worker ID is not authentication. Session ID is not authentication.
  Lease ID is not authentication.
- Enrollment cannot grant WorkOrder acceptance, Verification independence,
  Verification Subject creation, GitHub publication credentials, merge,
  deployment, production access, or repository scope beyond the server-issued
  credential.
- Registration is an assertion constrained by server-side authorization.
  Claim remains the atomic capability/capacity/lease decision.

## Provider-neutral registration shape

```text
worker_id
session_id
server_derived_generation
host_runtime_type
execution_backends[]
supported_executors[{adapter, version, cancel, resume, isolation_modes[]}]
sandbox_capabilities[]
repository_access[{repository_id, READ|READ_WRITE}]
slots{total, occupied_server_derived}
readiness{STARTING|READY|DRAINING|BLOCKED}
last_heartbeat_at
```

Strings are bounded identifiers, not provider enums. A local macOS worker,
hardened local Docker worker, persistent remote worker, disposable VM, job
backend, exe.dev worker, or future provider can implement the same
Worker/Attempt contract without changing WorkOrder or Attempt identity.

## Work required before implementation

- tenant-admin enrollment authorization and audit UX;
- credential hashing, rotation, revocation, and incident procedure;
- rate limits, replay protection, abuse monitoring, and bootstrap expiry;
- explicit outbound transport contract and version negotiation;
- fleet draining and capacity reconciliation;
- security review of repository and secret vending boundaries;
- deterministic browser/API evidence and rollback plan;
- separate product-owner approval for any remote capacity or network exposure.
