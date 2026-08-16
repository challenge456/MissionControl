import { describe, expect, it } from "vitest";
import {
  emptyAssertion,
  emptyMissionPlan,
  factoryRecipeIdFromMission,
  missionPlanFromFactoryRecipe,
  missionPlanPayload,
  nextPlanItemId,
  summarizePlanDiff,
  updateMissionPlanAssertion,
  validateMissionPlanValues,
} from "./missionPlanModel";
import { getFactoryRecipe } from "../factoryExperience/recipeCatalog";

describe("Mission plan model", () => {
  it("creates a deterministic editable scaffold", () => {
    const values = emptyMissionPlan({ workflowId: "delivery", name: "Delivery", version: 3 });
    expect(values.workOrderBlueprints[0]).toMatchObject({
      id: "work-order-1",
      workflowId: "delivery",
      workflowVersion: 3,
      assertionIds: ["assertion-1"],
      implementationPolicy: {
        allowedCommands: ["git diff --check"],
        maxAttempts: 2,
        timeoutMinutes: 30,
      },
    });
    expect(values.assertions[0].assertionId).toBe("assertion-1");
  });

  it("trims payload fields and removes duplicate links", () => {
    const values = emptyMissionPlan();
    values.summary = " Summary ";
    values.rollbackApproach = " Roll back ";
    values.workOrderBlueprints[0].id = " work-order-1 ";
    values.workOrderBlueprints[0].assertionIds = ["assertion-1", "assertion-1"];
    values.workOrderBlueprints[0].implementationPolicy!.allowedCommands = [" git diff --check ", ""];
    values.assertions[0] = { ...emptyAssertion("assertion-1"), title: " Proof ", outcome: " Outcome ", passCondition: " Pass ", requiredEvidence: " Output " };
    expect(missionPlanPayload(values)).toMatchObject({
      summary: "Summary",
      rollbackApproach: "Roll back",
      workOrderBlueprints: [{ id: "work-order-1", assertionIds: ["assertion-1"], implementationPolicy: { allowedCommands: ["git diff --check"] } }],
      assertions: [{ title: "Proof", outcome: "Outcome", passCondition: "Pass", requiredEvidence: "Output" }],
    });
  });

  it("exposes server-equivalent validation and stable IDs", () => {
    const values = emptyMissionPlan();
    const codes = validateMissionPlanValues(values).map((error) => error.code);
    expect(codes).toContain("summary-required");
    expect(codes).toContain("repository-required");
    expect(nextPlanItemId("work-order", ["work-order-1", "work-order-3"])).toBe("work-order-4");
  });

  it("summarizes additions and field changes across revisions", () => {
    const base = emptyMissionPlan();
    const current = structuredClone(base);
    current.summary = "Revised";
    current.assertions.push(emptyAssertion("assertion-2"));
    expect(summarizePlanDiff(base, current)).toEqual(expect.arrayContaining([
      "Plan summary changed",
      "Assertion added: assertion-2",
    ]));
  });

  it("keeps WorkOrder coverage linked when an assertion ID is renamed", () => {
    const values = emptyMissionPlan();
    const renamed = updateMissionPlanAssertion(values, 0, { assertionId: "exact-scope-proof" });
    expect(renamed.assertions[0].assertionId).toBe("exact-scope-proof");
    expect(renamed.workOrderBlueprints[0].assertionIds).toEqual(["exact-scope-proof"]);
  });

  it("projects recipe intent into a canonical editable Plan without approving it", () => {
    const recipe = getFactoryRecipe("build-test")!;
    const values = missionPlanFromFactoryRecipe({
      recipe,
      missionTitle: "Repair checkout",
      missionObjective: "Fix the checkout regression and prove it with tests.",
      workflow: { workflowId: "bug-fix", name: "Bug fix", version: 4 },
    });
    expect(values.workOrderBlueprints[0]).toMatchObject({
      title: "Build + Test: Repair checkout",
      workflowId: "bug-fix",
      workflowVersion: 4,
      isMutating: true,
      implementationPolicy: { maxAttempts: 3 },
    });
    expect(values.assertions[0]).toMatchObject({
      assertionId: "recipe-verification",
      verificationMethod: "TEST",
    });
  });

  it("keeps read-only recipes non-mutating", () => {
    const recipe = getFactoryRecipe("scout")!;
    const values = missionPlanFromFactoryRecipe({
      recipe,
      missionTitle: "Find the cause",
      missionObjective: "Investigate the reported failure.",
    });
    expect(values.workOrderBlueprints[0]).toMatchObject({
      isMutating: false,
      branchStrategy: undefined,
      implementationPolicy: undefined,
      workflowId: undefined,
    });
  });

  it("reads only known recipe IDs from Mission metadata", () => {
    expect(factoryRecipeIdFromMission({ metadata: { factoryExperience: { selectedRecipeId: "full-sdlc" } } })).toBe("full-sdlc");
    expect(factoryRecipeIdFromMission({ metadata: { factoryExperience: { selectedRecipeId: "unknown" } } })).toBeUndefined();
  });

});
