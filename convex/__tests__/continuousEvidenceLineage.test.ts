import { describe, expect, it } from "vitest";
import { buildContinuousEvidenceLineage } from "../lib/runInspector";

describe("buildContinuousEvidenceLineage", () => {
  it("connects research, verification, approval, implementation, receipts, and measurement", () => {
    const stages = buildContinuousEvidenceLineage({
      context: {
        researchLandscapeOutput: { sourceLedger: [{ title: "Primary source", url: "https://example.test/source" }] },
        verifyLandscapeOutput: { acceptedClaims: [{ claim: "The claim is supported" }] },
        synthesizeOutput: {
          recommendations: [{ recommendation: "Ship the bounded change" }],
          measurements: [{ name: "Focused tests pass" }],
          stopCondition: "Evidence is complete",
        },
        approvalOutput: "APPROVED",
        approvalEvidenceDigest: "sha256:abc",
      },
      approval: { status: "APPROVED", approver: "operator", decidedAt: 1_700_000_000_000 },
      fileChanges: [{ repositoryPath: "src/change.ts" }],
      receipts: [{ acceptanceCriterionId: "AC-1", status: "PASSED", result: "Focused test passed" }],
    });

    expect(stages).toHaveLength(7);
    expect(stages.map((stage) => stage.status)).toEqual(Array(7).fill("COMPLETE"));
    expect(stages.find((stage) => stage.id === "approval")?.details).toContain("Evidence digest: sha256:abc");
  });

  it("treats a measured clean stop as an explicit no-change outcome", () => {
    const stages = buildContinuousEvidenceLineage({
      context: {
        synthesizeOutput: {
          recommendations: [],
          measurements: [{ name: "No regression observed" }],
          stopCondition: "No material gap remains",
        },
      },
    });

    expect(stages.find((stage) => stage.id === "recommendation")?.status).toBe("NOT_REQUIRED");
    expect(stages.find((stage) => stage.id === "implementation")?.status).toBe("NOT_REQUIRED");
    expect(stages.find((stage) => stage.id === "evidence")?.status).toBe("MISSING");
  });

  it("makes missing lineage explicit", () => {
    const stages = buildContinuousEvidenceLineage({});
    expect(stages.every((stage) => stage.status === "MISSING")).toBe(true);
  });
});
