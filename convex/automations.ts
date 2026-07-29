import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  AUTOMATION_POLICY_VERSION,
  AUTOMATION_ACTOR_IDENTITY_SOURCE,
  buildDisabledAutomationDefinition,
  calculateAutomationMetrics,
  isAutomationCandidatePayload,
  nextScheduledAt,
} from "./lib/automationGovernance";
import {
  isCandidateEligibleForActivation,
  loadRepetitiveTaskCandidates,
} from "./lib/repetitiveTaskCandidates";

const actorArgs = {
  // V1 runs behind a trusted operator boundary. This is an audit label supplied
  // by that deployment, not an independently authenticated Mission Control ID.
  actorId: v.string(),
  reason: v.string(),
  policyVersion: v.optional(v.string()),
};

async function assertProject(ctx: { db: any }, projectId: any) {
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Workspace not found or access is unavailable");
  return project;
}

export const getControlPlane = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await assertProject(ctx, args.projectId);
    const [definitions, decisions, suggestions, workOrders, receipts, scheduledJobs] = await Promise.all([
      ctx.db.query("automationDefinitions").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.query("automationDecisions").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.query("metaLoopSuggestions").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.query("workOrders").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.query("verificationReceipts").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.query("scheduledJobs").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
    ]);
    const detected = await loadRepetitiveTaskCandidates(ctx, args.projectId);
    const suggestionByCandidate = new Map(
      suggestions
        .filter((suggestion: any) => isAutomationCandidatePayload(suggestion.payload))
        .map((suggestion: any) => [suggestion.payload.candidateId, suggestion])
    );
    const candidates = detected.map((candidate) => ({
      ...candidate,
      suggestionId: suggestionByCandidate.get(candidate.id)?._id,
      status: suggestionByCandidate.get(candidate.id)?.status ?? "DETECTED",
      eligible: isCandidateEligibleForActivation(candidate),
    }));
    const reviewGates = workOrders.filter((workOrder: any) => workOrder.metadata?.automationDefinitionId);
    const receiptByWorkOrder = new Map<string, any[]>();
    for (const receipt of receipts) {
      const key = String(receipt.workOrderId);
      receiptByWorkOrder.set(key, [...(receiptByWorkOrder.get(key) ?? []), receipt]);
    }
    const runs = reviewGates.map((workOrder: any) => ({
      workOrder,
      definition: definitions.find((definition: any) =>
        String(definition._id) === String(workOrder.metadata?.automationDefinitionId)
      ),
      receipts: receiptByWorkOrder.get(String(workOrder._id)) ?? [],
    }));
    const metrics = calculateAutomationMetrics({
      definitions,
      reviewGates,
    });
    return {
      definitions: definitions.sort((a: any, b: any) => b.updatedAt - a.updatedAt),
      decisions: decisions.sort((a: any, b: any) => b.decidedAt - a.decidedAt),
      candidates,
      runs,
      receipts: runs.flatMap((run: any) => run.receipts.map((receipt: any) => ({
        ...receipt,
        automationDefinitionId: run.definition?._id,
        automationName: run.definition?.name,
      }))),
      scheduledJobs,
      metrics,
    };
  },
});

export const getDefinition = query({
  args: {
    projectId: v.id("projects"),
    automationDefinitionId: v.id("automationDefinitions"),
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.automationDefinitionId);
    if (!definition || definition.projectId !== args.projectId) {
      throw new Error("Automation is outside the selected workspace");
    }
    const decisions = await ctx.db
      .query("automationDecisions")
      .withIndex("by_definition", (q) => q.eq("automationDefinitionId", args.automationDefinitionId))
      .collect();
    return { definition, decisions: decisions.sort((a, b) => b.decidedAt - a.decidedAt) };
  },
});

export const acceptCandidate = mutation({
  args: {
    projectId: v.id("projects"),
    candidateId: v.string(),
    ...actorArgs,
  },
  handler: async (ctx, args) => {
    await assertProject(ctx, args.projectId);
    const candidate = (await loadRepetitiveTaskCandidates(ctx, args.projectId))
      .find((item) => item.id === args.candidateId);
    if (!candidate) throw new Error("Automation Candidate is no longer eligible");
    if (!candidate.workflowId) throw new Error("Design and version a Workflow before accepting this candidate");
    if (candidate.receiptCount < 1) throw new Error("A passing, fresh verification receipt is required");

    const sourceRef = `repetitive-task:${args.projectId}:${candidate.id}`;
    const suggestions = await ctx.db
      .query("metaLoopSuggestions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    let suggestion = suggestions.find((item) => item.sourceRef === sourceRef);
    const payload = {
      type: "AUTOMATION_CANDIDATE" as const,
      candidateId: candidate.id,
      pattern: candidate.pattern,
      workflowId: candidate.workflowId,
      repository: candidate.repository,
      supportingWorkOrderIds: candidate.supportingWorkOrderIds,
      occurrences: candidate.occurrences,
      receiptCount: candidate.receiptCount,
      suggestedCadence: candidate.suggestedCadence,
      confidence: candidate.confidence,
      riskLevel: candidate.riskLevel,
      estimatedHumanMinutesSaved: candidate.estimatedHumanMinutesSaved,
      recommendedAutonomyLevel: candidate.recommendedAutonomyLevel,
    };
    if (!suggestion) {
      const suggestionId = await ctx.db.insert("metaLoopSuggestions", {
        projectId: args.projectId,
        kind: "DELEGATION",
        title: `Automation Candidate: ${candidate.pattern}`,
        summary: `${candidate.occurrences} occurrences with ${candidate.receiptCount} eligible receipts.`,
        status: "ACCEPTED",
        sourceRef,
        payload,
        createdAt: Date.now(),
        resolvedAt: Date.now(),
      });
      suggestion = (await ctx.db.get(suggestionId)) ?? undefined;
    }
    if (!suggestion) throw new Error("Failed to persist Automation Candidate");

    const existing = await ctx.db
      .query("automationDefinitions")
      .withIndex("by_source_candidate", (q) => q.eq("sourceCandidateId", suggestion!._id))
      .first();
    if (existing) return { definitionId: existing._id, created: false };

    const workflow = await ctx.db
      .query("workflows")
      .withIndex("by_workflow_id", (q) => q.eq("workflowId", candidate.workflowId!))
      .first();
    if (!workflow || !workflow.active) throw new Error("The candidate Workflow must exist and be active");

    const now = Date.now();
    if (suggestion.status !== "ACCEPTED") {
      await ctx.db.patch(suggestion._id, { status: "ACCEPTED", resolvedAt: now, payload });
    }
    const definitionId = await ctx.db.insert(
      "automationDefinitions",
      buildDisabledAutomationDefinition({
        projectId: args.projectId,
        sourceCandidateId: suggestion._id,
        actorId: args.actorId,
        candidate,
        workflow,
        now,
      })
    );
    await ctx.db.insert("automationDecisions", {
      projectId: args.projectId,
      automationDefinitionId: definitionId,
      decisionType: "CREATED",
      actorId: args.actorId,
      actorIdentitySource: AUTOMATION_ACTOR_IDENTITY_SOURCE,
      reason: args.reason,
      policyVersion: args.policyVersion ?? AUTOMATION_POLICY_VERSION,
      definitionVersion: 1,
      decidedAt: now,
    });
    return { definitionId, created: true };
  },
});

export const activate = mutation({
  args: {
    projectId: v.id("projects"),
    automationDefinitionId: v.id("automationDefinitions"),
    ...actorArgs,
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.automationDefinitionId);
    if (!definition || definition.projectId !== args.projectId) throw new Error("Automation is outside the selected workspace");
    if (definition.isMutating || definition.autonomyLevel !== "LEVEL_1") {
      throw new Error("V1 activation only supports read-only LEVEL_1 Automations");
    }
    if (definition.status === "ACTIVE") return { changed: false, definitionId: definition._id };
    if (!["DISABLED", "PAUSED"].includes(definition.status)) throw new Error(`Cannot activate an Automation from ${definition.status}`);
    const now = Date.now();
    await ctx.db.patch(definition._id, {
      status: "ACTIVE",
      activatedBy: args.actorId,
      activatedAt: now,
      activationReason: args.reason,
      activationPolicyVersion: args.policyVersion ?? AUTOMATION_POLICY_VERSION,
      pausedBy: undefined,
      pausedAt: undefined,
      pauseReason: undefined,
      nextRunAt: now,
      health: "HEALTHY",
      updatedAt: now,
    });
    await ctx.db.insert("automationDecisions", {
      projectId: args.projectId,
      automationDefinitionId: definition._id,
      decisionType: definition.status === "PAUSED" ? "RESUMED" : "ACTIVATED",
      actorId: args.actorId,
      actorIdentitySource: AUTOMATION_ACTOR_IDENTITY_SOURCE,
      reason: args.reason,
      policyVersion: args.policyVersion ?? AUTOMATION_POLICY_VERSION,
      definitionVersion: definition.definitionVersion,
      decidedAt: now,
    });
    return { changed: true, definitionId: definition._id };
  },
});

export const pause = mutation({
  args: {
    projectId: v.id("projects"),
    automationDefinitionId: v.id("automationDefinitions"),
    ...actorArgs,
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.automationDefinitionId);
    if (!definition || definition.projectId !== args.projectId) throw new Error("Automation is outside the selected workspace");
    if (definition.status === "PAUSED") return { changed: false };
    if (definition.status !== "ACTIVE") throw new Error(`Cannot pause an Automation from ${definition.status}`);
    const now = Date.now();
    await ctx.db.patch(definition._id, {
      status: "PAUSED",
      pausedBy: args.actorId,
      pausedAt: now,
      pauseReason: args.reason,
      nextRunAt: undefined,
      health: "ATTENTION",
      updatedAt: now,
    });
    await ctx.db.insert("automationDecisions", {
      projectId: args.projectId,
      automationDefinitionId: definition._id,
      decisionType: "PAUSED",
      actorId: args.actorId,
      actorIdentitySource: AUTOMATION_ACTOR_IDENTITY_SOURCE,
      reason: args.reason,
      policyVersion: args.policyVersion ?? AUTOMATION_POLICY_VERSION,
      definitionVersion: definition.definitionVersion,
      decidedAt: now,
    });
    return { changed: true };
  },
});

export const previewNextRun = query({
  args: { projectId: v.id("projects"), automationDefinitionId: v.id("automationDefinitions") },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.automationDefinitionId);
    if (!definition || definition.projectId !== args.projectId) throw new Error("Automation is outside the selected workspace");
    return { nextRunAt: definition.nextRunAt ?? nextScheduledAt(Date.now()) };
  },
});
