import { describe, expect, it } from "vitest";
import { summarizeWorkflowObservability } from "../lib/workflowObservability";

const workflowRun = {
  runId: "jv91vh5t",
  status: "COMPLETED",
  startedAt: 1_000,
  completedAt: 6_000,
  steps: [
    { startedAt: 1_000, completedAt: 2_000, retryCount: 1 },
    { startedAt: 2_000, completedAt: 3_000, retryCount: 2 },
    { retryCount: 0 },
  ],
};

describe("workflow observability summary", () => {
  it("aggregates graph attempts, retries, usage, and cost", () => {
    expect(
      summarizeWorkflowObservability({
        workflowRun,
        agentRuns: [
          { inputTokens: 100, outputTokens: 25, costUsd: 0.1 },
          { inputTokens: 40, outputTokens: 10, costUsd: 0.05 },
        ],
        now: 10_000,
      })
    ).toEqual({
      correlationId: "jv91vh5t",
      status: "COMPLETED",
      durationMs: 5_000,
      attempts: 5,
      retries: 3,
      inputTokens: 140,
      outputTokens: 35,
      costUsd: 0.15000000000000002,
      usageComplete: true,
    });
  });

  it("uses the current time for an active workflow duration", () => {
    const summary = summarizeWorkflowObservability({
      workflowRun: {
        ...workflowRun,
        status: "RUNNING",
        completedAt: undefined,
      },
      agentRuns: [],
      now: 8_000,
    });
    expect(summary.durationMs).toBe(7_000);
  });

  it("clamps malformed negative counters instead of corrupting totals", () => {
    const summary = summarizeWorkflowObservability({
      workflowRun: {
        ...workflowRun,
        steps: [{ startedAt: 1_000, retryCount: -4 }],
      },
      agentRuns: [{ inputTokens: -10, outputTokens: -5, costUsd: -1 }],
      now: 8_000,
    });
    expect(summary).toMatchObject({
      attempts: 1,
      retries: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    });
  });

  it("marks a capped run query as incomplete", () => {
    const summary = summarizeWorkflowObservability({
      workflowRun,
      agentRuns: [],
      now: 8_000,
      truncated: true,
    });
    expect(summary.usageComplete).toBe(false);
  });

  it("returns only the fixed non-sensitive telemetry contract", () => {
    const summary = summarizeWorkflowObservability({
      workflowRun: {
        ...workflowRun,
        prompt: "must not escape",
      } as typeof workflowRun,
      agentRuns: [
        {
          inputTokens: 1,
          metadata: { secret: "must not escape" },
        },
      ],
      now: 8_000,
    });

    expect(Object.keys(summary).sort()).toEqual(
      [
        "attempts",
        "correlationId",
        "costUsd",
        "durationMs",
        "inputTokens",
        "outputTokens",
        "retries",
        "status",
        "usageComplete",
      ].sort()
    );
    expect(JSON.stringify(summary)).not.toContain("must not escape");
  });
});
