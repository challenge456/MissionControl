import { beforeEach, describe, expect, it, vi } from "vitest";

describe("gatewayStatus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("reuses the cached status snapshot within the ttl", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ configured: true, urlConfigured: true, tokenConfigured: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadGatewayStatus } = await import("./gatewayStatus");
    const first = await loadGatewayStatus();
    const second = await loadGatewayStatus();

    expect(first.status?.configured).toBe(true);
    expect(second.status?.configured).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("hydrates from session storage after a reload", async () => {
    window.sessionStorage.setItem(
      "mc.gatewayStatusSnapshot",
      JSON.stringify({
        status: { configured: false, urlConfigured: false, tokenConfigured: false },
        error: "Could not reach orchestration server.",
        checkedAt: Date.now(),
      })
    );

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { loadGatewayStatus } = await import("./gatewayStatus");
    const snapshot = await loadGatewayStatus();

    expect(snapshot.error).toBe("Could not reach orchestration server.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
