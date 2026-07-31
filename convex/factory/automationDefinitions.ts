import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/** Operator-visible automation contracts. Activation is deliberately out of scope. */
export const list = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    const projectId = args.projectId;
    const rows = projectId
      ? await ctx.db.query("automationDefinitions").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect()
      : await ctx.db.query("automationDefinitions").collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Reversible activation gate. It authorizes recurring review only, not work dispatch. */
export const setEnabled = mutation({
  args: {
    definitionId: v.id("automationDefinitions"),
    enabled: v.boolean(),
    actorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.definitionId);
    if (!definition) throw new Error("Automation definition not found");
    if (definition.enabled === args.enabled) return definition._id;

    const now = Date.now();
    await ctx.db.patch(args.definitionId, {
      enabled: args.enabled,
      ...(args.enabled
        ? { activatedAt: now, activatedBy: args.actorId ?? "operator" }
        : { deactivatedAt: now, deactivatedBy: args.actorId ?? "operator" }),
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      projectId: definition.projectId,
      actorType: "HUMAN",
      actorId: args.actorId ?? "operator",
      action: args.enabled ? "AUTOMATION_DEFINITION_ACTIVATED" : "AUTOMATION_DEFINITION_DEACTIVATED",
      description: `${args.enabled ? "Activated" : "Disabled"} automation review loop: ${definition.name}`,
      targetType: "automationDefinition",
      targetId: args.definitionId,
    });
    return args.definitionId;
  },
});
