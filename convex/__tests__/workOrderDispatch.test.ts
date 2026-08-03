import { describe, expect, it } from "vitest";
import {
  dispatchApprovalAllowed,
  findActiveRun,
  nextStateForRunStatus,
  publicDispatchActorAllowed,
  validateDispatchable,
  validateRetryRequest,
} from "../lib/workOrderDispatch";

describe("public work order dispatch authority", () => {
  it("allows only server-derived human authority on the public mutation", () => {
    expect(publicDispatchActorAllowed("HUMAN")).toBe(true);
    expect(publicDispatchActorAllowed("SYSTEM")).toBe(false);
    expect(publicDispatchActorAllowed("AGENT")).toBe(false);
  });
});

describe("work order dispatch policy", () => {
  it("requires approval for high-risk work orders", () => {
    expect(
      dispatchApprovalAllowed({
        riskLevel: "HIGH",
        approvalStatus: "PENDING",
        requiredApprovals: [],
      })
    ).toBe(false);
  });

  it("allows approved high-risk work orders to dispatch", () => {
    expect(
      dispatchApprovalAllowed({
        riskLevel: "HIGH",
        approvalStatus: "APPROVED",
        requiredApprovals: [],
      })
    ).toBe(true);
  });

  it("finds an active run when one exists", () => {
    expect(findActiveRun([{ status: "COMPLETED" }, { status: "RUNNING" }])?.status).toBe("RUNNING");
  });

  it("blocks dispatch when an active run exists", () => {
    const result = validateDispatchable({
      state: "READY",
      riskLevel: "LOW",
      approvalStatus: "NOT_REQUIRED",
      hasWorkflowId: true,
      activeRunStatuses: ["RUNNING"],
    });

    expect(result).toEqual({ ok: false, reason: "active-run-exists" });
  });

  it("blocks dispatch when no workflow is assigned", () => {
    const result = validateDispatchable({
      state: "READY",
      riskLevel: "LOW",
      approvalStatus: "NOT_REQUIRED",
      hasWorkflowId: false,
      activeRunStatuses: [],
    });

    expect(result).toEqual({ ok: false, reason: "missing-workflow" });
  });

  it("allows redispatch from awaiting verification when no active run exists", () => {
    const result = validateDispatchable({
      state: "AWAITING_VERIFICATION",
      riskLevel: "LOW",
      approvalStatus: "NOT_REQUIRED",
      hasWorkflowId: true,
      activeRunStatuses: [],
    });

    expect(result).toEqual({ ok: true });
  });

  it("allows dispatch from reopened when no active run exists", () => {
    const result = validateDispatchable({
      state: "REOPENED",
      riskLevel: "LOW",
      approvalStatus: "NOT_REQUIRED",
      hasWorkflowId: true,
      activeRunStatuses: [],
    });

    expect(result).toEqual({ ok: true });
  });

  it("blocks dispatch for superseded work", () => {
    const result = validateDispatchable({
      state: "SUPERSEDED",
      riskLevel: "LOW",
      approvalStatus: "NOT_REQUIRED",
      hasWorkflowId: true,
      activeRunStatuses: [],
    });

    expect(result).toEqual({ ok: false, reason: "invalid-state:SUPERSEDED" });
  });
});

describe("work order recovery dispatch", () => {
  it("allows a reasoned retry of a failed run from the same WorkOrder", () => {
    expect(
      validateRetryRequest({
        workOrderId: "wo-1",
        retryReason: "Environment bootstrap was corrected.",
        priorRun: { workOrderId: "wo-1", status: "FAILED" },
      })
    ).toEqual({ ok: true, reason: "Environment bootstrap was corrected." });
  });

  it("rejects retrying a non-failed run", () => {
    expect(
      validateRetryRequest({
        workOrderId: "wo-1",
        retryReason: "Try the run again after review.",
        priorRun: { workOrderId: "wo-1", status: "COMPLETED" },
      })
    ).toEqual({ ok: false, reason: "retry-run-not-failed:COMPLETED" });
  });

  it("rejects a retry across WorkOrders", () => {
    expect(
      validateRetryRequest({
        workOrderId: "wo-1",
        retryReason: "Try the run again after review.",
        priorRun: { workOrderId: "wo-2", status: "FAILED" },
      })
    ).toEqual({ ok: false, reason: "retry-run-work-order-mismatch" });
  });

  it("requires a meaningful recovery reason", () => {
    expect(
      validateRetryRequest({
        workOrderId: "wo-1",
        retryReason: "retry",
        priorRun: { workOrderId: "wo-1", status: "FAILED" },
      })
    ).toEqual({ ok: false, reason: "retry-reason-required" });
  });
});

describe("work order lifecycle synchronization", () => {
  it("moves completed verified work to DONE", () => {
    expect(
      nextStateForRunStatus({
        currentState: "IN_PROGRESS",
        runStatus: "COMPLETED",
        verificationStatus: "PASS",
        approvalStatus: "APPROVED",
      })
    ).toBe("AWAITING_VERIFICATION");
  });

  it("moves completed but unverified work to AWAITING_VERIFICATION", () => {
    expect(
      nextStateForRunStatus({
        currentState: "IN_PROGRESS",
        runStatus: "COMPLETED",
        verificationStatus: "PENDING",
        approvalStatus: "APPROVED",
      })
    ).toBe("AWAITING_VERIFICATION");
  });

  it("moves completed but unapproved work to AWAITING_APPROVAL", () => {
    expect(
      nextStateForRunStatus({
        currentState: "IN_PROGRESS",
        runStatus: "COMPLETED",
        verificationStatus: "PASS",
        approvalStatus: "PENDING",
      })
    ).toBe("AWAITING_APPROVAL");
  });

  it("moves failed work to BLOCKED", () => {
    expect(
      nextStateForRunStatus({
        currentState: "IN_PROGRESS",
        runStatus: "FAILED",
        verificationStatus: "PENDING",
        approvalStatus: "PENDING",
      })
    ).toBe("BLOCKED");
  });

  it("moves canceled work to CANCELED", () => {
    expect(
      nextStateForRunStatus({
        currentState: "DISPATCHED",
        runStatus: "CANCELED",
        verificationStatus: "PENDING",
        approvalStatus: "PENDING",
      })
    ).toBe("CANCELED");
  });

  it("moves paused work to AWAITING_APPROVAL", () => {
    expect(
      nextStateForRunStatus({
        currentState: "IN_PROGRESS",
        runStatus: "PAUSED",
        verificationStatus: "PENDING",
        approvalStatus: "PENDING",
      })
    ).toBe("AWAITING_APPROVAL");
  });
});
