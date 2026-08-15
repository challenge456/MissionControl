import { describe, expect, it } from "vitest";
import { verificationContractDigest } from "../verificationIdentity.js";
import { assertVerificationPlanImmutable, freezeVerificationPlan, type VerificationPlanDraft } from "../verificationPlan.js";
import { createGitVerificationSubject } from "../verificationSubject.js";

const contractDigest = verificationContractDigest({ schemaVersion: 2, checks: ["api-check"] });
const subject = createGitVerificationSubject({
  version: 1,
  kind: "GIT_CANDIDATE",
  workOrderId: "wo-1",
  workOrderRevisionNumber: 1,
  verificationContractDigest: contractDigest,
  sourceAttemptId: "source-1",
  repositoryId: "repo-1",
  provider: "GITHUB",
  providerRepositoryId: "provider-repo-1",
  candidateSha: "a".repeat(40),
  treeSha: "b".repeat(40),
  pullRequest: {
    providerPullRequestId: "pr-1",
    number: 1,
    url: "https://github.com/example/repo/pull/1",
    baseRef: "main",
    headRef: "candidate",
    headSha: "a".repeat(40),
    draftAtPublication: true,
  },
});

const draft: VerificationPlanDraft = {
  planVersion: 1,
  workOrderId: "wo-1",
  workOrderRevisionNumber: 1,
  verificationContractDigest: contractDigest,
  sourceAttemptId: "source-1",
  verificationAttemptId: "verify-1",
  verificationSubject: subject,
  generatedBy: {
    factoryDefinitionId: "factory-1",
    factoryDefinitionVersionId: "factory-version-1",
    attemptId: "verify-1",
    executorInvocationId: "invocation-verify-1",
  },
  requirements: [{ id: "req-1", description: "Authenticated request returns 200", source: "WORK_ORDER", criticality: "REQUIRED" }],
  requiredRisks: [{ id: "risk-auth", description: "Authorization boundary regresses", severity: "CRITICAL", source: "WORK_ORDER", affectedAreas: ["api"] }],
  discoveredRisks: [],
  requiredEvidence: [{ id: "api-check", requirementIds: ["req-1"], requiredRiskIds: ["risk-auth"], description: "Prove API authorization behavior", evidenceType: "API_CHECK", required: true }],
  adversarial: { enabled: true, scenarios: [{ id: "invalid-token", description: "Reject malformed token", requirementIds: ["req-1"], riskIds: ["risk-auth"], requiredEvidenceIds: ["api-check"] }] },
  createdAt: 100,
};

const contract = {
  workOrderId: "wo-1",
  workOrderRevisionNumber: 1,
  verificationContractDigest: contractDigest,
  sourceAttemptId: "source-1",
  verificationAttemptId: "verify-1",
  verificationSubjectDigest: subject.digest,
  requiredRequirements: draft.requirements,
  requiredRisks: draft.requiredRisks,
  requiredEvidenceIds: ["api-check"],
};

describe("frozen Verification Plan", () => {
  it("is contract-preserving and digest-bound", () => {
    const plan = freezeVerificationPlan(draft, contract);
    expect(plan.planId).toContain(plan.planDigest.slice(7));
    expect(plan.planDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("rejects omitted checks, rewritten requirements, and risk downgrades", () => {
    expect(() => freezeVerificationPlan({ ...draft, requiredEvidence: [] }, contract)).toThrow(/required evidence api-check/);
    expect(() => freezeVerificationPlan({ ...draft, requirements: [{ ...draft.requirements[0], description: "Looks fine" }] }, contract)).toThrow(/rewritten or downgraded/);
    expect(() => freezeVerificationPlan({ ...draft, requiredRisks: [{ ...draft.requiredRisks[0], severity: "LOW" }] }, contract)).toThrow(/rewritten or downgraded/);
    expect(() => freezeVerificationPlan({ ...draft, requiredRisks: [{ ...draft.requiredRisks[0], affectedAreas: [] }] }, contract)).toThrow(/rewritten or downgraded/);
  });

  it("keeps verifier-discovered risks separate from the acceptance contract", () => {
    expect(() => freezeVerificationPlan({
      ...draft,
      discoveredRisks: [{ id: "risk-auth", description: "duplicate", severity: "HIGH", affectedAreas: [], discoveredBy: "verifier" }],
    }, contract)).toThrow(/both required and discovered/);
  });

  it("cannot change after verification begins", () => {
    const stored = freezeVerificationPlan(draft, contract);
    const proposed = { ...stored, planDigest: `sha256:${"c".repeat(64)}` };
    expect(() => assertVerificationPlanImmutable(stored, proposed, "RUNNING")).toThrow(/immutable/);
    expect(() => freezeVerificationPlan(draft, contract, "RUNNING")).toThrow(/immutable/);
  });
});
