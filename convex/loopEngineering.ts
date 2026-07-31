import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  classifyFreshness,
  normalizeSourceUrl,
  validateLoopAdvance,
  type LoopPhase,
} from "./lib/loopEngineering";
import { GRAPH_ENGINEERING_PERSONAS } from "./lib/graphEngineering";

function cycleRef(cycleId: Id<"loopEngineeringCycles">) {
  return `loop-engineering:${cycleId}`;
}

async function logCycleActivity(
  ctx: { db: any },
  args: {
    projectId: Id<"projects">;
    cycleId: Id<"loopEngineeringCycles">;
    action: string;
    description: string;
    actorId: string;
    metadata?: unknown;
  }
) {
  await ctx.db.insert("activities", {
    projectId: args.projectId,
    actorType: "HUMAN",
    actorId: args.actorId,
    action: args.action,
    description: args.description,
    targetType: "LOOP_ENGINEERING_CYCLE",
    targetId: args.cycleId,
    metadata: args.metadata,
  });
}

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("loopEngineeringCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect(),
});

export const get = query({
  args: { cycleId: v.id("loopEngineeringCycles") },
  handler: async (ctx, args) => await ctx.db.get(args.cycleId),
});

export const getByIdempotency = query({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) =>
    await ctx.db
      .query("loopEngineeringCycles")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first(),
});

export const createRecord = internalMutation({
  args: {
    projectId: v.id("projects"),
    parentCycleId: v.optional(v.id("loopEngineeringCycles")),
    idempotencyKey: v.string(),
    iteration: v.number(),
    objective: v.string(),
    hypothesis: v.optional(v.string()),
    researchBrief: v.optional(v.object({
      question: v.string(),
      scope: v.string(),
      exclusions: v.array(v.string()),
      freshnessWindow: v.string(),
      preferredSourceTypes: v.array(v.string()),
      requiredOutput: v.string(),
      approvalPolicy: v.string(),
    })),
    stopCondition: v.string(),
    maxIterations: v.number(),
    taskIds: v.array(v.id("tasks")),
    workOrderIds: v.array(v.id("workOrders")),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("loopEngineeringCycles")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .first();
    if (existing) return existing;

    const now = Date.now();
    const cycleId = await ctx.db.insert("loopEngineeringCycles", {
      projectId: args.projectId,
      parentCycleId: args.parentCycleId,
      idempotencyKey: args.idempotencyKey,
      iteration: args.iteration,
      objective: args.objective,
      hypothesis: args.hypothesis,
      researchBrief: args.researchBrief,
      stopCondition: args.stopCondition,
      maxIterations: args.maxIterations,
      phase: "RESEARCH",
      phaseHistory: [{
        phase: "RESEARCH",
        enteredAt: now,
        actorId: args.createdBy,
        note: "Cycle created",
      }],
      sources: [],
      claims: [],
      recommendations: [],
      validations: [],
      measurements: [],
      taskIds: args.taskIds,
      workOrderIds: args.workOrderIds,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    for (let index = 1; index < args.taskIds.length; index++) {
      const existingDependency = await ctx.db
        .query("taskDependencies")
        .withIndex("by_parent", (q) => q.eq("parentTaskId", args.taskIds[0]))
        .filter((q) =>
          q.and(
            q.eq(q.field("taskId"), args.taskIds[index]),
            q.eq(q.field("dependsOnTaskId"), args.taskIds[index - 1])
          )
        )
        .first();
      if (!existingDependency) {
        await ctx.db.insert("taskDependencies", {
          parentTaskId: args.taskIds[0],
          taskId: args.taskIds[index],
          dependsOnTaskId: args.taskIds[index - 1],
        });
      }
    }

    await logCycleActivity(ctx, {
      projectId: args.projectId,
      cycleId,
      action: "LOOP_CYCLE_CREATED",
      description: `Loop Engineering cycle ${args.iteration} created`,
      actorId: args.createdBy,
      metadata: {
        objective: args.objective,
        taskIds: args.taskIds,
        workOrderIds: args.workOrderIds,
      },
    });
    return await ctx.db.get(cycleId);
  },
});

export const create = action({
  args: {
    projectId: v.id("projects"),
    objective: v.string(),
    hypothesis: v.optional(v.string()),
    researchBrief: v.optional(v.object({
      question: v.string(),
      scope: v.string(),
      exclusions: v.array(v.string()),
      freshnessWindow: v.string(),
      preferredSourceTypes: v.array(v.string()),
      requiredOutput: v.string(),
      approvalPolicy: v.string(),
    })),
    stopCondition: v.string(),
    maxIterations: v.number(),
    idempotencyKey: v.string(),
    createdBy: v.string(),
    parentCycleId: v.optional(v.id("loopEngineeringCycles")),
    iteration: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const objective = args.objective.trim();
    const stopCondition = args.stopCondition.trim();
    if (!objective) throw new Error("Objective is required.");
    if (!stopCondition) throw new Error("Stop condition is required.");
    if (args.maxIterations < 1 || args.maxIterations > 10) {
      throw new Error("Maximum iterations must be between 1 and 10.");
    }

    const existing = await ctx.runQuery(api.loopEngineering.getByIdempotency, {
      idempotencyKey: args.idempotencyKey,
    });
    if (existing) return { cycle: existing, created: false };

    const project = await ctx.runQuery(api.projects.get, { projectId: args.projectId });
    if (!project) throw new Error("Project not found.");

    for (const persona of GRAPH_ENGINEERING_PERSONAS) {
      await ctx.runMutation(api.agents.register, {
        projectId: args.projectId,
        name: persona.name,
        emoji: persona.emoji,
        role: persona.role,
        workspacePath: project.githubRepo ?? project.slug ?? "mission-control",
        allowedTaskTypes: [...persona.allowedTaskTypes],
        budgetDaily: persona.budgetDaily,
        budgetPerRun: persona.budgetPerRun,
        canSpawn: false,
        maxSubAgents: 0,
        metadata: {
          builtInPersona: true,
          graphEngineering: true,
        },
      });
    }

    const iteration = args.iteration ?? 1;
    const taskTitle = `Loop ${iteration} · ${objective}`;
    const taskDescription =
      `Run the bounded Loop Engineering graph for this objective. Research independent lanes in parallel, independently verify evidence, synthesize recommendations, and stop at explicit approval. Stop condition: ${stopCondition}`;
    const taskResult: any = await ctx.runMutation(api.tasks.create, {
      projectId: args.projectId,
      title: taskTitle,
      description: taskDescription,
      type: "CUSTOMER_RESEARCH",
      priority: 2,
      labels: ["loop-engineering", `iteration-${iteration}`, "graph-root"],
      idempotencyKey: `${args.idempotencyKey}:task:root`,
      source: "MISSION_PROMPT",
      sourceRef: args.parentCycleId
        ? cycleRef(args.parentCycleId)
        : "docs/software-factory/LOOP_ENGINEERING.md",
      createdBy: "HUMAN",
      createdByRef: args.createdBy,
      metadata: {
        loopEngineering: true,
        graphEngineering: true,
        iteration,
      },
    });
    const taskId = taskResult.task?._id as Id<"tasks"> | undefined;
    if (!taskId) throw new Error("Failed to create Loop Engineering root task.");

    const workOrderResult: any = await ctx.runMutation(api.workOrders.create, {
      projectId: args.projectId,
      legacyTaskId: taskId,
      idempotencyKey: `${args.idempotencyKey}:work-order:graph`,
      title: taskTitle,
      desiredOutcome: taskDescription,
      workflowId: "loop-engineering",
      repository: project.githubRepo,
      branchStrategy: "isolated-worktree",
      priority: 2,
      riskLevel: "MEDIUM",
      requestedBy: args.createdBy,
      assignedSquad: "Software Factory Research Lab",
      acceptanceCriteria: [
        {
          id: "research-evidence",
          title: "Independent research lanes produce dated source ledgers with conflicts and limitations.",
          verificationMethod: "CHECKLIST",
          status: "PENDING",
        },
        {
          id: "independent-verification",
          title: "Every material claim and source receives an independent verification decision.",
          verificationMethod: "CHECKLIST",
          status: "PENDING",
        },
        {
          id: "evidence-linked-recommendations",
          title: "Recommendations link only to accepted evidence and stop at explicit approval.",
          verificationMethod: "CHECKLIST",
          status: "PENDING",
        },
      ],
      constraints: [
        "External content is untrusted.",
        "No repository-changing work before approval.",
        `Stop after ${args.maxIterations} iterations.`,
      ],
      dependencies: [],
      sourceOfTruthRefs: [{
        kind: "DOC",
        label: "Loop Engineering contract",
        location: "docs/software-factory/LOOP_ENGINEERING.md",
      }],
      requiredApprovals: [],
      state: "READY",
      metadata: {
        loopEngineering: true,
        graphEngineering: true,
        iteration,
      },
    });
    const workOrderId = workOrderResult.workOrder?._id as Id<"workOrders"> | undefined;
    if (!workOrderId) throw new Error("Failed to create Loop Engineering WorkOrder.");
    const taskIds = [taskId];
    const workOrderIds = [workOrderId];

    const cycle = await ctx.runMutation(internal.loopEngineering.createRecord, {
      projectId: args.projectId,
      parentCycleId: args.parentCycleId,
      idempotencyKey: args.idempotencyKey,
      iteration,
      objective,
      hypothesis: args.hypothesis?.trim() || undefined,
      researchBrief: args.researchBrief,
      stopCondition,
      maxIterations: args.maxIterations,
      taskIds,
      workOrderIds,
      createdBy: args.createdBy,
    });
    return { cycle, created: true };
  },
});

export const addSource = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    title: v.string(),
    url: v.string(),
    publisher: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    sourceType: v.optional(v.union(
      v.literal("PRIMARY"),
      v.literal("OFFICIAL_DOCS"),
      v.literal("RESEARCH"),
      v.literal("NEWS"),
      v.literal("VENDOR"),
      v.literal("COMMUNITY"),
      v.literal("OTHER")
    )),
    vendorClaim: v.optional(v.boolean()),
    syndicatedFromUrl: v.optional(v.string()),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (!["RESEARCH", "VERIFY"].includes(cycle.phase)) {
      throw new Error("Sources can only be collected during research or verification.");
    }
    const title = args.title.trim();
    const url = args.url.trim();
    if (!title || !url) throw new Error("Source title and URL are required.");
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error("Enter a valid HTTP or HTTPS source URL.");
    }
    const canonicalUrl = normalizeSourceUrl(url);
    if (cycle.sources.some((source) =>
      (source.canonicalUrl ?? normalizeSourceUrl(source.url)) === canonicalUrl
    )) {
      throw new Error("A source with this normalized URL is already recorded in the cycle.");
    }

    const source = {
      id: `source-${Date.now()}-${cycle.sources.length + 1}`,
      title,
      url,
      publisher: args.publisher?.trim() || undefined,
      publishedAt: args.publishedAt,
      retrievedAt: Date.now(),
      sourceType: args.sourceType ?? "OTHER",
      vendorClaim: args.vendorClaim ?? args.sourceType === "VENDOR",
      canonicalUrl,
      syndicatedFromUrl: args.syndicatedFromUrl?.trim() || undefined,
      freshness: classifyFreshness(args.publishedAt),
      decision: "PENDING" as const,
    };
    await ctx.db.patch(args.cycleId, {
      sources: [...cycle.sources, source],
      updatedAt: Date.now(),
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_SOURCE_RECORDED",
      description: `Source recorded: ${title}`,
      actorId: args.actorId,
      metadata: { sourceId: source.id, freshness: source.freshness },
    });
    return source;
  },
});

export const addClaim = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    statement: v.string(),
    supportingSourceIds: v.array(v.string()),
    contradictorySourceIds: v.array(v.string()),
    unsupported: v.boolean(),
    confidence: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH")),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (!["VERIFY", "RECOMMEND"].includes(cycle.phase)) {
      throw new Error("Claims can only be recorded during verification or recommendation.");
    }
    const statement = args.statement.trim();
    if (!statement) throw new Error("Claim statement is required.");
    if (!args.unsupported && args.supportingSourceIds.length === 0) {
      throw new Error("Link supporting evidence or mark the claim unsupported.");
    }
    if (args.unsupported && args.supportingSourceIds.length > 0) {
      throw new Error("An unsupported claim cannot also include supporting evidence.");
    }
    const acceptedIds = new Set(
      cycle.sources
        .filter((source) => source.decision === "ACCEPTED")
        .map((source) => source.id)
    );
    const allEvidenceIds = [...args.supportingSourceIds, ...args.contradictorySourceIds];
    if (allEvidenceIds.some((sourceId) => !acceptedIds.has(sourceId))) {
      throw new Error("Claims may only link to accepted evidence.");
    }
    const claim = {
      id: `claim-${Date.now()}-${(cycle.claims ?? []).length + 1}`,
      statement,
      supportingSourceIds: [...new Set(args.supportingSourceIds)],
      contradictorySourceIds: [...new Set(args.contradictorySourceIds)],
      unsupported: args.unsupported,
      confidence: args.confidence,
      createdAt: Date.now(),
      createdBy: args.actorId,
    };
    await ctx.db.patch(args.cycleId, {
      claims: [...(cycle.claims ?? []), claim],
      updatedAt: Date.now(),
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_CLAIM_RECORDED",
      description: `Claim recorded: ${statement}`,
      actorId: args.actorId,
      metadata: {
        claimId: claim.id,
        supportingEvidence: claim.supportingSourceIds.length,
        contradictoryEvidence: claim.contradictorySourceIds.length,
        unsupported: claim.unsupported,
      },
    });
    return claim;
  },
});

export const decideSource = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    sourceId: v.string(),
    decision: v.union(v.literal("ACCEPTED"), v.literal("REJECTED")),
    reason: v.optional(v.string()),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "VERIFY") throw new Error("Source decisions belong to the verify phase.");
    if (args.decision === "REJECTED" && !args.reason?.trim()) {
      throw new Error("Rejected evidence requires a reason.");
    }
    const source = cycle.sources.find((item) => item.id === args.sourceId);
    if (!source) throw new Error("Source not found.");
    const decidedAt = Date.now();
    const sources = cycle.sources.map((item) =>
      item.id === args.sourceId
        ? {
            ...item,
            decision: args.decision,
            decisionReason: args.reason?.trim() || undefined,
            verifiedBy: args.actorId,
            verifiedAt: decidedAt,
          }
        : item
    );
    await ctx.db.patch(args.cycleId, { sources, updatedAt: decidedAt });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_SOURCE_DECIDED",
      description: `${args.decision === "ACCEPTED" ? "Accepted" : "Rejected"} source: ${source.title}`,
      actorId: args.actorId,
      metadata: { sourceId: source.id, decision: args.decision, reason: args.reason },
    });
  },
});

export const addRecommendation = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    title: v.string(),
    rationale: v.string(),
    evidenceSourceIds: v.array(v.string()),
    confidence: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH")),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "RECOMMEND") {
      throw new Error("Recommendations can only be added during the recommend phase.");
    }
    if (!args.title.trim() || !args.rationale.trim()) {
      throw new Error("Recommendation title and rationale are required.");
    }
    if (args.evidenceSourceIds.length === 0) {
      throw new Error("Link at least one accepted evidence source.");
    }
    const acceptedIds = new Set(
      cycle.sources.filter((source) => source.decision === "ACCEPTED").map((source) => source.id)
    );
    if (args.evidenceSourceIds.some((sourceId) => !acceptedIds.has(sourceId))) {
      throw new Error("Recommendations may only link to accepted evidence.");
    }
    const recommendation = {
      id: `recommendation-${Date.now()}-${cycle.recommendations.length + 1}`,
      title: args.title.trim(),
      rationale: args.rationale.trim(),
      evidenceSourceIds: [...new Set(args.evidenceSourceIds)],
      confidence: args.confidence,
      status: "PROPOSED" as const,
    };
    await ctx.db.patch(args.cycleId, {
      recommendations: [...cycle.recommendations, recommendation],
      updatedAt: Date.now(),
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_RECOMMENDATION_CREATED",
      description: `Recommendation created: ${recommendation.title}`,
      actorId: args.actorId,
      metadata: { recommendationId: recommendation.id },
    });
    return recommendation;
  },
});

export const advance = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    actorId: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    const result = validateLoopAdvance(cycle.phase as LoopPhase, cycle);
    if ("reason" in result) throw new Error(result.reason);
    const now = Date.now();
    await ctx.db.patch(args.cycleId, {
      phase: result.nextPhase,
      phaseHistory: [
        ...cycle.phaseHistory,
        {
          phase: result.nextPhase,
          enteredAt: now,
          actorId: args.actorId,
          note: args.note?.trim() || undefined,
        },
      ],
      updatedAt: now,
      completedAt: result.nextPhase === "COMPLETE" ? now : cycle.completedAt,
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_PHASE_CHANGED",
      description: `Loop phase changed: ${cycle.phase} → ${result.nextPhase}`,
      actorId: args.actorId,
      metadata: { fromPhase: cycle.phase, toPhase: result.nextPhase },
    });
    return { phase: result.nextPhase };
  },
});

export const applyApproval = internalMutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    actorId: v.string(),
    links: v.array(v.object({
      recommendationId: v.string(),
      taskId: v.id("tasks"),
      workOrderId: v.id("workOrders"),
    })),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "AWAITING_APPROVAL") {
      throw new Error("Cycle is not awaiting approval.");
    }
    const linkByRecommendation = new Map(
      args.links.map((link) => [link.recommendationId, link])
    );
    const now = Date.now();
    const recommendations = cycle.recommendations.map((item) => {
      const link = linkByRecommendation.get(item.id);
      return link
        ? {
            ...item,
            status: "IMPLEMENTING" as const,
            implementationTaskId: link.taskId,
            implementationWorkOrderId: link.workOrderId,
          }
        : item;
    });
    await ctx.db.patch(args.cycleId, {
      phase: "IMPLEMENT",
      recommendations,
      taskIds: [...cycle.taskIds, ...args.links.map((link) => link.taskId)],
      workOrderIds: [...cycle.workOrderIds, ...args.links.map((link) => link.workOrderId)],
      approvalActorId: args.actorId,
      approvedAt: now,
      phaseHistory: [
        ...cycle.phaseHistory,
        { phase: "IMPLEMENT", enteredAt: now, actorId: args.actorId, note: "Recommendations approved" },
      ],
      updatedAt: now,
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_RECOMMENDATIONS_APPROVED",
      description: `${args.links.length} recommendation(s) approved for implementation`,
      actorId: args.actorId,
      metadata: { links: args.links },
    });
    return await ctx.db.get(args.cycleId);
  },
});

export const approveRecommendations = action({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    actorId: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const cycle = await ctx.runQuery(api.loopEngineering.get, { cycleId: args.cycleId });
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "AWAITING_APPROVAL") {
      throw new Error("Cycle is not awaiting approval.");
    }
    const project = await ctx.runQuery(api.projects.get, { projectId: cycle.projectId });
    if (!project) throw new Error("Project not found.");

    const links = [];
    for (const recommendation of cycle.recommendations) {
      const taskResult: any = await ctx.runMutation(api.tasks.create, {
        projectId: cycle.projectId,
        title: `Implement: ${recommendation.title}`,
        description:
          `${recommendation.rationale}\n\nEvidence sources: ${recommendation.evidenceSourceIds.join(", ")}`,
        type: "ENGINEERING",
        priority: recommendation.confidence === "HIGH" ? 2 : 3,
        labels: ["loop-engineering", `iteration-${cycle.iteration}`, "implementation"],
        idempotencyKey: `${args.idempotencyKey}:task:${recommendation.id}`,
        source: "MISSION_PROMPT",
        sourceRef: cycleRef(args.cycleId),
        createdBy: "HUMAN",
        createdByRef: args.actorId,
        metadata: {
          loopEngineeringCycleId: args.cycleId,
          recommendationId: recommendation.id,
        },
      });
      const taskId = taskResult.task?._id as Id<"tasks"> | undefined;
      if (!taskId) throw new Error("Failed to create implementation task.");

      const workOrderResult: any = await ctx.runMutation(api.workOrders.create, {
        projectId: cycle.projectId,
        legacyTaskId: taskId,
        idempotencyKey: `${args.idempotencyKey}:work-order:${recommendation.id}`,
        title: `Implement: ${recommendation.title}`,
        desiredOutcome: recommendation.rationale,
        workflowId: "feature-dev",
        repository: project.githubRepo,
        branchStrategy: "isolated-worktree",
        priority: recommendation.confidence === "HIGH" ? 2 : 3,
        riskLevel: "MEDIUM",
        requestedBy: args.actorId,
        assignedSquad: "Software Factory",
        acceptanceCriteria: [{
          id: "implemented-and-tested",
          title: "Implementation is complete, tests pass, and evidence is linked.",
          verificationMethod: "TEST",
          status: "PENDING",
        }],
        constraints: [
          "Preserve unrelated workspace changes.",
          "Run targeted tests and the affected UI journey.",
          "Do not mark complete without evidence.",
        ],
        sourceOfTruthRefs: [{
          kind: "DOC",
          label: `Loop Engineering cycle ${cycle.iteration}`,
          location: cycleRef(args.cycleId),
        }],
        requiredApprovals: [],
        state: "READY",
        approvalStatus: "NOT_REQUIRED",
        metadata: {
          loopEngineeringCycleId: args.cycleId,
          recommendationId: recommendation.id,
          approvedByCycleGate: {
            actorId: args.actorId,
            approvedAt: Date.now(),
          },
        },
      });
      const workOrderId = workOrderResult.workOrder?._id as Id<"workOrders"> | undefined;
      if (!workOrderId) throw new Error("Failed to create implementation WorkOrder.");
      links.push({ recommendationId: recommendation.id, taskId, workOrderId });
    }

    const updated = await ctx.runMutation(internal.loopEngineering.applyApproval, {
      cycleId: args.cycleId,
      actorId: args.actorId,
      links,
    });
    return { cycle: updated, links };
  },
});

export const rejectRecommendations = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    actorId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "AWAITING_APPROVAL") {
      throw new Error("Cycle is not awaiting approval.");
    }
    const reason = args.reason.trim();
    if (!reason) throw new Error("Rejection requires a reason.");
    const now = Date.now();
    await ctx.db.patch(args.cycleId, {
      phase: "RECOMMEND",
      recommendations: cycle.recommendations.map((item) => ({
        ...item,
        status: "REJECTED" as const,
        decisionReason: reason,
      })),
      phaseHistory: [
        ...cycle.phaseHistory,
        { phase: "RECOMMEND", enteredAt: now, actorId: args.actorId, note: `Rejected: ${reason}` },
      ],
      updatedAt: now,
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_RECOMMENDATIONS_REJECTED",
      description: "Loop recommendations rejected and returned for revision",
      actorId: args.actorId,
      metadata: { reason },
    });
  },
});

export const syncImplementation = mutation({
  args: { cycleId: v.id("loopEngineeringCycles"), actorId: v.string() },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "IMPLEMENT") throw new Error("Cycle is not in implementation.");
    const recommendations = [];
    for (const recommendation of cycle.recommendations) {
      if (!recommendation.implementationTaskId) {
        recommendations.push(recommendation);
        continue;
      }
      const task = await ctx.db.get(recommendation.implementationTaskId);
      recommendations.push({
        ...recommendation,
        status: task?.status === "DONE" ? "IMPLEMENTED" : "IMPLEMENTING",
      } as typeof recommendation);
    }
    await ctx.db.patch(args.cycleId, { recommendations, updatedAt: Date.now() });
    const incomplete = recommendations.filter((item) => item.status !== "IMPLEMENTED").length;
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_IMPLEMENTATION_SYNCED",
      description: incomplete === 0
        ? "All approved implementation tasks are complete"
        : `${incomplete} implementation task(s) remain`,
      actorId: args.actorId,
    });
    return { complete: incomplete === 0, incomplete };
  },
});

export const recordValidation = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    name: v.string(),
    status: v.union(v.literal("PASS"), v.literal("FAIL")),
    evidenceLocation: v.string(),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "VALIDATE") throw new Error("Cycle is not in validation.");
    if (!args.name.trim() || !args.evidenceLocation.trim()) {
      throw new Error("Validation name and evidence location are required.");
    }
    const validation = {
      id: `validation-${Date.now()}-${cycle.validations.length + 1}`,
      name: args.name.trim(),
      status: args.status,
      evidenceLocation: args.evidenceLocation.trim(),
      recordedAt: Date.now(),
      recordedBy: args.actorId,
    };
    await ctx.db.patch(args.cycleId, {
      validations: [...cycle.validations, validation],
      updatedAt: Date.now(),
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_VALIDATION_RECORDED",
      description: `${validation.status}: ${validation.name}`,
      actorId: args.actorId,
      metadata: validation,
    });
    return validation;
  },
});

export const recordMeasurement = mutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    name: v.string(),
    baseline: v.number(),
    result: v.number(),
    unit: v.string(),
    target: v.optional(v.number()),
    passed: v.boolean(),
    evidenceLocation: v.string(),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "MEASURE") throw new Error("Cycle is not in measurement.");
    if (!args.name.trim() || !args.unit.trim() || !args.evidenceLocation.trim()) {
      throw new Error("Measurement name, unit, and evidence location are required.");
    }
    const measurement = {
      id: `measurement-${Date.now()}-${cycle.measurements.length + 1}`,
      name: args.name.trim(),
      baseline: args.baseline,
      result: args.result,
      unit: args.unit.trim(),
      target: args.target,
      passed: args.passed,
      evidenceLocation: args.evidenceLocation.trim(),
      recordedAt: Date.now(),
      recordedBy: args.actorId,
    };
    await ctx.db.patch(args.cycleId, {
      measurements: [...cycle.measurements, measurement],
      updatedAt: Date.now(),
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_MEASUREMENT_RECORDED",
      description: `Measured ${measurement.name}: ${measurement.result}${measurement.unit}`,
      actorId: args.actorId,
      metadata: measurement,
    });
    return measurement;
  },
});

export const linkNextCycle = internalMutation({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    nextCycleId: v.id("loopEngineeringCycles"),
    actorId: v.string(),
  },
  handler: async (ctx, args) => {
    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.nextCycleId && cycle.nextCycleId !== args.nextCycleId) {
      throw new Error("A next cycle already exists.");
    }
    const now = Date.now();
    await ctx.db.patch(args.cycleId, {
      nextCycleId: args.nextCycleId,
      phase: "COMPLETE",
      completedAt: now,
      updatedAt: now,
      phaseHistory: [
        ...cycle.phaseHistory,
        { phase: "COMPLETE", enteredAt: now, actorId: args.actorId, note: "Next cycle created" },
      ],
    });
    await logCycleActivity(ctx, {
      projectId: cycle.projectId,
      cycleId: args.cycleId,
      action: "LOOP_NEXT_CYCLE_CREATED",
      description: `Created Loop Engineering iteration ${cycle.iteration + 1}`,
      actorId: args.actorId,
      metadata: { nextCycleId: args.nextCycleId },
    });
  },
});

export const createNextCycle = action({
  args: {
    cycleId: v.id("loopEngineeringCycles"),
    objective: v.string(),
    hypothesis: v.optional(v.string()),
    stopCondition: v.string(),
    actorId: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const cycle = await ctx.runQuery(api.loopEngineering.get, { cycleId: args.cycleId });
    if (!cycle) throw new Error("Loop Engineering cycle not found.");
    if (cycle.phase !== "READY_FOR_NEXT_CYCLE") {
      throw new Error("Measure the current cycle before creating the next one.");
    }
    if (cycle.nextCycleId) {
      const existing = await ctx.runQuery(api.loopEngineering.get, {
        cycleId: cycle.nextCycleId,
      });
      return { cycle: existing, created: false };
    }
    if (cycle.iteration >= cycle.maxIterations) {
      throw new Error("The cycle reached its configured maximum iteration count.");
    }
    const result: any = await ctx.runAction(api.loopEngineering.create, {
      projectId: cycle.projectId,
      objective: args.objective,
      hypothesis: args.hypothesis,
      stopCondition: args.stopCondition,
      maxIterations: cycle.maxIterations,
      idempotencyKey: `${cycle.idempotencyKey}:iteration:${cycle.iteration + 1}`,
      createdBy: args.actorId,
      parentCycleId: args.cycleId,
      iteration: cycle.iteration + 1,
    });
    if (!result.cycle?._id) throw new Error("Failed to create the next cycle.");
    await ctx.runMutation(internal.loopEngineering.linkNextCycle, {
      cycleId: args.cycleId,
      nextCycleId: result.cycle._id,
      actorId: args.actorId,
    });
    return result;
  },
});
