import { describe, expect, it } from "vitest";
import {
  outputContractFromMetadata,
  validateForReview,
  validateOutputContract,
} from "../lib/outputValidation";

const checkedReviewList = {
  type: "SUBMISSION",
  items: [{ label: "Evidence checked", checked: true }],
};

describe("workflow output contract validation", () => {
  it("normalizes required fields from task metadata", () => {
    expect(
      outputContractFromMetadata({
        outputContract: {
          expects: "architectureFindings",
          requiredFields: ["sourceLedger", "architectureFindings", "sourceLedger"],
        },
      })
    ).toEqual({
      expects: "architectureFindings",
      requiredFields: ["sourceLedger", "architectureFindings"],
    });
  });

  it("ignores unrelated task metadata", () => {
    expect(outputContractFromMetadata({ graph: { kind: "AGENT" } })).toBeUndefined();
  });

  it("accepts a JSON object containing every required field", () => {
    expect(
      validateOutputContract(
        JSON.stringify({ sourceLedger: [], architectureFindings: [] }),
        { requiredFields: ["sourceLedger", "architectureFindings"] }
      )
    ).toEqual([]);
  });

  it("rejects invalid JSON before review", () => {
    expect(
      validateOutputContract("not-json", {
        requiredFields: ["acceptedClaims", "sourceDecisions"],
      })
    ).toEqual([
      "Deliverable evidence must be valid JSON with required fields: acceptedClaims, sourceDecisions.",
    ]);
  });

  it("reports missing required fields", () => {
    expect(
      validateOutputContract(JSON.stringify({ acceptedClaims: [] }), {
        requiredFields: ["acceptedClaims", "sourceDecisions"],
      })
    ).toEqual([
      "Deliverable evidence is missing required fields: sourceDecisions.",
    ]);
  });

  it("integrates contract errors with normal review validation", () => {
    expect(
      validateForReview(
        {
          summary: "Independent verification completed.",
          content: JSON.stringify({ acceptedClaims: [] }),
        },
        checkedReviewList,
        { requiredFields: ["acceptedClaims", "sourceDecisions"] }
      )
    ).toContain("Deliverable evidence is missing required fields: sourceDecisions.");
  });
});
