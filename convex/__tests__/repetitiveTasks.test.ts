import { describe, expect, it } from "vitest";
import { detectRepetitiveTasks, isEligibleAutomationReceipt } from "../lib/repetitiveTasks";

describe("detectRepetitiveTasks", () => {
  it("only promotes repeated governed work and reports evidence coverage", () => {
    const candidates = detectRepetitiveTasks([
      { workflowId: "release", state: "DONE", hasReceipt: true },
      { workflowId: "release", state: "DONE", hasReceipt: true },
      { workflowId: "release", state: "FAILED", hasReceipt: false },
      { workflowId: "one-off", state: "DONE", hasReceipt: true },
    ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        id: "workflow:release",
        occurrences: 3,
        completedCount: 2,
        receiptCount: 2,
      }),
    ]);
  });

  it("falls back to repository grouping when a workflow is not assigned", () => {
    const candidates = detectRepetitiveTasks([
      { repository: "sellerfi/app", state: "DONE", hasReceipt: false },
      { repository: "sellerfi/app", state: "DONE", hasReceipt: false },
    ]);

    expect(candidates[0]).toMatchObject({ id: "repository:sellerfi/app", occurrences: 2 });
    expect(candidates[0]?.suggestion).toContain("verification receipt");
  });

  it("only treats fresh passing receipts as promotion evidence", () => {
    expect(isEligibleAutomationReceipt({ status: "PASSED" }, 100)).toBe(true);
    expect(isEligibleAutomationReceipt({ status: "FAILED" }, 100)).toBe(false);
    expect(isEligibleAutomationReceipt({ status: "WAIVED" }, 100)).toBe(false);
    expect(isEligibleAutomationReceipt({ status: "STALE" }, 100)).toBe(false);
    expect(isEligibleAutomationReceipt({ status: "PASSED", validUntil: 99 }, 100)).toBe(false);
    expect(isEligibleAutomationReceipt({ status: "PASSED", invalidatedAt: 99 }, 100)).toBe(false);
  });
});
