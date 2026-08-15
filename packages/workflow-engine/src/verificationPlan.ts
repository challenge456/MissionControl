import { verificationDigest } from "./verificationIdentity.js";
import type { VerificationSubject } from "./verificationSubject.js";

export type VerificationRequirement = {
  id: string;
  description: string;
  source: "WORK_ORDER" | "ACCEPTANCE_CRITERION" | "POLICY" | "MANUAL";
  sourceReference?: string;
  criticality: "REQUIRED" | "IMPORTANT" | "INFORMATIONAL";
};

export type RequiredVerificationRisk = {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source: "WORK_ORDER" | "POLICY" | "HUMAN_APPROVED";
  affectedAreas: string[];
};

export type DiscoveredVerificationRisk = {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedAreas: string[];
  discoveredBy: string;
};

export type RequiredEvidence = {
  id: string;
  requirementIds: string[];
  requiredRiskIds: string[];
  description: string;
  evidenceType:
    | "UNIT_TEST" | "INTEGRATION_TEST" | "E2E_TEST" | "API_CHECK"
    | "RUNTIME_OBSERVATION" | "SECURITY_CHECK" | "PERFORMANCE_CHECK"
    | "ARTIFACT_INSPECTION" | "MANUAL_REVIEW" | "CUSTOM";
  required: boolean;
};

export type VerificationPlan = {
  planVersion: 1;
  planId: string;
  planDigest: string;
  workOrderId: string;
  workOrderRevisionNumber: number;
  verificationContractDigest: string;
  sourceAttemptId: string;
  verificationAttemptId: string;
  verificationSubject: VerificationSubject;
  generatedBy: {
    factoryDefinitionId: string;
    factoryDefinitionVersionId: string;
    attemptId: string;
    executorInvocationId: string;
  };
  requirements: VerificationRequirement[];
  requiredRisks: RequiredVerificationRisk[];
  discoveredRisks: DiscoveredVerificationRisk[];
  requiredEvidence: RequiredEvidence[];
  adversarial?: {
    enabled: boolean;
    scenarios: Array<{
      id: string;
      description: string;
      requirementIds: string[];
      riskIds: string[];
      requiredEvidenceIds: string[];
    }>;
  };
  createdAt: number;
};

export type VerificationPlanDraft = Omit<VerificationPlan, "planId" | "planDigest">;

export type VerificationPlanContract = {
  workOrderId: string;
  workOrderRevisionNumber: number;
  verificationContractDigest: string;
  sourceAttemptId: string;
  verificationAttemptId: string;
  verificationSubjectDigest: string;
  requiredRequirements: VerificationRequirement[];
  requiredRisks: RequiredVerificationRisk[];
  requiredEvidenceIds: string[];
};

export function freezeVerificationPlan(
  draft: VerificationPlanDraft,
  contract: VerificationPlanContract,
  runStatus: "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED" = "PLANNED",
): VerificationPlan {
  if (runStatus !== "PLANNED") throw new Error("Verification Plan is immutable after verification begins.");
  const issues = validateVerificationPlanDraft(draft, contract);
  if (issues.length) throw new Error(`Verification Plan weakens or conflicts with its contract (${issues.join("; ")}).`);
  const planDigest = verificationDigest("verification-plan/v1", draft);
  return {
    ...draft,
    planId: `verification-plan:${planDigest.slice("sha256:".length)}`,
    planDigest,
  };
}

export function assertVerificationPlanImmutable(
  stored: VerificationPlan,
  proposed: VerificationPlan,
  runStatus: "PLANNED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED",
) {
  if (stored.planDigest === proposed.planDigest) return;
  if (runStatus !== "PLANNED") throw new Error("Verification Plan is immutable after verification begins.");
  throw new Error("A frozen Verification Plan cannot be replaced; create a new Verification Attempt.");
}

export function validateVerificationPlanDraft(draft: VerificationPlanDraft, contract: VerificationPlanContract): string[] {
  const issues: string[] = [];
  if (draft.planVersion !== 1) issues.push("unsupported plan version");
  for (const [label, actual, expected] of [
    ["WorkOrder", draft.workOrderId, contract.workOrderId],
    ["WorkOrder revision", draft.workOrderRevisionNumber, contract.workOrderRevisionNumber],
    ["verification contract", draft.verificationContractDigest, contract.verificationContractDigest],
    ["source Attempt", draft.sourceAttemptId, contract.sourceAttemptId],
    ["verification Attempt", draft.verificationAttemptId, contract.verificationAttemptId],
    ["verification subject", draft.verificationSubject.digest, contract.verificationSubjectDigest],
  ] as const) {
    if (actual !== expected) issues.push(`${label} identity mismatch`);
  }
  if (draft.generatedBy.attemptId !== draft.verificationAttemptId) issues.push("plan generator is not the Verification Attempt");

  validateUniqueIds(draft.requirements, "requirement", issues);
  validateUniqueIds(draft.requiredRisks, "required risk", issues);
  validateUniqueIds(draft.discoveredRisks, "discovered risk", issues);
  validateUniqueIds(draft.requiredEvidence, "required evidence", issues);
  if (draft.adversarial) validateUniqueIds(draft.adversarial.scenarios, "adversarial scenario", issues);

  const requirementById = new Map(draft.requirements.map((item) => [item.id, item]));
  const requiredRiskById = new Map(draft.requiredRisks.map((item) => [item.id, item]));
  const evidenceById = new Map(draft.requiredEvidence.map((item) => [item.id, item]));
  const discoveredRiskIds = new Set(draft.discoveredRisks.map((item) => item.id));
  for (const required of contract.requiredRequirements) {
    const planned = requirementById.get(required.id);
    if (!planned) issues.push(`required requirement ${required.id} is missing`);
    else if (planned.description !== required.description || planned.source !== required.source
      || planned.sourceReference !== required.sourceReference || planned.criticality !== required.criticality) {
      issues.push(`required requirement ${required.id} was rewritten or downgraded`);
    }
  }
  for (const required of contract.requiredRisks) {
    const planned = requiredRiskById.get(required.id);
    if (!planned) issues.push(`required risk ${required.id} is missing`);
    else if (planned.description !== required.description || planned.severity !== required.severity
      || planned.source !== required.source || !sameStrings(planned.affectedAreas, required.affectedAreas)) {
      issues.push(`required risk ${required.id} was rewritten or downgraded`);
    }
  }
  for (const evidenceId of contract.requiredEvidenceIds) {
    if (!evidenceById.get(evidenceId)?.required) issues.push(`required evidence ${evidenceId} is missing or optional`);
  }
  for (const evidence of draft.requiredEvidence) {
    for (const requirementId of evidence.requirementIds) {
      if (!requirementById.has(requirementId)) issues.push(`evidence ${evidence.id} references unknown requirement ${requirementId}`);
    }
    for (const riskId of evidence.requiredRiskIds) {
      if (!requiredRiskById.has(riskId)) issues.push(`evidence ${evidence.id} references non-contract risk ${riskId}`);
    }
  }
  for (const risk of draft.requiredRisks) {
    if (discoveredRiskIds.has(risk.id)) issues.push(`risk ${risk.id} cannot be both required and discovered`);
  }
  for (const scenario of draft.adversarial?.scenarios ?? []) {
    for (const requirementId of scenario.requirementIds) {
      if (!requirementById.has(requirementId)) issues.push(`adversarial scenario ${scenario.id} references unknown requirement ${requirementId}`);
    }
    for (const evidenceId of scenario.requiredEvidenceIds) {
      if (!evidenceById.has(evidenceId)) issues.push(`adversarial scenario ${scenario.id} references unknown evidence ${evidenceId}`);
    }
    for (const riskId of scenario.riskIds) {
      if (!requiredRiskById.has(riskId) && !discoveredRiskIds.has(riskId)) issues.push(`adversarial scenario ${scenario.id} references unknown risk ${riskId}`);
    }
  }
  return issues;
}

function sameStrings(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateUniqueIds(items: Array<{ id: string }>, label: string, issues: string[]) {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id.trim()) issues.push(`${label} ID is required`);
    else if (ids.has(item.id)) issues.push(`duplicate ${label} ${item.id}`);
    ids.add(item.id);
  }
}
