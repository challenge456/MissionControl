export const SERVICE_COMMAND_VERSION = "mc-service-command-v1";
export const SERVICE_COMMAND_MAX_TTL_MS = 5 * 60 * 1_000;
export const SERVICE_COMMAND_CLOCK_SKEW_MS = 30 * 1_000;

export interface ServiceCommandEnvelope {
  serviceId: string;
  capability: string;
  projectId: string;
  repositoryId: string;
  commandId: string;
  issuedAt: number;
  expiresAt: number;
  payloadDigest: string;
  signature: string;
}

const SAFE_ID = /^[A-Za-z0-9._:/-]{1,200}$/;
const SHA256 = /^sha256=[a-f0-9]{64}$/;

export function canonicalServiceCommand(envelope: Omit<ServiceCommandEnvelope, "signature">): string {
  return [
    SERVICE_COMMAND_VERSION,
    envelope.serviceId,
    envelope.capability,
    envelope.projectId,
    envelope.repositoryId,
    envelope.commandId,
    String(envelope.issuedAt),
    String(envelope.expiresAt),
    envelope.payloadDigest,
  ].join("\n");
}

export function validateServiceCommandEnvelope(
  envelope: ServiceCommandEnvelope,
  now: number,
  expected: { serviceId: string; capability: string }
): string | null {
  if (!SAFE_ID.test(envelope.serviceId) || !SAFE_ID.test(envelope.capability) ||
      !SAFE_ID.test(envelope.projectId) || !SAFE_ID.test(envelope.repositoryId) ||
      !SAFE_ID.test(envelope.commandId)) return "invalid-envelope-identifier";
  if (envelope.serviceId !== expected.serviceId) return "service-identity-not-allowed";
  if (envelope.capability !== expected.capability) return "capability-not-allowed";
  if (!Number.isSafeInteger(envelope.issuedAt) || !Number.isSafeInteger(envelope.expiresAt)) return "invalid-command-time";
  if (envelope.issuedAt > now + SERVICE_COMMAND_CLOCK_SKEW_MS) return "command-issued-in-future";
  if (envelope.expiresAt <= now) return "command-expired";
  if (envelope.expiresAt <= envelope.issuedAt || envelope.expiresAt - envelope.issuedAt > SERVICE_COMMAND_MAX_TTL_MS) return "invalid-command-ttl";
  if (!SHA256.test(envelope.payloadDigest)) return "invalid-payload-digest";
  if (!SHA256.test(envelope.signature)) return envelope.signature ? "invalid-signature-format" : "missing-signature";
  return null;
}
