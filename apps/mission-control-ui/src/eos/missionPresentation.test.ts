import { describe, expect, it } from "vitest";
import { presentMissionState, type MissionState } from "./missionPresentation";

describe("Mission presentation", () => {
  it.each<[MissionState, string]>([
    ["DRAFT", "Planning not started"],
    ["PLANNING", "Planning"],
    ["AWAITING_PLAN_APPROVAL", "Plan approval required"],
    ["READY", "Ready"],
    ["IN_PROGRESS", "In progress"],
    ["BLOCKED", "Needs attention"],
    ["AWAITING_VALIDATION", "Validation required"],
    ["AWAITING_ACCEPTANCE", "Acceptance required"],
    ["DONE", "Validated"],
    ["CANCELED", "Canceled"],
    ["SUPERSEDED", "Superseded"],
  ])("projects %s truthfully", (state, expectedHealth) => {
    expect(presentMissionState(state).health).toBe(expectedHealth);
  });

  it("never projects a draft as in progress", () => {
    const draft = presentMissionState("DRAFT");
    expect(draft.label).toBe("Draft");
    expect(draft.health).not.toBe("In progress");
  });
});
