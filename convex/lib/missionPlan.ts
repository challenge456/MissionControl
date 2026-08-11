export const MISSION_PLAN_RELEASE_FLAG = "missions.plan-release-v1";

export type MissionPlanVerificationMethod =
  | "COMMAND"
  | "TEST"
  | "BROWSER"
  | "MANUAL"
  | "CHECKLIST";

export type MissionPlanRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MissionPlanRole = "WORKER" | "VALIDATOR";

export interface MissionPlanImplementationPolicy {
  allowedCommands: string[];
  maxCostUsd?: number;
  maxAttempts: number;
  timeoutMinutes: number;
  stopCondition: string;
}

export interface MissionPlanAssertionInput {
  assertionId: string;
  title: string;
  outcome: string;
  verificationMethod: MissionPlanVerificationMethod;
  passCondition: string;
  requiredEvidence: string;
  requiresIndependentValidation: boolean;
  waiverAllowed: boolean;
}

export interface MissionPlanBlueprintInput {
  id: string;
  title: string;
  desiredOutcome: string;
  workflowId?: string;
  workflowVersion?: number;
  sequence: number;
  role: MissionPlanRole;
  isMutating: boolean;
  priority: 1 | 2 | 3 | 4;
  riskLevel: MissionPlanRiskLevel;
  modelComplexity?: "SMALL" | "STANDARD" | "LARGE";
  branchStrategy?: string;
  constraints: string[];
  requiredApprovals: string[];
  estimatedCostUsd?: number;
  implementationPolicy?: MissionPlanImplementationPolicy;
  dependsOnBlueprintIds: string[];
  assertionIds: string[];
}

export interface MissionPlanInput {
  summary: string;
  rollbackApproach: string;
  estimatedCostUsd?: number;
  repository?: string;
  repositoryBranch?: string;
  workOrderBlueprints: MissionPlanBlueprintInput[];
  assertions: MissionPlanAssertionInput[];
}

export interface MissionPlanValidationError {
  code: string;
  message: string;
  path: string;
  blueprintId?: string;
  assertionId?: string;
}

function required(
  value: string | undefined,
  code: string,
  message: string,
  path: string,
  identity?: Pick<MissionPlanValidationError, "blueprintId" | "assertionId">
): MissionPlanValidationError | null {
  return value?.trim()
    ? null
    : { code, message, path, ...identity };
}

function duplicates(values: string[]): Set<string> {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return repeated;
}

function findCycle(blueprints: MissionPlanBlueprintInput[]): string[] | null {
  const graph = new Map(blueprints.map((blueprint) => [blueprint.id, blueprint.dependsOnBlueprintIds]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }
    if (visited.has(id)) return null;
    visiting.add(id);
    stack.push(id);
    for (const dependency of graph.get(id) ?? []) {
      if (!graph.has(dependency)) continue;
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
    return null;
  };

  for (const blueprint of blueprints) {
    const cycle = visit(blueprint.id);
    if (cycle) return cycle;
  }
  return null;
}

export function validateMissionPlan(input: MissionPlanInput): MissionPlanValidationError[] {
  const errors: MissionPlanValidationError[] = [];
  const push = (error: MissionPlanValidationError | null) => {
    if (error) errors.push(error);
  };

  push(required(input.summary, "summary-required", "Plan summary is required.", "summary"));
  push(required(input.rollbackApproach, "rollback-required", "Rollback approach is required.", "rollbackApproach"));
  if (input.estimatedCostUsd !== undefined && (!Number.isFinite(input.estimatedCostUsd) || input.estimatedCostUsd < 0)) {
    errors.push({ code: "estimated-cost-invalid", message: "Estimated cost must be zero or greater.", path: "estimatedCostUsd" });
  }
  if (input.workOrderBlueprints.length === 0) {
    errors.push({ code: "blueprints-required", message: "At least one WorkOrder is required.", path: "workOrderBlueprints" });
  }
  if (input.assertions.length === 0) {
    errors.push({ code: "assertions-required", message: "At least one validation assertion is required.", path: "assertions" });
  }

  const blueprintIds = input.workOrderBlueprints.map((blueprint) => blueprint.id.trim());
  const assertionIds = input.assertions.map((assertion) => assertion.assertionId.trim());
  for (const id of duplicates(blueprintIds)) {
    errors.push({ code: "blueprint-id-duplicate", message: `WorkOrder ID ${id || "(empty)"} must be unique.`, path: "workOrderBlueprints", blueprintId: id });
  }
  for (const id of duplicates(assertionIds)) {
    errors.push({ code: "assertion-id-duplicate", message: `Assertion ID ${id || "(empty)"} must be unique.`, path: "assertions", assertionId: id });
  }

  const sequenceOwners = new Map<number, string>();
  const blueprintsById = new Map(input.workOrderBlueprints.map((blueprint) => [blueprint.id, blueprint]));
  const assertionIdSet = new Set(assertionIds);
  const assertionCoverage = new Map(assertionIds.map((id) => [id, 0]));
  const validatorAssertionCoverage = new Map(assertionIds.map((id) => [id, 0]));

  for (const blueprint of input.workOrderBlueprints) {
    const identity = { blueprintId: blueprint.id };
    push(required(blueprint.id, "blueprint-id-required", "WorkOrder ID is required.", `blueprints.${blueprint.id}.id`, identity));
    push(required(blueprint.title, "blueprint-title-required", "WorkOrder title is required.", `blueprints.${blueprint.id}.title`, identity));
    push(required(blueprint.desiredOutcome, "blueprint-outcome-required", "Desired outcome is required.", `blueprints.${blueprint.id}.desiredOutcome`, identity));
    push(required(blueprint.workflowId, "blueprint-workflow-required", "A workflow is required.", `blueprints.${blueprint.id}.workflowId`, identity));
    if (!Number.isInteger(blueprint.sequence) || blueprint.sequence < 1) {
      errors.push({ code: "blueprint-sequence-invalid", message: "Sequence must be a positive whole number.", path: `blueprints.${blueprint.id}.sequence`, ...identity });
    } else if (sequenceOwners.has(blueprint.sequence)) {
      errors.push({ code: "blueprint-sequence-duplicate", message: `Sequence ${blueprint.sequence} is already used by ${sequenceOwners.get(blueprint.sequence)}.`, path: `blueprints.${blueprint.id}.sequence`, ...identity });
    } else {
      sequenceOwners.set(blueprint.sequence, blueprint.id);
    }
    if (blueprint.isMutating) {
      push(required(input.repository, "repository-required", "A configured repository is required for mutating work.", "repository", identity));
      push(required(blueprint.branchStrategy, "branch-strategy-required", "A branch strategy is required for mutating work.", `blueprints.${blueprint.id}.branchStrategy`, identity));
      const implementationPolicy = blueprint.implementationPolicy;
      if (!implementationPolicy?.allowedCommands.some((command) => command.trim())) {
        errors.push({ code: "implementation-verifier-required", message: "Mutating WorkOrders require at least one approved verification command.", path: `blueprints.${blueprint.id}.implementationPolicy.allowedCommands`, ...identity });
      }
      if (!Number.isInteger(implementationPolicy?.maxAttempts) || (implementationPolicy?.maxAttempts ?? 0) < 1) {
        errors.push({ code: "implementation-attempts-invalid", message: "Maximum attempts must be a positive whole number.", path: `blueprints.${blueprint.id}.implementationPolicy.maxAttempts`, ...identity });
      }
      if (!Number.isInteger(implementationPolicy?.timeoutMinutes) || (implementationPolicy?.timeoutMinutes ?? 0) < 1) {
        errors.push({ code: "implementation-timeout-invalid", message: "Timeout minutes must be a positive whole number.", path: `blueprints.${blueprint.id}.implementationPolicy.timeoutMinutes`, ...identity });
      }
      push(required(implementationPolicy?.stopCondition, "implementation-stop-condition-required", "Mutating WorkOrders require an explicit stop condition.", `blueprints.${blueprint.id}.implementationPolicy.stopCondition`, identity));
      if (implementationPolicy?.maxCostUsd !== undefined && (!Number.isFinite(implementationPolicy.maxCostUsd) || implementationPolicy.maxCostUsd < 0)) {
        errors.push({ code: "implementation-cost-invalid", message: "Implementation cost must be zero or greater.", path: `blueprints.${blueprint.id}.implementationPolicy.maxCostUsd`, ...identity });
      }
    }
    if (blueprint.role === "VALIDATOR" && blueprint.isMutating) {
      errors.push({ code: "validator-must-be-read-only", message: "Validator WorkOrders must be read-only.", path: `blueprints.${blueprint.id}.isMutating`, ...identity });
    }
    if (blueprint.role === "VALIDATOR" && blueprint.dependsOnBlueprintIds.length === 0) {
      errors.push({ code: "validator-dependency-required", message: "Validator WorkOrders must depend on an earlier WorkOrder handoff.", path: `blueprints.${blueprint.id}.dependsOnBlueprintIds`, ...identity });
    }
    if (blueprint.estimatedCostUsd !== undefined && (!Number.isFinite(blueprint.estimatedCostUsd) || blueprint.estimatedCostUsd < 0)) {
      errors.push({ code: "blueprint-cost-invalid", message: "WorkOrder estimated cost must be zero or greater.", path: `blueprints.${blueprint.id}.estimatedCostUsd`, ...identity });
    }
    if (blueprint.assertionIds.length === 0) {
      errors.push({ code: "blueprint-assertion-required", message: "Each WorkOrder must link at least one assertion.", path: `blueprints.${blueprint.id}.assertionIds`, ...identity });
    }
    for (const assertionId of blueprint.assertionIds) {
      if (!assertionIdSet.has(assertionId)) {
        errors.push({ code: "blueprint-assertion-unknown", message: `Unknown assertion ${assertionId}.`, path: `blueprints.${blueprint.id}.assertionIds`, ...identity, assertionId });
      } else {
        assertionCoverage.set(assertionId, (assertionCoverage.get(assertionId) ?? 0) + 1);
        if (blueprint.role === "VALIDATOR") {
          validatorAssertionCoverage.set(assertionId, (validatorAssertionCoverage.get(assertionId) ?? 0) + 1);
        }
      }
    }
    for (const dependencyId of blueprint.dependsOnBlueprintIds) {
      const dependency = blueprintsById.get(dependencyId);
      if (!dependency) {
        errors.push({ code: "blueprint-dependency-unknown", message: `Unknown dependency ${dependencyId}.`, path: `blueprints.${blueprint.id}.dependsOnBlueprintIds`, ...identity });
      } else if (dependencyId === blueprint.id) {
        errors.push({ code: "blueprint-dependency-self", message: "A WorkOrder cannot depend on itself.", path: `blueprints.${blueprint.id}.dependsOnBlueprintIds`, ...identity });
      } else if (dependency.sequence >= blueprint.sequence) {
        errors.push({ code: "blueprint-dependency-order", message: `${dependencyId} must be ordered before ${blueprint.id}.`, path: `blueprints.${blueprint.id}.dependsOnBlueprintIds`, ...identity });
      }
    }
  }

  for (const assertion of input.assertions) {
    const identity = { assertionId: assertion.assertionId };
    push(required(assertion.assertionId, "assertion-id-required", "Assertion ID is required.", `assertions.${assertion.assertionId}.assertionId`, identity));
    push(required(assertion.title, "assertion-title-required", "Assertion title is required.", `assertions.${assertion.assertionId}.title`, identity));
    push(required(assertion.outcome, "assertion-outcome-required", "Observable outcome is required.", `assertions.${assertion.assertionId}.outcome`, identity));
    push(required(assertion.passCondition, "assertion-pass-condition-required", "Pass condition is required.", `assertions.${assertion.assertionId}.passCondition`, identity));
    push(required(assertion.requiredEvidence, "assertion-evidence-required", "Required evidence is required.", `assertions.${assertion.assertionId}.requiredEvidence`, identity));
    if ((assertionCoverage.get(assertion.assertionId) ?? 0) === 0) {
      errors.push({ code: "assertion-uncovered", message: `Assertion ${assertion.assertionId} is not covered by a WorkOrder.`, path: `assertions.${assertion.assertionId}`, ...identity });
    }
    if (assertion.requiresIndependentValidation && (validatorAssertionCoverage.get(assertion.assertionId) ?? 0) === 0) {
      errors.push({ code: "assertion-validator-required", message: `Assertion ${assertion.assertionId} requires a Validator WorkOrder.`, path: `assertions.${assertion.assertionId}`, ...identity });
    }
  }

  const cycle = findCycle(input.workOrderBlueprints);
  if (cycle) {
    errors.push({ code: "blueprint-dependency-cycle", message: `Dependency cycle: ${cycle.join(" -> ")}.`, path: "workOrderBlueprints" });
  }
  return errors;
}

export function missionPlanReleaseKey(planId: string): string {
  return `mission-plan:${planId}:release:v1`;
}

export function missionBlueprintReleaseKey(planId: string, blueprintId: string): string {
  return `${missionPlanReleaseKey(planId)}:work-order:${blueprintId}`;
}
