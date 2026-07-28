import { describe, expect, it } from "vitest";
import {
  canTransitionMission,
  evaluateMissionAcceptance,
  validateMissionHandoff,
  validateMissionWorkOrderDispatch,
} from "../lib/missionGovernance";

describe("mission governance", () => {
  it("only allows declared lifecycle transitions", () => {
    expect(canTransitionMission("AWAITING_PLAN_APPROVAL", "READY")).toBe(true);
    expect(canTransitionMission("DRAFT", "DONE")).toBe(false);
  });

  it("blocks dispatch before a plan is approved", () => {
    expect(validateMissionWorkOrderDispatch({
      missionState: "READY", planApproved: false, executionPolicy: "SERIAL_MUTATIONS",
      workOrderReleased: true, isMutating: true, hasActiveMutatingWorkOrder: false,
      predecessorHandoffValid: true, budgetRemaining: true, correctiveIterationsRemaining: true,
    })).toEqual({ ok: false, reason: "plan-not-approved" });
  });

  it("serializes repository-changing work", () => {
    expect(validateMissionWorkOrderDispatch({
      missionState: "IN_PROGRESS", planApproved: true, executionPolicy: "SERIAL_MUTATIONS",
      workOrderReleased: true, isMutating: true, hasActiveMutatingWorkOrder: true,
      predecessorHandoffValid: true, budgetRemaining: true, correctiveIterationsRemaining: true,
    })).toEqual({ ok: false, reason: "active-mutating-work-order-exists" });
  });

  it("allows bounded read-only work while a mutation is active", () => {
    expect(validateMissionWorkOrderDispatch({
      missionState: "IN_PROGRESS", planApproved: true, executionPolicy: "SERIAL_MUTATIONS",
      workOrderReleased: true, isMutating: false, hasActiveMutatingWorkOrder: true,
      predecessorHandoffValid: true, budgetRemaining: true, correctiveIterationsRemaining: true,
    })).toEqual({ ok: true });
  });

  it("rejects a complete handoff with unknown assertions", () => {
    expect(validateMissionHandoff({
      role: "WORKER", outcome: "COMPLETE", completedAssertionIds: ["a-1"],
      incompleteAssertionIds: [], unknownAssertionIds: ["a-2"],
      commands: [{ command: "pnpm test", exitCode: 0 }], knownRisks: [], nextAction: "Validate the result",
    })).toEqual({ ok: false, reason: "complete-handoff-has-open-assertions" });
  });

  it("requires independent validation before acceptance", () => {
    const result = evaluateMissionAcceptance({
      assertions: [{ id: "a-1", status: "PASS", requiresIndependentValidation: true }],
    });
    expect(result.eligible).toBe(false);
    expect(result.unverifiedAssertionIds).toEqual(["a-1"]);
  });

  it("allows a fully evidenced contract", () => {
    expect(evaluateMissionAcceptance({
      assertions: [{ id: "a-1", status: "PASS", requiresIndependentValidation: true, validatorRunId: "run-1" }],
    }).eligible).toBe(true);
  });
});
