import { describe, expect, it } from "vitest";
import { reconcileTerminalWorkflowSteps } from "../lib/workflowRunState";

describe("reconcileTerminalWorkflowSteps", () => {
  const steps = [
    { stepId: "done", status: "DONE" as const, retryCount: 0 },
    { stepId: "active", status: "RUNNING" as const, retryCount: 1 },
    { stepId: "next", status: "PENDING" as const, retryCount: 0 },
  ];

  it("fails active steps and blocks pending steps when the run fails", () => {
    const result = reconcileTerminalWorkflowSteps(steps, "FAILED", "Budget exceeded", 100);
    expect(result[0].status).toBe("DONE");
    expect(result[1]).toEqual(expect.objectContaining({
      status: "FAILED",
      completedAt: 100,
      error: "Budget exceeded",
    }));
    expect(result[2]).toEqual(expect.objectContaining({ status: "BLOCKED", completedAt: 100 }));
  });

  it("skips unfinished steps when the run is canceled", () => {
    const result = reconcileTerminalWorkflowSteps(steps, "CANCELED", "Operator canceled", 100);
    expect(result.map((step) => step.status)).toEqual(["DONE", "SKIPPED", "SKIPPED"]);
  });

  it("does not rewrite non-terminal runs", () => {
    expect(reconcileTerminalWorkflowSteps(steps, "PAUSED", undefined, 100)).toBe(steps);
  });
});
