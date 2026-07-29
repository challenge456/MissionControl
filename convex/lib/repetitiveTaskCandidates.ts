import {
  detectRepetitiveTasks,
  isEligibleAutomationReceipt,
  type RepetitiveTaskCandidate,
} from "./repetitiveTasks";
import type { Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";

export interface CandidateWorkOrderRecord {
  _id: unknown;
  projectId?: unknown;
  workflowId?: string;
  repository?: string;
  state: string;
}

export interface CandidateReceiptRecord {
  projectId?: unknown;
  workOrderId: unknown;
  status: string;
  validUntil?: number;
  invalidatedAt?: number;
}

function belongsToProject(recordProjectId: unknown, projectId?: unknown): boolean {
  return projectId == null || String(recordProjectId) === String(projectId);
}

export function candidatesFromProjectRecords(
  workOrders: readonly CandidateWorkOrderRecord[],
  receipts: readonly CandidateReceiptRecord[],
  projectId?: unknown,
  now = Date.now()
): RepetitiveTaskCandidate[] {
  const scopedWorkOrders = workOrders.filter((workOrder) =>
    belongsToProject(workOrder.projectId, projectId)
  );
  const scopedWorkOrderIds = new Set(scopedWorkOrders.map((workOrder) => String(workOrder._id)));
  const eligibleReceiptsByWorkOrder = new Map<string, number>();

  for (const receipt of receipts) {
    if (!belongsToProject(receipt.projectId, projectId)) continue;
    const workOrderId = String(receipt.workOrderId);
    if (!scopedWorkOrderIds.has(workOrderId)) continue;
    if (!isEligibleAutomationReceipt(receipt, now)) continue;
    eligibleReceiptsByWorkOrder.set(
      workOrderId,
      (eligibleReceiptsByWorkOrder.get(workOrderId) ?? 0) + 1
    );
  }

  return detectRepetitiveTasks(
    scopedWorkOrders.map((workOrder) => ({
      workOrderId: String(workOrder._id),
      workflowId: workOrder.workflowId,
      repository: workOrder.repository,
      state: workOrder.state,
      eligibleReceiptCount: eligibleReceiptsByWorkOrder.get(String(workOrder._id)) ?? 0,
    }))
  );
}

export async function loadRepetitiveTaskCandidates(
  ctx: { db: DatabaseReader },
  projectId?: Id<"projects">,
  now = Date.now()
): Promise<RepetitiveTaskCandidate[]> {
  const workOrders = projectId
    ? await ctx.db
        .query("workOrders")
        .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
        .collect()
    : await ctx.db.query("workOrders").collect();
  const receipts = projectId
    ? await ctx.db
        .query("verificationReceipts")
        .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
        .collect()
    : await ctx.db.query("verificationReceipts").collect();

  return candidatesFromProjectRecords(workOrders, receipts, projectId, now);
}

export function isCandidateEligibleForActivation(
  candidate: Pick<RepetitiveTaskCandidate, "workflowId" | "receiptCount">
): boolean {
  return Boolean(candidate.workflowId && candidate.receiptCount > 0);
}
