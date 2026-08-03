import { describe, expect, it, vi } from "vitest";
import { CodexV1ExecutorAdapter } from "../codexExecutorAdapter.js";

const request = {
  executionId: "execution-1",
  repositoryRoot: "/tmp/repository",
  workingDirectory: "/tmp/repository/apps/ui",
  prompt: "Implement the approved UI change.",
  allowedPaths: ["apps/ui/**"],
  timeoutMs: 60_000,
  isolation: "WORKSPACE_WRITE" as const,
};

describe("CodexV1ExecutorAdapter", () => {
  it("declares the frozen codex/v1 lifecycle and repository mutation capability", () => {
    const adapter = new CodexV1ExecutorAdapter("/tmp/codex", vi.fn() as any);
    expect(adapter.capabilities()).toMatchObject({
      adapter: "codex",
      version: "v1",
      supportsCancel: true,
      supportsResume: false,
      supportsRepositoryMutation: true,
    });
  });

  it("rejects paths that escape the explicit repository sandbox", () => {
    const adapter = new CodexV1ExecutorAdapter("/tmp/codex", vi.fn() as any);
    expect(adapter.validateConfiguration({
      ...request,
      workingDirectory: "/tmp/other",
      allowedPaths: ["../secrets/**"],
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "workingDirectory" }),
      expect.objectContaining({ field: "allowedPaths" }),
    ]));
  });

  it("emits structured events without putting diagnostics or secrets in successful metadata", async () => {
    const runner = vi.fn().mockResolvedValue({ exitCode: 0, output: "Implemented and tested." });
    const adapter = new CodexV1ExecutorAdapter("/tmp/codex", runner);
    const events: any[] = [];
    const result = await adapter.execute(request, (event) => { events.push(event); });

    expect(result).toMatchObject({ status: "COMPLETED", output: "Implemented and tested." });
    expect(events.map((event) => event.type)).toEqual([
      "EXECUTION_STARTED",
      "COMMAND_STARTED",
      "COMMAND_COMPLETED",
      "ARTIFACT_PRODUCED",
      "EXECUTION_COMPLETED",
    ]);
    expect(JSON.stringify(events)).not.toContain("OPENAI_API_KEY");
  });

  it("supports cancellation of an active execution", async () => {
    const runner = vi.fn(({ signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    const adapter = new CodexV1ExecutorAdapter("/tmp/codex", runner as any);
    const execution = adapter.execute(request, () => undefined);
    await vi.waitFor(() => expect(runner).toHaveBeenCalled());
    expect(await adapter.cancel(request.executionId)).toBe(true);
    await expect(execution).resolves.toMatchObject({ status: "CANCELED" });
  });
});
