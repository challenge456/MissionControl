import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { canonicalServiceCommand } from "@mission-control/shared";
import { createSignedServiceCommand } from "../serviceCommandClient.js";

describe("service command client", () => {
  afterEach(() => {
    delete process.env.MISSION_CONTROL_SERVICE_COMMAND_SECRET;
    delete process.env.MISSION_CONTROL_SERVICE_ID;
  });

  it("fails closed when the outbound signing secret is absent", () => {
    expect(() => createSignedServiceCommand({
      capability: "workorders.dispatch",
      projectId: "project-1",
      repositoryId: "repository-1",
      payload: { workOrderId: "work-order-1" },
    })).toThrow(/SERVICE_COMMAND_SECRET/);
  });

  it("signs identity, capability, scope, freshness, command ID, and payload digest", () => {
    process.env.MISSION_CONTROL_SERVICE_COMMAND_SECRET = "test-secret";
    const result = createSignedServiceCommand({
      capability: "receipts.ingest",
      projectId: "project-1",
      repositoryId: "repository-1",
      commandId: "command-1",
      now: 1_800_000_000_000,
      payload: { workOrderId: "work-order-1", receipts: [] },
    });
    const expected = `sha256=${createHmac("sha256", "test-secret")
      .update(canonicalServiceCommand(result.envelope))
      .digest("hex")}`;

    expect(result.envelope).toMatchObject({
      serviceId: "orchestration-server",
      capability: "receipts.ingest",
      projectId: "project-1",
      repositoryId: "repository-1",
      commandId: "command-1",
      issuedAt: 1_800_000_000_000,
      expiresAt: 1_800_000_060_000,
    });
    expect(result.envelope.signature).toBe(expected);
    expect(result.payloadJson).not.toContain("test-secret");
  });

  it("signs durable execution reports with the same scoped service identity", () => {
    process.env.MISSION_CONTROL_SERVICE_COMMAND_SECRET = "test-secret";
    const result = createSignedServiceCommand({
      capability: "executions.report",
      projectId: "project-1",
      repositoryId: "repository-1",
      payload: { workflowRunId: "run-1", packetId: "packet-1", events: [] },
    });
    expect(result.envelope.capability).toBe("executions.report");
    expect(result.envelope.projectId).toBe("project-1");
    expect(result.envelope.repositoryId).toBe("repository-1");
  });
});
