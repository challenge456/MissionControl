import { describe, expect, it } from "vitest";
import { evaluateCurrentVerificationEligibility } from "../verificationCurrentness.js";
import { verificationContractDigest } from "../verificationIdentity.js";
import { createAutomationVerificationSubject, createGitVerificationSubject, type VerificationSubject } from "../verificationSubject.js";

const now = 10_000;
const contractDigest = verificationContractDigest({ schemaVersion: 2, checks: ["api"] });

function gitSubject(sourceAttemptId = "source-a", candidateSha = "a".repeat(40)) {
  return createGitVerificationSubject({
    version: 1,
    kind: "GIT_CANDIDATE",
    workOrderId: "wo-1",
    workOrderRevisionNumber: 1,
    verificationContractDigest: contractDigest,
    sourceAttemptId,
    repositoryId: "repo-1",
    provider: "GITHUB",
    providerRepositoryId: "provider-repo-1",
    candidateSha,
    treeSha: candidateSha === "a".repeat(40) ? "b".repeat(40) : "d".repeat(40),
    pullRequest: {
      providerPullRequestId: "provider-pr-1",
      number: 91,
      url: "https://github.com/example/repo/pull/91",
      baseRef: "main",
      headRef: "candidate",
      headSha: candidateSha,
      draftAtPublication: true,
    },
  });
}

function fixture(subject: VerificationSubject = gitSubject(), sourceReadyAt = 100) {
  const tuple = {
    workOrderId: "wo-1",
    workOrderRevisionNumber: 1,
    verificationContractDigest: contractDigest,
    sourceAttemptId: subject.sourceAttemptId,
    verificationSubjectDigest: subject.digest,
  };
  return {
    workOrderId: "wo-1",
    workOrderRevisionNumber: 1,
    verificationContractDigest: contractDigest,
    sourceAttempts: [{
      id: subject.sourceAttemptId,
      repositoryId: subject.kind === "GIT_CANDIDATE" ? subject.repositoryId : undefined,
      attemptPurpose: subject.kind === "AUTOMATION_RUN" ? "AUTOMATION" as const : "IMPLEMENTATION" as const,
      status: "COMPLETED",
      candidateReadyAt: sourceReadyAt,
      verificationSubject: subject,
    }],
    verificationAttempts: [{ id: "verify-a", attemptPurpose: "VERIFICATION" as const, status: "COMPLETED", createdAt: 200, verificationAttemptBinding: tuple }],
    verificationResults: [{
      id: "result-a",
      workflowRunId: "verify-a",
      ...tuple,
      status: "COMPLETED" as const,
      verdict: "VERIFIED" as const,
      independenceValid: true,
      verificationPlanId: "plan-a",
      verificationPlanDigest: `sha256:${"e".repeat(64)}`,
      createdAt: 300,
      completedAt: 301,
    }],
    verificationReceipts: [{
      id: "receipt-a",
      verificationRunId: "result-a",
      verificationAttemptId: "verify-a",
      verificationPlanId: "plan-a",
      verificationPlanDigest: `sha256:${"e".repeat(64)}`,
      verificationSubjectId: subject.subjectId,
      ...tuple,
      status: "PASSED" as const,
      verdict: "VERIFIED" as const,
      independenceValid: true,
      recordedAt: 400,
      validUntil: now + 1,
    }],
    providerHeads: subject.kind === "GIT_CANDIDATE" ? [{
      provider: "GITHUB" as const,
      providerRepositoryId: subject.providerRepositoryId,
      providerPullRequestId: subject.pullRequest.providerPullRequestId,
      pullRequestNumber: subject.pullRequest.number,
      pullRequestUrl: subject.pullRequest.url,
      state: "OPEN" as const,
      draft: true,
      headSha: subject.candidateSha,
      syncedAt: 500,
      expiresAt: now + 1,
    }] : [],
    now,
  };
}

describe("exact-current verification acceptance eligibility", () => {
  it("allows only the exact current software tuple with GitHub PR lineage", () => {
    const result = evaluateCurrentVerificationEligibility(fixture());
    expect(result).toMatchObject({ eligible: true, current: true, sourceAttemptId: "source-a", verificationAttemptId: "verify-a" });
  });

  it("requires an exact source repository and an expiring trusted GitHub projection", () => {
    const data = fixture();
    const wrongRepository = evaluateCurrentVerificationEligibility({
      ...data,
      sourceAttempts: data.sourceAttempts.map((attempt) => ({ ...attempt, repositoryId: "repo-other" })),
    });
    const noProjectionTtl = evaluateCurrentVerificationEligibility({
      ...data,
      providerHeads: data.providerHeads.map(({ expiresAt: _expiresAt, ...projection }) => projection),
    });
    expect(wrongRepository.eligible).toBe(false);
    expect(noProjectionTtl.eligible).toBe(false);
  });

  it("keeps a historical pass but makes it ineligible after WorkOrder revision or contract change", () => {
    const changedRevision = evaluateCurrentVerificationEligibility({ ...fixture(), workOrderRevisionNumber: 2 });
    const changedContract = evaluateCurrentVerificationEligibility({ ...fixture(), verificationContractDigest: `sha256:${"f".repeat(64)}` });
    expect(changedRevision.eligible).toBe(false);
    expect(changedContract.eligible).toBe(false);
    expect(fixture().verificationResults[0].verdict).toBe("VERIFIED");
  });

  it("never lets Candidate A qualify a newer Candidate B", () => {
    const candidateA = gitSubject("source-a", "a".repeat(40));
    const candidateB = gitSubject("source-b", "c".repeat(40));
    const data = fixture(candidateA);
    const result = evaluateCurrentVerificationEligibility({
      ...data,
      sourceAttempts: [
        ...data.sourceAttempts,
        { id: "source-b", repositoryId: candidateB.repositoryId, attemptPurpose: "IMPLEMENTATION", status: "COMPLETED", candidateReadyAt: 900, verificationSubject: candidateB },
      ],
      providerHeads: [{ ...data.providerHeads[0], headSha: candidateB.candidateSha, syncedAt: 901 }],
    });
    expect(result.eligible).toBe(false);
    expect(result.sourceAttemptId).toBe("source-b");
    expect(data.verificationResults[0].verdict).toBe("VERIFIED");
  });

  it("does not fall back to an older pass while a newer exact Verification Attempt is running", () => {
    const data = fixture();
    const result = evaluateCurrentVerificationEligibility({
      ...data,
      verificationAttempts: [
        ...data.verificationAttempts,
        { ...data.verificationAttempts[0], id: "verify-b", status: "RUNNING", createdAt: 900 },
      ],
    });
    expect(result.eligible).toBe(false);
    expect(result.verificationAttemptId).toBe("verify-b");
    expect(result.reasons.join(" ")).toContain("older passing results cannot be reused");
  });

  it("fails closed for legacy attempts, receipts, and producer independence flags", () => {
    const data = fixture();
    const legacy = evaluateCurrentVerificationEligibility({
      ...data,
      sourceAttempts: data.sourceAttempts.map(({ attemptPurpose: _purpose, ...attempt }) => attempt),
      verificationAttempts: data.verificationAttempts.map(({ attemptPurpose: _purpose, verificationAttemptBinding: _binding, ...attempt }) => attempt),
      verificationResults: data.verificationResults.map(({ independenceValid: _independence, ...result }) => result),
      verificationReceipts: data.verificationReceipts.map(({ independenceValid: _independence, ...receipt }) => ({ ...receipt, producer: { independent: true } })),
    });
    expect(legacy.eligible).toBe(false);
  });

  it("supports immutable automation snapshot identity and stales changed output", () => {
    const automation = createAutomationVerificationSubject({
      version: 1,
      kind: "AUTOMATION_RUN",
      workOrderId: "wo-1",
      workOrderRevisionNumber: 1,
      verificationContractDigest: contractDigest,
      sourceAttemptId: "automation-a",
      automationWorkflowRunId: "automation-a",
      automationDefinitionId: "definition-1",
      automationDefinitionVersion: 1,
      adapterIdentity: { adapterType: "csv/v1", executionBindingDigest: `sha256:${"1".repeat(64)}`, outputContractDigest: `sha256:${"2".repeat(64)}` },
      outputSnapshotArtifactId: "snapshot-a",
      outputSnapshotContentHash: `sha256:${"3".repeat(64)}`,
      outputArtifactIds: ["output-a"],
      outputArtifactContentHashes: [`sha256:${"4".repeat(64)}`],
    });
    const passing = fixture(automation);
    expect(evaluateCurrentVerificationEligibility(passing).eligible).toBe(true);
    const changed = createAutomationVerificationSubject({
      ...automation,
      subjectId: undefined,
      digest: undefined,
      sourceAttemptId: "automation-b",
      automationWorkflowRunId: "automation-b",
      outputSnapshotArtifactId: "snapshot-b",
      outputSnapshotContentHash: `sha256:${"5".repeat(64)}`,
    } as any);
    const stale = evaluateCurrentVerificationEligibility({
      ...passing,
      sourceAttempts: [...passing.sourceAttempts, { id: "automation-b", attemptPurpose: "AUTOMATION", status: "COMPLETED", candidateReadyAt: 900, verificationSubject: changed }],
    });
    expect(stale.eligible).toBe(false);
    expect(stale.sourceAttemptId).toBe("automation-b");
  });
});
