export type FactoryReleaseState = "MERGED" | "DEPLOYED" | "VERIFIED" | "ROLLED_BACK";
export type FactoryProductionReleaseState = "ELIGIBLE" | "DEPLOYED" | "VERIFIED" | "PROMOTED" | "ROLLED_BACK";

export function factoryReleaseTone(state: FactoryReleaseState) {
  if (state === "VERIFIED") return "success" as const;
  if (state === "ROLLED_BACK") return "error" as const;
  if (state === "DEPLOYED") return "warning" as const;
  return "info" as const;
}

export function factoryProductionReleaseTone(state: FactoryProductionReleaseState) {
  if (state === "PROMOTED") return "success" as const;
  if (state === "ROLLED_BACK") return "error" as const;
  if (state === "VERIFIED") return "success" as const;
  if (state === "DEPLOYED") return "warning" as const;
  return "info" as const;
}

export function factoryProductionNextAction(input: {
  state?: FactoryProductionReleaseState;
  blockingIssue?: string;
  requiredHumanAction?: string;
}) {
  if (!input.state) return "Production has not been approved for this staging-verified release.";
  if (input.requiredHumanAction) return input.requiredHumanAction;
  if (input.state === "ELIGIBLE") return "Create a staged production deployment without assigning live domains.";
  if (input.state === "DEPLOYED") return input.blockingIssue
    ? "Review failed production evidence or roll back without promotion."
    : "Run independent production verification before promotion.";
  if (input.state === "VERIFIED") return "Promote this exact verified deployment and attach the provider receipt.";
  if (input.state === "PROMOTED") return "Production is current and independently verified.";
  return "Open a corrective WorkOrder before another production release.";
}

export function factoryReleaseNextAction(input: {
  state: FactoryReleaseState;
  deploymentApprovalStatus: "PENDING" | "APPROVED";
  blockingIssue?: string;
  requiredHumanAction?: string;
}) {
  if (input.requiredHumanAction) return input.requiredHumanAction;
  if (input.state === "MERGED" && input.deploymentApprovalStatus === "PENDING") {
    return "Approve the exact merged commit for staging deployment.";
  }
  if (input.state === "MERGED") return "Deploy the approved commit and attach its provider receipt.";
  if (input.state === "DEPLOYED") return input.blockingIssue
    ? "Review failed staging evidence, correct the deployment, or roll back."
    : "Run independent provenance, smoke, and health verification.";
  if (input.state === "VERIFIED") return "Staging proof is complete. Production requires separate eligibility and approval.";
  return "Open a corrective WorkOrder before attempting another release.";
}

export function factoryReleaseCounts(rows: Array<{ release: { state: FactoryReleaseState; deploymentApprovalStatus: "PENDING" | "APPROVED" } }>) {
  return {
    total: rows.length,
    awaitingApproval: rows.filter(({ release }) => release.state === "MERGED" && release.deploymentApprovalStatus === "PENDING").length,
    awaitingVerification: rows.filter(({ release }) => release.state === "DEPLOYED").length,
    verified: rows.filter(({ release }) => release.state === "VERIFIED").length,
    rolledBack: rows.filter(({ release }) => release.state === "ROLLED_BACK").length,
  };
}
