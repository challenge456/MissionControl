export const ACTIVE_WORK_ORDER_STATES = new Set([
  "READY",
  "DISPATCHED",
  "IN_PROGRESS",
  "BLOCKED",
  "AWAITING_APPROVAL",
  "AWAITING_VERIFICATION",
  "REOPENED",
]);

export function countActiveWorkOrders(workOrders: Array<{ state: string }>) {
  return workOrders.filter((workOrder) => ACTIVE_WORK_ORDER_STATES.has(workOrder.state)).length;
}

export function isRunNeedingAttention(run: {
  status?: string;
  failureReason?: string | null;
  humanInterventions?: number | null;
  retryCount?: number | null;
}) {
  if (!run) return false;
  if (run.status === "FAILED" || run.status === "PAUSED") return true;
  if ((run.humanInterventions ?? 0) > 0) return true;
  if ((run.retryCount ?? 0) > 0) return true;
  return Boolean(run.failureReason);
}

export function summarizeFactoryMetrics(args: {
  workOrders: Array<{ state: string; verificationStatus?: string; acceptedRevisionNumber?: number | null }>;
  approvalsPending: number;
  staleEvidence: number;
  runsNeedingAttention: number;
}) {
  return {
    activeWorkOrders: countActiveWorkOrders(args.workOrders),
    blockedWorkOrders: args.workOrders.filter((workOrder) => workOrder.state === "BLOCKED").length,
    awaitingApproval: args.workOrders.filter((workOrder) => workOrder.state === "AWAITING_APPROVAL").length,
    staleEvidence: args.staleEvidence,
    runsNeedingAttention: args.runsNeedingAttention,
    recentlyAccepted: args.workOrders.filter((workOrder) => workOrder.state === "DONE" && workOrder.acceptedRevisionNumber != null).length,
    verificationFailures: args.workOrders.filter((workOrder) => workOrder.verificationStatus === "FAIL").length,
    approvalsPending: args.approvalsPending,
  };
}
