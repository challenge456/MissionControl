import { describe, expect, it } from "vitest";
import { graphDispatchState, summarizeGraphExecution } from "./graphEngineering";

describe("Graph Engineering presentation", () => {
  it("summarizes fan-out, verification, failures, and progress", () => {
    const summary = summarizeGraphExecution({
      status: "RUNNING",
      steps: [
        { status: "DONE", kind: "AGENT" },
        { status: "DONE", kind: "AGENT" },
        { status: "RUNNING", kind: "AGENT" },
        { status: "DONE", kind: "VERIFY" },
        { status: "FAILED", kind: "VERIFY", error: "Source conflict unresolved" },
        { status: "PENDING", kind: "REDUCE" },
        { status: "BLOCKED", kind: "GATE" },
      ],
    });

    expect(summary).toMatchObject({
      total: 7,
      complete: 3,
      active: 1,
      failed: 1,
      blocked: 1,
      verificationTotal: 2,
      verificationComplete: 1,
      progressPercent: 43,
      failureReason: "Source conflict unresolved",
    });
  });

  it("keeps dispatch explicit and routes failed runs to recovery", () => {
    expect(graphDispatchState({
      loading: false,
      workOrder: { state: "READY" },
      run: null,
    })).toBe("READY");

    expect(graphDispatchState({
      loading: false,
      workOrder: { state: "BLOCKED" },
      run: { status: "FAILED", steps: [] },
    })).toBe("RECOVERY_REQUIRED");
  });

  it("identifies the evidence-bound gate as awaiting approval", () => {
    expect(graphDispatchState({
      loading: false,
      workOrder: { state: "IN_PROGRESS" },
      run: {
        status: "RUNNING",
        steps: [{ status: "RUNNING", kind: "GATE" }],
      },
    })).toBe("AWAITING_APPROVAL");
  });
});
