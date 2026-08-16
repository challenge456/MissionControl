import { describe, expect, it, vi } from "vitest";
import { OpenRouterSandboxCredentialBroker } from "../sandboxCredentials.js";

describe("OpenRouterSandboxCredentialBroker", () => {
  it("mints an expiring budget-capped key and revokes by its non-secret hash", async () => {
    const now = 1_800_000_000_000;
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { key: "sk-or-v1-attempt-secret", hash: "key-hash-1" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const broker = new OpenRouterSandboxCredentialBroker("management-secret", fetchImpl, () => now);
    const grant = await broker.mint({
      projectId: "project-1",
      workflowRunId: "run-1",
      attemptId: "attempt-1",
      attemptLeaseId: "lease-1",
      maxCostUsd: 3,
      expiresAt: now + 300_000,
    });
    expect(grant.secret).toBe("sk-or-v1-attempt-secret");
    expect(grant.externalCredentialId).toBe("key-hash-1");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ limit: 3, expires_at: new Date(now + 300_000).toISOString() });
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe("Bearer management-secret");

    const receipt = await broker.revoke(grant);
    expect(receipt.revoked).toBe(true);
    expect(fetchImpl.mock.calls[1][0]).toBe("https://openrouter.ai/api/v1/keys/key-hash-1");
  });

  it("redacts provider secrets from failures", async () => {
    const now = 1_800_000_000_000;
    const fetchImpl = vi.fn().mockResolvedValue(new Response("authorization=sk-or-v1-leaked", { status: 401 }));
    const broker = new OpenRouterSandboxCredentialBroker("management-secret", fetchImpl, () => now);
    await expect(broker.mint({
      projectId: "project-1", workflowRunId: "run-1", attemptId: "attempt-1", attemptLeaseId: "lease-1",
      maxCostUsd: 1, expiresAt: now + 300_000,
    })).rejects.not.toThrow(/sk-or-v1-leaked/);
  });
});
