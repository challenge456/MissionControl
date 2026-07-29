/** Governed repetitive-work detection from Work Orders and verification receipts. */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { detectRepetitiveTasks, isEligibleAutomationReceipt } from "../lib/repetitiveTasks";

export async function candidatesForProject(ctx: { db: any }, projectId?: string) {
  const workOrders = projectId
    ? await ctx.db.query("workOrders").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect()
    : await ctx.db.query("workOrders").collect();
  const receipts = projectId
    ? await ctx.db.query("verificationReceipts").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).collect()
    : await ctx.db.query("verificationReceipts").collect();
  const eligibleReceiptsByWorkOrder = new Map<string, number>();
  for (const receipt of receipts) {
    if (!isEligibleAutomationReceipt(receipt)) continue;
    const key = String(receipt.workOrderId);
    eligibleReceiptsByWorkOrder.set(key, (eligibleReceiptsByWorkOrder.get(key) ?? 0) + 1);
  }

  return detectRepetitiveTasks(
    workOrders.map((workOrder: any) => ({
      workOrderId: String(workOrder._id),
      workflowId: workOrder.workflowId,
      repository: workOrder.repository,
      state: workOrder.state,
      eligibleReceiptCount: eligibleReceiptsByWorkOrder.get(String(workOrder._id)) ?? 0,
    }))
  );
}

async function createProposals(ctx: { db: any }, projectId?: string) {
  const candidates = await candidatesForProject(ctx, projectId);
  const existing = await ctx.db.query("metaLoopSuggestions").collect();
  const existingRefs = new Set(existing.map((suggestion: any) => suggestion.sourceRef).filter(Boolean));
  const createdIds = [];

  for (const candidate of candidates) {
    if (candidate.receiptCount === 0) continue;
    const sourceRef = `repetitive-task:${projectId ?? "global"}:${candidate.id}`;
    if (existingRefs.has(sourceRef)) continue;
    const id = await ctx.db.insert("metaLoopSuggestions", {
      projectId: projectId as any,
      kind: "DELEGATION",
      title: `Automation proposal: ${candidate.pattern}`,
      summary: `${candidate.occurrences} governed Work Orders; ${candidate.completedCount} completed; ${candidate.receiptCount} have verification receipts. Review and approve a bounded automation scope.`,
      status: "OPEN",
      sourceRef,
      payload: {
        type: "AUTOMATION_CANDIDATE",
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
      },
      createdAt: Date.now(),
    });
    createdIds.push(id);
  }

  return { created: createdIds.length, candidates: candidates.length, proposalIds: createdIds };
}

export const listCandidates = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return (await candidatesForProject(ctx, args.projectId)).slice(0, args.limit ?? 8);
  },
});

/** Explicit operator action: collect evidence and create reviewable proposals. */
export const createProposalsNow = mutation({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => createProposals(ctx, args.projectId),
});

/** Hourly cron target. Only workspaces with a non-manual detector schedule are scanned. */
export const scanScheduled = internalMutation({
  args: {},
  handler: async (ctx) => {
    const schedules = await ctx.db.query("contextWorkflowRuns").collect();
    const projectIds = new Set(
      schedules
        .filter((run: any) => run.skillName === "repetitive-task-scan" && run.schedule && run.schedule !== "manual")
        .map((run: any) => run.projectId)
        .filter(Boolean)
    );
    const results = [];
    for (const projectId of projectIds) results.push(await createProposals(ctx, projectId));
    return { scannedProjects: projectIds.size, proposalsCreated: results.reduce((sum, result) => sum + result.created, 0) };
  },
});
