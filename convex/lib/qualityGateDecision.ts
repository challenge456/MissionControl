import { computeCanonicalHash } from "./genomeHash";

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

export function qualityGateStateForVerdict(
  verdict: VerificationVerdict,
): QualityGateState {
  if (verdict === "VERIFIED") return "ELIGIBLE";
  if (verdict === "REQUIRES_HUMAN_REVIEW") return "AWAITING_HUMAN";
  return "INELIGIBLE";
}

export function qualityGateSubjectDigest(input: {
  workOrderId: string;
  workOrderRevisionNumber: number;
  executionManifestDigest?: string;
  qualityContractDigest?: string;
  candidateRevision: string;
}) {
  return `sha256:${computeCanonicalHash(input)}`;
}

export function qualityGateEvidenceSetDigest(input: {
  verificationRunId: string;
  verificationReceiptId: string;
  evidenceEnvelopeIds: string[];
}) {
  return `sha256:${computeCanonicalHash({
    ...input,
    evidenceEnvelopeIds: [...input.evidenceEnvelopeIds].sort(),
  })}`;
}
