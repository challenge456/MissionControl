import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateHostBinding } from "./lib/workspaceBindings";
import { COMPANY_PERMISSIONS, requireWorkspaceAccess } from "./lib/companyAccess";

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
    const project = await ctx.db.get(args.projectId);
    if (!project?.tenantId) throw new Error("Workspace company assignment is incomplete");
    await requireWorkspaceAccess(ctx, project.tenantId, project._id);
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
    runtime: v.optional(v.string()),
    approvedModelIds: v.optional(v.array(v.string())),
    networkPolicyStatus: v.optional(v.union(v.literal("READY"), v.literal("BLOCKED"), v.literal("UNKNOWN"))),
    secretPolicyStatus: v.optional(v.union(v.literal("READY"), v.literal("BLOCKED"), v.literal("UNKNOWN"))),
    maxConcurrentRuns: v.optional(v.number()),
    currentRuns: v.optional(v.number()),
    attestedAt: v.optional(v.number()),
    status: bindingStatus,
    error: v.optional(v.string()),
    checkedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Workspace not found");
    if (!project.tenantId) throw new Error("Workspace company assignment is incomplete");
    await requireWorkspaceAccess(ctx, project.tenantId, project._id, { permission: COMPANY_PERMISSIONS.DISPATCH_WORK });
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
    if ((args.maxConcurrentRuns === undefined) !== (args.currentRuns === undefined)) throw new Error("Host capacity requires both maxConcurrentRuns and currentRuns");
    if (args.maxConcurrentRuns !== undefined && (!Number.isInteger(args.maxConcurrentRuns) || args.maxConcurrentRuns < 1)) throw new Error("Host maxConcurrentRuns must be a positive integer");
    if (args.currentRuns !== undefined && (!Number.isInteger(args.currentRuns) || args.currentRuns < 0)) throw new Error("Host currentRuns must be a non-negative integer");
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
      runtime: args.runtime?.trim() || undefined,
      approvedModelIds: args.approvedModelIds?.map((modelId) => modelId.trim()).filter(Boolean),
      networkPolicyStatus: args.networkPolicyStatus,
      secretPolicyStatus: args.secretPolicyStatus,
      capacity: args.maxConcurrentRuns === undefined ? undefined : { maxConcurrentRuns: args.maxConcurrentRuns, currentRuns: args.currentRuns! },
      attestedAt: args.attestedAt,
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
          runtime: args.runtime?.trim() || undefined,
          approvedModelCount: args.approvedModelIds?.length,
          networkPolicyStatus: args.networkPolicyStatus,
          secretPolicyStatus: args.secretPolicyStatus,
          capacity: args.maxConcurrentRuns === undefined ? undefined : { maxConcurrentRuns: args.maxConcurrentRuns, currentRuns: args.currentRuns },
          attestedAt: args.attestedAt,
          error: args.error,
          checkedAt,
        },
      });
    }

    return await ctx.db.get(bindingId);
  },
});
