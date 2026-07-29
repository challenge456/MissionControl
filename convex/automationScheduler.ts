import { v } from "convex/values";
import { api } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  AUTOMATION_POLICY_VERSION,
  buildReviewGate,
  isReviewGateDue,
  nextScheduledAt,
  suspensionReason,
} from "./lib/automationGovernance";

type EvaluationResult = {
  considered: number;
  created: number;
  skipped: number;
  suspended: number;
  workOrderIds: string[];
};

async function evaluate(
  ctx: any,
  args: {
    projectId?: Id<"projects">;
    automationDefinitionId?: Id<"automationDefinitions">;
  }
): Promise<EvaluationResult> {
  const now = Date.now();
  let definitions = args.projectId
    ? await ctx.db.query("automationDefinitions").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect()
    : await ctx.db.query("automationDefinitions").collect();
  if (args.automationDefinitionId) {
    definitions = definitions.filter((definition: any) => definition._id === args.automationDefinitionId);
  }

  let created = 0;
  let skipped = 0;
  let suspended = 0;
  const workOrderIds: string[] = [];

  for (const definition of definitions) {
    if (!isReviewGateDue(definition, now)) {
      skipped += 1;
      continue;
    }
    const priorGates = (await ctx.db
      .query("workOrders")
      .withIndex("by_project", (q: any) => q.eq("projectId", definition.projectId))
      .collect())
      .filter((workOrder: any) => String(workOrder.metadata?.automationDefinitionId) === String(definition._id));
    const priorReceipts = await ctx.db
      .query("verificationReceipts")
      .withIndex("by_project", (q: any) => q.eq("projectId", definition.projectId))
      .collect();
    const relevantReceipts = priorReceipts.filter((receipt: any) =>
      priorGates.some((gate: any) => gate._id === receipt.workOrderId)
    );
    const reason = suspensionReason({
      verificationFailed: relevantReceipts.some((receipt: any) => receipt.status === "FAILED"),
      requiredReceiptMissing: priorGates.some((gate: any) =>
        gate.state === "AWAITING_VERIFICATION"
        && now - gate.updatedAt > definition.maxDurationSeconds * 1000
        && !relevantReceipts.some((receipt: any) => receipt.workOrderId === gate._id && receipt.status === "PASSED")
      ),
    });
    if (reason) {
      await ctx.db.patch(definition._id, {
        status: "SUSPENDED",
        reliabilityState: "SUSPENDED",
        health: "DEGRADED",
        pauseReason: reason,
        pausedBy: "automation-policy",
        pausedAt: now,
        nextRunAt: undefined,
        updatedAt: now,
      });
      await ctx.db.insert("automationDecisions", {
        projectId: definition.projectId,
        automationDefinitionId: definition._id,
        decisionType: "SUSPENDED",
        actorId: "automation-policy",
        reason,
        policyVersion: AUTOMATION_POLICY_VERSION,
        definitionVersion: definition.definitionVersion,
        decidedAt: now,
      });
      suspended += 1;
      continue;
    }

    const draft = buildReviewGate({
      id: String(definition._id),
      name: definition.name,
      workflowId: definition.workflowId,
      workflowVersion: definition.workflowVersion,
      scope: definition.scope,
      riskLevel: definition.riskLevel,
      requiredApprovalTypes: definition.requiredApprovalTypes,
      verificationContract: definition.verificationContract,
      triggerConfig: definition.triggerConfig,
    }, definition.nextRunAt ?? now);
    const result: { workOrder: { _id: Id<"workOrders"> }; created: boolean } = await ctx.runMutation(
      api.workOrders.create,
      {
        ...draft,
        projectId: definition.projectId,
        repository: definition.repositoryIds[0],
      }
    );
    await ctx.db.patch(definition._id, {
      lastRunAt: now,
      nextRunAt: nextScheduledAt(now),
      lastResult: result.created ? "REVIEW_GATE_CREATED" : "IDEMPOTENT_SKIP",
      lastReviewGateWorkOrderId: result.workOrder._id,
      updatedAt: now,
    });
    if (result.created) created += 1;
    else skipped += 1;
    workOrderIds.push(String(result.workOrder._id));
  }
  return { considered: definitions.length, created, skipped, suspended, workOrderIds };
}

export const evaluateDue = internalMutation({
  args: {},
  handler: async (ctx): Promise<EvaluationResult> =>
    evaluate(ctx, {}),
});

/** Explicit deterministic operator control used for bounded validation and recovery. */
export const evaluateNow = mutation({
  args: {
    projectId: v.id("projects"),
    automationDefinitionId: v.id("automationDefinitions"),
    reason: v.string(),
  },
  handler: async (ctx, args): Promise<EvaluationResult> => {
    if (args.reason.trim().length < 5) {
      throw new Error("A reason is required for manual evaluation");
    }
    const definition = await ctx.db.get(args.automationDefinitionId);
    if (!definition || definition.projectId !== args.projectId) {
      throw new Error("Automation is outside the selected workspace");
    }
    return evaluate(ctx, {
      projectId: args.projectId,
      automationDefinitionId: args.automationDefinitionId,
    });
  },
});
