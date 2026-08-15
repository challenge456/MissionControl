import {
  validateMissionPlan,
  type MissionPlanAssertionInput,
  type MissionPlanBlueprintInput,
  type MissionPlanInput,
  type MissionPlanValidationError,
} from "../../../../convex/lib/missionPlan";
import { getFactoryRecipe, type FactoryRecipe } from "../factoryExperience/recipeCatalog";

export type MissionPlanValues = MissionPlanInput;
export type MissionPlanError = MissionPlanValidationError;

export interface MissionPlanWorkflowOption {
  workflowId: string;
  name: string;
  version: number;
}

export function defaultImplementationPolicy() {
  return {
    allowedCommands: ["git diff --check"],
    maxAttempts: 2,
    timeoutMinutes: 30,
    stopCondition: "Stop after the approved file scope and verification commands pass and the review-ready pull request identity is persisted.",
  };
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


export function factoryRecipeIdFromMission(mission: { metadata?: unknown }): string | undefined {
  if (!mission.metadata || typeof mission.metadata !== "object") return undefined;
  const factoryExperience = (mission.metadata as Record<string, unknown>).factoryExperience;
  if (!factoryExperience || typeof factoryExperience !== "object") return undefined;
  const recipeId = (factoryExperience as Record<string, unknown>).selectedRecipeId;
  return typeof recipeId === "string" && getFactoryRecipe(recipeId) ? recipeId : undefined;
}

export function missionPlanFromFactoryRecipe(input: {
  recipe: FactoryRecipe;
  missionTitle: string;
  missionObjective: string;
  workflow?: MissionPlanWorkflowOption;
}): MissionPlanValues {
  const { recipe, missionTitle, missionObjective, workflow } = input;
  const assertion = emptyAssertion("recipe-verification");
  assertion.title = `${recipe.name} verification`;
  assertion.outcome = recipe.verificationLevel;
  assertion.verificationMethod = recipe.mutatesRepository ? "TEST" : "CHECKLIST";
  assertion.passCondition = recipe.deterministicGates.join("; ");
  assertion.requiredEvidence = "Persist the exact verification result and subject identity required by the approved quality contract.";

  const blueprint = emptyBlueprint("delivery", 1, workflow);
  blueprint.title = `${recipe.name}: ${missionTitle}`;
  blueprint.desiredOutcome = missionObjective;
  blueprint.isMutating = recipe.mutatesRepository;
  blueprint.branchStrategy = recipe.mutatesRepository ? "isolated-worktree" : undefined;
  blueprint.implementationPolicy = recipe.mutatesRepository
    ? { ...defaultImplementationPolicy(), maxAttempts: Math.max(1, recipe.maxCorrectiveIterations + 1) }
    : undefined;
  blueprint.assertionIds = [assertion.assertionId];
  blueprint.constraints = [
    `Use the ${recipe.name} workflow recipe as composition intent.`,
    "Do not bypass active policy, approval, verification, or acceptance gates.",
  ];

  return {
    summary: `${recipe.shortDescription} Desired outcome: ${missionObjective}`,
    rollbackApproach: recipe.mutatesRepository
      ? "Preserve the pre-change revision and revert the candidate if the approved validation contract does not pass."
      : "No repository mutation is authorized by this plan.",
    estimatedCostUsd: undefined,
    repository: undefined,
    repositoryBranch: undefined,
    workOrderBlueprints: [blueprint],
    assertions: [assertion],
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
    implementationPolicy: defaultImplementationPolicy(),
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
      implementationPolicy: blueprint.implementationPolicy
        ?? (blueprint.isMutating ? defaultImplementationPolicy() : undefined),
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
      implementationPolicy: blueprint.implementationPolicy
        ? {
            ...blueprint.implementationPolicy,
            allowedCommands: blueprint.implementationPolicy.allowedCommands.map((item) => item.trim()).filter(Boolean),
            stopCondition: blueprint.implementationPolicy.stopCondition.trim(),
          }
        : undefined,
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

export function updateMissionPlanAssertion(
  values: MissionPlanValues,
  index: number,
  patch: Partial<MissionPlanAssertionInput>,
): MissionPlanValues {
  const previousId = values.assertions[index]?.assertionId;
  const assertions = [...values.assertions];
  assertions[index] = { ...assertions[index], ...patch };
  if (patch.assertionId === undefined || patch.assertionId === previousId) {
    return { ...values, assertions };
  }
  return {
    ...values,
    assertions,
    workOrderBlueprints: values.workOrderBlueprints.map((blueprint) => ({
      ...blueprint,
      assertionIds: blueprint.assertionIds.map((assertionId) =>
        assertionId === previousId ? patch.assertionId! : assertionId
      ),
    })),
  };
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
