import { v } from "convex/values";

export const evidenceCategoryValidator = v.union(
  v.literal("TEST_RESULT"), v.literal("BUILD_RESULT"), v.literal("STATIC_ANALYSIS"),
  v.literal("SECURITY_SCAN"), v.literal("COMMAND_LOG"), v.literal("FILE_DIFF"),
  v.literal("SCREENSHOT"), v.literal("BROWSER_RESULT"), v.literal("PERFORMANCE_RESULT"),
  v.literal("REVIEW_RESULT"), v.literal("POLICY_RESULT"), v.literal("CI_RESULT"),
  v.literal("RUNTIME_OBSERVATION"),
);

export const verificationCheckStatusValidator = v.union(
  v.literal("PASS"), v.literal("FAIL"), v.literal("SKIPPED"),
  v.literal("NOT_CONFIGURED"), v.literal("ERROR"),
);

export const verificationVerdictValidator = v.union(
  v.literal("VERIFIED"), v.literal("NOT_VERIFIED"), v.literal("BLOCKED"),
  v.literal("REQUIRES_HUMAN_REVIEW"),
);

export const verificationCategoryValidator = v.union(
  v.literal("BUILD"), v.literal("TYPECHECK"), v.literal("UNIT_TEST"),
  v.literal("INTEGRATION_TEST"), v.literal("CONTRACT_TEST"), v.literal("SECURITY"),
  v.literal("SECRETS"), v.literal("DEPENDENCY"), v.literal("POLICY"),
  v.literal("CHANGE_BUDGET"), v.literal("ACCEPTANCE"), v.literal("INDEPENDENT_REVIEW"),
);

export const commandClassValidator = v.union(
  v.literal("BUILD"), v.literal("TYPECHECK"), v.literal("TEST"), v.literal("LINT"),
  v.literal("SECURITY_SCAN"), v.literal("DEPENDENCY_SCAN"), v.literal("MIGRATION"),
  v.literal("INFRASTRUCTURE"), v.literal("PRODUCTION_ACCESS"), v.literal("SECRETS_ACCESS"),
  v.literal("DESTRUCTIVE"), v.literal("PUBLISH"),
);

export const evidenceRequirementValidator = v.object({
  category: evidenceCategoryValidator,
  minimumCount: v.number(),
  independent: v.boolean(),
});

export const acceptanceCriterionValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  requirementIds: v.optional(v.array(v.string())),
  givenWhenThen: v.optional(v.object({
    given: v.string(),
    when: v.string(),
    then: v.string(),
  })),
  requiredEvidence: v.optional(v.array(evidenceRequirementValidator)),
  verificationMethod: v.optional(v.union(
    v.literal("MANUAL"), v.literal("COMMAND"), v.literal("TEST"),
    v.literal("CHECKLIST"), v.literal("BROWSER"),
  )),
  status: v.union(
    v.literal("PENDING"), v.literal("PASS"), v.literal("FAIL"),
    v.literal("WAIVED"), v.literal("STALE"),
  ),
});

export const requirementValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  type: v.union(v.literal("FUNCTIONAL"), v.literal("NON_FUNCTIONAL")),
  category: v.optional(v.union(
    v.literal("FUNCTIONAL"), v.literal("SECURITY"), v.literal("RELIABILITY"),
    v.literal("PERFORMANCE"), v.literal("ACCESSIBILITY"), v.literal("PRIVACY"),
    v.literal("OPERABILITY"), v.literal("ARCHITECTURE"),
  )),
  priority: v.union(v.literal("MUST"), v.literal("SHOULD")),
});

export const negativeConstraintValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal("PROTECTED_PATH"), v.literal("NO_AUTH_CHANGES"),
    v.literal("NO_PRODUCTION_ACCESS"), v.literal("NO_PLAINTEXT_SECRETS"),
    v.literal("NO_PUBLIC_API_CHANGES"), v.literal("NO_SCHEMA_CHANGES"),
    v.literal("NO_NEW_DEPENDENCIES"), v.literal("NO_TEST_REMOVAL"),
    v.literal("NO_ASSERTION_WEAKENING"), v.literal("NO_VERIFICATION_CONFIG_CHANGES"),
    v.literal("CUSTOM"),
  ),
  description: v.string(),
  paths: v.optional(v.array(v.string())),
  pattern: v.optional(v.string()),
});

export const dataBoundaryValidator = v.object({
  id: v.string(),
  kind: v.union(
    v.literal("SECRET"), v.literal("CREDENTIAL"), v.literal("PRODUCTION_DATA"),
    v.literal("PII"), v.literal("PROTECTED_FILE"), v.literal("RESTRICTED_SERVICE"),
  ),
  description: v.string(),
  paths: v.optional(v.array(v.string())),
  resources: v.optional(v.array(v.string())),
});

export const changeBudgetValidator = v.object({
  maxFilesChanged: v.number(),
  maxLinesChanged: v.number(),
  allowedPaths: v.array(v.string()),
  deniedPaths: v.array(v.string()),
  allowedCommandClasses: v.array(commandClassValidator),
  prohibitedCommandClasses: v.array(commandClassValidator),
  allowDependencyChanges: v.boolean(),
  allowSchemaChanges: v.boolean(),
  allowMigrations: v.boolean(),
  allowInfrastructureChanges: v.boolean(),
});

export const verificationCheckValidator = v.object({
  id: v.string(),
  name: v.string(),
  category: verificationCategoryValidator,
  verifierId: v.string(),
  mandatory: v.boolean(),
  acceptanceCriterionIds: v.array(v.string()),
  evidenceCategory: evidenceCategoryValidator,
  command: v.optional(v.object({
    executable: v.string(),
    args: v.array(v.string()),
    commandClass: commandClassValidator,
    timeoutMs: v.number(),
  })),
});

export const verificationContractValidator = v.object({
  schemaVersion: v.number(),
  enforcementMode: v.union(v.literal("OBSERVE_ONLY"), v.literal("ENFORCED")),
  checks: v.array(verificationCheckValidator),
  requireHumanReview: v.boolean(),
});

export const verificationCheckResultValidator = v.object({
  checkId: v.string(),
  name: v.string(),
  category: verificationCategoryValidator,
  verifierId: v.string(),
  mandatory: v.boolean(),
  status: verificationCheckStatusValidator,
  summary: v.string(),
  acceptanceCriterionIds: v.array(v.string()),
  startedAt: v.number(),
  completedAt: v.number(),
  durationMs: v.number(),
  evidenceIds: v.array(v.id("evidenceEnvelopes")),
  violations: v.array(v.string()),
  metadata: v.optional(v.any()),
});

export const criterionCoverageValidator = v.object({
  criterionId: v.string(),
  title: v.string(),
  status: v.union(v.literal("EVIDENCED"), v.literal("MISSING")),
  requiredEvidenceCount: v.number(),
  usableEvidenceCount: v.number(),
  missingEvidence: v.array(v.string()),
  evidenceIds: v.array(v.id("evidenceEnvelopes")),
});
