import { describe, expect, it } from "vitest";
import {
  qualityGateEvidenceSetDigest,
  qualityGateStateForVerdict,
  qualityGateSubjectDigest,
} from "../lib/qualityGateDecision";

describe("Quality Gate decisions", () => {
  it("maps observed verification verdicts to policy-owned gate states", () => {
    expect(qualityGateStateForVerdict("VERIFIED")).toBe("ELIGIBLE");
    expect(qualityGateStateForVerdict("REQUIRES_HUMAN_REVIEW")).toBe("AWAITING_HUMAN");
    expect(qualityGateStateForVerdict("NOT_VERIFIED")).toBe("INELIGIBLE");
    expect(qualityGateStateForVerdict("BLOCKED")).toBe("INELIGIBLE");
  });

  it("binds decisions to immutable subject and evidence identities", () => {
    const subject = qualityGateSubjectDigest({
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
    expect(qualityGateEvidenceSetDigest({
      verificationRunId: "vr-1",
      verificationReceiptId: "receipt-1",
      evidenceEnvelopeIds: ["evidence-1", "evidence-2"],
    })).toBe(evidence);
  });
});
