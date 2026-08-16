import type {
  MissionPlanAssertionInput,
  MissionPlanBlueprintInput,
} from "./missionPlan";

const DEFAULT_DENIED_PATHS = [
  ".env*",
  ".github/workflows/**",
] as const;

const PROHIBITED_COMMAND_CLASSES = [
  "DESTRUCTIVE",
  "PRODUCTION_ACCESS",
  "SECRETS_ACCESS",
  "PUBLISH",
  "INFRASTRUCTURE",
  "MIGRATION",
] as const;

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

/**
 * Compiles approved Mission intent into the existing verification-first
 * WorkOrder contract. This function is deliberately pure so plan submission,
 * release, tests, and operator projections share the same deterministic shape.
 */
export function compileMissionWorkOrderContract(input: {
  blueprint: MissionPlanBlueprintInput;
  assertions: MissionPlanAssertionInput[];
  rollbackApproach?: string;
  codeScopes: Array<{ includePaths: string[]; excludePaths: string[] }>;
}) {
  const linkedAssertions = input.blueprint.assertionIds.map((assertionId) => {
    const assertion = input.assertions.find((candidate) => candidate.assertionId === assertionId);
    if (!assertion) throw new Error(`Mission WorkOrder references unknown assertion ${assertionId}`);
    return assertion;
  });
  const policy = input.blueprint.implementationPolicy;
  const requirements = linkedAssertions.map((assertion) => ({
    id: `requirement:${assertion.assertionId}`,
    title: assertion.title,
    description: assertion.outcome,
    type: "FUNCTIONAL" as const,
    category: "FUNCTIONAL" as const,
    priority: "MUST" as const,
  }));

  if (!input.blueprint.isMutating || !policy) {
    return {
      requirements,
      acceptanceCriteria: linkedAssertions.map((assertion) => ({
        id: assertion.assertionId,
        title: assertion.title,
        description: `${assertion.passCondition} Evidence: ${assertion.requiredEvidence}`,
        requirementIds: [`requirement:${assertion.assertionId}`],
        verificationMethod: assertion.verificationMethod,
        status: "PENDING" as const,
      })),
      requiredApprovals: unique(input.blueprint.requiredApprovals),
      metadata: input.rollbackApproach?.trim()
        ? { rollbackApproach: input.rollbackApproach.trim() }
        : {},
    };
  }

  const rollbackApproach = input.rollbackApproach?.trim();
  if (!rollbackApproach) {
    throw new Error("Mutating Mission WorkOrders require an explicit rollback approach");
  }

  const verification = policy.independentVerification;
  if (!verification || !policy.maxFilesChanged || !policy.maxLinesChanged) {
    throw new Error("Mutating Mission WorkOrders require a fully specified independent verification and change budget policy");
  }
  const allowedPaths = unique(input.codeScopes.flatMap((scope) => scope.includePaths));
  const deniedPaths = unique([
    ...input.codeScopes.flatMap((scope) => scope.excludePaths),
    ...DEFAULT_DENIED_PATHS,
  ]);
  if (allowedPaths.length === 0) {
    throw new Error("Mutating Mission WorkOrders require at least one approved repository code scope");
  }
  const verificationCheckId = "mission:independent-verification";
  const candidateRiskId = "mission:exact-candidate-integrity";

  return {
    requirements,
    acceptanceCriteria: linkedAssertions.map((assertion) => ({
      id: assertion.assertionId,
      title: assertion.title,
      description: `${assertion.passCondition} Evidence: ${assertion.requiredEvidence}`,
      requirementIds: [`requirement:${assertion.assertionId}`],
      requiredEvidence: [{
        category: verification.evidenceCategory,
        minimumCount: 1,
        independent: true,
      }],
      verificationMethod: assertion.verificationMethod,
      status: "PENDING" as const,
    })),
    positiveConstraints: unique(input.blueprint.constraints),
    negativeConstraints: [
      {
        id: "mission:no-production-access",
        type: "NO_PRODUCTION_ACCESS" as const,
        description: "The local Factory may not access production services or provider control planes.",
      },
      {
        id: "mission:no-plaintext-secrets",
        type: "NO_PLAINTEXT_SECRETS" as const,
        description: "The candidate and evidence may not contain plaintext credentials or secrets.",
      },
      {
        id: "mission:verification-contract-protected",
        type: "NO_VERIFICATION_CONFIG_CHANGES" as const,
        description: "The executor may not weaken or rewrite its frozen independent verification contract.",
      },
    ],
    changeBudget: {
      maxFilesChanged: policy.maxFilesChanged,
      maxLinesChanged: policy.maxLinesChanged,
      allowedPaths,
      deniedPaths,
      allowedCommandClasses: [verification.commandClass],
      prohibitedCommandClasses: [...PROHIBITED_COMMAND_CLASSES],
      allowDependencyChanges: false,
      allowSchemaChanges: false,
      allowMigrations: false,
      allowInfrastructureChanges: false,
    },
    verificationContract: {
      schemaVersion: 2,
      enforcementMode: "ENFORCED" as const,
      checks: [{
        id: verificationCheckId,
        name: "Mission independent candidate verification",
        category: verification.category,
        verifierId: "factory-command/v1",
        mandatory: true,
        acceptanceCriterionIds: linkedAssertions.map((assertion) => assertion.assertionId),
        evidenceCategory: verification.evidenceCategory,
        command: {
          executable: verification.executable,
          args: verification.args,
          commandClass: verification.commandClass,
          timeoutMs: verification.timeoutMs,
        },
      }],
      requiredRisks: [{
        id: candidateRiskId,
        description: "The published candidate may differ from the exact immutable subject independently verified for acceptance.",
        severity: input.blueprint.riskLevel,
        source: "HUMAN_APPROVED" as const,
        requiredEvidenceIds: [verificationCheckId],
      }],
      requireHumanReview: false,
      independence: {
        required: true,
        minimumBoundary: "SEPARATE_ATTEMPT" as const,
      },
    },
    requiredApprovals: unique([...input.blueprint.requiredApprovals, "HUMAN_REVIEW"]),
    autonomyLevel: "LEVEL_2" as const,
    metadata: {
      rollbackApproach,
      independentVerification: {
        subject: "IMMUTABLE_CANDIDATE_SHA",
        verifierId: "factory-command/v1",
        minimumBoundary: "SEPARATE_ATTEMPT",
      },
    },
  };
}
