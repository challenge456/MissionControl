import { evaluateCurrentVerificationEligibility } from "@mission-control/workflow-engine/verification-currentness";

export async function getCurrentVerificationResult(ctx: any, workOrder: any, now = Date.now()) {
  const [attempts, results, receipts, providerHeads] = await Promise.all([
    ctx.db.query("workflowRuns").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("verificationRuns").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("verificationReceipts").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("harnessPrChecks").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
  ]);

  return evaluateCurrentVerificationEligibility({
    workOrderId: String(workOrder._id),
    workOrderRevisionNumber: workOrder.currentRevisionNumber ?? 1,
    verificationContractDigest: workOrder.verificationContractDigest,
    sourceAttempts: attempts.map((attempt: any) => ({
      id: String(attempt._id),
      repositoryId: attempt.repositoryId ? String(attempt.repositoryId) : undefined,
      attemptPurpose: attempt.attemptPurpose,
      status: attempt.status,
      candidateReadyAt: attempt.candidateReadyAt,
      verificationSubject: normalizeSubject(attempt.verificationSubject),
    })),
    verificationAttempts: attempts.map((attempt: any) => ({
      id: String(attempt._id),
      attemptPurpose: attempt.attemptPurpose,
      status: attempt.status,
      createdAt: attempt._creationTime ?? attempt.startedAt,
      supersededAt: attempt.metadata?.verificationSupersededAt,
      verificationAttemptBinding: normalizeTuple(attempt.verificationAttemptBinding),
    })),
    verificationResults: results.map((result: any) => ({
      id: String(result._id),
      workflowRunId: String(result.workflowRunId),
      workOrderId: String(result.workOrderId),
      workOrderRevisionNumber: result.workOrderRevisionNumber,
      verificationContractDigest: result.verificationContractDigest ?? "",
      sourceAttemptId: result.sourceAttemptId ? String(result.sourceAttemptId) : "",
      verificationSubjectDigest: result.verificationSubjectDigest ?? "",
      status: result.status,
      verdict: result.verdict,
      independenceValid: result.independenceValid,
      verificationPlanId: result.verificationPlanId,
      verificationPlanDigest: result.verificationPlanDigest,
      createdAt: result.createdAt ?? result._creationTime,
      completedAt: result.completedAt,
      invalidatedAt: result.invalidatedAt,
    })),
    verificationReceipts: receipts
      .filter((receipt: any) => receipt.receiptScope === "WORK_ORDER" && receipt.verificationRunId)
      .map((receipt: any) => ({
        id: String(receipt._id),
        verificationRunId: String(receipt.verificationRunId),
        verificationAttemptId: receipt.verificationAttemptId ? String(receipt.verificationAttemptId) : "",
        verificationPlanId: receipt.verificationPlanId ?? "",
        verificationPlanDigest: receipt.verificationPlanDigest ?? "",
        verificationSubjectId: receipt.verificationSubjectId ?? "",
        workOrderId: String(receipt.workOrderId),
        workOrderRevisionNumber: receipt.workOrderRevisionNumber ?? 0,
        verificationContractDigest: receipt.verificationContractDigest ?? "",
        sourceAttemptId: receipt.sourceAttemptId ? String(receipt.sourceAttemptId) : "",
        verificationSubjectDigest: receipt.verificationSubjectDigest ?? "",
        status: receipt.status,
        verdict: receipt.verdict,
        independenceValid: receipt.independenceValid,
        recordedAt: receipt.recordedAt,
        validUntil: receipt.validUntil,
        invalidatedAt: receipt.invalidatedAt,
      })),
    providerHeads: providerHeads
      .filter((head: any) => head.provider === "GITHUB" && head.providerRepositoryId && head.providerPullRequestId
        && head.prNumber && head.headSha && head.prState)
      .map((head: any) => ({
        provider: "GITHUB" as const,
        providerRepositoryId: head.providerRepositoryId,
        providerPullRequestId: head.providerPullRequestId,
        pullRequestNumber: head.prNumber,
        pullRequestUrl: head.prUrl,
        state: head.prState,
        draft: head.draft === true,
        headSha: head.headSha,
        syncedAt: head.syncedAt,
        expiresAt: head.attestationExpiresAt,
      })),
    now,
  });
}

function normalizeTuple(tuple: any) {
  if (!tuple) return undefined;
  return {
    workOrderId: String(tuple.workOrderId),
    workOrderRevisionNumber: tuple.workOrderRevisionNumber,
    verificationContractDigest: tuple.verificationContractDigest,
    sourceAttemptId: String(tuple.sourceAttemptId),
    verificationSubjectDigest: tuple.verificationSubjectDigest,
  };
}

function normalizeSubject(subject: any) {
  if (!subject) return undefined;
  const common = {
    ...subject,
    workOrderId: String(subject.workOrderId),
    sourceAttemptId: String(subject.sourceAttemptId),
  };
  if (subject.kind === "GIT_CANDIDATE") {
    return { ...common, repositoryId: String(subject.repositoryId) };
  }
  return {
    ...common,
    automationWorkflowRunId: String(subject.automationWorkflowRunId),
    automationDefinitionId: String(subject.automationDefinitionId),
    outputSnapshotArtifactId: String(subject.outputSnapshotArtifactId),
    outputArtifactIds: subject.outputArtifactIds.map(String),
  };
}
