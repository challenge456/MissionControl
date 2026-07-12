export interface FactoryOverviewSummary {
  activeWorkOrders: number;
  blockedWorkOrders: number;
  awaitingApproval: number;
  staleEvidence: number;
  runsNeedingAttention: number;
  recentlyAccepted: number;
  verificationFailures: number;
  approvalsPending: number;
}

export function buildFactoryOverviewCards(summary: FactoryOverviewSummary) {
  return [
    { key: "active", label: "Active work", value: summary.activeWorkOrders, tone: "neutral" },
    { key: "blocked", label: "Blocked", value: summary.blockedWorkOrders, tone: summary.blockedWorkOrders > 0 ? "danger" : "neutral" },
    { key: "approvals", label: "Awaiting approval", value: summary.awaitingApproval, tone: summary.awaitingApproval > 0 ? "warning" : "neutral" },
    { key: "stale", label: "Stale evidence", value: summary.staleEvidence, tone: summary.staleEvidence > 0 ? "warning" : "neutral" },
    { key: "runs", label: "Runs needing attention", value: summary.runsNeedingAttention, tone: summary.runsNeedingAttention > 0 ? "danger" : "neutral" },
    { key: "accepted", label: "Recently accepted", value: summary.recentlyAccepted, tone: summary.recentlyAccepted > 0 ? "success" : "neutral" },
  ] as const;
}

export function summarizeAttentionLoad(summary: FactoryOverviewSummary) {
  return summary.blockedWorkOrders + summary.awaitingApproval + summary.staleEvidence + summary.runsNeedingAttention;
}
