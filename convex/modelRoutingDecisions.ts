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

/** The task-facing view of its governing Work Order's selected route. */
export const getForTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    const workflowRun = await ctx.db
      .query("workflowRuns")
      .withIndex("by_parent_task", (q) => q.eq("parentTaskId", args.taskId))
      .order("desc")
      .first();
    const directDecision = workflowRun?.routingDecisionId
      ? await ctx.db.get(workflowRun.routingDecisionId)
      : null;
    const workOrder = task.workOrderId ? await ctx.db.get(task.workOrderId) : null;
    const workOrderDecision = workOrder
      ? await ctx.db
          .query("modelRoutingDecisions")
          .withIndex("by_work_order", (q) => q.eq("workOrderId", workOrder._id))
          .order("desc")
          .first()
      : null;
    return {
      decision: directDecision ?? workOrderDecision,
      workOrderId: workOrder?._id ?? null,
      overrideModelId: workOrder?.authorizedModelOverride ?? null,
      overrideReason: workOrder?.authorizedModelOverrideReason ?? null,
      canChange: !workflowRun || !["PENDING", "RUNNING", "PAUSED"].includes(workflowRun.status),
    };
  },
});
