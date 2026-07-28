/** Governed repetitive-work detection from Work Orders and verification receipts. */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { detectRepetitiveTasks } from "../lib/repetitiveTasks";

export const listCandidates = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workOrders = args.projectId
      ? await ctx.db.query("workOrders").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect()
      : await ctx.db.query("workOrders").collect();
    const receipts = args.projectId
      ? await ctx.db.query("verificationReceipts").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).collect()
      : await ctx.db.query("verificationReceipts").collect();
    const workOrderIdsWithReceipts = new Set(receipts.map((receipt) => String(receipt.workOrderId)));

    return detectRepetitiveTasks(
      workOrders.map((workOrder) => ({
        workflowId: workOrder.workflowId,
        repository: workOrder.repository,
        state: workOrder.state,
        hasReceipt: workOrderIdsWithReceipts.has(String(workOrder._id)),
      }))
    ).slice(0, args.limit ?? 8);
  },
});
