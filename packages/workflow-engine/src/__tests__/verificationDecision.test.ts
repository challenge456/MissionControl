import { describe, expect, it } from "vitest";
import {
  assertVerificationRunTransition,
  evaluateVerificationDecision,
  type VerificationEvidenceInput,
} from "../verificationDecision.js";
import type { VerificationIndependenceResult } from "../verificationIndependence.js";
import type { VerificationPlan } from "../verificationPlan.js";

const independence: VerificationIndependenceResult = {
  policyVersion: "verification-independence/v1",
  sourceAttemptId: "source-1",
  verificationAttemptId: "verify-1",
  passed: true,
  reasons: ["server proved independence"],
};

const plan = {
  planVersion: 1,
  planId: "plan-1",
  planDigest: `sha256:${"a".repeat(64)}`,
  workOrderId: "wo-1",
  workOrderRevisionNumber: 1,
  verificationContractDigest: `sha256:${"b".repeat(64)}`,
  sourceAttemptId: "source-1",
  verificationAttemptId: "verify-1",
  verificationSubject: { digest: `sha256:${"c".repeat(64)}` },
  generatedBy: { factoryDefinitionId: "f-1", factoryDefinitionVersionId: "fv-1", attemptId: "verify-1", executorInvocationId: "inv-1" },
  requirements: [
    { id: "req-auth", description: "Authenticated request returns 200", source: "WORK_ORDER", criticality: "REQUIRED" },
    { id: "req-unauth", description: "Unauthenticated request returns 401", source: "ACCEPTANCE_CRITERION", criticality: "REQUIRED" },
  ],
  requiredRisks: [{ id: "risk-auth", description: "Authorization bypass", severity: "CRITICAL", source: "WORK_ORDER", affectedAreas: ["api"] }],
  discoveredRisks: [],
  requiredEvidence: [
    { id: "auth-200", requirementIds: ["req-auth"], requiredRiskIds: [], description: "Authenticated API check", evidenceType: "API_CHECK", required: true },
    { id: "unauth-401", requirementIds: ["req-unauth"], requiredRiskIds: ["risk-auth"], description: "Unauthorized API check", evidenceType: "API_CHECK", required: true },
  ],
  createdAt: 1,
} as unknown as VerificationPlan;

const passingEvidence: VerificationEvidenceInput[] = [
  { id: "e-1", requiredEvidenceIds: ["auth-200"], requirementIds: ["req-auth"], requiredRiskIds: [], discoveredRiskIds: [], conclusion: "PASSED", usable: true },
  { id: "e-2", requiredEvidenceIds: ["unauth-401"], requirementIds: ["req-unauth"], requiredRiskIds: ["risk-auth"], discoveredRiskIds: [], conclusion: "PASSED", usable: true },
];

describe("deterministic Verification Decision", () => {
  it("returns VERIFIED only for complete passing independent evidence", () => {
    const result = evaluateVerificationDecision({ plan, evidence: passingEvidence, runStatus: "COMPLETED", independence, requireHumanReview: false, evaluatedAt: 100 });
    expect(result.verdict).toBe("VERIFIED");
    expect(result.coverage).toMatchObject({ requiredRequirementCoverage: 1, requiredRiskCoverage: 1, requiredEvidenceCoverage: 1 });
  });

  it("returns BLOCKED for missing or unavailable required evidence", () => {
    const missing = evaluateVerificationDecision({ plan, evidence: passingEvidence.slice(0, 1), runStatus: "COMPLETED", independence, requireHumanReview: false, evaluatedAt: 100 });
    const unavailable = evaluateVerificationDecision({
      plan,
      evidence: [...passingEvidence.slice(0, 1), { ...passingEvidence[1], conclusion: "UNAVAILABLE" }],
      runStatus: "COMPLETED",
      independence,
      requireHumanReview: false,
      evaluatedAt: 100,
    });
    expect(missing.verdict).toBe("BLOCKED");
    expect(unavailable.verdict).toBe("BLOCKED");
  });

  it("accepts one passing proof even when a redundant source is unavailable", () => {
    const result = evaluateVerificationDecision({
      plan,
      evidence: [...passingEvidence, { ...passingEvidence[1], id: "e-3", conclusion: "UNAVAILABLE" }],
      runStatus: "COMPLETED",
      independence,
      requireHumanReview: false,
      evaluatedAt: 100,
    });
    expect(result.verdict).toBe("VERIFIED");
  });

  it("returns NOT_VERIFIED for failed required behavior or a materialized critical risk", () => {
    const failed = evaluateVerificationDecision({
      plan,
      evidence: [passingEvidence[0], { ...passingEvidence[1], conclusion: "FAILED" }],
      runStatus: "COMPLETED",
      independence,
      requireHumanReview: false,
      evaluatedAt: 100,
    });
    const materialized = evaluateVerificationDecision({
      plan,
      evidence: [passingEvidence[0], { ...passingEvidence[1], materializedRiskIds: ["risk-auth"] }],
      runStatus: "COMPLETED",
      independence,
      requireHumanReview: false,
      evaluatedAt: 100,
    });
    expect(failed.verdict).toBe("NOT_VERIFIED");
    expect(materialized.verdict).toBe("NOT_VERIFIED");
  });

  it("routes inconclusive evidence and material discovered risks to human review without changing required coverage", () => {
    const inconclusive = evaluateVerificationDecision({
      plan,
      evidence: [passingEvidence[0], { ...passingEvidence[1], conclusion: "INCONCLUSIVE" }],
      runStatus: "COMPLETED",
      independence,
      requireHumanReview: false,
      evaluatedAt: 100,
    });
    const discoveredPlan = { ...plan, discoveredRisks: [{ id: "risk-new", description: "Suspicious untested area", severity: "HIGH", affectedAreas: ["api"], discoveredBy: "adversarial-phase" }] };
    const discovered = evaluateVerificationDecision({
      plan: discoveredPlan,
      evidence: passingEvidence,
      runStatus: "COMPLETED",
      independence,
      requireHumanReview: false,
      evaluatedAt: 100,
    });
    expect(inconclusive.verdict).toBe("REQUIRES_HUMAN_REVIEW");
    expect(discovered.verdict).toBe("REQUIRES_HUMAN_REVIEW");
    expect(discovered.coverage.requiredRequirementCoverage).toBe(1);
  });

  it("keeps verifier crashes as lifecycle failure without fabricating a verdict", () => {
    const result = evaluateVerificationDecision({ plan, evidence: passingEvidence, runStatus: "FAILED", independence, requireHumanReview: false, evaluatedAt: 100 });
    expect(result.verdict).toBeNull();
    expect(result.reasons.join(" ")).toContain("failed before a verdict");
  });

  it("enforces the append-only Verification Run lifecycle", () => {
    expect(() => assertVerificationRunTransition("PLANNED", "RUNNING")).not.toThrow();
    expect(() => assertVerificationRunTransition("RUNNING", "COMPLETED")).not.toThrow();
    expect(() => assertVerificationRunTransition("COMPLETED", "RUNNING")).toThrow(/Invalid Verification Run lifecycle/);
    expect(() => assertVerificationRunTransition("FAILED", "COMPLETED")).toThrow(/Invalid Verification Run lifecycle/);
  });

  it("is byte-repeatable for identical stored inputs and injected time", () => {
    const input = { plan, evidence: passingEvidence, runStatus: "COMPLETED" as const, independence, requireHumanReview: false, evaluatedAt: 100 };
    expect(evaluateVerificationDecision(input)).toEqual(evaluateVerificationDecision(input));
  });
});
