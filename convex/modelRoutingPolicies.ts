import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  fallbackRoutingPolicy,
  resolveModelRoute,
  type CatalogModel,
  type RoutingPolicyInput,
} from "./lib/modelRouting";

const tier = v.union(
  v.literal("FAST"),
  v.literal("BALANCED"),
  v.literal("POWERFUL")
);
const risk = v.union(
  v.literal("LOW"),
  v.literal("MEDIUM"),
  v.literal("HIGH"),
  v.literal("CRITICAL")
);
const rule = v.object({
  id: v.string(),
  order: v.number(),
  taskType: v.optional(v.string()),
  riskLevel: v.optional(risk),
  requiredCapabilities: v.optional(v.array(v.string())),
  modelId: v.string(),
});

async function loadActive(ctx: { db: any }, projectId: any) {
  return await ctx.db
    .query("modelRoutingPolicies")
    .withIndex("by_project_status", (q: any) =>
      q.eq("projectId", projectId).eq("status", "ACTIVE")
    )
    .order("desc")
    .first();
}

export const getActive = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => loadActive(ctx, args.projectId),
});

export const getAgentOverride = query({
  args: {
    projectId: v.id("projects"),
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const override = await ctx.db
      .query("agentModelOverrides")
      .withIndex("by_project_agent", (q) =>
        q.eq("projectId", args.projectId).eq("agentId", args.agentId)
      )
      .first();
    if (override?.expiresAt && override.expiresAt <= Date.now()) return null;
    return override;
  },
});

export const setAgentOverride = mutation({
  args: {
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    modelId: v.string(),
    reason: v.string(),
    expiresAt: v.optional(v.number()),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [agent, model] = await Promise.all([
      ctx.db.get(args.agentId),
      ctx.db
        .query("modelCatalog")
        .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
        .first(),
    ]);
    if (!agent || agent.projectId !== args.projectId) {
      throw new Error("Agent does not belong to the selected workspace");
    }
    if (!model || model.deprecated || model.availability === "UNAVAILABLE") {
      throw new Error("Override model route is unavailable");
    }
    if (!args.reason.trim()) throw new Error("Override reason is required");
    const existing = await ctx.db
      .query("agentModelOverrides")
      .withIndex("by_project_agent", (q) =>
        q.eq("projectId", args.projectId).eq("agentId", args.agentId)
      )
      .first();
    const now = Date.now();
    const overrideId = existing
      ? existing._id
      : await ctx.db.insert("agentModelOverrides", {
          projectId: args.projectId,
          agentId: args.agentId,
          modelId: args.modelId,
          reason: args.reason.trim(),
          expiresAt: args.expiresAt,
          createdBy: args.actorId ?? "operator",
          createdAt: now,
          updatedAt: now,
        });
    if (existing) {
      await ctx.db.patch(existing._id, {
        modelId: args.modelId,
        reason: args.reason.trim(),
        expiresAt: args.expiresAt,
        updatedAt: now,
      });
    }
    await ctx.db.insert("activities", {
      projectId: args.projectId,
      actorType: "HUMAN",
      actorId: args.actorId ?? "operator",
      action: "AGENT_MODEL_OVERRIDE_SET",
      description: `Agent "${agent.name}" model override set to ${args.modelId}`,
      targetType: "AGENT",
      targetId: args.agentId,
      beforeState: existing ? { modelId: existing.modelId } : undefined,
      afterState: { modelId: args.modelId, reason: args.reason.trim() },
    });
    return overrideId;
  },
});

export const clearAgentOverride = mutation({
  args: {
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent || agent.projectId !== args.projectId) {
      throw new Error("Agent does not belong to the selected workspace");
    }
    const existing = await ctx.db
      .query("agentModelOverrides")
      .withIndex("by_project_agent", (q) =>
        q.eq("projectId", args.projectId).eq("agentId", args.agentId)
      )
      .first();
    if (!existing) return { removed: false };
    await ctx.db.delete(existing._id);
    await ctx.db.insert("activities", {
      projectId: args.projectId,
      actorType: "HUMAN",
      actorId: args.actorId ?? "operator",
      action: "AGENT_MODEL_OVERRIDE_CLEARED",
      description: `Agent "${agent.name}" returned to workspace model routing`,
      targetType: "AGENT",
      targetId: args.agentId,
      beforeState: { modelId: existing.modelId },
      afterState: { modelId: null },
    });
    return { removed: true };
  },
});

export const save = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    defaultModelId: v.optional(v.string()),
    safeFallbackModelId: v.optional(v.string()),
    rules: v.array(rule),
    fallbackChain: v.array(v.string()),
    budgetLimitUsd: v.optional(v.number()),
    latencyTargetMs: v.optional(v.number()),
    canaryPercent: v.number(),
    killSwitch: v.boolean(),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Workspace not found");
    if (!args.name.trim()) throw new Error("Policy name is required");
    if (args.canaryPercent < 0 || args.canaryPercent > 100) {
      throw new Error("Canary percentage must be between 0 and 100");
    }
    if (args.budgetLimitUsd !== undefined && args.budgetLimitUsd < 0) {
      throw new Error("Budget limit cannot be negative");
    }
    const ids = [
      args.defaultModelId,
      args.safeFallbackModelId,
      ...args.fallbackChain,
      ...args.rules.map((item) => item.modelId),
    ].filter((value): value is string => Boolean(value));
    const uniqueIds = [...new Set(ids)];
    for (const modelId of uniqueIds) {
      const model = await ctx.db
        .query("modelCatalog")
        .withIndex("by_model_id", (q) => q.eq("modelId", modelId))
        .first();
      if (!model || model.deprecated) {
        throw new Error(`Model route "${modelId}" is unavailable`);
      }
    }
    const current = await loadActive(ctx, args.projectId);
    const now = Date.now();
    if (current) {
      await ctx.db.patch(current._id, { status: "ARCHIVED", updatedAt: now });
    }
    const policyId = await ctx.db.insert("modelRoutingPolicies", {
      projectId: args.projectId,
      name: args.name.trim(),
      status: "ACTIVE",
      defaultModelId: args.defaultModelId,
      safeFallbackModelId: args.safeFallbackModelId,
      rules: args.rules,
      fallbackChain: [...new Set(args.fallbackChain)],
      budgetLimitUsd: args.budgetLimitUsd,
      latencyTargetMs: args.latencyTargetMs,
      canaryPercent: args.canaryPercent,
      killSwitch: args.killSwitch,
      version: (current?.version ?? 0) + 1,
      createdBy: args.actorId ?? "operator",
      updatedBy: args.actorId ?? "operator",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      projectId: args.projectId,
      actorType: "HUMAN",
      actorId: args.actorId ?? "operator",
      action: "MODEL_ROUTING_POLICY_ACTIVATED",
      description: `Activated model routing policy v${(current?.version ?? 0) + 1}`,
      targetType: "MODEL_ROUTING_POLICY",
      targetId: policyId,
      beforeState: current ? { policyId: current._id, version: current.version } : undefined,
      afterState: { policyId, version: (current?.version ?? 0) + 1 },
    });
    return await ctx.db.get(policyId);
  },
});

export const simulate = query({
  args: {
    projectId: v.id("projects"),
    taskType: v.optional(v.string()),
    riskLevel: risk,
    requestedTier: v.optional(tier),
    requiredCapabilities: v.array(v.string()),
    budgetRemainingUsd: v.optional(v.number()),
    agentId: v.optional(v.id("agents")),
    authorizedRunOverride: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Workspace not found");
    const active = await loadActive(ctx, args.projectId);
    const catalog = (await ctx.db.query("modelCatalog").collect()) as CatalogModel[];
    const override = args.agentId
      ? await ctx.db
          .query("agentModelOverrides")
          .withIndex("by_project_agent", (q) =>
            q.eq("projectId", args.projectId).eq("agentId", args.agentId!)
          )
          .first()
      : null;
    const policy: RoutingPolicyInput = active
      ? {
          id: active._id,
          version: active.version,
          defaultModelId: active.defaultModelId,
          safeFallbackModelId: active.safeFallbackModelId,
          fallbackChain: active.fallbackChain,
          rules: active.rules,
          budgetLimitUsd: active.budgetLimitUsd,
          killSwitch: active.killSwitch,
        }
      : fallbackRoutingPolicy(project.swarmConfig?.defaultModel);
    return {
      policyId: active?._id,
      policyVersion: policy.version,
      result: resolveModelRoute(catalog, policy, {
        taskType: args.taskType,
        riskLevel: args.riskLevel,
        requestedTier: args.requestedTier,
        requiredCapabilities: args.requiredCapabilities,
        budgetRemainingUsd: args.budgetRemainingUsd,
        authorizedRunOverride: args.authorizedRunOverride,
        agentOverrideModelId:
          override && (!override.expiresAt || override.expiresAt > Date.now())
            ? override.modelId
            : undefined,
        systemDefaultModelId: "operator-default",
      }),
    };
  },
});
