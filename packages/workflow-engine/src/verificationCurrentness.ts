import { tupleMatches, type VerificationIdentityTuple } from "./verificationIndependence.js";
import type { VerificationSubject } from "./verificationSubject.js";

export type CurrentVerificationSourceAttempt = {
  id: string;
  repositoryId?: string;
  attemptPurpose?: "IMPLEMENTATION" | "VERIFICATION" | "AUTOMATION";
  status: string;
  candidateReadyAt?: number;
  verificationSubject?: VerificationSubject;
};

export type CurrentVerificationAttempt = {
  id: string;
  attemptPurpose?: "IMPLEMENTATION" | "VERIFICATION" | "AUTOMATION";
  status: string;
  createdAt: number;
  supersededAt?: number;
  verificationAttemptBinding?: VerificationIdentityTuple;
};

export type StoredVerificationResult = VerificationIdentityTuple & {
  id: string;
  workflowRunId: string;
  status: "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED";
  verdict?: "VERIFIED" | "NOT_VERIFIED" | "BLOCKED" | "REQUIRES_HUMAN_REVIEW";
  independenceValid?: boolean;
  verificationPlanId?: string;
  verificationPlanDigest?: string;
  createdAt: number;
  completedAt?: number;
  invalidatedAt?: number;
};

export type StoredVerificationReceipt = VerificationIdentityTuple & {
  id: string;
  verificationRunId: string;
  verificationAttemptId: string;
  verificationPlanId: string;
  verificationPlanDigest: string;
  verificationSubjectId: string;
  status: "PENDING" | "PASSED" | "FAILED" | "WAIVED" | "STALE";
  verdict?: "VERIFIED" | "NOT_VERIFIED" | "BLOCKED" | "REQUIRES_HUMAN_REVIEW";
  independenceValid?: boolean;
  recordedAt: number;
  validUntil?: number;
  invalidatedAt?: number;
};

export type GitProviderHeadProjection = {
  provider: "GITHUB";
  providerRepositoryId: string;
  providerPullRequestId: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  draft: boolean;
  headSha: string;
  syncedAt: number;
  expiresAt?: number;
};

export type CurrentVerificationEligibility = {
  eligible: boolean;
  current: boolean;
  exactIdentity?: VerificationIdentityTuple;
  sourceAttemptId?: string;
  verificationAttemptId?: string;
  verificationRunId?: string;
  verificationReceiptId?: string;
  historicalVerdict?: StoredVerificationResult["verdict"];
  reasons: string[];
};

/**
 * Canonical policy-v2 acceptance eligibility helper.
 *
 * This intentionally chooses the newest candidate and newest exact-bound
 * Verification Attempt before it looks at a verdict. It never falls back to an
 * older pass.
 */
export function evaluateCurrentVerificationEligibility(input: {
  workOrderId: string;
  workOrderRevisionNumber: number;
  verificationContractDigest?: string;
  sourceAttempts: CurrentVerificationSourceAttempt[];
  verificationAttempts: CurrentVerificationAttempt[];
  verificationResults: StoredVerificationResult[];
  verificationReceipts: StoredVerificationReceipt[];
  providerHeads?: GitProviderHeadProjection[];
  now: number;
}): CurrentVerificationEligibility {
  if (!input.verificationContractDigest) return denied("Current WorkOrder has no persisted verification contract digest.");
  const source = [...input.sourceAttempts]
    .filter((attempt) => attempt.candidateReadyAt && attempt.status === "COMPLETED"
      && (attempt.attemptPurpose === "IMPLEMENTATION" || attempt.attemptPurpose === "AUTOMATION"))
    .sort((left, right) => (right.candidateReadyAt ?? 0) - (left.candidateReadyAt ?? 0))[0];
  if (!source?.verificationSubject) return denied("No completed current source Attempt has an immutable Verification Subject.");
  const subject = source.verificationSubject;
  const exactIdentity: VerificationIdentityTuple = {
    workOrderId: input.workOrderId,
    workOrderRevisionNumber: input.workOrderRevisionNumber,
    verificationContractDigest: input.verificationContractDigest,
    sourceAttemptId: source.id,
    verificationSubjectDigest: subject.digest,
  };
  if (subject.workOrderId !== input.workOrderId || subject.workOrderRevisionNumber !== input.workOrderRevisionNumber
    || subject.verificationContractDigest !== input.verificationContractDigest || subject.sourceAttemptId !== source.id) {
    return denied("Current source Attempt subject is stale for the WorkOrder revision or verification contract.", {
      exactIdentity,
      sourceAttemptId: source.id,
    });
  }
  if (subject.kind === "GIT_CANDIDATE" && source.repositoryId !== subject.repositoryId) {
    return denied("Current source Attempt repository does not match the immutable Git subject.", {
      exactIdentity,
      sourceAttemptId: source.id,
    });
  }

  const verificationAttempt = [...input.verificationAttempts]
    .filter((attempt) => attempt.attemptPurpose === "VERIFICATION" && !attempt.supersededAt
      && attempt.verificationAttemptBinding && tupleMatches(attempt.verificationAttemptBinding, exactIdentity))
    .sort((left, right) => right.createdAt - left.createdAt)[0];
  if (!verificationAttempt) return denied("No Verification Attempt is bound to the exact current subject.", {
    exactIdentity,
    sourceAttemptId: source.id,
  });
  if (verificationAttempt.status !== "COMPLETED") return denied(`Newest exact Verification Attempt is ${verificationAttempt.status}; older passing results cannot be reused.`, {
    exactIdentity,
    sourceAttemptId: source.id,
    verificationAttemptId: verificationAttempt.id,
  });

  const result = [...input.verificationResults]
    .filter((candidate) => candidate.workflowRunId === verificationAttempt.id && tupleMatches(candidate, exactIdentity))
    .sort((left, right) => right.createdAt - left.createdAt)[0];
  if (!result) return denied("Newest exact Verification Attempt has no matching Verification Result.", {
    exactIdentity,
    sourceAttemptId: source.id,
    verificationAttemptId: verificationAttempt.id,
  });
  const context = {
    exactIdentity,
    sourceAttemptId: source.id,
    verificationAttemptId: verificationAttempt.id,
    verificationRunId: result.id,
    historicalVerdict: result.verdict,
  };
  if (result.invalidatedAt) return denied("Exact Verification Result was invalidated.", context);
  if (result.status !== "COMPLETED") return denied(`Exact Verification Result lifecycle is ${result.status}.`, context);
  if (result.verdict !== "VERIFIED") return denied(`Exact Verification Result is ${result.verdict ?? "missing a verdict"}.`, context);
  if (result.independenceValid !== true) return denied("Exact Verification Result lacks server-derived independence.", context);
  if (!result.verificationPlanId || !result.verificationPlanDigest) return denied("Exact Verification Result lacks frozen Verification Plan identity.", context);

  const receipt = [...input.verificationReceipts]
    .filter((candidate) => candidate.verificationRunId === result.id
      && candidate.verificationAttemptId === verificationAttempt.id
      && candidate.verificationPlanId === result.verificationPlanId
      && candidate.verificationPlanDigest === result.verificationPlanDigest
      && candidate.verificationSubjectId === subject.subjectId
      && tupleMatches(candidate, exactIdentity))
    .sort((left, right) => right.recordedAt - left.recordedAt)[0];
  if (!receipt) return denied("Exact Verification Result has no matching WorkOrder verification receipt.", context);
  const receiptContext = { ...context, verificationReceiptId: receipt.id };
  if (receipt.status !== "PASSED" || receipt.verdict !== "VERIFIED" || receipt.independenceValid !== true) {
    return denied("Exact WorkOrder verification receipt is not a passing independent receipt.", receiptContext);
  }
  if (receipt.invalidatedAt || (receipt.validUntil && receipt.validUntil <= input.now)) {
    return denied("Exact WorkOrder verification receipt is stale or expired.", receiptContext);
  }

  if (subject.kind === "GIT_CANDIDATE") {
    const providerHead = [...(input.providerHeads ?? [])]
      .filter((candidate) => candidate.provider === subject.provider
        && candidate.providerRepositoryId === subject.providerRepositoryId
        && candidate.providerPullRequestId === subject.pullRequest.providerPullRequestId)
      .sort((left, right) => right.syncedAt - left.syncedAt)[0];
    if (!providerHead) return denied("No trusted GitHub App projection exists for the exact pull request.", receiptContext);
    if (providerHead.state !== "OPEN" || !providerHead.draft || providerHead.pullRequestNumber !== subject.pullRequest.number
      || providerHead.pullRequestUrl !== subject.pullRequest.url || providerHead.headSha !== subject.candidateSha
      || !providerHead.expiresAt || providerHead.expiresAt <= input.now) {
      return denied("GitHub pull-request identity or head is stale for the verified subject.", receiptContext);
    }
  }

  return {
    eligible: true,
    current: true,
    ...receiptContext,
    reasons: ["Exact current Verification Result is completed, verified, independent, plan-bound, and provider-current."],
  };
}

function denied(reason: string, context: Partial<CurrentVerificationEligibility> = {}): CurrentVerificationEligibility {
  return { eligible: false, current: false, ...context, reasons: [reason] };
}
