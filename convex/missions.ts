import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  canTransitionMission,
  evaluateMissionAcceptance,
  validateMissionHandoff,
} from "./lib/missionGovernance";
import {
  assertMissionDraftWorkspace,
  changedMissionDraftFields,
  missionScopeStatus,
  validateMissionDraftInput,
} from "./lib/missionDraft";
import {
  MISSION_PLAN_RELEASE_FLAG,
  missionBlueprintReleaseKey,
  missionPlanReleaseKey,
  validateMissionPlan,
  type MissionPlanInput,
} from "./lib/missionPlan";
import { resolveFlag, type FlagRow } from "./lib/flags";
import { createWorkOrderRecord } from "./lib/workOrderCreate";
import {
  loadMissionExecutionState,
  reconcileMissionAfterHandoff,
} from "./lib/missionExecution";
import { COMPANY_PERMISSIONS, requireWorkspaceAccess } from "./lib/companyAccess";
import { assertAuthorizedDeliveryRecord, canAccessDeliveryRecord, requireAuthorizedDeliveryScope } from "./lib/deliveryAuthorization";

const missionState = v.union(
  v.literal("DRAFT"), v.literal("PLANNING"), v.literal("AWAITING_PLAN_APPROVAL"),
  v.literal("READY"), v.literal("IN_PROGRESS"), v.literal("BLOCKED"),
  v.literal("AWAITING_VALIDATION"), v.literal("AWAITING_ACCEPTANCE"),
  v.literal("DONE"), v.literal("CANCELED"), v.literal("SUPERSEDED")
);

const sourceRef = v.object({
  kind: v.union(v.literal("REPO"), v.literal("DOC"), v.literal("PRD"), v.literal("ISSUE"), v.literal("URL")),
  label: v.string(),
  location: v.string(),
});

const assertionInput = v.object({
  assertionId: v.string(),
  title: v.string(),
  outcome: v.string(),
  verificationMethod: v.union(v.literal("COMMAND"), v.literal("TEST"), v.literal("BROWSER"), v.literal("MANUAL"), v.literal("CHECKLIST")),
  passCondition: v.string(),
  requiredEvidence: v.string(),
  requiresIndependentValidation: v.boolean(),
  waiverAllowed: v.boolean(),
});

const blueprintInput = v.object({
  id: v.string(),
  title: v.string(),
  desiredOutcome: v.string(),
  workflowId: v.optional(v.string()),
  workflowVersion: v.optional(v.number()),
  sequence: v.number(),
  role: v.union(v.literal("WORKER"), v.literal("VALIDATOR")),
  isMutating: v.boolean(),
  priority: v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
  riskLevel: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
  modelComplexity: v.optional(v.union(v.literal("SMALL"), v.literal("STANDARD"), v.literal("LARGE"))),
  branchStrategy: v.optional(v.string()),
  constraints: v.array(v.string()),
  requiredApprovals: v.array(v.string()),
  estimatedCostUsd: v.optional(v.number()),
  dependsOnBlueprintIds: v.array(v.string()),
  assertionIds: v.array(v.string()),
});

async function assertPlanReleaseEnabled(ctx: any, projectId: any) {
  const rows = await ctx.db
    .query("featureFlags")
    .withIndex("by_key", (q: any) => q.eq("key", MISSION_PLAN_RELEASE_FLAG))
    .collect() as FlagRow[];
  if (!resolveFlag(rows, MISSION_PLAN_RELEASE_FLAG, projectId).enabled) {
    throw new Error(`Mission planning is disabled (${MISSION_PLAN_RELEASE_FLAG})`);
  }
}

function normalizedPlanAssertions(plan: any) {
  return plan.assertions ?? plan.metadata?.assertions ?? [];
}

function planInput(plan: any): MissionPlanInput {
  return {
    summary: plan.summary,
    rollbackApproach: plan.rollbackApproach ?? "",
    estimatedCostUsd: plan.estimatedCostUsd,
    repository: plan.repository,
    repositoryBranch: plan.repositoryBranch,
    workOrderBlueprints: plan.workOrderBlueprints.map((blueprint: any) => ({
      ...blueprint,
      priority: blueprint.priority ?? 3,
      riskLevel: blueprint.riskLevel ?? "MEDIUM",
      constraints: blueprint.constraints ?? [],
      requiredApprovals: blueprint.requiredApprovals ?? [],
    })),
    assertions: normalizedPlanAssertions(plan),
  };
}

function assertValidPlan(plan: any) {
  const errors = validateMissionPlan(planInput(plan));
  if (errors.length > 0) {
    const error = new Error(`Mission plan is invalid: ${errors.map((item) => item.message).join(" ")}`) as Error & { data?: any };
    error.data = { code: "MISSION_PLAN_INVALID", errors };
    throw error;
  }
}

async function assertMissionProject(ctx: any, missionId: any, projectId: any, deliveryAccess?: any) {
  const [mission, project] = await Promise.all([ctx.db.get(missionId), ctx.db.get(projectId)]);
  if (!mission) throw new Error("Mission not found");
  if (!project || mission.projectId !== projectId) throw new Error("Mission does not belong to the selected workspace");
  assertAuthorizedDeliveryRecord(deliveryAccess, mission);
  return { mission, project };
}

async function logMissionEvent(ctx: any, args: {
  mission: any;
  eventType: string;
  actorType: "HUMAN" | "AGENT" | "SYSTEM";
  actorId?: string;
  summary: string;
  idempotencyKey?: string;
  metadata?: any;
}) {
  if (args.idempotencyKey) {
    const existing = await ctx.db
      .query("missionEvents")
      .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) return existing;
  }
  const id = await ctx.db.insert("missionEvents", {
    tenantId: args.mission.tenantId,
    projectId: args.mission.projectId,
    missionId: args.mission._id,
    eventType: args.eventType,
    actorType: args.actorType,
    actorId: args.actorId,
    summary: args.summary,
    idempotencyKey: args.idempotencyKey,
    timestamp: Date.now(),
    metadata: args.metadata,
  });
  return await ctx.db.get(id);
}

function assertTransition(mission: any, state: any) {
  if (!canTransitionMission(mission.state, state)) {
    throw new Error(`Mission cannot transition from ${mission.state} to ${state}`);
  }
}

async function resolveOperator(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    return { actorId: identity.subject, actorSource: "AUTHENTICATED" as const };
  }
  return {
    actorId: "development:local-operator",
    actorSource: "DEVELOPMENT_FALLBACK" as const,
  };
}

async function getMissionDetail(ctx: any, mission: any) {
  const [plans, assertions, handoffs, events, workOrders, project] = await Promise.all([
    ctx.db.query("missionPlans").withIndex("by_mission", (q: any) => q.eq("missionId", mission._id)).order("desc").collect(),
    ctx.db.query("validationAssertions").withIndex("by_mission", (q: any) => q.eq("missionId", mission._id)).collect(),
    ctx.db.query("missionHandoffs").withIndex("by_mission", (q: any) => q.eq("missionId", mission._id)).order("desc").collect(),
    ctx.db.query("missionEvents").withIndex("by_mission_timestamp", (q: any) => q.eq("missionId", mission._id)).order("desc").collect(),
    ctx.db.query("workOrders").withIndex("by_mission", (q: any) => q.eq("missionId", mission._id)).collect(),
    mission.projectId ? ctx.db.get(mission.projectId) : null,
  ]);
  const normalizedPlans = plans.map((plan: any) => ({
    ...plan,
    assertions: normalizedPlanAssertions(plan),
    legacyRelease: plan.status === "APPROVED" && !plan.releaseIdempotencyKey,
  }));
  const currentPlan = normalizedPlans.find((plan: any) => plan._id === mission.currentPlanId)
    ?? normalizedPlans.find((plan: any) => plan.status === "PROPOSED")
    ?? normalizedPlans[0];
  const blueprintById = new Map((currentPlan?.workOrderBlueprints ?? []).map((blueprint: any) => [blueprint.id, blueprint]));
  const workOrderByBlueprintId = new Map(workOrders.map((workOrder: any) => [workOrder.metadata?.missionBlueprintId, workOrder]));
  const handoffByWorkOrderId = new Map<string, any>();
  for (const handoff of handoffs) {
    const key = String(handoff.workOrderId);
    if (!handoffByWorkOrderId.has(key)) handoffByWorkOrderId.set(key, handoff);
  }
  const eligibleWorkOrders = workOrders
    .map((workOrder: any) => {
      const blueprint = blueprintById.get(workOrder.metadata?.missionBlueprintId) as any;
      const missingDependencies = (blueprint?.dependsOnBlueprintIds ?? []).filter((dependencyId: string) => {
        const dependencyWorkOrder = workOrderByBlueprintId.get(dependencyId) as any;
        if (!dependencyWorkOrder) return true;
        const handoff = handoffByWorkOrderId.get(String(dependencyWorkOrder._id)) as any;
        return !handoff || handoff.outcome !== "COMPLETE" || handoff.incompleteAssertionIds.length > 0 || handoff.unknownAssertionIds.length > 0;
      });
      return {
        ...workOrder,
        missionEligibility: missingDependencies.length === 0
          ? { eligible: true as const, reason: "All predecessor handoffs are complete." }
          : { eligible: false as const, reason: `Waiting for predecessor handoff: ${missingDependencies.join(", ")}`, missingBlueprintIds: missingDependencies },
      };
    })
    .sort((left: any, right: any) => (left.missionSequence ?? 0) - (right.missionSequence ?? 0));
  const executionWorkOrders = await Promise.all(eligibleWorkOrders.map(async (workOrder: any) => {
    const [childTasks, executionRuns, approvalDecisions, verificationReceipts] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).collect(),
      ctx.db.query("workflowRuns").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).order("desc").collect(),
      ctx.db.query("approvalDecisions").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).order("desc").collect(),
      ctx.db.query("verificationReceipts").withIndex("by_work_order", (q: any) => q.eq("workOrderId", workOrder._id)).order("desc").collect(),
    ]);
    return {
      ...workOrder,
      childTasks,
      executionRuns,
      approvalDecisions,
      verificationReceipts,
      latestHandoff: handoffByWorkOrderId.get(String(workOrder._id)) ?? null,
    };
  }));
  const acceptance = evaluateMissionAcceptance({
    assertions: assertions.map((assertion: any) => ({
      id: assertion.assertionId,
      status: assertion.status,
      requiresIndependentValidation: assertion.requiresIndependentValidation,
      validatorRunId: assertion.validatorWorkflowRunId,
      verificationReceiptId: assertion.verificationReceiptId,
      waiverApprovalId: assertion.waiverApprovalDecisionId,
    })),
    workOrders: workOrders.map((workOrder: any) => ({ id: String(workOrder._id), state: workOrder.state })),
    handoffs: [...handoffByWorkOrderId.values()].map((handoff: any) => ({
      workOrderId: String(handoff.workOrderId),
      outcome: handoff.outcome,
      incompleteAssertionIds: handoff.incompleteAssertionIds,
      unknownAssertionIds: handoff.unknownAssertionIds,
    })),
  });
  return {
    mission,
    project,
    plans: normalizedPlans,
    assertions,
    handoffs,
    events,
    workOrders: executionWorkOrders,
    acceptance,
  };
}

export const list = query({
  args: { projectId: v.optional(v.id("projects")), state: v.optional(missionState), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId);
    let missions = args.projectId
      ? await ctx.db.query("missions").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).order("desc").take(args.limit ?? 100)
      : await ctx.db.query("missions").order("desc").take(args.limit ?? 100);
    if (args.state) missions = missions.filter((mission) => mission.state === args.state);
    if (deliveryAccess) missions = missions.filter((mission) => canAccessDeliveryRecord(deliveryAccess, mission));
    return Promise.all(missions.map(async (mission) => {
      const [workOrders, assertions] = await Promise.all([
        ctx.db.query("workOrders").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect(),
        ctx.db.query("validationAssertions").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect(),
      ]);
      return { ...mission, workOrderCount: workOrders.length, assertionCount: assertions.length };
    }));
  },
});

export const get = query({
  args: { missionId: v.id("missions") },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) return null;
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, mission.projectId);
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    return await getMissionDetail(ctx, mission);
  },
});

export const getScoped = query({
  args: { missionId: v.id("missions"), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId);
    const mission = await ctx.db.get(args.missionId);
    if (!mission) return { status: "NOT_FOUND" as const };
    const scope = missionScopeStatus(mission, args.projectId);
    if (scope === "SCOPE_MISMATCH") return { status: "SCOPE_MISMATCH" as const };
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    return { status: "FOUND" as const, detail: await getMissionDetail(ctx, mission) };
  },
});

export const createDraft = mutation({
  args: {
    projectId: v.optional(v.id("projects")), idempotencyKey: v.optional(v.string()), title: v.string(), objective: v.string(),
    context: v.optional(v.string()), constraints: v.optional(v.array(v.string())), sourceOfTruthRefs: v.optional(v.array(sourceRef)),
    owner: v.optional(v.string()), budgetUsd: v.optional(v.number()), stopCondition: v.string(),
    ownerMemberId: v.optional(v.id("orgMembers")), owningTeamId: v.optional(v.id("scrumTeams")),
    repositoryId: v.optional(v.id("workspaceRepositories")), codeScopeIds: v.optional(v.array(v.id("repositoryCodeScopes"))),
    executionEnvironment: v.optional(v.union(v.literal("LOCAL"), v.literal("CLOUD"), v.literal("POLICY_SELECTED"))),
    maxReadOnlyConcurrency: v.optional(v.number()), maxCorrectiveIterations: v.optional(v.number()), metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    assertAuthorizedDeliveryRecord(deliveryAccess, {
      ownerMemberId: args.ownerMemberId,
      owningTeamId: args.owningTeamId,
    });
    validateMissionDraftInput(args);
    if (args.idempotencyKey) {
      const existing = await ctx.db.query("missions").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
      if (existing) {
        if (existing.projectId !== args.projectId) throw new Error("Idempotency key is already bound to another workspace");
        assertAuthorizedDeliveryRecord(deliveryAccess, existing);
        return { mission: existing, created: false };
      }
    }
    const project = args.projectId ? await ctx.db.get(args.projectId) : null;
    if (args.projectId && !project) throw new Error("Workspace not found");
    let requestingOperatorId;
    let ownerMember: any = null;
    let owningTeam: any = null;
    if (args.projectId && project?.tenantId && (args.ownerMemberId || args.owningTeamId || args.repositoryId || args.codeScopeIds?.length)) {
      const access = await requireWorkspaceAccess(ctx, project.tenantId, args.projectId, { permission: COMPANY_PERMISSIONS.ASSIGN_DELIVERY });
      assertAuthorizedDeliveryRecord(access, {
        ownerMemberId: args.ownerMemberId,
        owningTeamId: args.owningTeamId,
      });
      requestingOperatorId = access.membership.operatorId;
      [ownerMember, owningTeam] = await Promise.all([
        args.ownerMemberId ? ctx.db.get(args.ownerMemberId) : null,
        args.owningTeamId ? ctx.db.get(args.owningTeamId) : null,
      ]);
      const repository = args.repositoryId ? await ctx.db.get(args.repositoryId) : null;
      const scopes = await Promise.all((args.codeScopeIds ?? []).map((scopeId) => ctx.db.get(scopeId)));
      if (ownerMember && ownerMember.projectId !== args.projectId) throw new Error("Mission owner must belong to the active workspace.");
      if (owningTeam && owningTeam.projectId !== args.projectId) throw new Error("Mission team must belong to the active workspace.");
      if (repository && repository.projectId !== args.projectId) throw new Error("Mission repository must belong to the active workspace.");
      if (scopes.some((scope) => !scope || scope.projectId !== args.projectId || (repository && scope.repositoryId !== repository._id))) throw new Error("Mission code scopes must belong to the active workspace and repository.");
      if (args.ownerMemberId && args.owningTeamId) {
        const teamMembership = await ctx.db.query("teamMemberships").withIndex("by_team_member", (q) => q.eq("teamId", args.owningTeamId!).eq("memberId", args.ownerMemberId!)).first();
        if (!teamMembership?.active) throw new Error("Mission owner must be active in the owning team.");
      }
    }
    const operator = await resolveOperator(ctx);
    const now = Date.now();
    const missionId = await ctx.db.insert("missions", {
      tenantId: project?.tenantId, projectId: args.projectId, idempotencyKey: args.idempotencyKey,
      title: args.title, objective: args.objective, context: args.context, constraints: args.constraints,
      sourceOfTruthRefs: args.sourceOfTruthRefs, owner: ownerMember?.name ?? args.owner,
      ownerMemberId: args.ownerMemberId, owningTeamId: args.owningTeamId, repositoryId: args.repositoryId,
      codeScopeIds: args.codeScopeIds ?? [], requestedByOperatorId: requestingOperatorId,
      executionEnvironment: args.executionEnvironment,
      state: "DRAFT", executionPolicy: "SERIAL_MUTATIONS",
      maxReadOnlyConcurrency: args.maxReadOnlyConcurrency ?? 2, maxCorrectiveIterations: args.maxCorrectiveIterations ?? 2,
      correctiveIterations: 0, stopCondition: args.stopCondition, budgetUsd: args.budgetUsd, spentUsd: 0,
      createdAt: now, updatedAt: now, metadata: args.metadata,
    });
    const mission = await ctx.db.get(missionId);
    if (!mission) throw new Error("Mission creation failed");
    if (args.ownerMemberId && args.owningTeamId && project?.tenantId) {
      await ctx.db.insert("missionAssignments", {
        tenantId: project.tenantId,
        projectId: project._id,
        missionId: mission._id,
        memberId: args.ownerMemberId,
        teamId: args.owningTeamId,
        role: "OWNER",
        activeFrom: now,
        active: true,
        createdAt: now,
        updatedAt: now,
        createdBy: requestingOperatorId,
        updatedBy: requestingOperatorId,
      });
    }
    await logMissionEvent(ctx, {
      mission,
      eventType: "MISSION_CREATED",
      actorType: "HUMAN",
      actorId: operator.actorId,
      summary: `Created mission ${args.title}`,
      idempotencyKey: args.idempotencyKey ? `${args.idempotencyKey}:created` : undefined,
      metadata: { actorSource: operator.actorSource },
    });
    return { mission, created: true };
  },
});

export const updateDraft = mutation({
  args: {
    missionId: v.id("missions"),
    projectId: v.id("projects"),
    idempotencyKey: v.string(),
    title: v.string(),
    objective: v.string(),
    context: v.optional(v.string()),
    constraints: v.optional(v.array(v.string())),
    sourceOfTruthRefs: v.optional(v.array(sourceRef)),
    owner: v.optional(v.string()),
    budgetUsd: v.optional(v.number()),
    stopCondition: v.string(),
    maxReadOnlyConcurrency: v.optional(v.number()),
    maxCorrectiveIterations: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    validateMissionDraftInput(args);
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    assertMissionDraftWorkspace(mission, args.projectId);
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);

    const duplicate = await ctx.db
      .query("missionEvents")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (duplicate) return { mission, updated: false };
    if (mission.state !== "DRAFT") {
      throw new Error(`Mission draft cannot be edited while ${mission.state}`);
    }

    const {
      missionId: _missionId,
      projectId: _projectId,
      idempotencyKey: _idempotencyKey,
      ...draft
    } = args;
    const changedFields = changedMissionDraftFields(mission, draft);
    if (changedFields.length === 0) return { mission, updated: false };

    await ctx.db.patch(mission._id, { ...draft, updatedAt: Date.now() });
    const updated = await ctx.db.get(mission._id);
    if (!updated) throw new Error("Mission draft update failed");
    const operator = await resolveOperator(ctx);
    await logMissionEvent(ctx, {
      mission: updated,
      eventType: "MISSION_DRAFT_UPDATED",
      actorType: "HUMAN",
      actorId: operator.actorId,
      summary: `Updated mission draft ${updated.title}`,
      idempotencyKey: args.idempotencyKey,
      metadata: { actorSource: operator.actorSource, changedFields },
    });
    return { mission: updated, updated: true };
  },
});

export const savePlanDraft = mutation({
  args: {
    projectId: v.id("projects"),
    missionId: v.id("missions"),
    planId: v.optional(v.id("missionPlans")),
    basePlanId: v.optional(v.id("missionPlans")),
    expectedDraftVersion: v.optional(v.number()),
    idempotencyKey: v.string(),
    summary: v.string(),
    rollbackApproach: v.string(),
    estimatedCostUsd: v.optional(v.number()),
    workOrderBlueprints: v.array(blueprintInput),
    assertions: v.array(assertionInput),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await assertPlanReleaseEnabled(ctx, args.projectId);
    const { mission } = await assertMissionProject(ctx, args.missionId, args.projectId, deliveryAccess);
    if (!["DRAFT", "PLANNING"].includes(mission.state)) throw new Error(`Mission plan cannot be edited while ${mission.state}`);
    const operator = await resolveOperator(ctx);
    const now = Date.now();

    if (args.planId) {
      const plan = await ctx.db.get(args.planId);
      if (!plan || plan.missionId !== mission._id || plan.projectId !== args.projectId) throw new Error("Mission plan not found");
      if (plan.status !== "DRAFT") throw new Error("Only a draft plan can be edited");
      const version = plan.draftVersion ?? 1;
      if (args.expectedDraftVersion !== version) throw new Error("Mission plan changed in another session. Reload before saving.");
      await ctx.db.patch(plan._id, {
        summary: args.summary,
        rollbackApproach: args.rollbackApproach,
        estimatedCostUsd: args.estimatedCostUsd,
        workOrderBlueprints: args.workOrderBlueprints,
        assertions: args.assertions,
        draftVersion: version + 1,
        metadata: args.metadata,
      });
      const updated = await ctx.db.get(plan._id);
      await logMissionEvent(ctx, {
        mission,
        eventType: "PLAN_DRAFT_SAVED",
        actorType: "HUMAN",
        actorId: operator.actorId,
        summary: `Saved mission plan revision ${plan.revisionNumber}`,
        idempotencyKey: args.idempotencyKey,
        metadata: { planId: plan._id, draftVersion: version + 1, actorSource: operator.actorSource },
      });
      return { plan: updated, created: false };
    }

    const duplicate = await ctx.db.query("missionPlans").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) {
      if (duplicate.missionId !== mission._id) throw new Error("Idempotency key is already bound to another Mission");
      return { plan: duplicate, created: false };
    }
    if (args.basePlanId) {
      const base = await ctx.db.get(args.basePlanId);
      if (!base || base.missionId !== mission._id || !["REJECTED", "SUPERSEDED"].includes(base.status)) {
        throw new Error("Plan revision baseline is not available");
      }
    }
    const existingPlans = await ctx.db.query("missionPlans").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect();
    const revisionNumber = existingPlans.reduce((latest, plan) => Math.max(latest, plan.revisionNumber), 0) + 1;
    const planId = await ctx.db.insert("missionPlans", {
      tenantId: mission.tenantId,
      projectId: mission.projectId,
      missionId: mission._id,
      basePlanId: args.basePlanId,
      idempotencyKey: args.idempotencyKey,
      revisionNumber,
      draftVersion: 1,
      status: "DRAFT",
      summary: args.summary,
      rollbackApproach: args.rollbackApproach,
      estimatedCostUsd: args.estimatedCostUsd,
      createdBy: operator.actorId,
      assertions: args.assertions,
      workOrderBlueprints: args.workOrderBlueprints,
      createdAt: now,
      metadata: args.metadata,
    });
    if (mission.state === "DRAFT") {
      assertTransition(mission, "PLANNING");
      await ctx.db.patch(mission._id, { state: "PLANNING", updatedAt: now });
    }
    const updatedMission = await ctx.db.get(mission._id) ?? mission;
    await logMissionEvent(ctx, {
      mission: updatedMission,
      eventType: "PLAN_DRAFT_CREATED",
      actorType: "HUMAN",
      actorId: operator.actorId,
      summary: `Created mission plan revision ${revisionNumber}`,
      idempotencyKey: `${args.idempotencyKey}:created`,
      metadata: { planId, basePlanId: args.basePlanId, actorSource: operator.actorSource },
    });
    return { plan: await ctx.db.get(planId), created: true };
  },
});

export const abandonPlanDraft = mutation({
  args: { projectId: v.id("projects"), missionId: v.id("missions"), planId: v.id("missionPlans"), reason: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await assertPlanReleaseEnabled(ctx, args.projectId);
    if (!args.reason.trim()) throw new Error("A reason is required to abandon a plan draft");
    const { mission } = await assertMissionProject(ctx, args.missionId, args.projectId, deliveryAccess);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.missionId !== mission._id || plan.status !== "DRAFT") throw new Error("Draft plan not found");
    if (mission.state !== "PLANNING") throw new Error(`Mission plan cannot be abandoned while ${mission.state}`);
    const duplicate = await ctx.db.query("missionEvents").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { mission, plan, created: false };
    const operator = await resolveOperator(ctx);
    const now = Date.now();
    assertTransition(mission, "DRAFT");
    await ctx.db.patch(plan._id, { status: "SUPERSEDED", decisionReason: args.reason.trim(), decidedBy: operator.actorId, decidedAt: now, decidedActorSource: operator.actorSource });
    await ctx.db.patch(mission._id, { state: "DRAFT", updatedAt: now, requiredHumanAction: "Review the Mission definition before creating another plan." });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_DRAFT_ABANDONED", actorType: "HUMAN", actorId: operator.actorId, summary: `Abandoned mission plan revision ${plan.revisionNumber}`, idempotencyKey: args.idempotencyKey, metadata: { planId: plan._id, reason: args.reason.trim(), actorSource: operator.actorSource } });
    return { mission: updated, plan: await ctx.db.get(plan._id), created: true };
  },
});

export const submitPlan = mutation({
  args: { projectId: v.id("projects"), missionId: v.id("missions"), planId: v.id("missionPlans"), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await assertPlanReleaseEnabled(ctx, args.projectId);
    const { mission, project } = await assertMissionProject(ctx, args.missionId, args.projectId, deliveryAccess);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.missionId !== mission._id || plan.projectId !== args.projectId) throw new Error("Mission plan not found");
    if (plan.status === "PROPOSED") return { plan, created: false };
    if (plan.status !== "DRAFT" || mission.state !== "PLANNING") throw new Error("Mission plan is not ready for submission");
    const workflows = await Promise.all(plan.workOrderBlueprints.map((blueprint: any) => blueprint.workflowId
      ? ctx.db.query("workflows").withIndex("by_workflow_id", (q: any) => q.eq("workflowId", blueprint.workflowId)).first()
      : null));
    const workOrderBlueprints = plan.workOrderBlueprints.map((blueprint: any, index: number) => {
      const workflow = workflows[index];
      if (!workflow || !workflow.active) throw new Error(`Active workflow not found for ${blueprint.id}`);
      return { ...blueprint, workflowVersion: workflow.version };
    });
    const proposed = { ...plan, repository: project.githubRepo, repositoryBranch: project.githubBranch, workOrderBlueprints };
    assertValidPlan(proposed);
    if (mission.budgetUsd !== undefined && proposed.estimatedCostUsd !== undefined && proposed.estimatedCostUsd > mission.budgetUsd) {
      throw new Error("Plan estimate exceeds the Mission budget");
    }
    const operator = await resolveOperator(ctx);
    const now = Date.now();
    assertTransition(mission, "AWAITING_PLAN_APPROVAL");
    await ctx.db.patch(plan._id, {
      status: "PROPOSED",
      repository: project.githubRepo,
      repositoryBranch: project.githubBranch,
      workOrderBlueprints,
      submittedBy: operator.actorId,
      submittedAt: now,
      submittedActorSource: operator.actorSource,
    });
    await ctx.db.patch(mission._id, { state: "AWAITING_PLAN_APPROVAL", updatedAt: now, requiredHumanAction: "Review, reject, or approve the proposed Mission plan." });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_SUBMITTED", actorType: "HUMAN", actorId: operator.actorId, summary: `Submitted mission plan revision ${plan.revisionNumber}`, idempotencyKey: args.idempotencyKey, metadata: { planId: plan._id, actorSource: operator.actorSource } });
    return { plan: await ctx.db.get(plan._id), created: true };
  },
});

export const rejectPlan = mutation({
  args: { projectId: v.id("projects"), missionId: v.id("missions"), planId: v.id("missionPlans"), reason: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.APPROVE_DELIVERY);
    await assertPlanReleaseEnabled(ctx, args.projectId);
    if (!args.reason.trim()) throw new Error("Plan rejection requires a reason");
    const { mission } = await assertMissionProject(ctx, args.missionId, args.projectId, deliveryAccess);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.missionId !== mission._id) throw new Error("Mission plan not found");
    if (plan.status === "REJECTED") return { mission, plan, created: false };
    if (plan.status !== "PROPOSED" || mission.state !== "AWAITING_PLAN_APPROVAL") throw new Error("Mission plan is not awaiting a decision");
    const operator = await resolveOperator(ctx);
    const now = Date.now();
    assertTransition(mission, "DRAFT");
    await ctx.db.patch(plan._id, { status: "REJECTED", decisionReason: args.reason.trim(), decidedBy: operator.actorId, decidedAt: now, decidedActorSource: operator.actorSource });
    await ctx.db.patch(mission._id, { state: "DRAFT", updatedAt: now, requiredHumanAction: "Revise the rejected plan before requesting another decision." });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_REJECTED", actorType: "HUMAN", actorId: operator.actorId, summary: `Rejected mission plan revision ${plan.revisionNumber}`, idempotencyKey: args.idempotencyKey, metadata: { planId: plan._id, reason: args.reason.trim(), actorSource: operator.actorSource } });
    return { mission: updated, plan: await ctx.db.get(plan._id), created: true };
  },
});

export const forkPlanRevision = mutation({
  args: { projectId: v.id("projects"), missionId: v.id("missions"), sourcePlanId: v.id("missionPlans"), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    await assertPlanReleaseEnabled(ctx, args.projectId);
    const { mission } = await assertMissionProject(ctx, args.missionId, args.projectId, deliveryAccess);
    if (mission.state !== "DRAFT") throw new Error(`Mission cannot create a plan revision while ${mission.state}`);
    const source = await ctx.db.get(args.sourcePlanId);
    if (!source || source.missionId !== mission._id || !["REJECTED", "SUPERSEDED"].includes(source.status)) throw new Error("Plan revision source not found");
    const duplicate = await ctx.db.query("missionPlans").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) {
      if (duplicate.missionId !== mission._id) throw new Error("Idempotency key is already bound to another Mission");
      return { plan: duplicate, created: false };
    }
    const plans = await ctx.db.query("missionPlans").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect();
    const revisionNumber = plans.reduce((latest, plan) => Math.max(latest, plan.revisionNumber), 0) + 1;
    const operator = await resolveOperator(ctx);
    const now = Date.now();
    const planId = await ctx.db.insert("missionPlans", {
      tenantId: mission.tenantId,
      projectId: mission.projectId,
      missionId: mission._id,
      basePlanId: source._id,
      idempotencyKey: args.idempotencyKey,
      revisionNumber,
      draftVersion: 1,
      status: "DRAFT",
      summary: source.summary,
      rollbackApproach: source.rollbackApproach,
      estimatedCostUsd: source.estimatedCostUsd,
      createdBy: operator.actorId,
      assertions: normalizedPlanAssertions(source),
      workOrderBlueprints: source.workOrderBlueprints,
      createdAt: now,
      metadata: source.metadata,
    });
    assertTransition(mission, "PLANNING");
    await ctx.db.patch(mission._id, { state: "PLANNING", updatedAt: now, requiredHumanAction: undefined });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_REVISION_FORKED", actorType: "HUMAN", actorId: operator.actorId, summary: `Created mission plan revision ${revisionNumber} from revision ${source.revisionNumber}`, idempotencyKey: `${args.idempotencyKey}:forked`, metadata: { planId, basePlanId: source._id, actorSource: operator.actorSource } });
    return { plan: await ctx.db.get(planId), created: true };
  },
});

export const approvePlan = mutation({
  args: { projectId: v.id("projects"), missionId: v.id("missions"), planId: v.id("missionPlans"), decisionReason: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, args.projectId, COMPANY_PERMISSIONS.APPROVE_DELIVERY);
    await assertPlanReleaseEnabled(ctx, args.projectId);
    if (!args.decisionReason.trim()) throw new Error("Plan approval requires a reason");
    const { mission, project } = await assertMissionProject(ctx, args.missionId, args.projectId, deliveryAccess);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.missionId !== mission._id || plan.projectId !== args.projectId) throw new Error("Mission plan not found");
    if (plan.status === "APPROVED" && plan.releasedWorkOrderIds?.length) {
      const existingWorkOrders = (await Promise.all(plan.releasedWorkOrderIds.map((id: any) => ctx.db.get(id)))).filter(Boolean);
      return { mission, plan, workOrders: existingWorkOrders, created: false };
    }
    if (mission.state !== "AWAITING_PLAN_APPROVAL" || plan.status !== "PROPOSED") throw new Error("Mission plan is not awaiting approval");
    if (plan.repository !== project.githubRepo || plan.repositoryBranch !== project.githubBranch) throw new Error("Repository configuration changed after plan submission. Create a new revision.");
    assertValidPlan(plan);
    const workflows = await Promise.all(plan.workOrderBlueprints.map((blueprint: any) => ctx.db.query("workflows").withIndex("by_workflow_id", (q: any) => q.eq("workflowId", blueprint.workflowId)).first()));
    for (let index = 0; index < workflows.length; index += 1) {
      if (!workflows[index]?.active || workflows[index]?.version !== plan.workOrderBlueprints[index].workflowVersion) {
        throw new Error(`Workflow changed after plan submission: ${plan.workOrderBlueprints[index].workflowId}`);
      }
    }
    const operator = await resolveOperator(ctx);
    if (operator.actorSource === "AUTHENTICATED" && plan.submittedBy === operator.actorId) {
      throw new Error("A plan author cannot approve the same plan revision");
    }
    const now = Date.now();
    const releaseKey = missionPlanReleaseKey(String(plan._id));
    const assertionRows = new Map<string, any>();
    for (const assertion of normalizedPlanAssertions(plan)) {
      const assertionId = await ctx.db.insert("validationAssertions", {
        tenantId: mission.tenantId,
        projectId: mission.projectId,
        missionId: mission._id,
        missionPlanId: plan._id,
        assertionId: assertion.assertionId,
        title: assertion.title,
        outcome: assertion.outcome,
        verificationMethod: assertion.verificationMethod,
        passCondition: assertion.passCondition,
        requiredEvidence: assertion.requiredEvidence,
        requiresIndependentValidation: assertion.requiresIndependentValidation,
        waiverAllowed: assertion.waiverAllowed,
        linkedWorkOrderIds: [],
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      });
      assertionRows.set(assertion.assertionId, await ctx.db.get(assertionId));
    }
    await ctx.db.patch(plan._id, {
      status: "APPROVED",
      approvedBy: operator.actorId,
      approvedAt: now,
      decisionReason: args.decisionReason.trim(),
      decidedBy: operator.actorId,
      decidedAt: now,
      decidedActorSource: operator.actorSource,
      releaseIdempotencyKey: releaseKey,
      materializationVersion: 1,
    });
    await ctx.db.patch(mission._id, { state: "READY", currentPlanId: plan._id, updatedAt: now, requiredHumanAction: "Review released WorkOrders. Execution remains a separate governed action." });

    const releasedByBlueprint = new Map<string, any>();
    const workOrders: any[] = [];
    for (const blueprint of [...plan.workOrderBlueprints].sort((left: any, right: any) => left.sequence - right.sequence)) {
      const linkedAssertions = blueprint.assertionIds.map((assertionId: string) => assertionRows.get(assertionId));
      const dependencies = blueprint.dependsOnBlueprintIds.map((dependencyId: string) => String(releasedByBlueprint.get(dependencyId)?._id ?? dependencyId));
      const result = await createWorkOrderRecord(ctx, {
        projectId: args.projectId,
        missionId: mission._id,
        missionPlanId: plan._id,
        missionBlueprintId: blueprint.id,
        missionRole: blueprint.role,
        isMutating: blueprint.isMutating,
        idempotencyKey: missionBlueprintReleaseKey(String(plan._id), blueprint.id),
        title: blueprint.title,
        desiredOutcome: blueprint.desiredOutcome,
        context: mission.context,
        workflowId: blueprint.workflowId,
        repository: plan.repository,
        branchStrategy: blueprint.branchStrategy,
        priority: blueprint.priority ?? 3,
        riskLevel: blueprint.riskLevel ?? "MEDIUM",
        modelComplexity: blueprint.modelComplexity,
        requestedBy: operator.actorId,
        acceptanceCriteria: linkedAssertions.map((assertion: any) => ({
          id: assertion.assertionId,
          title: assertion.title,
          description: `${assertion.passCondition} Evidence: ${assertion.requiredEvidence}`,
          verificationMethod: assertion.verificationMethod,
          status: "PENDING",
        })),
        constraints: [...(mission.constraints ?? []), ...(blueprint.constraints ?? [])],
        dependencies,
        sourceOfTruthRefs: mission.sourceOfTruthRefs,
        requiredApprovals: blueprint.requiredApprovals ?? [],
        state: "READY",
        metadata: { approvedWorkflowVersion: blueprint.workflowVersion, estimatedCostUsd: blueprint.estimatedCostUsd },
      });
      releasedByBlueprint.set(blueprint.id, result.workOrder);
      workOrders.push(result.workOrder);
    }
    await ctx.db.patch(plan._id, { releasedAt: now, releasedWorkOrderIds: workOrders.map((workOrder) => workOrder._id) });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_APPROVED_AND_WORKORDERS_RELEASED", actorType: "HUMAN", actorId: operator.actorId, summary: `Approved mission plan revision ${plan.revisionNumber} and released ${workOrders.length} WorkOrders`, idempotencyKey: args.idempotencyKey, metadata: { planId: plan._id, releaseKey, workOrderIds: workOrders.map((workOrder) => workOrder._id), reason: args.decisionReason.trim(), actorSource: operator.actorSource, dispatchStarted: false } });
    return { mission: updated, plan: await ctx.db.get(plan._id), workOrders, created: true };
  },
});

export const start = mutation({
  args: { missionId: v.id("missions"), actorId: v.optional(v.string()), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const scopedMission = await ctx.db.get(args.missionId);
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, scopedMission?.projectId, COMPANY_PERMISSIONS.DISPATCH_WORK);
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    if (deliveryAccess) {
      if (!mission.ownerMemberId || !mission.owningTeamId) {
        throw new Error("Assign one accountable human owner and owning team before starting the Mission");
      }
      const activeOwners = (await ctx.db
        .query("missionAssignments")
        .withIndex("by_mission_role", (q) => q.eq("missionId", mission._id).eq("role", "OWNER"))
        .collect())
        .filter((assignment) => assignment.active);
      if (activeOwners.length !== 1 || activeOwners[0].memberId !== mission.ownerMemberId || activeOwners[0].teamId !== mission.owningTeamId) {
        throw new Error("Mission ownership must have exactly one matching active OWNER assignment before start");
      }
    }
    if (mission.state === "IN_PROGRESS") return { mission, created: false };
    const releasedWorkOrder = await ctx.db
      .query("workOrders")
      .withIndex("by_mission", (q) => q.eq("missionId", mission._id))
      .first();
    if (!releasedWorkOrder) throw new Error("Release at least one approved WorkOrder before starting the Mission");
    assertTransition(mission, "IN_PROGRESS");
    const now = Date.now();
    await ctx.db.patch(mission._id, { state: "IN_PROGRESS", updatedAt: now, blockingReason: undefined, requiredHumanAction: undefined });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "MISSION_STARTED", actorType: "HUMAN", actorId: args.actorId, summary: "Mission execution started", idempotencyKey: args.idempotencyKey });
    return { mission: updated, created: true };
  },
});

export const recordValidationResult = mutation({
  args: {
    missionId: v.id("missions"), validationAssertionId: v.id("validationAssertions"), workflowRunId: v.id("workflowRuns"),
    status: v.union(v.literal("PASS"), v.literal("FAIL"), v.literal("WAIVED"), v.literal("STALE"), v.literal("UNKNOWN")),
    verificationReceiptId: v.optional(v.id("verificationReceipts")), waiverApprovalDecisionId: v.optional(v.id("approvalDecisions")),
    actorId: v.optional(v.string()), idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const scopedMission = await ctx.db.get(args.missionId);
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, scopedMission?.projectId, COMPANY_PERMISSIONS.VERIFY_DELIVERY);
    const [mission, assertion, run] = await Promise.all([
      ctx.db.get(args.missionId), ctx.db.get(args.validationAssertionId), ctx.db.get(args.workflowRunId),
    ]);
    if (!mission || !assertion || !run || assertion.missionId !== mission._id || run.missionId !== mission._id) {
      throw new Error("Mission validation references do not match");
    }
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    if (run.missionRole !== "VALIDATOR" && assertion.requiresIndependentValidation) {
      throw new Error("Independent validation requires a validator WorkflowRun");
    }
    if (args.status === "PASS" && run.status !== "COMPLETED") {
      throw new Error("A passing Mission assertion requires a completed validator WorkflowRun");
    }
    if (args.status === "PASS") {
      if (!args.verificationReceiptId) {
        throw new Error("A passing Mission assertion requires a verification receipt");
      }
      const receipt = await ctx.db.get(args.verificationReceiptId);
      if (!receipt
        || receipt.validationAssertionId !== assertion._id
        || receipt.workflowRunId !== run._id
        || receipt.status !== "PASSED") {
        throw new Error("The verification receipt does not prove this assertion with this Validator run");
      }
    }
    if (args.status === "WAIVED" && (!assertion.waiverAllowed || !args.waiverApprovalDecisionId)) {
      throw new Error("Mission assertion waiver requires an authorized approval");
    }
    const duplicate = await ctx.db.query("missionEvents").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { assertion, created: false };
    const now = Date.now();
    await ctx.db.patch(assertion._id, {
      status: args.status, validatorWorkflowRunId: run._id, verificationReceiptId: args.verificationReceiptId,
      waiverApprovalDecisionId: args.waiverApprovalDecisionId, updatedAt: now,
    });
    const execution = await loadMissionExecutionState(ctx, mission._id);
    const acceptance = execution.acceptance;
    const nextState = acceptance.eligible ? "AWAITING_ACCEPTANCE" : args.status === "FAIL" || args.status === "UNKNOWN" || args.status === "STALE" ? "BLOCKED" : mission.state;
    await ctx.db.patch(mission._id, {
      state: nextState as any, updatedAt: now,
      blockingReason: acceptance.eligible ? undefined : acceptance.blockingReasons.join("; "),
      requiredHumanAction: acceptance.eligible ? "Review and accept the fully evidenced Mission." : "Review validation evidence and create corrective work or revise the plan.",
    });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "VALIDATION_RECORDED", actorType: "AGENT", actorId: args.actorId, summary: `Validation ${args.status} for ${assertion.assertionId}`, idempotencyKey: args.idempotencyKey, metadata: { validationAssertionId: assertion._id, workflowRunId: run._id, verificationReceiptId: args.verificationReceiptId } });
    return { assertion: await ctx.db.get(assertion._id), mission: updated, acceptance, created: true };
  },
});

export const requestCorrectiveWork = mutation({
  args: { missionId: v.id("missions"), requestedBy: v.string(), reason: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const scopedMission = await ctx.db.get(args.missionId);
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, scopedMission?.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    if (mission.state !== "BLOCKED") throw new Error(`Corrective work can only be requested while Mission is BLOCKED (currently ${mission.state})`);
    if (mission.correctiveIterations >= mission.maxCorrectiveIterations) {
      throw new Error("Mission corrective-iteration limit reached; revise the plan or rescope with an operator");
    }
    const failedAssertions = await ctx.db
      .query("validationAssertions")
      .withIndex("by_mission", (q) => q.eq("missionId", mission._id))
      .collect();
    const failedAssertionIds = failedAssertions.filter((assertion) => ["FAIL", "STALE", "UNKNOWN"].includes(assertion.status)).map((assertion) => assertion.assertionId);
    if (failedAssertionIds.length === 0) throw new Error("Corrective work requires failed, stale, or unknown validation evidence");
    const duplicate = await ctx.db.query("missionEvents").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { mission, failedAssertionIds, created: false };
    const now = Date.now();
    await ctx.db.patch(mission._id, {
      state: "READY", correctiveIterations: mission.correctiveIterations + 1, updatedAt: now,
      blockingReason: undefined,
      requiredHumanAction: "Release a corrective Worker Work Order, then re-run independent validation.",
    });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, {
      mission: updated, eventType: "CORRECTIVE_WORK_REQUESTED", actorType: "HUMAN", actorId: args.requestedBy,
      summary: `Corrective iteration ${updated.correctiveIterations} requested for ${failedAssertionIds.join(", ")}`,
      idempotencyKey: args.idempotencyKey, metadata: { failedAssertionIds, reason: args.reason },
    });
    return { mission: updated, failedAssertionIds, created: true };
  },
});

export const accept = mutation({
  args: { missionId: v.id("missions"), acceptedBy: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const scopedMission = await ctx.db.get(args.missionId);
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, scopedMission?.projectId, COMPANY_PERMISSIONS.APPROVE_DELIVERY);
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    const duplicate = await ctx.db.query("missionEvents").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { mission, created: false };
    if (mission.state !== "AWAITING_ACCEPTANCE") throw new Error(`Mission cannot be accepted while ${mission.state}`);
    const acceptance = (await loadMissionExecutionState(ctx, mission._id)).acceptance;
    if (!acceptance.eligible) throw new Error(`Mission cannot be accepted (${acceptance.blockingReasons.join("; ")})`);
    const now = Date.now();
    await ctx.db.patch(mission._id, { state: "DONE", acceptedAt: now, updatedAt: now, requiredHumanAction: undefined, blockingReason: undefined });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "MISSION_ACCEPTED", actorType: "HUMAN", actorId: args.acceptedBy, summary: "Mission accepted with complete validation coverage", idempotencyKey: args.idempotencyKey });
    return { mission: updated, created: true };
  },
});

export const recordHandoff = mutation({
  args: {
    missionId: v.id("missions"), workOrderId: v.id("workOrders"), workflowRunId: v.id("workflowRuns"), idempotencyKey: v.string(),
    producingRole: v.union(v.literal("WORKER"), v.literal("VALIDATOR")), consumingRole: v.union(v.literal("WORKER"), v.literal("VALIDATOR"), v.literal("ORCHESTRATOR"), v.literal("OPERATOR")),
    outcome: v.union(v.literal("COMPLETE"), v.literal("INCOMPLETE"), v.literal("NEEDS_HUMAN_INPUT")),
    completedAssertionIds: v.array(v.string()), incompleteAssertionIds: v.array(v.string()), unknownAssertionIds: v.array(v.string()),
    commands: v.array(v.object({ command: v.string(), exitCode: v.number() })), artifactIds: v.array(v.id("runArtifacts")), knownRisks: v.array(v.string()), nextAction: v.string(), nextOwner: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scopedMission = await ctx.db.get(args.missionId);
    const deliveryAccess = await requireAuthorizedDeliveryScope(ctx, scopedMission?.projectId, COMPANY_PERMISSIONS.UPDATE_DELIVERY);
    const [mission, workOrder, workflowRun] = await Promise.all([ctx.db.get(args.missionId), ctx.db.get(args.workOrderId), ctx.db.get(args.workflowRunId)]);
    if (!mission || !workOrder || !workflowRun || workOrder.missionId !== mission._id || workflowRun.missionId !== mission._id) throw new Error("Mission handoff references do not match");
    assertAuthorizedDeliveryRecord(deliveryAccess, mission);
    if (workflowRun.workOrderId !== workOrder._id || workflowRun.status !== "COMPLETED") {
      throw new Error("Mission handoff requires a completed run from the same WorkOrder");
    }
    if (workOrder.state !== "DONE") throw new Error("Accept the WorkOrder before recording its Mission handoff");
    const missionRole = workOrder.missionRole ?? "WORKER";
    if (missionRole !== args.producingRole || workflowRun.missionRole !== args.producingRole) {
      throw new Error("Mission handoff producing role does not match its WorkOrder and run");
    }
    const plan = workOrder.missionPlanId ? await ctx.db.get(workOrder.missionPlanId) : null;
    const blueprintId = workOrder.metadata?.missionBlueprintId;
    const blueprint = plan?.workOrderBlueprints.find((candidate: any) => candidate.id === blueprintId);
    if (!blueprint) throw new Error("Mission handoff is missing its approved blueprint contract");
    const reportedAssertionIds = [
      ...args.completedAssertionIds,
      ...args.incompleteAssertionIds,
      ...args.unknownAssertionIds,
    ];
    if (reportedAssertionIds.length !== blueprint.assertionIds.length
      || reportedAssertionIds.some((assertionId: string) => !blueprint.assertionIds.includes(assertionId))) {
      throw new Error("Mission handoff must account for every assertion in its approved blueprint");
    }
    for (const artifactId of args.artifactIds) {
      const artifact = await ctx.db.get(artifactId);
      if (!artifact || artifact.workflowRunId !== workflowRun._id || artifact.workOrderId !== workOrder._id) {
        throw new Error("Mission handoff artifacts must belong to the same run and WorkOrder");
      }
    }
    const validation = validateMissionHandoff({ ...args, role: args.producingRole });
    if (!validation.ok) throw new Error(`Mission handoff is invalid (${validation.reason})`);
    const duplicate = await ctx.db.query("missionHandoffs").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { handoff: duplicate, created: false };
    const handoffId = await ctx.db.insert("missionHandoffs", { ...args, tenantId: mission.tenantId, projectId: mission.projectId, createdAt: Date.now() });
    await logMissionEvent(ctx, { mission, eventType: "HANDOFF_RECORDED", actorType: "AGENT", summary: `${args.producingRole} handoff recorded`, idempotencyKey: `${args.idempotencyKey}:event`, metadata: { handoffId, workOrderId: workOrder._id, workflowRunId: workflowRun._id } });
    const handoff = await ctx.db.get(handoffId);
    const reconciliation = await reconcileMissionAfterHandoff(ctx, { mission, handoff });
    return { handoff, mission: reconciliation.mission, acceptance: reconciliation.acceptance, created: true };
  },
});
