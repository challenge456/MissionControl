import { describe, expect, it } from "vitest";
import {
  assessPrReconciliationCandidate,
  buildChangeReviewLenses,
  buildMutationTestingReport,
  isVerifiedPrLineage,
  isPendingPrReconciliation,
  isProducingAttemptStatus,
  recordedPrLineageBranch,
  parseGitHubPrUrl,
  parseGitHubRepoUrl,
  selectExactPrLineageWorkOrder,
  shouldPreserveManualPrLineage,
} from "../lib/harnessPrChecks";

describe("harnessPrChecks lib", () => {
  it("parses GitHub repo URLs", () => {
    expect(parseGitHubRepoUrl("https://github.com/acme/widgets")).toEqual({
      owner: "acme",
      repo: "widgets",
    });
    expect(parseGitHubPrUrl("https://github.com/acme/widgets/pull/42")?.prNumber).toBe(42);
  });

  it("builds change review lenses from QC signals", () => {
    const lenses = buildChangeReviewLenses({
      qcFindings: [{ severity: "RED", category: "security" }],
      verificationPassRate: 90,
    });
    expect(lenses.find((l) => l.id === "security")?.score).toBeLessThan(90);
    expect(lenses.find((l) => l.id === "custom")?.enabled).toBe(false);
  });

  it("builds mutation testing report with fallback findings", () => {
    const report = buildMutationTestingReport({
      qcFindings: [],
      diffLineCount: 24,
      testPassCount: 3,
      testFailCount: 1,
    });
    expect(report.diffCoveragePct).toBeGreaterThan(0);
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it("never falls back to a recent WorkOrder when PR lineage does not match", () => {
    const candidates = [
      { _id: "older-exact", repository: "acme/widgets", branchStrategy: "feature/exact" },
      { _id: "newer-unrelated", repository: "acme/widgets", branchStrategy: "feature/unrelated" },
    ];
    expect(selectExactPrLineageWorkOrder({
      candidates,
      repository: "https://github.com/acme/widgets.git",
      branch: "refs/heads/feature/exact",
    })?._id).toBe("older-exact");
    expect(selectExactPrLineageWorkOrder({
      candidates,
      repository: "acme/widgets",
      branch: "feature/missing",
    })).toBeNull();
    expect(selectExactPrLineageWorkOrder({
      candidates: [{ _id: "policy-only", repository: "acme/widgets", branchStrategy: "isolated-worktree" }],
      repository: "acme/widgets",
      branch: "feature/missing",
    })).toBeNull();
  });

  it("quarantines ambiguous exact branch matches", () => {
    const candidates = [
      { _id: "one", repository: "acme/widgets", branchStrategy: "feature/shared" },
      { _id: "two", repository: "acme/widgets", metadata: { pullRequestArtifact: { branch: "feature/shared" } } },
    ];
    expect(selectExactPrLineageWorkOrder({
      candidates,
      repository: "acme/widgets",
      branch: "feature/shared",
    })).toBeNull();
  });

  it("uses an exact recorded artifact branch before a branch strategy", () => {
    expect(recordedPrLineageBranch({
      _id: "recorded-artifact",
      branchStrategy: "feature/stale",
      metadata: { pullRequestArtifact: { branch: "refs/heads/feature/current" } },
    })).toBe("feature/current");
  });

  it("does not treat legacy or recency-inferred PR rows as verified lineage", () => {
    expect(isVerifiedPrLineage({ workOrderId: "wo-1" })).toBe(false);
    expect(isVerifiedPrLineage({
      workOrderId: "wo-1",
      metadata: { lineageStatus: "UNCORRELATED" },
    })).toBe(false);
    expect(isVerifiedPrLineage({
      workOrderId: "wo-1",
      metadata: { lineageStatus: "EXPLICIT_ARTIFACT" },
    })).toBe(true);
    expect(isVerifiedPrLineage({
      workOrderId: "wo-1",
      metadata: { lineageStatus: "OPERATOR_RECONCILIATION" },
    })).toBe(true);
    expect(isPendingPrReconciliation({
      metadata: { lineageStatus: "UNCORRELATED" },
    })).toBe(true);
    expect(isPendingPrReconciliation({
      metadata: { lineageStatus: "RECONCILIATION_DISMISSED" },
    })).toBe(false);
  });

  it("explains every exact signal before allowing manual reconciliation", () => {
    const assessment = assessPrReconciliationCandidate({
      evidence: { repoFullName: "acme/widgets", branch: "refs/heads/feature/exact" },
      candidate: {
        _id: "wo-1",
        repository: "https://github.com/acme/widgets.git",
        branchStrategy: "feature/exact",
        state: "IN_PROGRESS",
      },
      hasAttempt: true,
      attemptStatus: "COMPLETED",
    });
    expect(assessment.eligible).toBe(true);
    expect(assessment.signals).toHaveLength(4);

    const blocked = assessPrReconciliationCandidate({
      evidence: { repoFullName: "acme/widgets", branch: "feature/other" },
      candidate: {
        _id: "wo-1",
        repository: "acme/widgets",
        branchStrategy: "feature/exact",
        state: "IN_PROGRESS",
      },
      hasAttempt: false,
    });
    expect(blocked.eligible).toBe(false);
    expect(blocked.blockedReasons).toEqual(expect.arrayContaining([
      expect.stringContaining("Evidence feature/other"),
      expect.stringContaining("No execution Attempt"),
    ]));

    const pendingAttempt = assessPrReconciliationCandidate({
      evidence: { repoFullName: "acme/widgets", branch: "feature/exact" },
      candidate: {
        _id: "wo-1",
        repository: "acme/widgets",
        branchStrategy: "feature/exact",
        state: "READY",
      },
      hasAttempt: true,
      attemptStatus: "PENDING",
    });
    expect(pendingAttempt.eligible).toBe(false);
    expect(pendingAttempt.blockedReasons).toContain("Attempt state cannot have produced evidence: PENDING");
  });

  it("preserves an immutable manual decision whenever the same head is re-ingested", () => {
    expect(shouldPreserveManualPrLineage("OPERATOR_RECONCILIATION", "UNCORRELATED")).toBe(true);
    expect(shouldPreserveManualPrLineage("RECONCILIATION_DISMISSED", "UNCORRELATED")).toBe(true);
    expect(shouldPreserveManualPrLineage("EXACT_BRANCH", "UNCORRELATED")).toBe(false);
    expect(shouldPreserveManualPrLineage("OPERATOR_RECONCILIATION", "EXACT_BRANCH")).toBe(true);
  });

  it("requires an Attempt state capable of producing evidence", () => {
    expect(isProducingAttemptStatus("RUNNING")).toBe(true);
    expect(isProducingAttemptStatus("COMPLETED")).toBe(true);
    expect(isProducingAttemptStatus("FAILED")).toBe(true);
    expect(isProducingAttemptStatus("PENDING")).toBe(false);
    expect(isProducingAttemptStatus("CANCELED")).toBe(false);
    expect(isProducingAttemptStatus(undefined)).toBe(false);
  });
});
