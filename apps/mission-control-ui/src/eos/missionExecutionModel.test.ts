import { describe, expect, it } from "vitest";
import { deriveMissionExecutionAction } from "./missionExecutionModel";

const base = {
  state: "READY",
  missionEligibility: { eligible: true },
  requiredApprovals: [],
  approvalDecisions: [],
  childTasks: [],
  executionRuns: [],
};

describe("Mission execution next action", () => {
  it("requires an assigned Task before first dispatch", () => {
    expect(deriveMissionExecutionAction(base).action).toBe("CREATE_TASK");
  });

  it("routes a failed attempt into bounded recovery", () => {
    expect(deriveMissionExecutionAction({
      ...base,
      childTasks: [{ status: "READY" }],
      executionRuns: [{ status: "FAILED" }],
    }).action).toBe("RETRY_RUN");
  });

  it("requires a handoff after Work Order acceptance", () => {
    expect(deriveMissionExecutionAction({
      ...base,
      state: "DONE",
      childTasks: [{ status: "DONE" }],
      executionRuns: [{ status: "COMPLETED" }],
    }).action).toBe("RECORD_HANDOFF");
  });

  it("marks accepted and handed-off work complete", () => {
    expect(deriveMissionExecutionAction({
      ...base,
      state: "DONE",
      latestHandoff: { outcome: "COMPLETE" },
    }).action).toBe("COMPLETE");
  });
});
