import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
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

  it("closes the Codex CLI stdin pipe so an explicit prompt can start", async () => {
    const repositoryRoot = await mkdtemp(path.join(tmpdir(), "mc-codex-stdin-"));
    const executable = path.join(repositoryRoot, "codex-stub.sh");
    await writeFile(executable, `#!/bin/sh
output=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    shift
    output="$1"
  fi
  shift
done
if IFS= read -r _line; then
  exit 41
fi
printf '%s' 'Codex started after EOF.' > "$output"
`);
    await chmod(executable, 0o700);

    try {
      const adapter = new CodexV1ExecutorAdapter(executable);
      const started = vi.fn();
      const terminated = vi.fn();
      const result = await adapter.execute({
        ...request,
        repositoryRoot,
        workingDirectory: repositoryRoot,
        timeoutMs: 2_000,
      }, () => undefined, undefined, { started, terminated });

      expect(result).toMatchObject({
        status: "COMPLETED",
        output: "Codex started after EOF.",
      });
      expect(started).toHaveBeenCalledOnce();
      expect(terminated).toHaveBeenCalledOnce();
      expect(terminated.mock.calls[0][0].pid).toBe(started.mock.calls[0][0].pid);
      expect(terminated.mock.calls[0][0].exitCode).toBe(0);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
