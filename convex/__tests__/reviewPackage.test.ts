import { describe, expect, it } from "vitest";
import { buildReviewPackage } from "../lib/reviewPackage";

const base = {
  now: 100,
  run: {
    status: "COMPLETED",
    runId: "run-1",
    workOrderRevisionNumber: 2,
    repositoryId: "repo-1",
    branch: "codex/work",
    executionBaseSha: "base",
    headSha: "head",
    pullRequestUrl: "https://github.com/acme/repo/pull/1",
    pullRequestNumber: 1,
  },
  workOrder: {
    _id: "wo-1",
    currentRevisionNumber: 2,
    acceptanceCriteria: [{ id: "criterion-1", title: "Tests pass", verificationMethod: "TEST" }],
  },
  receipts: [{
    _id: "receipt-1",
    acceptanceCriterionId: "criterion-1",
    status: "PASSED",
    verifier: "validator:ci",
    linkedRunArtifactIds: ["artifact-1"],
    workOrderRevisionNumber: 2,
    recordedAt: 90,
  }],
  prChecks: [{
    _id: "check-1",
    prUrl: "https://github.com/acme/repo/pull/1",
    headSha: "head",
    prState: "OPEN" as const,
    ciStatus: "PASS" as const,
    syncedAt: 95,
  }],
  events: [],
  fileChanges: [{ repositoryPath: "src/feature.ts" }],
  rollbackApproach: "Revert the pull request.",
};

describe("unified review package", () => {
  it("reports ready only for exact-head CI and complete criterion evidence", () => {
    const review = buildReviewPackage(base);
    expect(review.status).toBe("READY");
    expect(review.criteria[0]).toMatchObject({ status: "PASS", verifier: "validator:ci" });
    expect(review.identity.headSha).toBe("head");
  });

  it("ignores WorkOrder-level receipts when projecting criterion evidence", () => {
    const review = buildReviewPackage({
      ...base,
      receipts: [
        ...base.receipts,
        {
          _id: "receipt-overall",
          status: "PASSED",
          verifier: "verification-engine",
          linkedRunArtifactIds: ["artifact-overall"],
          workOrderRevisionNumber: 2,
          recordedAt: 99,
        },
      ],
    });

    expect(review.status).toBe("READY");
    expect(review.criteria[0]).toMatchObject({
      receiptId: "receipt-1",
      status: "PASS",
    });
  });

  it("fails closed for stale evidence, policy deviation, or mismatched CI head", () => {
    const review = buildReviewPackage({
      ...base,
      receipts: [{ ...base.receipts[0], validUntil: 99 }],
      prChecks: [{ ...base.prChecks[0], headSha: "older-head" }],
      events: [{ eventType: "POLICY_DEVIATION", status: "FAILED", sequenceNumber: 4, errorSummary: "Out-of-scope file" }],
    });
    expect(review.status).toBe("BLOCKED");
    expect(review.blockers).toEqual(expect.arrayContaining([
      "Tests pass: evidence is stale.",
      "1 unresolved policy deviation(s) are recorded.",
      "Exact-head GitHub CI evidence is missing.",
    ]));
  });

  it("does not accept a worker-style receipt without verifier identity and linked evidence", () => {
    const review = buildReviewPackage({
      ...base,
      receipts: [{
        acceptanceCriterionId: "criterion-1",
        status: "PASSED",
        recordedAt: 90,
      }],
    });
    expect(review.status).toBe("BLOCKED");
    expect(review.criteria[0].status).toBe("UNKNOWN");
  });

  it("blocks self-verification by the worker that claimed the execution", () => {
    const review = buildReviewPackage({
      ...base,
      run: { ...base.run, executionClaimedBy: "worker:factory-1" },
      receipts: [{ ...base.receipts[0], verifier: "worker:factory-1" }],
    });

    expect(review.status).toBe("BLOCKED");
    expect(review.criteria[0]).toMatchObject({
      status: "UNKNOWN",
      integrityIssue: "Verifier matches the execution worker; independent verification is required.",
    });
    expect(review.blockers).toContain(
      "Tests pass: Verifier matches the execution worker; independent verification is required.",
    );
  });

  it("requires an open pull request and fails closed when provider state is absent", () => {
    const closed = buildReviewPackage({
      ...base,
      prChecks: [{ ...base.prChecks[0], prState: "CLOSED" as const }],
    });
    expect(closed.status).toBe("BLOCKED");
    expect(closed.blockers).toContain("Pull request is closed; an open review candidate is required.");

    const unknown = buildReviewPackage({
      ...base,
      prChecks: [{ ...base.prChecks[0], prState: undefined }],
    });
    expect(unknown.status).toBe("INCOMPLETE");
    expect(unknown.blockers).toContain("Pull-request open-state evidence is missing.");
  });

  it("keeps in-progress and missing records incomplete rather than overstating failure", () => {
    const review = buildReviewPackage({
      ...base,
      run: { status: "RUNNING", runId: "run-2" },
      receipts: [],
      prChecks: [],
      fileChanges: [],
      rollbackApproach: null,
    });
    expect(review.status).toBe("INCOMPLETE");
    expect(review.nextAction).toBe("Attempt has not completed.");
  });
});
