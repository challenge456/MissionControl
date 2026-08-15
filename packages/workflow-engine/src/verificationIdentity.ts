import {
  canonicalDigest,
  canonicalHash,
  canonicalJson,
  sha256Hex,
} from "@mission-control/shared";

/** Canonical verification aliases retained as the public workflow-engine API. */
export const canonicalVerificationJson = canonicalJson;
export const verificationSha256Hex = sha256Hex;

export function verificationDigest(namespace: string, value: unknown): string {
  return canonicalDigest(namespace, value);
}

/**
 * The WorkOrder Verification Contract digest is bound to its approved Plan
 * Quality Contract when that lineage exists. Legacy standalone WorkOrders use
 * an explicit null parent rather than receiving an inferred guarantee.
 */
export function verificationContractDigest(
  contract: unknown,
  qualityContractDigest?: string,
): string {
  return verificationDigest("verification-contract/v2", {
    qualityContractDigest: qualityContractDigest ?? null,
    contract,
  });
}

/**
 * Stable evidence-set identity shared by durable Quality Gate projections and
 * the policy-v2 currentness evaluator. The payload remains compatible with
 * the v19 Verification-First records.
 */
export function qualityGateEvidenceSetDigest(input: {
  verificationRunId: string;
  verificationReceiptId: string;
  evidenceEnvelopeIds: string[];
}): string {
  return `sha256:${canonicalHash({
    ...input,
    evidenceEnvelopeIds: [...input.evidenceEnvelopeIds].sort(),
  })}`;
}
