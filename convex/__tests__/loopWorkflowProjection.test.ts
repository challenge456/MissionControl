import { describe, expect, it } from "vitest";
import { projectLoopWorkflowContext } from "../lib/loopWorkflowProjection";

const now = Date.UTC(2026, 7, 1);

describe("projectLoopWorkflowContext", () => {
  it("projects accepted evidence, claims, recommendations, and gate identity", () => {
    const projection = projectLoopWorkflowContext({
      researchLandscapeOutput: {
        sourceLedger: [{
          title: "Primary evidence",
          url: "https://example.com/report?b=2&a=1",
          publisher: "Example",
          publishedAt: "2026-07-15",
        }],
      },
      verifyLandscapeOutput: {
        acceptedClaims: [{ claim: "The check passes", confidence: "HIGH" }],
        rejectedClaims: [],
        conflicts: ["One conflicting benchmark"],
        limitations: ["Local fixture"],
        sourceDecisions: [{ source: "Primary evidence", decision: "ACCEPTED", reason: "Reproducible" }],
      },
      synthesizeOutput: {
        recommendations: [{ title: "Adopt the check", rationale: "Evidence supports it", confidence: "HIGH" }],
        measurements: [{ name: "Checks", result: 1, unit: "checks", passed: true }],
        stopCondition: "One verified change",
      },
      approvalOutput: "APPROVED",
      approvalId: "approval-1",
      approvalEvidenceDigest: "sha256:abc",
    }, { workflowRunId: "run-1", now });

    expect(projection.sources).toHaveLength(1);
    expect(projection.sources[0]).toMatchObject({
      decision: "ACCEPTED",
      canonicalUrl: "https://example.com/report?a=1&b=2",
    });
    expect(projection.claims[0]).toMatchObject({ unsupported: false, confidence: "HIGH" });
    expect(projection.recommendations[0].evidenceSourceIds).toEqual([projection.sources[0].id]);
    expect(projection.conflicts).toEqual(["One conflicting benchmark"]);
    expect(projection.limitations).toEqual(["Local fixture"]);
    expect(projection.approved).toBe(true);
    expect(projection.cleanStop).toBe(false);
  });

  it("preserves repository evidence and a zero-recommendation clean stop", () => {
    const projection = projectLoopWorkflowContext({
      researchArchitectureOutput: {
        sourceLedger: [{
          title: "Local contract",
          URL: "docs/software-factory/LOOP_ENGINEERING.md",
          freshness: "CURRENT",
        }],
      },
      verifyArchitectureOutput: {
        acceptedClaims: ["The contract is enforced"],
        sourceDecisions: [{ source: "Local contract", decision: "ACCEPTED" }],
      },
      synthesizeOutput: {
        recommendations: [],
        measurements: [{ name: "Browser errors", result: 0, unit: "errors", passed: true }],
        stopCondition: "Met",
      },
      approvalOutput: "APPROVED",
      approvalId: "approval-2",
    }, { workflowRunId: "run-2", now });

    expect(projection.sources[0].canonicalUrl).toBe("repo:docs/software-factory/loop_engineering.md");
    expect(projection.recommendations).toEqual([]);
    expect(projection.measurementSnapshots).toHaveLength(1);
    expect(projection.cleanStop).toBe(true);
  });

  it("keeps rejected claims unsupported and does not invent approval", () => {
    const projection = projectLoopWorkflowContext({
      researchGovernanceOutput: {
        sourceLedger: [{ title: "Policy", url: "https://example.com/policy" }],
      },
      verifyGovernanceOutput: {
        rejectedClaims: [{ claim: "Self approval is safe" }],
        sourceDecisions: [{ source: "Policy", decision: "REJECTED", reason: "Untrusted" }],
      },
      synthesizeOutput: { recommendations: [] },
    }, { workflowRunId: "run-3", now });

    expect(projection.sources[0]).toMatchObject({ decision: "REJECTED", decisionReason: "Untrusted" });
    expect(projection.claims[0]).toMatchObject({ unsupported: true, supportingSourceIds: [] });
    expect(projection.approved).toBe(false);
    expect(projection.cleanStop).toBe(false);
  });
});
