import { describe, expect, it } from "vitest";
import {
  factoryHumanReviewOutcome,
  validateHumanReviewApprovalContext,
  validatePublishContinuation,
} from "../lib/factoryHumanReview.js";

describe("factory human-review continuation", () => {
  it("resumes only an unconditional approval", () => {
    expect(factoryHumanReviewOutcome("APPROVE")).toBe("RESUME_PUBLISH");
    expect(factoryHumanReviewOutcome("APPROVE_WITH_CONDITIONS")).toBe("FAIL_ATTEMPT");
    expect(factoryHumanReviewOutcome("REJECT")).toBe("FAIL_ATTEMPT");
    expect(factoryHumanReviewOutcome("REQUEST_REVISION")).toBe("FAIL_ATTEMPT");
  });

  it("accepts a current approval for the exact paused attempt", () => {
    expect(validateHumanReviewApprovalContext({
      approval: { approvalType: "HUMAN_REVIEW", workflowRunId: "run-1", workOrderRevisionNumber: 2, status: "PENDING" },
      run: {
        _id: "run-1", status: "PAUSED", workOrderRevisionNumber: 2,
        factoryContinuation: { status: "AWAITING_HUMAN_REVIEW", workOrderRevisionNumber: 2 },
      },
      workOrderRevisionNumber: 2,
    })).toEqual({ ok: true });
  });

  it("rejects a stale or cross-attempt approval", () => {
    const result = validateHumanReviewApprovalContext({
      approval: { approvalType: "HUMAN_REVIEW", workflowRunId: "run-old", workOrderRevisionNumber: 1, status: "PENDING" },
      run: {
        _id: "run-1", status: "PAUSED", workOrderRevisionNumber: 2,
        factoryContinuation: { status: "AWAITING_HUMAN_REVIEW", workOrderRevisionNumber: 2 },
      },
      workOrderRevisionNumber: 2,
    });
    expect(result).toEqual({ ok: false, reason: "attempt-mismatch" });
  });

  it("requires an approval-linked VERIFIED receipt for the exact candidate", () => {
    const run = {
      _id: "run-1", status: "PENDING", workOrderRevisionNumber: 2,
      factoryContinuation: {
        status: "READY_TO_PUBLISH", workOrderRevisionNumber: 2,
        verificationReceiptId: "receipt-source", resolvedVerificationReceiptId: "receipt-approved",
        approvalDecisionId: "approval-1", candidateRevision: "head-1",
      },
    };
    const approval = {
      _id: "approval-1", approvalType: "HUMAN_REVIEW", workflowRunId: "run-1",
      workOrderRevisionNumber: 2, status: "APPROVED",
    };
    const sourceReceipt = {
      _id: "receipt-source", workflowRunId: "run-1", workOrderRevisionNumber: 2,
      status: "PENDING", verdict: "REQUIRES_HUMAN_REVIEW", candidateRevision: "head-1",
    };
    const resolvedReceipt = {
      _id: "receipt-approved", workflowRunId: "run-1", workOrderRevisionNumber: 2,
      status: "PASSED", verdict: "VERIFIED", candidateRevision: "head-1",
      metadata: { humanReviewApprovalDecisionId: "approval-1", supersedesVerificationReceiptId: "receipt-source" },
    };

    expect(validatePublishContinuation({
      run, approval, sourceReceipt, resolvedReceipt, workOrderRevisionNumber: 2,
    })).toEqual({ ok: true, candidateRevision: "head-1" });

    expect(validatePublishContinuation({
      run,
      approval,
      sourceReceipt,
      resolvedReceipt: { ...resolvedReceipt, candidateRevision: "head-changed" },
      workOrderRevisionNumber: 2,
    })).toEqual({ ok: false, reason: "resolved-receipt-invalid" });
  });
});
