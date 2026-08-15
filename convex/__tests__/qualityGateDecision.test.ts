import { describe, expect, it } from "vitest";
import {
  qualityGateEvidenceSetDigest,
  qualityGateStateForCurrentEligibility,
  legacyQualityGateStateForVerdict,
  legacyQualityGateSubjectDigest,
} from "../lib/qualityGateDecision";

describe("Quality Gate decisions", () => {
  it("maps observed verification verdicts to policy-owned gate states", () => {
    expect(legacyQualityGateStateForVerdict("VERIFIED")).toBe("ELIGIBLE");
    expect(legacyQualityGateStateForVerdict("REQUIRES_HUMAN_REVIEW")).toBe("AWAITING_HUMAN");
    expect(legacyQualityGateStateForVerdict("NOT_VERIFIED")).toBe("INELIGIBLE");
    expect(legacyQualityGateStateForVerdict("BLOCKED")).toBe("INELIGIBLE");
  });

  it("projects canonical policy-v2 currentness without becoming acceptance authority", () => {
    expect(qualityGateStateForCurrentEligibility({ eligible: true, reasons: [] })).toBe("ELIGIBLE");
    expect(qualityGateStateForCurrentEligibility({
      eligible: false,
      historicalVerdict: "VERIFIED",
      reasons: ["GitHub pull-request head is stale."],
    })).toBe("STALE");
  });

  it("binds decisions to immutable subject and evidence identities", () => {
    const subject = legacyQualityGateSubjectDigest({
      workOrderId: "wo-1",
      workOrderRevisionNumber: 2,
      executionManifestDigest: "sha256:manifest",
      qualityContractDigest: "sha256:contract",
      candidateRevision: "abc123",
    });
    const evidence = qualityGateEvidenceSetDigest({
      verificationRunId: "vr-1",
      verificationReceiptId: "receipt-1",
      evidenceEnvelopeIds: ["evidence-2", "evidence-1"],
    });

    expect(subject).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(evidence).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(subject).toBe("sha256:c989dd960c12d697e26cb466bac935e8f2535e8aeee31f3561506424456545b8");
    expect(evidence).toBe("sha256:9cfcec22e0de0c9de6b3e3a8530a18f71c4adc72863709a3ff9683639db81cef");
    expect(qualityGateEvidenceSetDigest({
      verificationRunId: "vr-1",
      verificationReceiptId: "receipt-1",
      evidenceEnvelopeIds: ["evidence-1", "evidence-2"],
    })).toBe(evidence);
  });

  it("keeps the legacy projection separate from policy-v2 Verification Subject identity", () => {
    expect(legacyQualityGateSubjectDigest({
      workOrderId: "wo-1",
      workOrderRevisionNumber: 2,
      candidateRevision: "abc123",
    })).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
