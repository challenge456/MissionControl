import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("modelCatalog").collect(),
});

export const initializeDefaults = mutation({
  args: { actorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
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
      actorType: "HUMAN",
      actorId: args.actorId ?? "operator",
      action: "MODEL_CATALOG_INITIALIZED",
      description: `Initialized ${created} safe runtime model route(s)`,
      targetType: "MODEL_CATALOG",
      targetId: "system",
    });
    return { created };
  },
});

export const reportHealth = mutation({
  args: {
    modelId: v.string(),
    availability: v.union(
      v.literal("HEALTHY"),
      v.literal("DEGRADED"),
      v.literal("RATE_LIMITED"),
      v.literal("UNAVAILABLE")
    ),
  },
  handler: async (ctx, args) => {
    const model = await ctx.db
      .query("modelCatalog")
      .withIndex("by_model_id", (q) => q.eq("modelId", args.modelId))
      .first();
    if (!model) throw new Error("Catalog model not found");
    await ctx.db.patch(model._id, {
      availability: args.availability,
      updatedAt: Date.now(),
    });
    return model._id;
  },
});
