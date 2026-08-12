import { describe, expect, it } from "vitest";
import { buildBoundedContextUpdate, validateCompletionOutput } from "../handoff.js";

describe("Structured workflow handoffs", () => {
  it("requires an explicit completed status", () => {
    expect(validateCompletionOutput({ status: "COMPLETED" })).toEqual({ ok: true });
    expect(validateCompletionOutput({ status: "BLOCKED" })).toMatchObject({ ok: false });
    expect(validateCompletionOutput("STATUS: done")).toMatchObject({ ok: false });
  });

  it("creates a compact assertion-aware handoff", () => {
    const result = buildBoundedContextUpdate({
      existingContext: { task: "Ship buyer gate" },
      stepId: "implement",
      structuredOutput: {
        status: "COMPLETED",
        completedAcceptanceCriterionIds: ["ac-1"],
        incompleteAcceptanceCriterionIds: [],
        unknownAcceptanceCriterionIds: ["ac-2"],
        knownRisks: ["Needs browser verification"],
        nextAction: "Run independent verification",
      },
    });
    expect(result.ok && result.handoff).toMatchObject({
      outcome: "COMPLETED",
      completedAssertionIds: ["ac-1"],
      unknownAssertionIds: ["ac-2"],
      nextAction: "Run independent verification",
    });
  });

  it("rejects unbounded step output", () => {
    expect(buildBoundedContextUpdate({
      existingContext: {},
      stepId: "research",
      structuredOutput: { status: "COMPLETED", evidence: "x".repeat(33 * 1024) },
    })).toMatchObject({ ok: false, error: expect.stringContaining("32 KB") });
  });
});
