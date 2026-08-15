import {
  evaluateCurrentVerificationEligibility,
} from "@mission-control/workflow-engine/verification-currentness";
import {
  qualityGateProjectionInputDigest,
  qualityGateStateForCurrentEligibility,
} from "./qualityGateDecision";

export type CurrentVerificationResult = {
  eligible: boolean;
  current: boolean;
  exactIdentity?: {
    workOrderId: string;
    workOrderRevisionNumber: number;
    verificationContractDigest: string;
    sourceAttemptId: string;
    verificationSubjectDigest: string;
  };
  sourceAttemptId?: string;
  candidateRevision?: string;
  verificationAttemptId?: string;
  verificationRunId?: string;
  verificationReceiptId?: string;
  verificationPlanDigest?: string;
  evidenceSetDigest?: string;
  historicalVerdict?:
    | "VERIFIED"
    | "NOT_VERIFIED"
    | "BLOCKED"
    | "REQUIRES_HUMAN_REVIEW";
  reasons: string[];
};

export async function getCurrentVerificationResult(
  ctx: any,
  workOrder: any,
  now = Date.now(),
): Promise<CurrentVerificationResult> {
  const [attempts, results, receipts, evidence, providerHeads, repository, installations] = await Promise.all([
    ctx.db.query("workflowRuns").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("verificationRuns").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("verificationReceipts").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("evidenceEnvelopes").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    ctx.db.query("harnessPrChecks").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
    workOrder.repositoryId ? ctx.db.get(workOrder.repositoryId) : Promise.resolve(null),
    workOrder.repositoryId
      ? ctx.db.query("githubAppInstallations").withIndex("by_repository", (q: any) => q.eq("repositoryId", workOrder.repositoryId)).collect()
      : Promise.resolve([]),
  ]);
  const connectedInstallationIds = new Set(
    installations.filter((installation: any) => installation.status === "CONNECTED")
      .map((installation: any) => installation.installationId),
  );

  return evaluateCurrentVerificationEligibility({
    workOrderId: String(workOrder._id),
    workOrderRevisionNumber: workOrder.currentRevisionNumber ?? 1,
    qualityContractDigest: workOrder.qualityContractDigest,
    verificationContractDigest: workOrder.verificationContractDigest,
    sourceAttempts: attempts.map((attempt: any) => ({
      id: String(attempt._id),
      repositoryId: attempt.repositoryId ? String(attempt.repositoryId) : undefined,
      attemptPurpose: attempt.attemptPurpose,
      status: attempt.status,
      candidateReadyAt: attempt.candidateReadyAt,
      qualityContractDigest: attempt.qualityContractDigest,
      verificationSubject: normalizeSubject(attempt.verificationSubject),
    })),
    verificationAttempts: attempts.map((attempt: any) => ({
      id: String(attempt._id),
      attemptPurpose: attempt.attemptPurpose,
      status: attempt.status,
      createdAt: attempt._creationTime ?? attempt.startedAt,
      supersededAt: attempt.metadata?.verificationSupersededAt,
      qualityContractDigest: attempt.qualityContractDigest,
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
      decisionInputDigest: result.decisionInputDigest,
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
        evidenceEnvelopeIds: receipt.evidenceEnvelopeIds?.map(String),
        workOrderId: String(receipt.workOrderId),
        workOrderRevisionNumber: receipt.workOrderRevisionNumber ?? 0,
        verificationContractDigest: receipt.verificationContractDigest ?? "",
        sourceAttemptId: receipt.sourceAttemptId ? String(receipt.sourceAttemptId) : "",
        verificationSubjectDigest: receipt.verificationSubjectDigest ?? "",
        status: receipt.status,
        verdict: receipt.verdict,
        independenceValid: receipt.independenceValid,
        decisionInputDigest: receipt.decisionInputDigest,
        recordedAt: receipt.recordedAt,
        validUntil: receipt.validUntil,
        invalidatedAt: receipt.invalidatedAt,
      })),
    verificationEvidence: evidence.map((envelope: any) => ({
      id: String(envelope._id),
      workflowRunId: String(envelope.workflowRunId),
      verificationRunId: String(envelope.verificationRunId),
      verificationAttemptId: envelope.verificationAttemptId ? String(envelope.verificationAttemptId) : "",
      verificationSubjectId: envelope.verificationSubjectId ?? "",
      verificationPlanId: envelope.verificationPlanId ?? "",
      verificationPlanDigest: envelope.verificationPlanDigest ?? "",
      workOrderId: String(envelope.workOrderId),
      workOrderRevisionNumber: envelope.workOrderRevisionNumber ?? 0,
      verificationContractDigest: envelope.verificationContractDigest ?? "",
      sourceAttemptId: envelope.sourceAttemptId ? String(envelope.sourceAttemptId) : "",
      verificationSubjectDigest: envelope.verificationSubjectDigest ?? "",
      recordedAt: envelope.recordedAt,
    })),
    providerHeads: providerHeads
      .filter((head: any) => head.source === "GITHUB" && head.provider === "GITHUB"
        && head.repositoryId && String(head.repositoryId) === String(workOrder.repositoryId)
        && head.installationId && connectedInstallationIds.has(head.installationId)
        && head.providerRepositoryId && head.providerRepositoryId === repository?.providerRepositoryId
        && head.providerPullRequestId && head.workflowRunId
        && head.prNumber && head.headSha && head.prState)
      .map((head: any) => ({
        provider: "GITHUB" as const,
        repositoryId: String(head.repositoryId),
        installationId: head.installationId,
        sourceAttemptId: String(head.workflowRunId),
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

/**
 * Append the audit projection produced by the canonical policy-v2 currentness
 * calculation. Acceptance must never read this projection back as authority.
 */
export async function appendCurrentVerificationQualityGateDecision(
  ctx: any,
  workOrder: any,
  current: CurrentVerificationResult,
  idempotencyKey: string,
  now = Date.now(),
) {
  const projectionKey = `${idempotencyKey}:policy-v2-quality-gate`;
  const existing = await ctx.db.query("qualityGateDecisions")
    .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", projectionKey))
    .first();
  if (existing) {
    if (existing.workOrderId !== workOrder._id) {
      throw new Error("Quality Gate idempotency key is already bound to another WorkOrder.");
    }
    return existing;
  }

  const sourceAttempt = current.sourceAttemptId ? await ctx.db.get(current.sourceAttemptId) : null;
  const decisionInput = {
    version: 2,
    workOrderId: String(workOrder._id),
    workOrderRevisionNumber: workOrder.currentRevisionNumber ?? 1,
    qualityContractDigest: workOrder.qualityContractDigest,
    verificationContractDigest: workOrder.verificationContractDigest,
    exactIdentity: current.exactIdentity,
    candidateRevision: current.candidateRevision,
    sourceAttemptId: current.sourceAttemptId,
    verificationAttemptId: current.verificationAttemptId,
    verificationRunId: current.verificationRunId,
    verificationReceiptId: current.verificationReceiptId,
    verificationPlanDigest: current.verificationPlanDigest,
    evidenceSetDigest: current.evidenceSetDigest,
    historicalVerdict: current.historicalVerdict,
    eligible: current.eligible,
    current: current.current,
    reasons: current.reasons,
  };
  const qualityGateDecisionId = await ctx.db.insert("qualityGateDecisions", {
    tenantId: workOrder.tenantId,
    projectId: workOrder.projectId,
    missionId: workOrder.missionId,
    workOrderId: workOrder._id,
    workflowRunId: current.verificationAttemptId ?? current.sourceAttemptId,
    verificationRunId: current.verificationRunId,
    verificationReceiptId: current.verificationReceiptId,
    idempotencyKey: projectionKey,
    workOrderRevisionNumber: workOrder.currentRevisionNumber ?? 1,
    candidateRevision: current.candidateRevision,
    subjectDigest: current.exactIdentity?.verificationSubjectDigest,
    verificationContractDigest: workOrder.verificationContractDigest,
    verificationSubjectDigest: current.exactIdentity?.verificationSubjectDigest,
    sourceAttemptId: current.sourceAttemptId,
    verificationAttemptId: current.verificationAttemptId,
    verificationPlanDigest: current.verificationPlanDigest,
    qualityContractDigest: workOrder.qualityContractDigest,
    executionManifestDigest: sourceAttempt?.executionManifestDigest,
    evidenceSetDigest: current.evidenceSetDigest,
    decisionInputDigest: qualityGateProjectionInputDigest(decisionInput),
    governancePolicyId: workOrder.governancePolicyId,
    state: qualityGateStateForCurrentEligibility(current),
    mode: "ENFORCED",
    reasons: current.reasons,
    blockingFindingIds: [],
    requiredApprovalIds: [],
    evaluatedAt: now,
    metadata: {
      projectionSource: "POLICY_V2_CURRENT_VERIFICATION",
      authoritative: false,
      canonicalDecision: decisionInput,
    },
  });
  return await ctx.db.get(qualityGateDecisionId);
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
