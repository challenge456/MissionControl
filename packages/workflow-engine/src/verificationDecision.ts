import { verificationDigest } from "./verificationIdentity.js";
import type { VerificationIndependenceResult } from "./verificationIndependence.js";
import type { VerificationPlan } from "./verificationPlan.js";

export type VerificationRunStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED";
export type VerificationVerdictV2 = "VERIFIED" | "NOT_VERIFIED" | "BLOCKED" | "REQUIRES_HUMAN_REVIEW";

export type VerificationEvidenceInput = {
  id: string;
  requiredEvidenceIds: string[];
  requirementIds: string[];
  requiredRiskIds: string[];
  discoveredRiskIds: string[];
  conclusion: "PASSED" | "FAILED" | "UNAVAILABLE" | "INCONCLUSIVE";
  usable: boolean;
  materializedRiskIds?: string[];
};

export type VerificationCoverageV2 = {
  requiredRequirementCoverage: number;
  requiredEvidenceCoverage: number;
  requiredRiskCoverage: number;
  totalRequiredRequirements: number;
  coveredRequiredRequirements: number;
  totalRequiredRisks: number;
  coveredRequiredRisks: number;
  requiredEvidenceCount: number;
  passedRequiredEvidenceCount: number;
  discoveredRiskCount: number;
  discoveredRiskEvidenceCoverage: number | null;
};

export type VerificationDecisionResult = {
  runStatus: VerificationRunStatus;
  verdict: VerificationVerdictV2 | null;
  coverage: VerificationCoverageV2;
  independenceValid: boolean;
  passedRequirementIds: string[];
  failedRequirementIds: string[];
  uncoveredRequirementIds: string[];
  coveredRiskIds: string[];
  uncoveredRiskIds: string[];
  evidenceIds: string[];
  reasons: string[];
  evaluatedAt: number;
  decisionInputDigest: string;
};

const VERIFICATION_RUN_TRANSITIONS: Record<VerificationRunStatus, VerificationRunStatus[]> = {
  PLANNED: ["RUNNING", "FAILED", "CANCELED"],
  RUNNING: ["COMPLETED", "FAILED", "CANCELED"],
  COMPLETED: [],
  FAILED: [],
  CANCELED: [],
};

export function assertVerificationRunTransition(from: VerificationRunStatus, to: VerificationRunStatus) {
  if (!VERIFICATION_RUN_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid Verification Run lifecycle transition: ${from} -> ${to}.`);
  }
}

export function evaluateVerificationDecision(input: {
  plan: VerificationPlan;
  evidence: VerificationEvidenceInput[];
  runStatus: VerificationRunStatus;
  independence: VerificationIndependenceResult;
  requireHumanReview: boolean;
  evaluatedAt: number;
}): VerificationDecisionResult {
  const requiredEvidence = input.plan.requiredEvidence.filter((item) => item.required);
  const requiredRequirements = input.plan.requirements.filter((item) => item.criticality === "REQUIRED");
  const usable = input.evidence.filter((item) => item.usable);
  const conclusionByRequiredEvidence = new Map(requiredEvidence.map((required) => [
    required.id,
    usable.filter((evidence) => evidence.requiredEvidenceIds.includes(required.id)),
  ]));

  const passedRequiredEvidenceIds = requiredEvidence
    .filter((required) => conclusionByRequiredEvidence.get(required.id)?.some((evidence) => evidence.conclusion === "PASSED"))
    .map((item) => item.id);
  const failedRequiredEvidenceIds = requiredEvidence
    .filter((required) => conclusionByRequiredEvidence.get(required.id)?.some((evidence) => evidence.conclusion === "FAILED"))
    .map((item) => item.id);
  const unavailableRequiredEvidenceIds = requiredEvidence
    .filter((required) => {
      const evidence = conclusionByRequiredEvidence.get(required.id) ?? [];
      return !evidence.some((item) => item.conclusion === "PASSED")
        && (evidence.length === 0 || evidence.some((item) => item.conclusion === "UNAVAILABLE"));
    })
    .map((item) => item.id);
  const inconclusiveRequiredEvidenceIds = requiredEvidence
    .filter((required) => conclusionByRequiredEvidence.get(required.id)?.some((evidence) => evidence.conclusion === "INCONCLUSIVE"))
    .map((item) => item.id);

  const passedRequirementIds: string[] = [];
  const failedRequirementIds: string[] = [];
  const uncoveredRequirementIds: string[] = [];
  for (const requirement of requiredRequirements) {
    const mapped = requiredEvidence.filter((item) => item.requirementIds.includes(requirement.id));
    if (mapped.some((item) => failedRequiredEvidenceIds.includes(item.id))) failedRequirementIds.push(requirement.id);
    else if (mapped.length > 0 && mapped.every((item) => passedRequiredEvidenceIds.includes(item.id))) passedRequirementIds.push(requirement.id);
    else uncoveredRequirementIds.push(requirement.id);
  }

  const materializedRiskIds = new Set(usable.flatMap((item) => item.materializedRiskIds ?? []));
  const requiredCriticalRiskIds = new Set(input.plan.requiredRisks
    .filter((risk) => risk.severity === "CRITICAL")
    .map((risk) => risk.id));
  const materializedRequiredCriticalRiskIds = [...materializedRiskIds]
    .filter((riskId) => requiredCriticalRiskIds.has(riskId));
  const coveredRiskIds: string[] = [];
  const uncoveredRiskIds: string[] = [];
  for (const risk of input.plan.requiredRisks) {
    const mapped = requiredEvidence.filter((item) => item.requiredRiskIds.includes(risk.id));
    if (!materializedRiskIds.has(risk.id) && mapped.length > 0 && mapped.every((item) => passedRequiredEvidenceIds.includes(item.id))) {
      coveredRiskIds.push(risk.id);
    } else {
      uncoveredRiskIds.push(risk.id);
    }
  }

  const discoveredWithEvidence = input.plan.discoveredRisks.filter((risk) => usable.some((item) => item.discoveredRiskIds.includes(risk.id)));
  const coverage: VerificationCoverageV2 = {
    requiredRequirementCoverage: ratio(passedRequirementIds.length, requiredRequirements.length),
    requiredEvidenceCoverage: ratio(passedRequiredEvidenceIds.length, requiredEvidence.length),
    requiredRiskCoverage: ratio(coveredRiskIds.length, input.plan.requiredRisks.length),
    totalRequiredRequirements: requiredRequirements.length,
    coveredRequiredRequirements: passedRequirementIds.length,
    totalRequiredRisks: input.plan.requiredRisks.length,
    coveredRequiredRisks: coveredRiskIds.length,
    requiredEvidenceCount: requiredEvidence.length,
    passedRequiredEvidenceCount: passedRequiredEvidenceIds.length,
    discoveredRiskCount: input.plan.discoveredRisks.length,
    discoveredRiskEvidenceCoverage: input.plan.discoveredRisks.length
      ? ratio(discoveredWithEvidence.length, input.plan.discoveredRisks.length)
      : null,
  };

  const reasons: string[] = [];
  let verdict: VerificationVerdictV2 | null = null;
  if (input.runStatus !== "COMPLETED") {
    reasons.push(input.runStatus === "FAILED"
      ? "Verification execution failed before a verdict could be computed."
      : input.runStatus === "CANCELED"
        ? "Verification execution was canceled before a verdict could be computed."
        : "Verification execution has not completed.");
  } else if (!input.independence.passed) {
    verdict = "BLOCKED";
    reasons.push(...input.independence.reasons);
  } else if (failedRequiredEvidenceIds.length || failedRequirementIds.length || materializedRequiredCriticalRiskIds.length) {
    verdict = "NOT_VERIFIED";
    if (failedRequiredEvidenceIds.length) reasons.push(`Required evidence failed: ${failedRequiredEvidenceIds.join(", ")}.`);
    if (failedRequirementIds.length) reasons.push(`Required behavior was disproven: ${failedRequirementIds.join(", ")}.`);
    if (materializedRequiredCriticalRiskIds.length) {
      reasons.push(`Required critical risk materialized: ${materializedRequiredCriticalRiskIds.join(", ")}.`);
    }
  } else if (inconclusiveRequiredEvidenceIds.length) {
    verdict = "REQUIRES_HUMAN_REVIEW";
    reasons.push(`Required evidence is inconclusive: ${inconclusiveRequiredEvidenceIds.join(", ")}.`);
  } else if (unavailableRequiredEvidenceIds.length || uncoveredRequirementIds.length || uncoveredRiskIds.length) {
    verdict = "BLOCKED";
    if (unavailableRequiredEvidenceIds.length) reasons.push(`Required evidence is unavailable: ${unavailableRequiredEvidenceIds.join(", ")}.`);
    if (uncoveredRequirementIds.length) reasons.push(`Required requirements are uncovered: ${uncoveredRequirementIds.join(", ")}.`);
    if (uncoveredRiskIds.length) reasons.push(`Required risks are uncovered: ${uncoveredRiskIds.join(", ")}.`);
  } else if (input.requireHumanReview || input.plan.discoveredRisks.some((risk) => risk.severity === "HIGH" || risk.severity === "CRITICAL")) {
    verdict = "REQUIRES_HUMAN_REVIEW";
    reasons.push(input.requireHumanReview
      ? "The verification contract reserves advancement for human review."
      : "A material verifier-discovered risk requires human judgment without changing the contract denominator.");
  } else {
    verdict = "VERIFIED";
    reasons.push("All required requirements, risks, and evidence passed with server-derived independence.");
  }

  const decisionInputDigest = verificationDigest("verification-decision-input/v1", {
    planDigest: input.plan.planDigest,
    evidence: [...input.evidence].sort((left, right) => left.id.localeCompare(right.id)),
    runStatus: input.runStatus,
    independence: input.independence,
    requireHumanReview: input.requireHumanReview,
    evaluatedAt: input.evaluatedAt,
  });
  return {
    runStatus: input.runStatus,
    verdict,
    coverage,
    independenceValid: input.independence.passed,
    passedRequirementIds,
    failedRequirementIds,
    uncoveredRequirementIds,
    coveredRiskIds,
    uncoveredRiskIds,
    evidenceIds: usable.map((item) => item.id).sort(),
    reasons,
    evaluatedAt: input.evaluatedAt,
    decisionInputDigest,
  };
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}
