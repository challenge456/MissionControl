import { describe, expect, it } from "vitest";
import {
  canonicalServiceCommand,
  validateServiceCommandEnvelope,
  type ServiceCommandEnvelope,
} from "../lib/serviceCommandAuth";

const now = 1_800_000_000_000;
const envelope: ServiceCommandEnvelope = {
  serviceId: "orchestration-server",
  capability: "workorders.dispatch",
  projectId: "project-1",
  repositoryId: "repository-1",
  commandId: "command-1",
  issuedAt: now,
  expiresAt: now + 60_000,
  payloadDigest: `sha256=${"a".repeat(64)}`,
  signature: `sha256=${"b".repeat(64)}`,
};

describe("service command authentication", () => {
  it("canonicalizes every signed identity, scope, time, and payload field", () => {
    expect(canonicalServiceCommand(envelope)).toBe([
      "mc-service-command-v1",
      "orchestration-server",
      "workorders.dispatch",
      "project-1",
      "repository-1",
      "command-1",
      String(now),
      String(now + 60_000),
      `sha256=${"a".repeat(64)}`,
    ].join("\n"));
  });

  it("accepts a narrowly scoped current envelope", () => {
    expect(validateServiceCommandEnvelope(envelope, now, {
      serviceId: "orchestration-server",
      capability: "workorders.dispatch",
    })).toBeNull();
  });

  it.each([
    [{ ...envelope, serviceId: "unknown" }, "service-identity-not-allowed"],
    [{ ...envelope, capability: "receipts.ingest" }, "capability-not-allowed"],
    [{ ...envelope, expiresAt: now }, "command-expired"],
    [{ ...envelope, expiresAt: now + 6 * 60_000 }, "invalid-command-ttl"],
    [{ ...envelope, payloadDigest: "sha256=bad" }, "invalid-payload-digest"],
  ])("denies an invalid envelope", (candidate, reason) => {
    expect(validateServiceCommandEnvelope(candidate, now, {
      serviceId: "orchestration-server",
      capability: "workorders.dispatch",
    })).toBe(reason);
  });
});
