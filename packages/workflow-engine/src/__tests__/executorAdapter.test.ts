import { describe, expect, it } from "vitest";
import type { ExecutorAdapter, ExecutorRequest } from "../executorAdapter";

describe("ExecutorAdapter contract", () => {
  it("requires the complete governed lifecycle surface", () => {
    const request: ExecutorRequest = {
      executionId: "execution-1",
      repositoryRoot: "/tmp/repository",
      workingDirectory: "/tmp/repository",
      prompt: "Implement the approved change.",
      allowedPaths: ["src/**"],
      timeoutMs: 60_000,
      isolation: "WORKSPACE_WRITE",
    };
    const adapter = {} as ExecutorAdapter;
    expect(request.isolation).toBe("WORKSPACE_WRITE");
    expectTypeOf(adapter.capabilities).toBeFunction();
    expectTypeOf(adapter.validateConfiguration).toBeFunction();
    expectTypeOf(adapter.estimate).toBeFunction();
    expectTypeOf(adapter.execute).toBeFunction();
    expectTypeOf(adapter.cancel).toBeFunction();
    expectTypeOf(adapter.health).toBeFunction();
  });
});
