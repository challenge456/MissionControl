import { createHash, createHmac, randomUUID } from "node:crypto";
import {
  canonicalServiceCommand,
  type ServiceCommandEnvelope,
} from "@mission-control/shared";

export type ServiceCapability =
  | "workorders.dispatch"
  | "receipts.ingest"
  | "attempts.claim"
  | "attempts.renew"
  | "attempts.report"
  | "executions.claim"
  | "executions.heartbeat"
  | "executions.report"
  | "executions.finalize";

export function createSignedServiceCommand(args: {
  capability: ServiceCapability;
  projectId: string;
  repositoryId: string;
  payload: unknown;
  now?: number;
  commandId?: string;
}) {
  const secret = process.env.MISSION_CONTROL_SERVICE_COMMAND_SECRET?.trim();
  if (!secret) throw new Error("MISSION_CONTROL_SERVICE_COMMAND_SECRET is required for service commands.");
  const serviceId = process.env.MISSION_CONTROL_SERVICE_ID?.trim() || "orchestration-server";
  const issuedAt = args.now ?? Date.now();
  const payloadJson = JSON.stringify(args.payload);
  const unsigned: Omit<ServiceCommandEnvelope, "signature"> = {
    serviceId,
    capability: args.capability,
    projectId: args.projectId,
    repositoryId: args.repositoryId,
    commandId: args.commandId ?? randomUUID(),
    issuedAt,
    expiresAt: issuedAt + 60_000,
    payloadDigest: `sha256=${createHash("sha256").update(payloadJson).digest("hex")}`,
  };
  const signature = `sha256=${createHmac("sha256", secret)
    .update(canonicalServiceCommand(unsigned))
    .digest("hex")}`;
  return { envelope: { ...unsigned, signature }, payloadJson };
}
