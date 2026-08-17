import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "./lib/companyAccess";
import { loadModelCatalogForProject } from "./lib/modelCatalogScope";

const DEFAULT_MODELS = [
  {
    provider: "runtime",
    modelId: "operator-fast",
    displayName: "Operator Fast",
    tier: "FAST" as const,
    capabilities: ["text", "code"],
    supportsTools: true,
    riskApproved: false,
    contextWindow: 128_000,
    availability: "HEALTHY" as const,
    estimatedCostPerRunUsd: 0.03,
    deprecated: false,
  },
  {
    provider: "runtime",
    modelId: "operator-default",
    displayName: "Operator Default",
    tier: "BALANCED" as const,
    capabilities: ["text", "code", "vision"],
    supportsTools: true,
    riskApproved: true,
    contextWindow: 200_000,
    availability: "HEALTHY" as const,
    estimatedCostPerRunUsd: 0.15,
    deprecated: false,
  },
  {
    provider: "runtime",
    modelId: "operator-powerful",
    displayName: "Operator Powerful",
    tier: "POWERFUL" as const,
    capabilities: ["text", "code", "vision", "deep-reasoning"],
    supportsTools: true,
    riskApproved: true,
    contextWindow: 200_000,
    availability: "HEALTHY" as const,
    estimatedCostPerRunUsd: 0.45,
    deprecated: false,
  },
];

function validateDiscoveredModels(models: Array<{
  modelId: string;
  displayName: string;
  capabilities: string[];
  contextWindow: number;
}>) {
  if (models.length > 200 || new Set(models.map((model) => model.modelId)).size !== models.length) {
    throw new Error("Local model discovery must contain at most 200 unique models.");
  }
  if (models.some((model) =>
    model.modelId !== model.modelId.trim()
    || model.modelId.length < 1
    || model.modelId.length > 200
    || model.displayName !== model.displayName.trim()
    || model.displayName.length < 1
    || model.displayName.length > 200
    || !Number.isSafeInteger(model.contextWindow)
    || model.contextWindow < 1
    || model.contextWindow > 10_000_000
    || model.capabilities.length > 50
    || new Set(model.capabilities).size !== model.capabilities.length
    || model.capabilities.some((capability) => capability !== capability.trim() || capability.length < 1 || capability.length > 100)
  )) {
    throw new Error("Local model discovery contains invalid or unbounded metadata.");
  }
}

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    return loadModelCatalogForProject(ctx, args.projectId);
  },
});

export const initializeDefaults = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const access = await requireWorkspacePermission(
      ctx,
      args.projectId,
      FACTORY_PERMISSIONS.MANAGE_AUTOMATION,
    );
    const now = Date.now();
    let created = 0;
    for (const model of DEFAULT_MODELS) {
      const existing = await ctx.db
        .query("modelCatalog")
        .withIndex("by_model_id", (q) => q.eq("modelId", model.modelId))
        .first();
      if (existing) continue;
      await ctx.db.insert("modelCatalog", { ...model, updatedAt: now });
      created += 1;
    }
    await ctx.db.insert("activities", {
      tenantId: access.project.tenantId,
      projectId: access.project._id,
      actorType: "HUMAN",
      actorId: access.actorId,
      action: "MODEL_CATALOG_INITIALIZED",
      description: `Initialized ${created} safe runtime model route(s)`,
      targetType: "MODEL_CATALOG",
      targetId: "system",
    });
    return { created };
  },
});

export const reportHealth = internalMutation({
  args: {
    modelId: v.string(),
    projectId: v.optional(v.id("projects")),
    availability: v.union(
      v.literal("HEALTHY"),
      v.literal("DEGRADED"),
      v.literal("RATE_LIMITED"),
      v.literal("UNAVAILABLE")
    ),
  },
  handler: async (ctx, args) => {
    const models = await ctx.db
      .query("modelCatalog")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .collect();
    const model = models.find((candidate) => candidate.projectId === args.projectId);
    if (!model) throw new Error("Catalog model not found");
    await ctx.db.patch(model._id, {
      availability: args.availability,
      updatedAt: Date.now(),
    });
    return model._id;
  },
});

/** Registers models discovered by the trusted orchestration server. */
export const syncLocalModels = mutation({
  args: {
    projectId: v.id("projects"),
    provider: v.union(v.literal("OLLAMA"), v.literal("LM_STUDIO"), v.literal("MLX"), v.literal("VLLM")),
    models: v.array(v.object({
      modelId: v.string(),
      displayName: v.string(),
      capabilities: v.array(v.string()),
      supportsTools: v.boolean(),
      contextWindow: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const access = await requireWorkspacePermission(
      ctx,
      args.projectId,
      FACTORY_PERMISSIONS.MANAGE_AUTOMATION,
    );
    validateDiscoveredModels(args.models);
    const now = Date.now();
    const provider = `local:${args.provider.toLowerCase()}`;
    let created = 0;
    let updated = 0;
    for (const discovered of args.models) {
      const modelId = `${provider}:${discovered.modelId}`;
      const existing = await ctx.db
        .query("modelCatalog")
        .withIndex("by_project_model", (q) => q.eq("projectId", args.projectId).eq("modelId", modelId))
        .first();
      const record = {
        tenantId: access.project.tenantId,
        projectId: args.projectId,
        provider,
        modelId,
        displayName: discovered.displayName,
        tier: "FAST" as const,
        capabilities: [...new Set(["local", ...discovered.capabilities])],
        supportsTools: discovered.supportsTools,
        riskApproved: false,
        contextWindow: discovered.contextWindow,
        availability: "HEALTHY" as const,
        estimatedCostPerRunUsd: 0,
        deprecated: false,
        updatedAt: now,
      };
      if (existing) {
        await ctx.db.patch(existing._id, record);
        updated += 1;
      } else {
        await ctx.db.insert("modelCatalog", record);
        created += 1;
      }
    }
    await ctx.db.insert("activities", {
      tenantId: access.project.tenantId,
      projectId: args.projectId,
      actorType: "HUMAN",
      actorId: access.actorId,
      action: "LOCAL_MODEL_CATALOG_SYNCED",
      description: `Synced ${args.models.length} local ${args.provider} model route(s)`,
      targetType: "MODEL_CATALOG",
      targetId: provider,
      metadata: { created, updated },
    });
    return { created, updated, provider };
  },
});
