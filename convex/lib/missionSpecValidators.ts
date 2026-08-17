import { v } from "convex/values";

export const specSectionValidator = v.union(
  v.literal("OUTCOME"),
  v.literal("PERSONAS"),
  v.literal("USER_STORIES"),
  v.literal("REQUIREMENTS"),
  v.literal("NON_FUNCTIONAL_REQUIREMENTS"),
  v.literal("ACCEPTANCE_EXPECTATIONS"),
  v.literal("DEFINITION_OF_DONE"),
  v.literal("NON_GOALS"),
  v.literal("CONSTRAINTS"),
  v.literal("RISKS"),
  v.literal("REPOSITORY_SCOPE"),
  v.literal("VERIFICATION_EXPECTATIONS"),
  v.literal("SOURCES"),
  v.literal("CLARIFICATIONS"),
);

export const checklistClassificationValidator = v.union(
  v.literal("REQUIREMENTS_QUALITY"),
  v.literal("GOVERNANCE_CONSTRAINT"),
  v.literal("EVIDENCE_BEARING_VERIFICATION"),
);

const policyReferenceValidator = v.object({
  kind: v.union(
    v.literal("GOVERNANCE_POLICY"),
    v.literal("POLICY_ENVELOPE"),
    v.literal("QUALITY_CONTRACT"),
    v.literal("VERIFICATION_PLAN"),
  ),
  referenceId: v.string(),
  description: v.string(),
});

export const projectConstitutionContentValidator = v.object({
  summary: v.string(),
  principles: v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("ARCHITECTURE"),
      v.literal("SECURITY"),
      v.literal("ACCESSIBILITY_UX"),
      v.literal("DEPENDENCIES"),
      v.literal("TESTING"),
      v.literal("DOCUMENTATION"),
      v.literal("PERFORMANCE"),
      v.literal("REQUIREMENTS_QUALITY"),
    ),
    policyReference: v.optional(policyReferenceValidator),
  })),
  requiredSpecSections: v.array(specSectionValidator),
  checklistItems: v.array(v.object({
    id: v.string(),
    title: v.string(),
    description: v.string(),
    classification: checklistClassificationValidator,
    required: v.boolean(),
    policyReference: v.optional(policyReferenceValidator),
  })),
});

export const missionSpecContentValidator = v.object({
  problem: v.string(),
  outcome: v.string(),
  measurableOutcomes: v.array(v.object({ id: v.string(), description: v.string(), metric: v.string(), target: v.string() })),
  personas: v.array(v.object({ id: v.string(), name: v.string(), needs: v.string() })),
  userStories: v.array(v.object({
    id: v.string(),
    personaId: v.string(),
    title: v.string(),
    outcome: v.string(),
    priority: v.union(v.literal("P0"), v.literal("P1"), v.literal("P2")),
    scenarios: v.array(v.object({ id: v.string(), given: v.string(), when: v.string(), then: v.string() })),
  })),
  requirements: v.array(v.object({
    id: v.string(), title: v.string(), description: v.string(),
    priority: v.union(v.literal("MUST"), v.literal("SHOULD")),
    sourceStoryIds: v.array(v.string()),
  })),
  nonFunctionalRequirements: v.array(v.object({
    id: v.string(), title: v.string(), description: v.string(),
    category: v.union(v.literal("SECURITY"), v.literal("RELIABILITY"), v.literal("PERFORMANCE"), v.literal("ACCESSIBILITY"), v.literal("PRIVACY"), v.literal("OPERABILITY"), v.literal("ARCHITECTURE")),
    priority: v.union(v.literal("MUST"), v.literal("SHOULD")),
    sourceStoryIds: v.array(v.string()),
  })),
  acceptanceExpectations: v.array(v.object({
    id: v.string(), title: v.string(), description: v.string(),
    requirementIds: v.array(v.string()),
    verificationExpectationIds: v.array(v.string()),
    givenWhenThen: v.optional(v.object({ given: v.string(), when: v.string(), then: v.string() })),
  })),
  verificationExpectations: v.array(v.object({
    id: v.string(), title: v.string(), description: v.string(),
    method: v.union(v.literal("COMMAND"), v.literal("TEST"), v.literal("BROWSER"), v.literal("MANUAL"), v.literal("CHECKLIST")),
    category: v.union(v.literal("BUILD"), v.literal("TYPECHECK"), v.literal("UNIT_TEST"), v.literal("INTEGRATION_TEST"), v.literal("CONTRACT_TEST"), v.literal("SECURITY"), v.literal("SECRETS"), v.literal("DEPENDENCY"), v.literal("POLICY"), v.literal("CHANGE_BUDGET"), v.literal("ACCEPTANCE"), v.literal("INDEPENDENT_REVIEW")),
    evidenceCategory: v.union(v.literal("TEST_RESULT"), v.literal("BUILD_RESULT"), v.literal("STATIC_ANALYSIS"), v.literal("SECURITY_SCAN"), v.literal("COMMAND_LOG"), v.literal("FILE_DIFF"), v.literal("SCREENSHOT"), v.literal("BROWSER_RESULT"), v.literal("PERFORMANCE_RESULT"), v.literal("REVIEW_RESULT"), v.literal("POLICY_RESULT"), v.literal("CI_RESULT"), v.literal("RUNTIME_OBSERVATION")),
    acceptanceExpectationIds: v.array(v.string()),
    checklistItemIds: v.array(v.string()),
    mandatory: v.boolean(),
  })),
  definitionOfDone: v.array(v.object({ id: v.string(), description: v.string(), acceptanceExpectationIds: v.array(v.string()) })),
  constraints: v.array(v.object({ id: v.string(), description: v.string() })),
  nonGoals: v.array(v.object({ id: v.string(), description: v.string() })),
  risks: v.array(v.object({
    id: v.string(), description: v.string(),
    severity: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH"), v.literal("CRITICAL")),
    mitigation: v.string(),
  })),
  edgeCases: v.array(v.object({ id: v.string(), description: v.string(), expectedBehavior: v.string() })),
  repositoryScope: v.object({ repositoryId: v.optional(v.string()), codeScopeIds: v.array(v.string()) }),
  sources: v.array(v.object({
    id: v.string(),
    kind: v.union(v.literal("REPO"), v.literal("DOC"), v.literal("PRD"), v.literal("ISSUE"), v.literal("URL")),
    label: v.string(),
    location: v.string(),
  })),
  clarifications: v.array(v.object({
    id: v.string(), findingCode: v.string(), question: v.string(), answer: v.optional(v.string()),
    status: v.union(v.literal("OPEN"), v.literal("RESOLVED")),
  })),
  checklistDispositions: v.array(v.object({
    checklistItemId: v.string(), classification: checklistClassificationValidator,
    disposition: v.union(v.literal("SATISFIED"), v.literal("NOT_APPLICABLE"), v.literal("MISSING")),
    reason: v.optional(v.string()),
  })),
  recipe: v.optional(v.object({
    recipeId: v.string(),
    specTemplateVersion: v.number(),
    checklistVersion: v.number(),
    repositoryType: v.union(v.literal("APPLICATION"), v.literal("LIBRARY"), v.literal("SERVICE"), v.literal("MONOREPO"), v.literal("OTHER")),
    teamType: v.union(v.literal("PRODUCT"), v.literal("PLATFORM"), v.literal("INFRASTRUCTURE"), v.literal("OTHER")),
    riskProfile: v.union(v.literal("LOW"), v.literal("STANDARD"), v.literal("HIGH"), v.literal("REGULATED")),
    productType: v.union(v.literal("SAAS"), v.literal("MARKETPLACE"), v.literal("INTERNAL_TOOL"), v.literal("API"), v.literal("OTHER")),
  })),
});

export const missionSpecFindingValidator = v.object({
  code: v.string(),
  severity: v.union(v.literal("BLOCKING"), v.literal("ADVISORY")),
  blocking: v.boolean(),
  path: v.string(),
  artifactType: v.union(v.literal("SPEC"), v.literal("CONSTITUTION"), v.literal("PLAN"), v.literal("WORK_ORDER"), v.literal("CHECKLIST"), v.literal("LINEAGE")),
  artifactId: v.optional(v.string()),
  message: v.string(),
  nextAction: v.string(),
});

export const requirementsCoverageProjectionValidator = v.object({
  schemaVersion: v.number(),
  rows: v.array(v.object({
    specRequirementId: v.string(),
    acceptanceExpectationIds: v.array(v.string()),
    planAssertionIds: v.array(v.string()),
    workOrderBlueprintIds: v.array(v.string()),
    acceptanceCriterionIds: v.array(v.string()),
    verificationCheckIds: v.array(v.string()),
    complete: v.boolean(),
  })),
  complete: v.boolean(),
  digest: v.string(),
});

export const missionSpecLineageValidator = v.object({
  missionSpecRevisionId: v.id("missionSpecRevisions"),
  missionSpecDigest: v.string(),
  missionSpecQualityEvaluationId: v.id("missionSpecQualityEvaluations"),
  projectConstitutionRevisionId: v.id("projectConstitutionRevisions"),
  projectConstitutionDigest: v.string(),
  requirementsCoverage: requirementsCoverageProjectionValidator,
  checklistLineage: v.object({
    requirementsQualityItemIds: v.array(v.string()),
    governanceConstraintItemIds: v.array(v.string()),
    evidenceBearingVerificationItemIds: v.array(v.string()),
  }),
});
