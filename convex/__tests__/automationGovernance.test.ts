import { describe, expect, it } from "vitest";
import {
  AUTOMATION_CADENCE_MS,
  buildReviewGate,
  calculateAutomationMetrics,
  isAutomationSelfApproval,
  isReviewGateDue,
  reviewGateIdempotencyKey,
  suspensionReason,
} from "../lib/automationGovernance";

const definition = {
  id: "automation-1",
  name: "Weekly release review",
  workflowId: "release-review",
  workflowVersion: "v1",
  scope: "sellerfi/app",
  riskLevel: "MEDIUM" as const,
  requiredApprovalTypes: ["operator"],
  verificationContract: { receipt: "required", independent: true },
  triggerConfig: { cron: "0 8 * * 1", timezone: "America/Los_Angeles" },
};

describe("automation governance", () => {
  it("creates an idempotent read-only LEVEL_1 review gate", () => {
    const first = buildReviewGate(definition, AUTOMATION_CADENCE_MS + 100);
    const retry = buildReviewGate(definition, AUTOMATION_CADENCE_MS + 200);
    expect(first).toMatchObject({
      state: "AWAITING_APPROVAL",
      approvalStatus: "PENDING",
      isMutating: false,
      requiredApprovals: ["operator"],
      workflowId: "release-review",
    });
    expect(first.idempotencyKey).toBe(retry.idempotencyKey);
    expect(first.acceptanceCriteria).toHaveLength(2);
  });

  it("only considers active definitions due", () => {
    expect(isReviewGateDue({ status: "ACTIVE", nextRunAt: 10 }, 10)).toBe(true);
    expect(isReviewGateDue({ status: "PAUSED", nextRunAt: 10 }, 10)).toBe(false);
    expect(isReviewGateDue({ status: "SUSPENDED", nextRunAt: 10 }, 10)).toBe(false);
  });

  it("uses stable cadence keys and explicit suspension rules", () => {
    expect(reviewGateIdempotencyKey("a", 100)).toBe(reviewGateIdempotencyKey("a", 200));
    expect(suspensionReason({ verificationFailed: true })).toBe("Verification failed");
    expect(suspensionReason({ requiredReceiptMissing: true })).toBe("Required receipt is missing");
    expect(suspensionReason({})).toBeNull();
  });

  it("blocks automation self-approval while allowing a human operator", () => {
    expect(isAutomationSelfApproval({
      automationDefinitionId: "automation-1",
      requestedBy: "automation-scheduler",
      approver: "automation-scheduler",
    })).toBe(true);
    expect(isAutomationSelfApproval({
      automationDefinitionId: "automation-1",
      requestedBy: "automation-scheduler",
      approver: "operator-jay",
    })).toBe(false);
  });

  it("calculates exception-first metrics", () => {
    expect(calculateAutomationMetrics({
      definitions: [{ status: "ACTIVE" }, { status: "PAUSED" }, { status: "SUSPENDED" }],
      reviewGates: [{
        state: "AWAITING_APPROVAL",
        approvalStatus: "PENDING",
        verificationStatus: "PENDING",
      }],
    })).toMatchObject({
      active: 1,
      paused: 1,
      suspended: 1,
      waitingApprovals: 1,
      missingReceipts: 0,
    });
  });
});
