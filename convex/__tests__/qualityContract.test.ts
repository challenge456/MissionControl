import { describe, expect, it } from "vitest";
import { compileApprovedPlanQualityContract } from "../lib/qualityContract";

const input = {
  missionId: "mission-1",
  missionPlanId: "plan-1",
  missionPlanRevision: 3,
  objective: "Add business justification",
  businessContext: "Improve governed Mission intake",
  constraints: ["No unrelated changes", "Preserve existing requests"],
  sourceOfTruthRefs: [{ kind: "ISSUE", label: "Golden path", location: "lab-1" }],
  repository: "jaydubya818/mission-control-factory-lab",
  repositoryBranch: "main",
  summary: "Implement the field through UI and API",
  rollbackApproach: "Revert the pull request",
  assertions: [{
    assertionId: "REQ-1",
    title: "Business justification is required",
    outcome: "Empty requests fail",
    verificationMethod: "BROWSER",
    passCondition: "The form blocks an empty value",
    requiredEvidence: "Browser result",
    requiresIndependentValidation: true,
    waiverAllowed: false,
  }],
  workOrderBlueprints: [{
    id: "implement",
    title: "Add the required field",
    desiredOutcome: "Validated UI and API behavior",
    workflowId: "implementation",
    workflowVersion: 1,
    sequence: 1,
    role: "WORKER",
    isMutating: true,
    riskLevel: "MEDIUM",
    constraints: ["Preserve compatibility"],
    requiredApprovals: ["HUMAN_REVIEW"],
    dependsOnBlueprintIds: [],
    assertionIds: ["REQ-1"],
  }],
};

describe("approved Plan Quality Contract projection", () => {
  it("produces one deterministic digest tied to the Plan revision", () => {
    const first = compileApprovedPlanQualityContract(input);
    const reordered = compileApprovedPlanQualityContract({
      ...input,
      constraints: [...input.constraints].reverse(),
    });

    expect(first.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(reordered.digest).toBe(first.digest);
    expect(first.projection.source).toMatchObject({
      missionPlanId: "plan-1",
      missionPlanRevision: 3,
    });
  });

  it("changes when approved quality authority changes", () => {
    const first = compileApprovedPlanQualityContract(input).digest;
    const revised = compileApprovedPlanQualityContract({
      ...input,
      missionPlanRevision: 4,
    }).digest;

    expect(revised).not.toBe(first);
  });
});
