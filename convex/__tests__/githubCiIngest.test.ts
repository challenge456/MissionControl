import { describe, expect, it } from "vitest";
import { extractPrFromWebhookEvent, mapCheckRunsToSignals, verifyGithubWebhookSignature } from "../lib/githubCiIngest";
import { buildFileTreeFromPaths } from "../lib/fileTree";

describe("githubCiIngest", () => {
  it("maps GitHub check runs to CI signals", () => {
    const mapped = mapCheckRunsToSignals([
      { name: "unit-tests", status: "completed", conclusion: "success" },
      { name: "vitest", status: "completed", conclusion: "failure" },
      { name: "lint", status: "completed", conclusion: "success" },
    ]);
    expect(mapped.ciStatus).toBe("FAIL");
    expect(mapped.testPassCount).toBe(1);
    expect(mapped.testFailCount).toBe(1);
  });

  it("fails closed when a webhook signature or secret is missing", async () => {
    expect(await verifyGithubWebhookSignature("{}", null, "secret")).toBe(false);
    expect(await verifyGithubWebhookSignature("{}", "sha256=abc", "")).toBe(false);
  });

  it("correlates pull-request and check-run payloads to the same PR", () => {
    const repository = { full_name: "owner/repo" };
    expect(extractPrFromWebhookEvent("pull_request", {
      repository,
      pull_request: { number: 42, html_url: "https://github.com/owner/repo/pull/42" },
    })).toMatchObject({ owner: "owner", repo: "repo", prNumber: 42 });
    expect(extractPrFromWebhookEvent("check_run", {
      repository,
      check_run: { pull_requests: [{ number: 42 }] },
    })).toMatchObject({ owner: "owner", repo: "repo", prNumber: 42 });
    expect(extractPrFromWebhookEvent("pull_request_review", {
      repository,
      pull_request: { number: 42 },
    })).toMatchObject({ owner: "owner", repo: "repo", prNumber: 42 });
  });
});

describe("fileTree", () => {
  it("builds nested folders from flat paths", () => {
    const tree = buildFileTreeFromPaths([
      "skills/foo/SKILL.md",
      "skills/foo/docs/guide.md",
    ]);
    expect(tree[0]?.kind).toBe("folder");
    expect(tree[0]?.children?.length).toBeGreaterThan(0);
  });
});
