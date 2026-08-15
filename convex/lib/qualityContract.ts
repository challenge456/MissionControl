import { computeCanonicalHash } from "./genomeHash";

export const QUALITY_CONTRACT_SCHEMA_VERSION = 1;

export interface ApprovedPlanQualityContractInput {
  missionId: string;
  missionPlanId: string;
  missionPlanRevision: number;
  objective: string;
  businessContext?: string;
  constraints?: string[];
  sourceOfTruthRefs?: Array<{ kind: string; label: string; location: string }>;
  repository: string;
  repositoryBranch: string;
  summary: string;
  rollbackApproach?: string;
  assertions: Array<{
    assertionId: string;
    title: string;
    outcome: string;
    verificationMethod: string;
    passCondition: string;
    requiredEvidence: string;
    requiresIndependentValidation: boolean;
    waiverAllowed: boolean;
  }>;
  workOrderBlueprints: Array<{
    id: string;
    title: string;
    desiredOutcome: string;
    workflowId?: string;
    workflowVersion?: number;
    sequence: number;
    role: string;
    isMutating: boolean;
    riskLevel?: string;
    constraints?: string[];
    requiredApprovals?: string[];
    dependsOnBlueprintIds: string[];
    assertionIds: string[];
  }>;
}

function sortedStrings(values: string[] | undefined): string[] {
  return [...(values ?? [])].sort((left, right) => left.localeCompare(right));
}

/**
 * Compile the human-approved Plan into an immutable assurance projection.
 * The returned object is a projection, not an independently mutable aggregate.
 */
export function compileApprovedPlanQualityContract(
  input: ApprovedPlanQualityContractInput,
) {
  const projection = {
    schemaVersion: QUALITY_CONTRACT_SCHEMA_VERSION,
    source: {
      missionId: input.missionId,
      missionPlanId: input.missionPlanId,
      missionPlanRevision: input.missionPlanRevision,
    },
    intent: {
      objective: input.objective,
      businessContext: input.businessContext,
      constraints: sortedStrings(input.constraints),
      sourceOfTruthRefs: [...(input.sourceOfTruthRefs ?? [])].sort((left, right) =>
        left.kind.localeCompare(right.kind)
        || left.location.localeCompare(right.location)
        || left.label.localeCompare(right.label)
      ),
    },
    repository: {
      repository: input.repository,
      branch: input.repositoryBranch,
    },
    plan: {
      summary: input.summary,
      rollbackApproach: input.rollbackApproach,
    },
    assertions: [...input.assertions]
      .sort((left, right) => left.assertionId.localeCompare(right.assertionId))
      .map((assertion) => ({ ...assertion })),
    workOrders: [...input.workOrderBlueprints]
      .sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
      .map((blueprint) => ({
        ...blueprint,
        constraints: sortedStrings(blueprint.constraints),
        requiredApprovals: sortedStrings(blueprint.requiredApprovals),
        dependsOnBlueprintIds: sortedStrings(blueprint.dependsOnBlueprintIds),
        assertionIds: sortedStrings(blueprint.assertionIds),
      })),
  };

  return {
    projection,
    digest: `sha256:${computeCanonicalHash(projection)}`,
  };
}
