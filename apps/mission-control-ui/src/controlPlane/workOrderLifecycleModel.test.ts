import { describe, expect, it } from "vitest";
import { splitCurrentAndHistoricalRevisions, summarizeRevisionEffects } from "./workOrderLifecycleModel";

describe("work order lifecycle model", () => {
  it("distinguishes current and historical revisions", () => {
    const result = splitCurrentAndHistoricalRevisions([
      { _id: "rev-3", revisionNumber: 3 },
      { _id: "rev-2", revisionNumber: 2 },
      { _id: "rev-1", revisionNumber: 1 },
    ], "rev-2");

    expect(result.current?._id).toBe("rev-2");
    expect(result.historical.map((revision) => revision._id)).toEqual(["rev-3", "rev-1"]);
  });

  it("summarizes revision effects for the UI", () => {
    expect(summarizeRevisionEffects({
      materiality: "BOTH",
      changedFields: ["riskLevel", "acceptanceCriteria"],
      impactedAcceptanceCriteria: ["ac-1"],
      impactedApprovals: ["RISK_REVIEW"],
      impactedVerificationReceiptIds: ["receipt-1", "receipt-2"],
    })).toBe("BOTH · fields:2 · criteria:1 · approvals:1 · receipts:2");
  });
});
