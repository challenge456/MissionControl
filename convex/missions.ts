import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  canTransitionMission,
  evaluateMissionAcceptance,
  validateMissionHandoff,
} from "./lib/missionGovernance";

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
  sequence: v.number(),
  role: v.union(v.literal("WORKER"), v.literal("VALIDATOR")),
  isMutating: v.boolean(),
  dependsOnBlueprintIds: v.array(v.string()),
  assertionIds: v.array(v.string()),
});

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

export const list = query({
  args: { projectId: v.optional(v.id("projects")), state: v.optional(missionState), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let missions = args.projectId
      ? await ctx.db.query("missions").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).order("desc").take(args.limit ?? 100)
      : await ctx.db.query("missions").order("desc").take(args.limit ?? 100);
    if (args.state) missions = missions.filter((mission) => mission.state === args.state);
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
    const [plans, assertions, handoffs, events, workOrders] = await Promise.all([
      ctx.db.query("missionPlans").withIndex("by_mission", (q) => q.eq("missionId", args.missionId)).order("desc").collect(),
      ctx.db.query("validationAssertions").withIndex("by_mission", (q) => q.eq("missionId", args.missionId)).collect(),
      ctx.db.query("missionHandoffs").withIndex("by_mission", (q) => q.eq("missionId", args.missionId)).order("desc").collect(),
      ctx.db.query("missionEvents").withIndex("by_mission_timestamp", (q) => q.eq("missionId", args.missionId)).order("desc").collect(),
      ctx.db.query("workOrders").withIndex("by_mission", (q) => q.eq("missionId", args.missionId)).collect(),
    ]);
    return { mission, plans, assertions, handoffs, events, workOrders, acceptance: evaluateMissionAcceptance({ assertions: assertions.map((assertion) => ({
      id: assertion.assertionId,
      status: assertion.status,
      requiresIndependentValidation: assertion.requiresIndependentValidation,
      validatorRunId: assertion.validatorWorkflowRunId,
      waiverApprovalId: assertion.waiverApprovalDecisionId,
    })) }) };
  },
});

export const createDraft = mutation({
  args: {
    projectId: v.optional(v.id("projects")), idempotencyKey: v.optional(v.string()), title: v.string(), objective: v.string(),
    context: v.optional(v.string()), constraints: v.optional(v.array(v.string())), sourceOfTruthRefs: v.optional(v.array(sourceRef)),
    owner: v.optional(v.string()), budgetUsd: v.optional(v.number()), stopCondition: v.string(),
    maxReadOnlyConcurrency: v.optional(v.number()), maxCorrectiveIterations: v.optional(v.number()), metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (args.idempotencyKey) {
      const existing = await ctx.db.query("missions").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
      if (existing) return { mission: existing, created: false };
    }
    const project = args.projectId ? await ctx.db.get(args.projectId) : null;
    const now = Date.now();
    const missionId = await ctx.db.insert("missions", {
      tenantId: project?.tenantId, projectId: args.projectId, idempotencyKey: args.idempotencyKey,
      title: args.title, objective: args.objective, context: args.context, constraints: args.constraints,
      sourceOfTruthRefs: args.sourceOfTruthRefs, owner: args.owner, state: "DRAFT", executionPolicy: "SERIAL_MUTATIONS",
      maxReadOnlyConcurrency: args.maxReadOnlyConcurrency ?? 2, maxCorrectiveIterations: args.maxCorrectiveIterations ?? 2,
      correctiveIterations: 0, stopCondition: args.stopCondition, budgetUsd: args.budgetUsd, spentUsd: 0,
      createdAt: now, updatedAt: now, metadata: args.metadata,
    });
    const mission = await ctx.db.get(missionId);
    if (!mission) throw new Error("Mission creation failed");
    await logMissionEvent(ctx, { mission, eventType: "MISSION_CREATED", actorType: "HUMAN", actorId: args.owner, summary: `Created mission ${args.title}`, idempotencyKey: args.idempotencyKey ? `${args.idempotencyKey}:created` : undefined });
    return { mission, created: true };
  },
});

export const submitPlan = mutation({
  args: { missionId: v.id("missions"), idempotencyKey: v.string(), createdBy: v.string(), summary: v.string(), workOrderBlueprints: v.array(blueprintInput), assertions: v.array(assertionInput), metadata: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    if (!["DRAFT", "PLANNING"].includes(mission.state)) throw new Error(`Mission cannot accept a plan while ${mission.state}`);
    const duplicate = await ctx.db.query("missionPlans").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { plan: duplicate, created: false };
    if (args.assertions.length === 0) throw new Error("Mission plan requires at least one validation assertion");
    const assertionIds = new Set(args.assertions.map((assertion) => assertion.assertionId));
    if (assertionIds.size !== args.assertions.length) throw new Error("Mission assertion IDs must be unique");
    if (args.workOrderBlueprints.some((blueprint) => blueprint.assertionIds.some((id) => !assertionIds.has(id)))) {
      throw new Error("WorkOrder blueprint references an unknown assertion");
    }
    const existingPlans = await ctx.db.query("missionPlans").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect();
    const now = Date.now();
    const planId = await ctx.db.insert("missionPlans", {
      tenantId: mission.tenantId, projectId: mission.projectId, missionId: mission._id, idempotencyKey: args.idempotencyKey,
      revisionNumber: existingPlans.length + 1, status: "PROPOSED", summary: args.summary, createdBy: args.createdBy,
      workOrderBlueprints: args.workOrderBlueprints, createdAt: now, metadata: { assertions: args.assertions, ...args.metadata },
    });
    const nextState = "AWAITING_PLAN_APPROVAL" as const;
    if (mission.state === "DRAFT") assertTransition(mission, "PLANNING");
    await ctx.db.patch(mission._id, { state: nextState, updatedAt: now });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_SUBMITTED", actorType: "AGENT", actorId: args.createdBy, summary: `Submitted mission plan revision ${existingPlans.length + 1}`, idempotencyKey: `${args.idempotencyKey}:submitted`, metadata: { planId } });
    return { plan: await ctx.db.get(planId), created: true };
  },
});

export const approvePlan = mutation({
  args: { missionId: v.id("missions"), planId: v.id("missionPlans"), approvedBy: v.string(), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const [mission, plan] = await Promise.all([ctx.db.get(args.missionId), ctx.db.get(args.planId)]);
    if (!mission || !plan || plan.missionId !== mission._id) throw new Error("Mission plan not found");
    if (mission.state !== "AWAITING_PLAN_APPROVAL" || plan.status !== "PROPOSED") throw new Error("Mission plan is not awaiting approval");
    const duplicate = await ctx.db.query("missionEvents").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { mission, created: false };
    const now = Date.now();
    const assertions = (plan.metadata?.assertions ?? []) as Array<any>;
    for (const assertion of assertions) {
      await ctx.db.insert("validationAssertions", {
        tenantId: mission.tenantId, projectId: mission.projectId, missionId: mission._id, missionPlanId: plan._id,
        assertionId: assertion.assertionId, title: assertion.title, outcome: assertion.outcome,
        verificationMethod: assertion.verificationMethod, passCondition: assertion.passCondition, requiredEvidence: assertion.requiredEvidence,
        requiresIndependentValidation: assertion.requiresIndependentValidation, waiverAllowed: assertion.waiverAllowed,
        linkedWorkOrderIds: [], status: "PENDING", createdAt: now, updatedAt: now,
      });
    }
    await ctx.db.patch(plan._id, { status: "APPROVED", approvedBy: args.approvedBy, approvedAt: now });
    await ctx.db.patch(mission._id, { state: "READY", currentPlanId: plan._id, updatedAt: now });
    const updated = await ctx.db.get(mission._id);
    if (updated) await logMissionEvent(ctx, { mission: updated, eventType: "PLAN_APPROVED", actorType: "HUMAN", actorId: args.approvedBy, summary: `Approved mission plan revision ${plan.revisionNumber}`, idempotencyKey: args.idempotencyKey, metadata: { planId: plan._id } });
    return { mission: updated, created: true };
  },
});

export const start = mutation({
  args: { missionId: v.id("missions"), actorId: v.optional(v.string()), idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
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
    const [mission, assertion, run] = await Promise.all([
      ctx.db.get(args.missionId), ctx.db.get(args.validationAssertionId), ctx.db.get(args.workflowRunId),
    ]);
    if (!mission || !assertion || !run || assertion.missionId !== mission._id || run.missionId !== mission._id) {
      throw new Error("Mission validation references do not match");
    }
    if (run.missionRole !== "VALIDATOR" && assertion.requiresIndependentValidation) {
      throw new Error("Independent validation requires a validator WorkflowRun");
    }
    if (args.status === "PASS" && run.status !== "COMPLETED") {
      throw new Error("A passing Mission assertion requires a completed validator WorkflowRun");
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
    const assertions = await ctx.db.query("validationAssertions").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect();
    const acceptance = evaluateMissionAcceptance({ assertions: assertions.map((row) => ({
      id: row.assertionId,
      status: row._id === assertion._id ? args.status : row.status,
      requiresIndependentValidation: row.requiresIndependentValidation,
      validatorRunId: row._id === assertion._id ? run._id : row.validatorWorkflowRunId,
      waiverApprovalId: row._id === assertion._id ? args.waiverApprovalDecisionId : row.waiverApprovalDecisionId,
    })) });
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
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
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
    const mission = await ctx.db.get(args.missionId);
    if (!mission) throw new Error("Mission not found");
    const duplicate = await ctx.db.query("missionEvents").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { mission, created: false };
    if (mission.state !== "AWAITING_ACCEPTANCE") throw new Error(`Mission cannot be accepted while ${mission.state}`);
    const assertions = await ctx.db.query("validationAssertions").withIndex("by_mission", (q) => q.eq("missionId", mission._id)).collect();
    const acceptance = evaluateMissionAcceptance({ assertions: assertions.map((assertion) => ({
      id: assertion.assertionId, status: assertion.status, requiresIndependentValidation: assertion.requiresIndependentValidation,
      validatorRunId: assertion.validatorWorkflowRunId, waiverApprovalId: assertion.waiverApprovalDecisionId,
    })) });
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
    const [mission, workOrder, workflowRun] = await Promise.all([ctx.db.get(args.missionId), ctx.db.get(args.workOrderId), ctx.db.get(args.workflowRunId)]);
    if (!mission || !workOrder || !workflowRun || workOrder.missionId !== mission._id || workflowRun.missionId !== mission._id) throw new Error("Mission handoff references do not match");
    const validation = validateMissionHandoff({ ...args, role: args.producingRole });
    if (!validation.ok) throw new Error(`Mission handoff is invalid (${validation.reason})`);
    const duplicate = await ctx.db.query("missionHandoffs").withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey)).first();
    if (duplicate) return { handoff: duplicate, created: false };
    const handoffId = await ctx.db.insert("missionHandoffs", { ...args, tenantId: mission.tenantId, projectId: mission.projectId, createdAt: Date.now() });
    await logMissionEvent(ctx, { mission, eventType: "HANDOFF_RECORDED", actorType: "AGENT", summary: `${args.producingRole} handoff recorded`, idempotencyKey: `${args.idempotencyKey}:event`, metadata: { handoffId, workOrderId: workOrder._id, workflowRunId: workflowRun._id } });
    return { handoff: await ctx.db.get(handoffId), created: true };
  },
});
