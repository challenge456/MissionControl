import { describe, expect, it } from "vitest";
import {
  buildChangeReviewLenses,
  buildMutationTestingReport,
  isVerifiedPrLineage,
  recordedPrLineageBranch,
  parseGitHubPrUrl,
  parseGitHubRepoUrl,
  selectExactPrLineageWorkOrder,
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
  });
});
