import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateHostBinding } from "./lib/workspaceBindings";

const bindingStatus = v.union(
  v.literal("READY"),
  v.literal("MISSING"),
  v.literal("STALE"),
  v.literal("DIRTY"),
  v.literal("ERROR")
);

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("workspaceHostBindings")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    return rows.sort((left, right) => right.checkedAt - left.checkedAt);
  },
});

export const report = mutation({
  args: {
    projectId: v.id("projects"),
    hostId: v.string(),
    repository: v.string(),
    checkoutRoot: v.string(),
    observedBranch: v.optional(v.string()),
    observedCommit: v.optional(v.string()),
    dirty: v.boolean(),
    status: bindingStatus,
    error: v.optional(v.string()),
    checkedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Workspace not found");
    if (!project.githubRepo) throw new Error("Workspace repository is not configured");
    const hostId = args.hostId.trim();
    const checkoutRoot = args.checkoutRoot.trim();
    const validationError = validateHostBinding({
      expectedRepository: project.githubRepo,
      repository: args.repository,
      hostId,
      checkoutRoot,
    });
    if (validationError) throw new Error(validationError);

    const checkedAt = args.checkedAt ?? Date.now();
    const existing = await ctx.db
      .query("workspaceHostBindings")
      .withIndex("by_project_host", (q) =>
        q.eq("projectId", args.projectId).eq("hostId", hostId)
      )
      .first();

    const value = {
      projectId: args.projectId,
      hostId,
      repository: args.repository,
      checkoutRoot,
      observedBranch: args.observedBranch,
      observedCommit: args.observedCommit,
      dirty: args.dirty,
      status: args.status,
      error: args.error,
      checkedAt,
    };

    const bindingId = existing
      ? (await ctx.db.patch(existing._id, value), existing._id)
      : await ctx.db.insert("workspaceHostBindings", value);

    if (!existing || existing.status !== args.status || existing.dirty !== args.dirty) {
      await ctx.db.insert("activities", {
        projectId: args.projectId,
        actorType: "SYSTEM",
        actorId: hostId,
        action: "WORKSPACE_CHECKOUT_REPORTED",
        description: `${hostId} reported ${args.status.toLowerCase()} checkout for ${args.repository}`,
        targetType: "PROJECT",
        targetId: args.projectId,
        metadata: {
          bindingId,
          checkoutRoot,
          observedBranch: args.observedBranch,
          observedCommit: args.observedCommit,
          dirty: args.dirty,
          error: args.error,
          checkedAt,
        },
      });
    }

    return await ctx.db.get(bindingId);
  },
});
