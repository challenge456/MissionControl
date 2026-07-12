import { describe, expect, it } from "vitest";
import { countActiveWorkOrders, isRunNeedingAttention, summarizeFactoryMetrics } from "../lib/factoryOverview";

describe("factory overview helpers", () => {
  it("counts active work orders across operational states", () => {
    expect(countActiveWorkOrders([
      { state: "READY" },
      { state: "BLOCKED" },
      { state: "DONE" },
      { state: "SUPERSEDED" },
    ])).toBe(2);
  });

  it("flags runs needing attention", () => {
    expect(isRunNeedingAttention({ status: "FAILED" })).toBe(true);
    expect(isRunNeedingAttention({ status: "RUNNING", retryCount: 1 })).toBe(true);
    expect(isRunNeedingAttention({ status: "RUNNING", humanInterventions: 1 })).toBe(true);
    expect(isRunNeedingAttention({ status: "RUNNING", retryCount: 0, humanInterventions: 0 })).toBe(false);
  });

  it("summarizes factory metrics", () => {
    expect(summarizeFactoryMetrics({
      workOrders: [
        { state: "READY", verificationStatus: "PENDING", acceptedRevisionNumber: null },
        { state: "BLOCKED", verificationStatus: "FAIL", acceptedRevisionNumber: null },
        { state: "AWAITING_APPROVAL", verificationStatus: "PENDING", acceptedRevisionNumber: null },
        { state: "DONE", verificationStatus: "PASS", acceptedRevisionNumber: 2 },
      ],
      approvalsPending: 3,
      staleEvidence: 2,
      runsNeedingAttention: 1,
    })).toEqual({
      activeWorkOrders: 3,
      blockedWorkOrders: 1,
      awaitingApproval: 1,
      staleEvidence: 2,
      runsNeedingAttention: 1,
      recentlyAccepted: 1,
      verificationFailures: 1,
      approvalsPending: 3,
    });
  });
});
