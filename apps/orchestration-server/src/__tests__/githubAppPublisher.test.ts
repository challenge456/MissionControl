import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { GithubAppPublisher, parseGithubRepository } from "../githubAppPublisher";

function privateKey() {
  return generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
}

describe("GithubAppPublisher", () => {
  it("mints a repository-scoped installation token without returning it in metadata", async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify({
      token: "installation-secret",
      expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
    }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const publisher = new GithubAppPublisher("123", privateKey(), fetcher as any);
    const result = await publisher.mintInstallationToken({
      installationId: "456",
      repository: "jaydubya818/MissionControl",
      providerRepositoryId: "789",
    });
    expect(result.token).toBe("installation-secret");
    const init = fetcher.mock.calls[0][1];
    expect(init).toBeDefined();
    expect(JSON.parse(String(init?.body))).toEqual({ repository_ids: [789] });
  });

  it("rejects unsafe repository and provider identities before publication", async () => {
    expect(() => parseGithubRepository("github.com@attacker.invalid/repo")).toThrow("safe owner/name");
    const publisher = new GithubAppPublisher("123", privateKey(), vi.fn() as any);
    await expect(publisher.mintInstallationToken({
      installationId: "456",
      repository: "jaydubya818/MissionControl",
      providerRepositoryId: "9007199254740992",
    })).rejects.toThrow("supported integer range");
  });

  it("propagates an already-requested cancellation to GitHub", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(true);
      throw new DOMException("Aborted", "AbortError");
    });
    const publisher = new GithubAppPublisher("123", privateKey(), fetcher as any);
    const controller = new AbortController();
    controller.abort();
    await expect(publisher.findOrCreatePullRequest({
      token: "ephemeral",
      repository: "jaydubya818/MissionControl",
      branch: "mc/canceled",
      baseBranch: "main",
      title: "Canceled",
      body: "lineage",
    }, controller.signal)).rejects.toThrow("Aborted");
  });

  it("reuses the open pull request for the exact branch", async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => new Response(JSON.stringify([{
      id: 19, number: 24, html_url: "https://github.com/jaydubya818/MissionControl/pull/24", state: "open",
      head: { ref: "mc/golden-path" },
    }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const publisher = new GithubAppPublisher("123", privateKey(), fetcher as any);
    await expect(publisher.findOrCreatePullRequest({
      token: "ephemeral", repository: "jaydubya818/MissionControl", branch: "mc/golden-path",
      baseBranch: "main", title: "Golden path", body: "lineage",
    })).resolves.toMatchObject({ number: 24, created: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("creates one review-ready pull request when the exact branch has none", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 20,
        number: 25,
        html_url: "https://github.com/jaydubya818/MissionControl/pull/25",
        state: "open",
      }), { status: 201, headers: { "Content-Type": "application/json" } }));
    const publisher = new GithubAppPublisher("123", privateKey(), fetcher as any);
    await expect(publisher.findOrCreatePullRequest({
      token: "ephemeral", repository: "jaydubya818/MissionControl", branch: "mc/golden-path",
      baseBranch: "main", title: "Golden path", body: "lineage",
    })).resolves.toMatchObject({ number: 25, created: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toMatchObject({
      head: "mc/golden-path",
      base: "main",
      draft: false,
      maintainer_can_modify: false,
    });
  });

  it("refuses to reuse a branch whose prior pull request is closed", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([{
      id: 19,
      number: 24,
      html_url: "https://github.com/jaydubya818/MissionControl/pull/24",
      state: "closed",
      head: { ref: "mc/golden-path" },
    }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    const publisher = new GithubAppPublisher("123", privateKey(), fetcher as any);
    await expect(publisher.findOrCreatePullRequest({
      token: "ephemeral", repository: "jaydubya818/MissionControl", branch: "mc/golden-path",
      baseBranch: "main", title: "Golden path", body: "lineage",
    })).rejects.toThrow("already owns branch mc/golden-path but is closed");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
