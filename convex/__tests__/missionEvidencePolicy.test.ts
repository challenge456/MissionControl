import { describe, expect, it } from "vitest";
import { assertionEvidenceCanSatisfy, missionReceiptMatchesExecution } from "../lib/missionExecution";

describe("Mission assertion evidence policy", () => {
  it("allows a linked Worker receipt when independent validation is not required", () => {
    expect(assertionEvidenceCanSatisfy({
      missionRole: "WORKER",
      requiresIndependentValidation: false,
    })).toBe(true);
  });

  it("requires either a Validator or exact Factory-independent verification for independent assertions", () => {
    expect(assertionEvidenceCanSatisfy({
      missionRole: "WORKER",
      requiresIndependentValidation: true,
    })).toBe(false);
    expect(assertionEvidenceCanSatisfy({
      missionRole: "VALIDATOR",
      requiresIndependentValidation: true,
    })).toBe(true);
    expect(assertionEvidenceCanSatisfy({
      missionRole: "WORKER",
      requiresIndependentValidation: true,
      serverDerivedIndependentVerification: true,
    })).toBe(true);
  });

  it("requires the exact completed run and current WorkOrder revision", () => {
    const workOrder = { _id: "work-order-1", missionId: "mission-1", missionRole: "WORKER", currentRevisionNumber: 2 };
    const workflowRun = { _id: "run-2", workOrderId: "work-order-1", missionId: "mission-1", missionRole: "WORKER", status: "COMPLETED", executionBaseSha: "base", headSha: "candidate" };
    const verificationReceipt = { workflowRunId: "run-2", workOrderRevisionNumber: 2, sourceRevision: "base", candidateRevision: "candidate" };
    expect(missionReceiptMatchesExecution({ workOrder, workflowRun, verificationReceipt })).toBe(true);
    expect(missionReceiptMatchesExecution({ workOrder, workflowRun: { ...workflowRun, _id: "run-3" }, verificationReceipt })).toBe(false);
    expect(missionReceiptMatchesExecution({ workOrder, workflowRun, verificationReceipt: { ...verificationReceipt, workOrderRevisionNumber: 1 } })).toBe(false);
    expect(missionReceiptMatchesExecution({ workOrder, workflowRun: { ...workflowRun, status: "FAILED" }, verificationReceipt })).toBe(false);
    expect(missionReceiptMatchesExecution({ workOrder, workflowRun, verificationReceipt: { ...verificationReceipt, candidateRevision: "other" } })).toBe(false);
    expect(missionReceiptMatchesExecution({ workOrder, workflowRun: { ...workflowRun, status: "FAILED" }, verificationReceipt: { ...verificationReceipt, status: "FAILED" } })).toBe(true);
  });
});
