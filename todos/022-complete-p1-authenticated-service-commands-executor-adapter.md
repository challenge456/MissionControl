---
status: complete
priority: p1
issue_id: "022"
tags: [software-factory, service-auth, executor, codex, orchestration, convex]
dependencies: ["021"]
---

# Establish Authenticated Service Commands and the Codex V1 Adapter

## Problem Statement

The orchestration server authenticates some inbound HTTP routes, but then calls
public Convex mutations whose service actor fields are supplied by the caller.
The current Codex worker is also a specialized read-only script rather than a
versioned production executor contract. Dispatch and evidence ingestion cannot
be considered production-safe until both boundaries are explicit and tested.

## Findings

- `workOrders.dispatch` accepts `SYSTEM` and `AGENT` actor claims from public clients.
- `factory/piBridge.ingestReceiptPacket` is a public mutation without a service credential.
- Orchestration bearer authentication becomes permissive when no token is configured.
- The existing Codex worker proves local execution mechanics but intentionally
  forbids repository mutation and does not implement a stable adapter lifecycle.
- Existing WorkOrder, Task, WorkflowRun, receipt, and Mission state must remain
  authoritative; this slice must not introduce another execution hierarchy.

## Recommended Action

Add a signed, replay-resistant service-command envelope and durable command
receipt ledger. Move service-only dispatch and receipt ingestion behind internal
mutations invoked by authenticated actions, retain a separate human dispatch
mutation, and update orchestration callers to sign narrowly scoped commands.
Define the `codex/v1` executor adapter contract for capability discovery,
configuration validation, estimation, structured execution events, cancel,
optional resume, and health. Keep deterministic simulation test-only.

## Acceptance Criteria

- [x] Service identity, capability, workspace/repository scope, issued time, expiry, command ID, payload digest, and signature are verified server-side.
- [x] Command IDs are replay-resistant and every accepted or denied service command has a durable receipt without storing credentials.
- [x] Public clients cannot claim `SYSTEM` or `AGENT` authority to dispatch a WorkOrder.
- [x] Receipt ingestion is reachable only through the authenticated service boundary or an internal command.
- [x] Orchestration production mode fails closed when its inbound token or outbound signing secret is missing.
- [x] One server-owned dispatch implementation serves the human and authenticated service entry points.
- [x] The `codex/v1` adapter contract covers capabilities, validation, estimate, execute events, cancellation, optional resume, and health.
- [x] The production adapter uses an explicit repository sandbox boundary and emits no credentials into records or logs.
- [x] Focused/full tests, typechecks, and build pass.

## Work Log

### 2026-08-02 - Implementation started

**By:** Codex

**Actions:**

- Mapped current orchestration authentication, WorkOrder dispatch, Pi receipt,
  and Codex worker paths.
- Confirmed the approved initial executor is `codex/v1`, with simulation limited
  to deterministic tests.
- Kept the current Mission → WorkOrder → Task → WorkflowRun/Attempt hierarchy as
  the only authoritative lifecycle.

### 2026-08-02 - Service command and executor boundaries completed

**By:** Codex

**Actions:**

- Added HMAC-signed, one-minute service command envelopes covering identity,
  named capability, exact workspace/repository scope, unique command ID,
  freshness, and the digest of the exact payload.
- Added durable accepted, failed, denied, and replay-aware command receipts that
  deliberately exclude credentials, raw signatures, and payload bodies.
- Split public human WorkOrder dispatch from internal service dispatch while
  retaining one authoritative implementation of the existing lifecycle.
- Moved Pi receipt packet ingestion to an internal mutation exposed only through
  the signed service action.
- Updated the orchestration bridge to sign outbound commands and fail closed in
  production when inbound or outbound credentials are missing.
- Defined the stable executor adapter contract and implemented `codex/v1` with
  sandbox validation, estimates, ordered events, cancellation, declared no-resume
  support, health checks, bounded diagnostics, and credential redaction.
- Documented the service identity and executor runtime contracts.

**Verification:**

- Convex code generation and typecheck pass.
- Full Convex suite passes: 56 files and 390 tests.
- Full UI suite passes: 46 files and 198 tests.
- Workflow-engine suite passes: 7 files and 77 tests.
- Orchestration suite passes: 5 files and 19 tests; the existing opt-in live
  governed-context fixture remains skipped unless its explicit environment flag
  and isolated local deployment are provided.
- Workspace lint/typecheck and all skill lint checks pass.
- Production UI build passes.
