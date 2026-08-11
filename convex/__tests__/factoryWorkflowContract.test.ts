import { describe, expect, it } from "vitest";
import { factoryWorkflowContractIssues } from "../lib/factoryWorkflowContract";

describe("Factory workflow contract", () => {
  it("accepts schema-validated execution with a human gate", () => {
    expect(factoryWorkflowContractIssues({
      active: true,
      steps: [
        { id: "implement", expects: "summary", outputSchema: { type: "object", required: ["status", "summary"], properties: { status: { type: "string" } } } },
        { id: "approval", kind: "GATE", expects: "APPROVED", input: "Wait for the recorded human decision" },
      ],
    })).toEqual([]);
  });

  it("rejects heuristic completion and provider authority", () => {
    expect(factoryWorkflowContractIssues({
      active: true,
      steps: [{ id: "pr", expects: "STATUS: done", input: "Use gh pr create" }],
    })).toEqual([
      "pr:heuristic-completion",
      "pr:structured-status-required",
      "pr:provider-authority-forbidden",
    ]);
  });
});
