import { describe, expect, it, vi } from "vitest";
import { OpenRouterSandboxCredentialBroker } from "../sandboxCredentials.js";

describe("OpenRouterSandboxCredentialBroker", () => {
  it("mints an expiring budget-capped key and revokes by its non-secret hash", async () => {
    const now = 1_800_000_000_000;
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { key: "sk-or-v1-attempt-secret", hash: "key-hash-1" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    const sleep = vi.fn(async () => undefined);
    const broker = new OpenRouterSandboxCredentialBroker("management-secret", fetchImpl, () => now, sleep, [0, 1_000]);
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
    expect(fetchImpl.mock.calls[2][0]).toBe("https://openrouter.ai/api/v1/key");
    expect(fetchImpl.mock.calls[2][1].headers.Authorization).toBe("Bearer sk-or-v1-attempt-secret");
    expect(receipt.confirmation).toEqual({
      method: "STALE_SECRET_REJECTION",
      endpoint: "GET https://openrouter.ai/api/v1/key",
      offsetsMs: [0, 1_000],
      statuses: [200, 401],
    });
    expect(sleep).toHaveBeenCalledWith(1_000);
  });

  it("fails closed when deletion is accepted but stale-key rejection exceeds the bound", async () => {
    const now = 1_800_000_000_000;
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { key: "sk-or-v1-attempt-secret", hash: "key-hash-1" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const broker = new OpenRouterSandboxCredentialBroker("management-secret", fetchImpl, () => now, async () => undefined, [0, 60_000]);
    const grant = await broker.mint({
      projectId: "project-1", workflowRunId: "run-1", attemptId: "attempt-1", attemptLeaseId: "lease-1",
      maxCostUsd: 1, expiresAt: now + 300_000,
    });

    await expect(broker.revoke(grant)).rejects.toThrow(/exact stale-key rejection was not confirmed within 60 seconds/);
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
