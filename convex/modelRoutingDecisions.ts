import { v } from "convex/values";
import { query } from "./_generated/server";

export const listRecent = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) =>
    ctx.db
      .query("modelRoutingDecisions")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(Math.min(args.limit ?? 50, 200)),
});

export const getForWorkflowRun = query({
  args: { workflowRunId: v.id("workflowRuns") },
  handler: async (ctx, args) =>
    ctx.db
      .query("modelRoutingDecisions")
      .withIndex("by_workflow_run", (q) => q.eq("workflowRunId", args.workflowRunId))
      .first(),
});
