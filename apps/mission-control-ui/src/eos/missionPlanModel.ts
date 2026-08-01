import {
  validateMissionPlan,
  type MissionPlanAssertionInput,
  type MissionPlanBlueprintInput,
  type MissionPlanInput,
  type MissionPlanValidationError,
} from "../../../../convex/lib/missionPlan";

export type MissionPlanValues = MissionPlanInput;
export type MissionPlanError = MissionPlanValidationError;

export interface MissionPlanWorkflowOption {
  workflowId: string;
  name: string;
  version: number;
}
export function emptyMissionPlan(workflow?: MissionPlanWorkflowOption): MissionPlanValues {
  return {
    summary: "",
    rollbackApproach: "",
    estimatedCostUsd: undefined,
    repository: undefined,
    repositoryBranch: undefined,
    workOrderBlueprints: [emptyBlueprint("work-order-1", 1, workflow)],
    assertions: [emptyAssertion("assertion-1")],
  };
}

export function emptyBlueprint(
  id: string,
  sequence: number,
  workflow?: MissionPlanWorkflowOption
): MissionPlanBlueprintInput {
  return {
    id,
    title: "",
    desiredOutcome: "",
    workflowId: workflow?.workflowId,
    workflowVersion: workflow?.version,
    sequence,
    role: "WORKER",
    isMutating: true,
    priority: 3,
    riskLevel: "MEDIUM",
    branchStrategy: "isolated-worktree",
    constraints: [],
    requiredApprovals: [],
    dependsOnBlueprintIds: [],
    assertionIds: ["assertion-1"],
  };
}

export function emptyAssertion(id: string): MissionPlanAssertionInput {
  return {
    assertionId: id,
    title: "",
    outcome: "",
    verificationMethod: "TEST",
    passCondition: "",
    requiredEvidence: "",
    requiresIndependentValidation: true,
    waiverAllowed: false,
  };
}

export function planToMissionPlanValues(plan: any, repository?: string, repositoryBranch?: string): MissionPlanValues {
  return {
    summary: plan?.summary ?? "",
    rollbackApproach: plan?.rollbackApproach ?? "",
    estimatedCostUsd: plan?.estimatedCostUsd,
    repository: plan?.repository ?? repository,
    repositoryBranch: plan?.repositoryBranch ?? repositoryBranch,
    workOrderBlueprints: (plan?.workOrderBlueprints ?? []).map((blueprint: any) => ({
      ...blueprint,
      priority: blueprint.priority ?? 3,
      riskLevel: blueprint.riskLevel ?? "MEDIUM",
      constraints: blueprint.constraints ?? [],
      requiredApprovals: blueprint.requiredApprovals ?? [],
    })),
    assertions: plan?.assertions ?? plan?.metadata?.assertions ?? [],
  };
}

export function missionPlanPayload(values: MissionPlanValues) {
  return {
    summary: values.summary.trim(),
    rollbackApproach: values.rollbackApproach.trim(),
    estimatedCostUsd: values.estimatedCostUsd,
    workOrderBlueprints: values.workOrderBlueprints.map((blueprint) => ({
      ...blueprint,
      id: blueprint.id.trim(),
      title: blueprint.title.trim(),
      desiredOutcome: blueprint.desiredOutcome.trim(),
      workflowId: blueprint.workflowId?.trim() || undefined,
      branchStrategy: blueprint.branchStrategy?.trim() || undefined,
      constraints: blueprint.constraints.map((item) => item.trim()).filter(Boolean),
      requiredApprovals: blueprint.requiredApprovals.map((item) => item.trim()).filter(Boolean),
      dependsOnBlueprintIds: [...new Set(blueprint.dependsOnBlueprintIds)],
      assertionIds: [...new Set(blueprint.assertionIds)],
    })),
    assertions: values.assertions.map((assertion) => ({
      ...assertion,
      assertionId: assertion.assertionId.trim(),
      title: assertion.title.trim(),
      outcome: assertion.outcome.trim(),
      passCondition: assertion.passCondition.trim(),
      requiredEvidence: assertion.requiredEvidence.trim(),
    })),
  };
}

export function validateMissionPlanValues(values: MissionPlanValues): MissionPlanError[] {
  return validateMissionPlan(values);
}

export function missionPlanValuesEqual(left: MissionPlanValues, right: MissionPlanValues): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function nextPlanItemId(prefix: string, existingIds: string[]): string {
  let index = existingIds.length + 1;
  while (existingIds.includes(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

export function summarizePlanDiff(base: MissionPlanValues | null, current: MissionPlanValues): string[] {
  if (!base) return [
    `New plan with ${current.workOrderBlueprints.length} WorkOrders`,
    `${current.assertions.length} validation assertions`,
  ];
  const changes: string[] = [];
  if (base.summary !== current.summary) changes.push("Plan summary changed");
  if (base.rollbackApproach !== current.rollbackApproach) changes.push("Rollback approach changed");
  if (base.estimatedCostUsd !== current.estimatedCostUsd) changes.push("Estimated cost changed");
  const baseBlueprints = new Map(base.workOrderBlueprints.map((item) => [item.id, item]));
  const currentBlueprints = new Map(current.workOrderBlueprints.map((item) => [item.id, item]));
  for (const id of currentBlueprints.keys()) {
    if (!baseBlueprints.has(id)) changes.push(`WorkOrder added: ${id}`);
    else if (JSON.stringify(baseBlueprints.get(id)) !== JSON.stringify(currentBlueprints.get(id))) changes.push(`WorkOrder changed: ${id}`);
  }
  for (const id of baseBlueprints.keys()) if (!currentBlueprints.has(id)) changes.push(`WorkOrder removed: ${id}`);
  const baseAssertions = new Map(base.assertions.map((item) => [item.assertionId, item]));
  const currentAssertions = new Map(current.assertions.map((item) => [item.assertionId, item]));
  for (const id of currentAssertions.keys()) {
    if (!baseAssertions.has(id)) changes.push(`Assertion added: ${id}`);
    else if (JSON.stringify(baseAssertions.get(id)) !== JSON.stringify(currentAssertions.get(id))) changes.push(`Assertion changed: ${id}`);
  }
  for (const id of baseAssertions.keys()) if (!currentAssertions.has(id)) changes.push(`Assertion removed: ${id}`);
  return changes.length ? changes : ["No material changes from the prior revision"];
}
