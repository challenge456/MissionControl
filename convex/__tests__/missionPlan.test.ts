import { describe, expect, it } from "vitest";
import {
  missionBlueprintReleaseKey,
  missionPlanReleaseKey,
  validateMissionPlan,
  type MissionPlanInput,
} from "../lib/missionPlan";

function validPlan(): MissionPlanInput {
  return {
    summary: "Deliver a governed checkout change",
    rollbackApproach: "Disable the feature flag and revert the isolated branch.",
    estimatedCostUsd: 8,
    repository: "jaydubya818/MissionControl",
    repositoryBranch: "main",
    assertions: [
      {
        assertionId: "tests-pass",
        title: "Focused tests pass",
        outcome: "The approved behavior is regression-tested.",
        verificationMethod: "TEST",
        passCondition: "Focused suite exits zero.",
        requiredEvidence: "Test output",
        requiresIndependentValidation: true,
        waiverAllowed: false,
      },
    ],
    workOrderBlueprints: [
      {
        id: "implement",
        title: "Implement checkout change",
        desiredOutcome: "Checkout behavior matches the approved contract.",
        workflowId: "software-delivery",
        workflowVersion: 1,
        sequence: 1,
        role: "WORKER",
        isMutating: true,
        priority: 2,
        riskLevel: "MEDIUM",
        branchStrategy: "isolated-worktree",
        constraints: [],
        requiredApprovals: [],
        implementationPolicy: {
          allowedCommands: ["pnpm test"],
          independentVerification: {
            executable: "pnpm",
            args: ["test"],
            category: "UNIT_TEST",
            commandClass: "TEST",
            evidenceCategory: "TEST_RESULT",
            timeoutMs: 1_800_000,
          },
          maxFilesChanged: 40,
          maxLinesChanged: 3_000,
          maxAttempts: 2,
          timeoutMinutes: 30,
          stopCondition: "Stop after tests pass and the pull request is persisted.",
        },
        dependsOnBlueprintIds: [],
        assertionIds: ["tests-pass"],
      },
      {
        id: "validate",
        title: "Independently validate checkout change",
        desiredOutcome: "The approved assertion is proven by a separate read-only run.",
        workflowId: "software-delivery",
        workflowVersion: 1,
        sequence: 2,
        role: "VALIDATOR",
        isMutating: false,
        priority: 2,
        riskLevel: "MEDIUM",
        constraints: [],
        requiredApprovals: [],
        dependsOnBlueprintIds: ["implement"],
        assertionIds: ["tests-pass"],
      },
    ],
  };
}

describe("Mission plan contract", () => {
  it("accepts a complete plan and generates deterministic release keys", () => {
    expect(validateMissionPlan(validPlan())).toEqual([]);
    expect(missionPlanReleaseKey("plan-1")).toBe("mission-plan:plan-1:release:v1");
    expect(missionBlueprintReleaseKey("plan-1", "implement")).toBe(
      "mission-plan:plan-1:release:v1:work-order:implement"
    );
  });

  it("reports empty contracts and invalid estimates", () => {
    const errors = validateMissionPlan({
      summary: "",
      rollbackApproach: "",
      estimatedCostUsd: -1,
      workOrderBlueprints: [],
      assertions: [],
    });
    expect(errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "summary-required",
      "rollback-required",
      "estimated-cost-invalid",
      "blueprints-required",
      "assertions-required",
    ]));
  });

  it("blocks unknown, self, out-of-order, and cyclic dependencies", () => {
    const plan = validPlan();
    plan.workOrderBlueprints.push({
      ...plan.workOrderBlueprints[0],
      id: "validate-2",
      title: "Validate",
      role: "VALIDATOR",
      isMutating: false,
      sequence: 2,
      dependsOnBlueprintIds: ["validate-2", "missing", "implement"],
      branchStrategy: undefined,
    });
    plan.workOrderBlueprints[0].dependsOnBlueprintIds = ["validate-2"];
    const codes = validateMissionPlan(plan).map((error) => error.code);
    expect(codes).toEqual(expect.arrayContaining([
      "blueprint-dependency-order",
      "blueprint-dependency-self",
      "blueprint-dependency-unknown",
      "blueprint-dependency-cycle",
    ]));
  });

  it("blocks duplicate ordering and incomplete assertion coverage", () => {
    const plan = validPlan();
    plan.assertions.push({ ...plan.assertions[0], assertionId: "browser-proof", title: "Browser proof" });
    plan.workOrderBlueprints.push({
      ...plan.workOrderBlueprints[0],
      id: "extra",
      title: "Extra work",
      sequence: 1,
      assertionIds: [],
    });
    const codes = validateMissionPlan(plan).map((error) => error.code);
    expect(codes).toEqual(expect.arrayContaining([
      "blueprint-sequence-duplicate",
      "blueprint-assertion-required",
      "assertion-uncovered",
    ]));
  });

  it("fails closed when mutating work lacks an explicit implementation policy", () => {
    const plan = validPlan();
    plan.workOrderBlueprints[0].implementationPolicy = undefined;
    const codes = validateMissionPlan(plan).map((error) => error.code);
    expect(codes).toEqual(expect.arrayContaining([
      "implementation-verifier-required",
      "implementation-attempts-invalid",
      "implementation-timeout-invalid",
      "implementation-stop-condition-required",
    ]));
  });

  it("bounds verification payload, recovery attempts, and runtime", () => {
    const plan = validPlan();
    plan.workOrderBlueprints[0].implementationPolicy = {
      allowedCommands: Array.from({ length: 21 }, (_, index) => `check-${index}`),
      independentVerification: {
        executable: "pnpm",
        args: ["test"],
        category: "UNIT_TEST",
        commandClass: "TEST",
        evidenceCategory: "TEST_RESULT",
        timeoutMs: 30 * 60_000 + 1,
      },
      maxFilesChanged: 0,
      maxLinesChanged: 100_001,
      maxAttempts: 11,
      timeoutMinutes: 481,
      stopCondition: "Stop after verification.",
    };
    const codes = validateMissionPlan(plan).map((error) => error.code);
    expect(codes).toEqual(expect.arrayContaining([
      "implementation-verifiers-too-large",
      "independent-verifier-timeout-invalid",
      "implementation-max-files-invalid",
      "implementation-max-lines-invalid",
      "implementation-attempts-invalid",
      "implementation-timeout-invalid",
    ]));
  });

  it("accepts server-owned independent Factory verification without a redundant Validator WorkOrder", () => {
    const plan = validPlan();
    plan.workOrderBlueprints = [plan.workOrderBlueprints[0]];
    expect(validateMissionPlan(plan)).toEqual([]);
  });
});
