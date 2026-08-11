import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewEvidencePackage, type ReviewEvidencePackageData } from "./ReviewEvidencePackage";

const ready: ReviewEvidencePackageData = {
  status: "READY",
  summary: "Exact-head CI and every criterion have accepted evidence.",
  nextAction: "Review and merge manually.",
  blockers: [],
  identity: { runId: "run-1", workOrderId: "wo-1", workOrderRevisionNumber: 2, repositoryId: "repo-1", branch: "codex/work", baseSha: "base", headSha: "head", pullRequestUrl: "https://github.com/acme/repo/pull/1", pullRequestNumber: 1 },
  ci: { status: "PASS", runUrl: "https://github.com/acme/repo/actions/1", evaluationId: "check-1", headSha: "head", prState: "OPEN", lenses: [] },
  criteria: [{ id: "tests", title: "Tests pass", verificationMethod: "TEST", status: "PASS", receiptId: "receipt-1", verifier: "validator:ci", result: "454 tests passed", evidenceLocation: null, validUntil: null, integrityIssue: null }],
  changedFiles: ["src/feature.ts"], deviations: [], failedChecks: [], risks: [], rollbackApproach: "Revert the PR.", recovery: { attempts: 2, staleRecoveries: 1 },
};

describe("ReviewEvidencePackage", () => {
  it("presents exact-head, criterion, rollback, and recovery evidence when ready", () => {
    render(<ReviewEvidencePackage review={ready} />);
    expect(screen.getByText("READY")).toBeInTheDocument();
    expect(screen.getByText("Tests pass")).toBeInTheDocument();
    expect(screen.getByText("validator:ci", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("Revert the PR.")).toBeInTheDocument();
    expect(screen.getByText("2 / 1")).toBeInTheDocument();
  });

  it("keeps blocker reasons and missing evidence visible", () => {
    render(<ReviewEvidencePackage review={{ ...ready, status: "BLOCKED", summary: "One blocker.", nextAction: "Fix CI.", blockers: ["Exact-head GitHub CI is failing."], ci: { ...ready.ci, status: "FAIL" } }} />);
    expect(screen.getByText("BLOCKED")).toBeInTheDocument();
    expect(screen.getByText(/Exact-head GitHub CI is failing/)).toBeInTheDocument();
    expect(screen.getByText("Fix CI.")).toBeInTheDocument();
  });

  it("explains when the execution worker attempted to verify its own work", () => {
    render(<ReviewEvidencePackage review={{
      ...ready,
      status: "BLOCKED",
      summary: "One blocker.",
      nextAction: "Obtain independent verification.",
      blockers: ["Tests pass: independent verification is required."],
      criteria: [{
        ...ready.criteria[0],
        status: "UNKNOWN",
        verifier: "worker:factory-1",
        integrityIssue: "Verifier matches the execution worker; independent verification is required.",
      }],
    }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("independent verification is required");
  });
});
