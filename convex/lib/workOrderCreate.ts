import { deriveVerificationStatus } from "./workOrders";
import {
  deriveApprovalStatus,
  evaluateAcceptance,
} from "./workOrderGovernance";
import { snapshotRevisionFields } from "./workOrderRevision";

function describeInitialReadiness(
  workOrder: { state: string },
  acceptance: ReturnType<typeof evaluateAcceptance>,
) {
  if (acceptance.missingApprovalTypes.length > 0) return `Awaiting approvals: ${acceptance.missingApprovalTypes.join(", ")}`;
  if (acceptance.expiredApprovalTypes.length > 0) return `Expired approvals: ${acceptance.expiredApprovalTypes.join(", ")}`;
  if (acceptance.revokedApprovalTypes.length > 0) return `Revoked approvals: ${acceptance.revokedApprovalTypes.join(", ")}`;
  if (acceptance.failedCriteriaIds.length > 0) return `Verification failed for ${acceptance.failedCriteriaIds.join(", ")}`;
  if (acceptance.staleCriteriaIds.length > 0) return `Evidence is stale for ${acceptance.staleCriteriaIds.join(", ")}`;
  if (acceptance.missingCriteriaIds.length > 0) return `Missing verification receipts for ${acceptance.missingCriteriaIds.join(", ")}`;
  if (acceptance.waiverWithoutApprovalCriteriaIds.length > 0) return `Waiver approval missing for ${acceptance.waiverWithoutApprovalCriteriaIds.join(", ")}`;
  return workOrder.state === "DONE" ? undefined : "Ready for explicit acceptance.";
}

/**
 * Canonical WorkOrder creation engine shared by the public WorkOrder mutation
 * and atomic Mission-plan materialization. Creation-time governance is derived
 * without calling another Convex mutation, so the entire plan release remains
 * one transaction.
 */
export async function createWorkOrderRecord(ctx: any, args: any) {
  if (args.idempotencyKey) {
    const existing = await ctx.db
      .query("workOrders")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) return { workOrder: existing, created: false };
  }

  const project = args.projectId ? await ctx.db.get(args.projectId) : null;
  let mission: any = null;
  let missionBlueprint: any = null;
  if (args.missionId) {
    mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    if (mission.projectId !== args.projectId) throw new Error("Mission and WorkOrder project scopes must match");
    if (!args.missionPlanId || !args.missionBlueprintId) throw new Error("Mission WorkOrders require an approved plan and blueprint");
    const missionPlan = await ctx.db.get(args.missionPlanId);
    if (!missionPlan || missionPlan.missionId !== mission._id || mission.currentPlanId !== missionPlan._id || missionPlan.status !== "APPROVED") {
      throw new Error("Mission WorkOrder must use the current approved plan");
    }
    missionBlueprint = missionPlan.workOrderBlueprints.find((blueprint: any) => blueprint.id === args.missionBlueprintId);
    if (!missionBlueprint) throw new Error("Mission WorkOrder blueprint not found");
    if (missionBlueprint.title !== args.title || missionBlueprint.desiredOutcome !== args.desiredOutcome) {
      throw new Error("Mission WorkOrder must match its approved blueprint");
    }
    if ((args.missionRole ?? "WORKER") !== missionBlueprint.role) {
      throw new Error("Mission WorkOrder role must match its approved blueprint");
    }
  }

  const now = Date.now();
  const riskLevel = args.riskLevel ?? "MEDIUM";
  const finalCriteria = args.acceptanceCriteria.map((criterion: any) => ({
    ...criterion,
    status: criterion.status ?? "PENDING",
  }));
  const verificationStatus = deriveVerificationStatus(finalCriteria);
  const approvalStatus = args.approvalStatus ?? deriveApprovalStatus({
    riskLevel,
    requiredApprovals: args.requiredApprovals,
    approvals: [],
    now,
  });
  const requestedState = args.state ?? "READY";
  const state = !["DONE", "CANCELED", "SUPERSEDED", "REOPENED"].includes(requestedState)
    && ["PENDING", "REVISION_REQUESTED"].includes(approvalStatus)
    ? "AWAITING_APPROVAL"
    : requestedState;
  const acceptance = evaluateAcceptance({
    riskLevel,
    requiredApprovals: args.requiredApprovals,
    approvalDecisions: [],
    acceptanceCriteria: finalCriteria,
    verificationReceipts: [],
    now,
  });
  const requiredHumanAction = describeInitialReadiness({ state }, acceptance);

  const workOrderId = await ctx.db.insert("workOrders", {
    tenantId: project?.tenantId,
    projectId: args.projectId,
    missionId: args.missionId,
    missionPlanId: args.missionPlanId,
    missionSequence: missionBlueprint?.sequence,
    missionRole: args.missionId ? (args.missionRole ?? "WORKER") : undefined,
    isMutating: args.missionId ? missionBlueprint?.isMutating : args.isMutating,
    releasedAt: args.missionId ? now : undefined,
    legacyTaskId: args.legacyTaskId,
    idempotencyKey: args.idempotencyKey,
    title: args.title,
    desiredOutcome: args.desiredOutcome,
    context: args.context,
    workflowId: args.workflowId,
    repository: args.repository,
    branchStrategy: args.branchStrategy,
    priority: args.priority ?? 3,
    riskLevel,
    modelComplexity: args.modelComplexity,
    requestedBy: args.requestedBy,
    assignedAgent: args.assignedAgent,
    assignedSquad: args.assignedSquad,
    acceptanceCriteria: finalCriteria,
    constraints: args.constraints,
    dependencies: args.dependencies,
    sourceOfTruthRefs: args.sourceOfTruthRefs,
    requiredApprovals: args.requiredApprovals,
    state,
    verificationStatus,
    approvalStatus,
    blockingIssue: acceptance.blockingReasons[0],
    requiredHumanAction,
    currentRevisionNumber: 1,
    acceptedRevisionNumber: undefined,
    createdAt: now,
    updatedAt: now,
    metadata: args.missionId ? { ...(args.metadata ?? {}), missionBlueprintId: args.missionBlueprintId } : args.metadata,
  });

  if (mission && missionBlueprint) {
    await Promise.all(missionBlueprint.assertionIds.map(async (assertionId: string) => {
      const assertion = await ctx.db
        .query("validationAssertions")
        .withIndex("by_mission_assertion", (q: any) => q.eq("missionId", mission._id).eq("assertionId", assertionId))
        .first();
      if (!assertion) throw new Error(`Mission WorkOrder references an assertion that is not in the approved contract: ${assertionId}`);
      if (!assertion.linkedWorkOrderIds.includes(workOrderId)) {
        await ctx.db.patch(assertion._id, {
          linkedWorkOrderIds: [...assertion.linkedWorkOrderIds, workOrderId],
          updatedAt: now,
        });
      }
    }));
  }

  const initialSnapshot = snapshotRevisionFields({
    ...args,
    priority: args.priority ?? 3,
    riskLevel,
    acceptanceCriteria: finalCriteria,
    metadata: args.metadata,
  });
  const initialRevisionId = await ctx.db.insert("workOrderRevisions", {
    tenantId: project?.tenantId,
    projectId: args.projectId,
    workOrderId,
    idempotencyKey: args.idempotencyKey ? `${args.idempotencyKey}:revision:1` : undefined,
    revisionNumber: 1,
    previousRevisionId: undefined,
    status: "APPLIED",
    changedFields: ["title", "desiredOutcome", "workflowId", "repository", "riskLevel", "acceptanceCriteria"],
    changeSummary: "Initial work order created",
    reason: "Initial creation",
    requestedBy: args.requestedBy,
    approvedBy: args.requestedBy,
    createdAt: now,
    effectiveAt: now,
    riskReassessment: "UNCHANGED",
    materiality: "NO_ACTION",
    requiresReapproval: false,
    requiresReverification: false,
    requiresFullReopen: false,
    impactedAcceptanceCriteria: [],
    impactedApprovals: [],
    impactedVerificationReceiptIds: [],
    requestedChanges: initialSnapshot,
    previousSnapshot: initialSnapshot,
    nextSnapshot: initialSnapshot,
    metadata: { initial: true },
  });
  await ctx.db.patch(workOrderId, { currentRevisionId: initialRevisionId });

  await ctx.db.insert("activities", {
    tenantId: project?.tenantId,
    projectId: args.projectId,
    actorType: "HUMAN",
    actorId: args.requestedBy,
    action: "WORK_ORDER_CREATED",
    description: `WorkOrder "${args.title}" created`,
    targetType: "WORK_ORDER",
    targetId: workOrderId,
    metadata: { repository: args.repository },
  });
  await ctx.db.insert("workOrderEvents", {
    tenantId: project?.tenantId,
    projectId: args.projectId,
    workOrderId,
    eventType: "WORK_ORDER_CREATED",
    actorType: "HUMAN",
    actorId: args.requestedBy,
    summary: `Created work order ${args.title}`,
    idempotencyKey: args.idempotencyKey ? `${args.idempotencyKey}:created` : undefined,
    timestamp: now,
    metadata: { repository: args.repository, workflowId: args.workflowId },
  });

  return { workOrder: await ctx.db.get(workOrderId), created: true };
}
