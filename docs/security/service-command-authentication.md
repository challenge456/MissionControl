# Service command authentication

## Decision

Mission Control V1 uses one authenticated service identity,
`orchestration-server`, for service-side WorkOrder dispatch and executor receipt
ingestion. Public browser mutations cannot claim `SYSTEM` or `AGENT` authority.
The orchestration server authenticates inbound callers with a bearer credential,
then signs each outbound Convex command with a separate HMAC credential.

This is an application service identity, not a human Clerk identity and not a
GitHub App installation identity. Those authorities remain separate.

## Signed envelope

Every service command signs these fields in a fixed `mc-service-command-v1`
canonical form:

- service identity and exact capability;
- workspace and repository record IDs;
- globally unique command ID;
- issued and expiry times (maximum five-minute envelope; clients use one minute);
- SHA-256 digest of the exact serialized payload.

Convex validates syntax, freshness, payload digest, HMAC, active Factory version,
and exact WorkOrder/workspace/repository scope before invoking an internal
mutation. A command ID can be claimed once. A repeated command ID is recorded as
a replay and cannot repeat side effects.

## Durable audit behavior

`serviceCommandReceipts` stores accepted, succeeded, failed, and denied commands.
It contains identity, capability, claimed scope, timestamps, digest, result
reference, denial/failure reason, attempt count, and replay time. It never stores
the HMAC secret, bearer credential, raw signature, or payload body.

## Configuration

Production orchestration requires:

- `ORCHESTRATION_API_TOKEN` (or legacy `MC_API_TOKEN`) for inbound HTTP requests;
- `MISSION_CONTROL_SERVICE_COMMAND_SECRET` in both orchestration and Convex;
- optional `MISSION_CONTROL_SERVICE_ID`, defaulting to `orchestration-server` in
  both processes.

Production HTTP routes return `503` when inbound authentication is not
configured. Outbound commands fail before calling Convex when the signing secret
is absent. Rotate the bearer and signing credentials independently.

## Current command capabilities

| Capability | Public human entry | Authenticated service entry | Internal mutation |
|---|---|---|---|
| `workorders.dispatch` | `workOrders.dispatch` (`HUMAN` only) | `serviceCommands.dispatchWorkOrder` | `workOrders.dispatchServiceInternal` |
| `receipts.ingest` | None | `serviceCommands.ingestReceiptPacket` | `factory/piBridge.ingestReceiptPacketInternal` |

Additional scheduler, task-transition, artifact, approval-request, and handoff
commands must be added as named capabilities before those callers can be treated
as production service identities. Do not reuse one generic “system” capability.
