export function prEvaluationKey(prUrl: string, headSha: string): string {
  return `${prUrl.trim().replace(/\/$/, "").toLowerCase()}@${headSha.trim().toLowerCase()}`;
}

export function correctionRequired(input: {
  ciStatus: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
  priorHeadSha?: string;
  headSha?: string;
}): boolean {
  if (input.ciStatus !== "FAIL") return false;
  return Boolean(input.headSha && input.headSha !== input.priorHeadSha);
}

export function ciBlockCanRecover(input: {
  ciStatus: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
  blockingIssue?: string;
  priorHeadSha?: string;
  headSha?: string;
}): boolean {
  return input.ciStatus === "PASS"
    && Boolean(input.headSha && input.priorHeadSha && input.headSha !== input.priorHeadSha)
    && input.blockingIssue === `Required CI failed for ${input.priorHeadSha}`;
}

export function ciBlockedHead(blockingIssue?: string): string | undefined {
  const prefix = "Required CI failed for ";
  if (!blockingIssue?.startsWith(prefix)) return undefined;
  const headSha = blockingIssue.slice(prefix.length).trim();
  return headSha || undefined;
}

export function mergeAuthoritySatisfied(input: {
  ciStatus: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
  gatesPass: boolean;
  approvalStatus?: string;
  humanConfirmed: boolean;
}): boolean {
  return input.ciStatus === "PASS"
    && input.gatesPass
    && ["APPROVED", "CONDITIONAL"].includes(input.approvalStatus ?? "")
    && input.humanConfirmed;
}
