export type CriterionEvidenceStatus =
  | "PASS"
  | "FAIL"
  | "STALE"
  | "WAIVED"
  | "PENDING"
  | "MISSING"
  | "UNKNOWN";

type CriterionLike = {
  id: string;
  title: string;
  verificationMethod?: string;
};

type ReceiptLike = {
  _id?: string;
  acceptanceCriterionId?: string;
  status: string;
  verifier?: string;
  result?: string;
  evidenceLocation?: string;
  artifactReference?: string;
  linkedRunArtifactIds?: string[];
  waiverApprovalDecisionId?: string;
  workOrderRevisionNumber?: number;
  validUntil?: number;
  invalidatedAt?: number;
  recordedAt: number;
};

type PrCheckLike = {
  _id?: string;
  prUrl: string;
  headSha?: string;
  prState?: "OPEN" | "CLOSED" | "MERGED";
  ciStatus?: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
  ciRunUrl?: string;
  syncedAt: number;
  changeReviewLenses?: Array<{ id: string; label: string; enabled: boolean; score?: number }>;
};

type EventLike = {
  eventType: string;
  status?: string;
  commandSummary?: string;
  errorSummary?: string;
  sequenceNumber: number;
};

function latestReceipt(receipts: ReceiptLike[], criterionId: string) {
  return receipts
    .filter((receipt) => receipt.acceptanceCriterionId === criterionId)
    .sort((left, right) => right.recordedAt - left.recordedAt)[0];
}

function hasEvidence(receipt: ReceiptLike) {
  return Boolean(
    receipt.evidenceLocation
    || receipt.artifactReference
    || receipt.linkedRunArtifactIds?.length,
  );
}

function receiptIntegrityIssue(receipt: ReceiptLike | undefined, executionClaimedBy?: string) {
  if (!receipt) return null;
  if (receipt.status === "WAIVED") {
    if (!receipt.waiverApprovalDecisionId) return "Waiver approval is missing.";
    if (!hasEvidence(receipt)) return "Waiver evidence is missing.";
  }
  if (receipt.status === "PASSED") {
    const verifier = receipt.verifier?.trim();
    if (!verifier) return "Verifier identity is missing.";
    if (!hasEvidence(receipt)) return "Linked verification evidence is missing.";
    if (executionClaimedBy?.trim() && verifier === executionClaimedBy.trim()) {
      return "Verifier matches the execution worker; independent verification is required.";
    }
  }
  return null;
}

function criterionStatus(receipt: ReceiptLike | undefined, input: {
  now: number;
  workOrderRevisionNumber?: number;
  executionClaimedBy?: string;
}): CriterionEvidenceStatus {
  if (!receipt) return "MISSING";
  if (receipt.invalidatedAt) return "STALE";
  if (
    input.workOrderRevisionNumber
    && receipt.workOrderRevisionNumber
    && receipt.workOrderRevisionNumber !== input.workOrderRevisionNumber
  ) return "STALE";
  if (receipt.validUntil && receipt.validUntil <= input.now) return "STALE";
  if (receipt.status === "FAILED") return "FAIL";
  if (receipt.status === "STALE") return "STALE";
  if (receipt.status === "PENDING") return "PENDING";
  if (receipt.status === "WAIVED") {
    return receiptIntegrityIssue(receipt, input.executionClaimedBy) ? "UNKNOWN" : "WAIVED";
  }
  if (receipt.status === "PASSED") {
    return receiptIntegrityIssue(receipt, input.executionClaimedBy) ? "UNKNOWN" : "PASS";
  }
  return "UNKNOWN";
}

export function buildReviewPackage(input: {
  now: number;
  run: {
    status: string;
    runId: string;
    workOrderRevisionNumber?: number;
    repositoryId?: string;
    branch?: string;
    executionBaseSha?: string;
    headSha?: string;
    pullRequestUrl?: string;
    pullRequestNumber?: number;
    executionAttemptNumber?: number;
    executionStaleRecoveryCount?: number;
    executionClaimedBy?: string;
    returnHandoff?: { failedChecks?: string[]; unresolvedRisks?: string[]; nextDecision?: string };
  };
  workOrder?: {
    _id?: string;
    title?: string;
    riskLevel?: string;
    currentRevisionNumber?: number;
    acceptanceCriteria?: CriterionLike[];
    constraints?: string[];
  } | null;
  receipts?: ReceiptLike[];
  prChecks?: PrCheckLike[];
  events?: EventLike[];
  fileChanges?: Array<{ repositoryPath?: string | null }>;
  rollbackApproach?: string | null;
}) {
  const criteria = (input.workOrder?.acceptanceCriteria ?? []).map((criterion) => {
    const receipt = latestReceipt(input.receipts ?? [], criterion.id);
    const status = criterionStatus(receipt, {
      now: input.now,
      workOrderRevisionNumber: input.run.workOrderRevisionNumber ?? input.workOrder?.currentRevisionNumber,
      executionClaimedBy: input.run.executionClaimedBy,
    });
    const integrityIssue = receiptIntegrityIssue(receipt, input.run.executionClaimedBy);
    return {
      id: criterion.id,
      title: criterion.title,
      verificationMethod: criterion.verificationMethod ?? null,
      status,
      receiptId: receipt?._id ?? null,
      verifier: receipt?.verifier ?? null,
      result: receipt?.result ?? null,
      evidenceLocation: receipt?.evidenceLocation ?? receipt?.artifactReference ?? null,
      validUntil: receipt?.validUntil ?? null,
      integrityIssue,
    };
  });

  const exactPrCheck = (input.prChecks ?? [])
    .filter((check) => check.prUrl === input.run.pullRequestUrl && check.headSha === input.run.headSha)
    .sort((left, right) => right.syncedAt - left.syncedAt)[0];
  const deviations = (input.events ?? [])
    .filter((event) => event.eventType === "POLICY_DEVIATION")
    .map((event) => event.errorSummary ?? event.commandSummary ?? `Policy deviation at event ${event.sequenceNumber}`);
  const failedChecks = input.run.returnHandoff?.failedChecks ?? [];
  const risks = input.run.returnHandoff?.unresolvedRisks ?? [];
  const files = (input.fileChanges ?? [])
    .map((change) => change.repositoryPath)
    .filter((path): path is string => Boolean(path));

  const blockers: string[] = [];
  const incomplete: string[] = [];
  if (input.run.status === "FAILED" || input.run.status === "CANCELED") {
    blockers.push(`Attempt is ${input.run.status.toLowerCase()}.`);
  } else if (input.run.status !== "COMPLETED") {
    incomplete.push("Attempt has not completed.");
  }
  if (!input.run.pullRequestUrl || !input.run.headSha) {
    incomplete.push("Review-ready pull request and exact head SHA are missing.");
  }
  if (!exactPrCheck) {
    incomplete.push("Exact-head GitHub CI evidence is missing.");
  } else {
    if (exactPrCheck.prState === "CLOSED" || exactPrCheck.prState === "MERGED") {
      blockers.push(`Pull request is ${exactPrCheck.prState.toLowerCase()}; an open review candidate is required.`);
    } else if (exactPrCheck.prState !== "OPEN") {
      incomplete.push("Pull-request open-state evidence is missing.");
    }
    if (exactPrCheck.ciStatus === "FAIL") {
      blockers.push("Exact-head GitHub CI is failing.");
    } else if (exactPrCheck.ciStatus !== "PASS") {
      incomplete.push(`Exact-head GitHub CI is ${exactPrCheck.ciStatus?.toLowerCase() ?? "unknown"}.`);
    }
  }
  if (files.length === 0) incomplete.push("Structured changed-file lineage is missing.");
  if (criteria.length === 0) incomplete.push("No acceptance criteria are bound to the WorkOrder.");
  for (const criterion of criteria) {
    if (["FAIL", "STALE", "UNKNOWN"].includes(criterion.status)) {
      blockers.push(`${criterion.title}: ${criterion.integrityIssue ?? `evidence is ${criterion.status.toLowerCase()}.`}`);
    } else if (["MISSING", "PENDING"].includes(criterion.status)) {
      incomplete.push(`${criterion.title}: evidence is ${criterion.status.toLowerCase()}.`);
    }
  }
  if (deviations.length > 0) blockers.push(`${deviations.length} unresolved policy deviation(s) are recorded.`);
  if (failedChecks.length > 0) blockers.push(`${failedChecks.length} failed handoff check(s) remain.`);
  if (!input.rollbackApproach?.trim()) incomplete.push("Rollback guidance is missing.");

  const status = blockers.length > 0 ? "BLOCKED" : incomplete.length > 0 ? "INCOMPLETE" : "READY";
  const allBlockers = [...blockers, ...incomplete];
  return {
    status,
    summary: status === "READY"
      ? "Exact-head CI and every criterion have accepted evidence. Human merge review can proceed."
      : status === "BLOCKED"
        ? `${blockers.length} blocking issue(s) require resolution before merge review.`
        : `${incomplete.length} evidence item(s) are still required before merge review.`,
    nextAction: status === "READY"
      ? "Review the focused risks, rollback guidance, and changed files; merge remains a human decision."
      : allBlockers[0] ?? "Complete the missing evidence.",
    blockers: allBlockers,
    identity: {
      runId: input.run.runId,
      workOrderId: input.workOrder?._id ?? null,
      workOrderRevisionNumber: input.run.workOrderRevisionNumber ?? input.workOrder?.currentRevisionNumber ?? null,
      repositoryId: input.run.repositoryId ?? null,
      branch: input.run.branch ?? null,
      baseSha: input.run.executionBaseSha ?? null,
      headSha: input.run.headSha ?? null,
      pullRequestUrl: input.run.pullRequestUrl ?? null,
      pullRequestNumber: input.run.pullRequestNumber ?? null,
    },
    ci: {
      status: exactPrCheck?.ciStatus ?? "MISSING",
      runUrl: exactPrCheck?.ciRunUrl ?? null,
      evaluationId: exactPrCheck?._id ?? null,
      headSha: exactPrCheck?.headSha ?? null,
      prState: exactPrCheck?.prState ?? "UNKNOWN",
      lenses: exactPrCheck?.changeReviewLenses?.filter((lens) => lens.enabled) ?? [],
    },
    criteria,
    changedFiles: files,
    deviations,
    failedChecks,
    risks,
    rollbackApproach: input.rollbackApproach?.trim() || null,
    recovery: {
      attempts: input.run.executionAttemptNumber ?? 0,
      staleRecoveries: input.run.executionStaleRecoveryCount ?? 0,
    },
  } as const;
}
