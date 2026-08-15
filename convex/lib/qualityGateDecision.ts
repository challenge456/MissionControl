import { canonicalDigest, canonicalHash } from "@mission-control/shared";
import { qualityGateEvidenceSetDigest } from "@mission-control/workflow-engine/verification-identity";

export type VerificationVerdict =
  | "VERIFIED"
  | "NOT_VERIFIED"
  | "BLOCKED"
  | "REQUIRES_HUMAN_REVIEW";

export type QualityGateState =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "UNKNOWN"
  | "STALE"
  | "WAIVER_REQUIRED"
  | "AWAITING_HUMAN";

/** Legacy policy-v1 projection only. Policy-v2 state comes from exact currentness. */
export function legacyQualityGateStateForVerdict(
  verdict: VerificationVerdict,
): QualityGateState {
  if (verdict === "VERIFIED") return "ELIGIBLE";
  if (verdict === "REQUIRES_HUMAN_REVIEW") return "AWAITING_HUMAN";
  return "INELIGIBLE";
}

export function qualityGateStateForCurrentEligibility(input: {
  eligible: boolean;
  historicalVerdict?: VerificationVerdict;
  reasons: string[];
}): QualityGateState {
  if (input.eligible) return "ELIGIBLE";
  if (input.reasons.some((reason) => /stale|expired|head|invalidated/i.test(reason))) return "STALE";
  if (input.historicalVerdict === "REQUIRES_HUMAN_REVIEW") return "AWAITING_HUMAN";
  if (input.reasons.some((reason) => /no .*subject|no .*attempt|no .*result|no .*receipt/i.test(reason))) return "UNKNOWN";
  return "INELIGIBLE";
}

/** Legacy policy-v1 subject projection. Policy-v2 uses VerificationSubject.digest. */
export function legacyQualityGateSubjectDigest(input: {
  workOrderId: string;
  workOrderRevisionNumber: number;
  executionManifestDigest?: string;
  qualityContractDigest?: string;
  candidateRevision: string;
}) {
  return `sha256:${canonicalHash(input)}`;
}

export { qualityGateEvidenceSetDigest };

export function qualityGateProjectionInputDigest(input: unknown): string {
  return canonicalDigest("quality-gate-currentness-projection/v2", input);
}
