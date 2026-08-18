import { v } from "convex/values";

export const decisionCandidateCategoryValidator = v.union(
  v.literal("REQUIREMENT_CLARIFICATION"),
  v.literal("ARCHITECTURE_CHOICE"),
  v.literal("COMPATIBILITY_DECISION"),
  v.literal("REJECTED_APPROACH"),
  v.literal("SCOPE_DECISION"),
  v.literal("SECURITY_TRADEOFF"),
  v.literal("TESTING_DECISION"),
);

export const decisionCandidateTargetValidator = v.union(
  v.literal("SPEC"), v.literal("PLAN"), v.literal("WORK_ORDER"),
  v.literal("ADR_DOCUMENTATION"), v.literal("INFORMATIONAL"),
);

export const decisionCandidateStatusValidator = v.union(
  v.literal("PROPOSED"), v.literal("ACCEPTED_FOR_REVISION"),
  v.literal("REJECTED"), v.literal("SUPERSEDED"), v.literal("RESOLVED"),
);

export const reviewActionValidator = v.union(
  v.literal("COMMENT"), v.literal("REQUEST_CLARIFICATION"),
  v.literal("REQUEST_CHANGE"), v.literal("ACKNOWLEDGE_RESIDUAL_RISK"),
  v.literal("RECORD_ARCHITECTURE_CONCERN"), v.literal("CORRECTION"),
  v.literal("APPROVE_REVIEW_PACKAGE"),
);

export const reviewCorrectionCategoryValidator = v.union(
  v.literal("REPEATED_REVIEW_CORRECTION"),
  v.literal("ARCHITECTURAL_REVIEW_PATTERN"),
  v.literal("MISSING_ACCEPTANCE_CRITERION"),
  v.literal("MISSING_DETERMINISTIC_GATE"),
  v.literal("REPEATED_SECURITY_COMMENT"),
  v.literal("REPEATED_SCOPE_CORRECTION"),
  v.literal("REVIEW_DISCOVERED_REQUIREMENT"),
  v.literal("POST_VERIFICATION_HUMAN_DEFECT"),
);

export const residualFindingCategoryValidator = v.union(
  v.literal("ARCHITECTURE_CONCERN"), v.literal("UNNECESSARY_COUPLING"),
  v.literal("MAINTAINABILITY_CONCERN"), v.literal("SUSPICIOUS_COMPLEXITY"),
  v.literal("MISSING_EDGE_CASE"), v.literal("POTENTIAL_SECURITY_CONCERN"),
  v.literal("MIGRATION_RISK"), v.literal("PERFORMANCE_CONCERN"),
);

export const residualFindingValidator = v.object({
  findingId: v.string(),
  category: residualFindingCategoryValidator,
  summary: v.string(),
  rationale: v.optional(v.string()),
  fileReferences: v.array(v.string()),
  confidence: v.optional(v.number()),
  authority: v.literal("ADVISORY"),
});
