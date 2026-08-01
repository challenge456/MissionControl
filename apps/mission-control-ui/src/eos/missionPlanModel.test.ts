import { describe, expect, it } from "vitest";
import {
  emptyAssertion,
  emptyMissionPlan,
  missionPlanPayload,
  nextPlanItemId,
  summarizePlanDiff,
  validateMissionPlanValues,
} from "./missionPlanModel";

describe("Mission plan model", () => {
  it("creates a deterministic editable scaffold", () => {
    const values = emptyMissionPlan({ workflowId: "delivery", name: "Delivery", version: 3 });
    expect(values.workOrderBlueprints[0]).toMatchObject({
      id: "work-order-1",
      workflowId: "delivery",
      workflowVersion: 3,
      assertionIds: ["assertion-1"],
    });
    expect(values.assertions[0].assertionId).toBe("assertion-1");
  });

  it("trims payload fields and removes duplicate links", () => {
    const values = emptyMissionPlan();
    values.summary = " Summary ";
    values.rollbackApproach = " Roll back ";
    values.workOrderBlueprints[0].id = " work-order-1 ";
    values.workOrderBlueprints[0].assertionIds = ["assertion-1", "assertion-1"];
    values.assertions[0] = { ...emptyAssertion("assertion-1"), title: " Proof ", outcome: " Outcome ", passCondition: " Pass ", requiredEvidence: " Output " };
    expect(missionPlanPayload(values)).toMatchObject({
      summary: "Summary",
      rollbackApproach: "Roll back",
      workOrderBlueprints: [{ id: "work-order-1", assertionIds: ["assertion-1"] }],
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
});
