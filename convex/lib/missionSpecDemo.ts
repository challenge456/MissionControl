import type { MissionPlanAssertionInput, MissionPlanBlueprintInput } from "./missionPlan";
import type { MissionSpecContent, ProjectConstitutionContent } from "./missionSpec";

export function demoProjectConstitution(): ProjectConstitutionContent {
  return {
    summary: "Mission planning must be explicit, bounded, accessible, secure, testable, and attributable.",
    principles: [
      { id: "PRINCIPLE-ARCH-001", title: "One authority path", description: "Planning lineage compiles into the existing Plan, Quality Contract, WorkOrder, verification, and acceptance path.", category: "ARCHITECTURE" },
      { id: "PRINCIPLE-SEC-001", title: "No authority expansion", description: "Specification, Memory, Learning, recipe, and harness context grant no execution or acceptance authority.", category: "SECURITY" },
      { id: "PRINCIPLE-UX-001", title: "Operator confidence", description: "Every state presents its status, reason, next action, and recovery path accessibly.", category: "ACCESSIBILITY_UX" },
      { id: "PRINCIPLE-TEST-001", title: "Evidence first", description: "Every accepted result maps to evidence-bearing verification over the exact approved subject.", category: "TESTING" },
    ],
    requiredSpecSections: [
      "OUTCOME", "PERSONAS", "USER_STORIES", "REQUIREMENTS",
      "NON_FUNCTIONAL_REQUIREMENTS", "ACCEPTANCE_EXPECTATIONS",
      "VERIFICATION_EXPECTATIONS", "DEFINITION_OF_DONE", "NON_GOALS",
      "CONSTRAINTS", "RISKS", "REPOSITORY_SCOPE", "SOURCES",
    ],
    checklistItems: [
      { id: "CHECK-REQ-001", title: "Requirements are testable", description: "Each requirement is clear and maps to observable acceptance.", classification: "REQUIREMENTS_QUALITY", required: true },
      { id: "CHECK-GOV-001", title: "Authority stays bounded", description: "The design preserves canonical governance and execution boundaries.", classification: "GOVERNANCE_CONSTRAINT", required: true },
      { id: "CHECK-VERIFY-001", title: "Exact evidence is required", description: "Execution must produce durable proof for the exact approved candidate.", classification: "EVIDENCE_BEARING_VERIFICATION", required: true },
    ],
  };
}

export function demoMissionSpecRevision2(repositoryId: string, codeScopeId: string): MissionSpecContent {
  return {
    problem: "Operators cannot prove which immutable product requirements authorized a released WorkOrder.",
    outcome: "Every governed Mission retains exact, inspectable intent-to-evidence lineage without adding another execution path.",
    measurableOutcomes: [{ id: "OUTCOME-001", description: "Plans and WorkOrders retain their original Spec binding after a newer revision exists.", metric: "Silent lineage rebinds", target: "0" }],
    personas: [{ id: "PERSONA-001", name: "Mission operator", needs: "A trustworthy explanation of the exact requirements behind delivery." }],
    userStories: [{
      id: "STORY-001",
      personaId: "PERSONA-001",
      title: "Inspect frozen delivery intent",
      outcome: "The operator can trace an approved Plan and released WorkOrder to the exact finalized Spec.",
      priority: "P0",
      scenarios: [{ id: "SCENARIO-001", given: "A Plan is bound to Spec revision two", when: "Spec revision three is saved", then: "The Plan and released WorkOrder still reference revision two" }],
    }],
    requirements: [{ id: "REQ-001", title: "Immutable Plan binding", description: "A new Plan must persist the exact finalized Spec revision, digest, evaluation, Constitution revision, and Constitution digest.", priority: "MUST", sourceStoryIds: ["STORY-001"] }],
    nonFunctionalRequirements: [{ id: "NFR-001", title: "Fail-closed consistency", description: "Plan submission and approval must reject missing coverage or stale exact lineage without releasing work.", category: "RELIABILITY", priority: "MUST", sourceStoryIds: ["STORY-001"] }],
    acceptanceExpectations: [
      { id: "AC-001", title: "Historical binding remains exact", description: "A newer Spec revision leaves the approved Plan and WorkOrder bound to revision two.", requirementIds: ["REQ-001"], verificationExpectationIds: ["VERIFY-001"], givenWhenThen: { given: "An approved Plan bound to revision two", when: "revision three becomes current", then: "all released lineage still names revision two" } },
      { id: "AC-002", title: "Stale lineage fails closed", description: "A digest or coverage mismatch cannot submit or approve a Plan.", requirementIds: ["NFR-001"], verificationExpectationIds: ["VERIFY-001"] },
    ],
    verificationExpectations: [{ id: "VERIFY-001", title: "Exact lineage regression", description: "Run deterministic contract tests and retain the exact test result for the approved candidate.", method: "TEST", category: "CONTRACT_TEST", evidenceCategory: "TEST_RESULT", acceptanceExpectationIds: ["AC-001", "AC-002"], checklistItemIds: ["CHECK-VERIFY-001"], mandatory: true }],
    definitionOfDone: [{ id: "DOD-001", description: "The frozen Spec-to-Plan-to-WorkOrder coverage matrix is complete and browser-visible.", acceptanceExpectationIds: ["AC-001", "AC-002"] }],
    constraints: [{ id: "CONSTRAINT-001", description: "Specification intake must not release, dispatch, verify, publish, merge, route, or accept work." }],
    nonGoals: [{ id: "NONGOAL-001", description: "Create a second orchestrator, acceptance API, or harness lifecycle." }],
    risks: [{ id: "RISK-001", description: "A requirements-quality checkbox could be mistaken for delivery evidence.", severity: "HIGH", mitigation: "Keep checklist classifications explicit and compile only evidence-bearing verification expectations." }],
    edgeCases: [{ id: "EDGE-001", description: "A new Spec is saved after WorkOrder release.", expectedBehavior: "The new revision becomes current intake context but cannot rebind historical delivery artifacts." }],
    repositoryScope: { repositoryId, codeScopeIds: [codeScopeId] },
    sources: [{ id: "SOURCE-001", kind: "DOC", label: "Spec Intake architecture", location: "docs/architecture/2026-08-16-spec-driven-mission-intake-audit.md" }],
    clarifications: [{ id: "CLARIFY-001", findingCode: "MEASURABLE_OUTCOME_MISSING", question: "What measurable result proves immutable lineage?", answer: "Zero silent lineage rebinds.", status: "RESOLVED" }],
    checklistDispositions: [
      { checklistItemId: "CHECK-REQ-001", classification: "REQUIREMENTS_QUALITY", disposition: "SATISFIED", reason: "Every MUST requirement maps to acceptance." },
      { checklistItemId: "CHECK-GOV-001", classification: "GOVERNANCE_CONSTRAINT", disposition: "SATISFIED", reason: "The canonical Plan and WorkOrder authority path is preserved." },
      { checklistItemId: "CHECK-VERIFY-001", classification: "EVIDENCE_BEARING_VERIFICATION", disposition: "SATISFIED", reason: "VERIFY-001 requires durable exact-subject test evidence." },
    ],
    recipe: { recipeId: "full-sdlc", specTemplateVersion: 1, checklistVersion: 1, repositoryType: "MONOREPO", teamType: "PRODUCT", riskProfile: "HIGH", productType: "INTERNAL_TOOL" },
  };
}

export function demoMissionSpecRevision1(repositoryId: string, codeScopeId: string): MissionSpecContent {
  const complete = demoMissionSpecRevision2(repositoryId, codeScopeId);
  return {
    ...complete,
    measurableOutcomes: [],
    acceptanceExpectations: complete.acceptanceExpectations.map((item, index) => index === 0 ? { ...item, verificationExpectationIds: [] } : item),
    clarifications: [{ id: "CLARIFY-001", findingCode: "MEASURABLE_OUTCOME_MISSING", question: "What measurable result proves immutable lineage?", status: "OPEN" }],
  };
}

export function demoMissionSpecRevision3(repositoryId: string, codeScopeId: string): MissionSpecContent {
  const revision2 = demoMissionSpecRevision2(repositoryId, codeScopeId);
  return {
    ...revision2,
    outcome: `${revision2.outcome} Revision three also records narrow-viewport lineage inspection.`,
    edgeCases: [...revision2.edgeCases, { id: "EDGE-002", description: "The operator opens frozen lineage on a narrow viewport.", expectedBehavior: "The exact IDs remain readable without changing authority or records." }],
  };
}

export function demoMissionPlanAssertions(): MissionPlanAssertionInput[] {
  return [
    { assertionId: "ASSERT-001", title: "Historical binding remains exact", outcome: "Plan and WorkOrder retain Spec revision two after revision three exists.", verificationMethod: "TEST", passCondition: "The exact lineage regression exits zero.", requiredEvidence: "Durable test result for the exact candidate", requiresIndependentValidation: true, waiverAllowed: false, sourceRequirementIds: ["REQ-001"], sourceAcceptanceExpectationIds: ["AC-001"], sourceVerificationExpectationIds: ["VERIFY-001"] },
    { assertionId: "ASSERT-002", title: "Stale lineage fails closed", outcome: "A stale digest or incomplete coverage cannot release work.", verificationMethod: "TEST", passCondition: "Contract tests prove submission and approval reject the mismatch.", requiredEvidence: "Durable contract-test result", requiresIndependentValidation: true, waiverAllowed: false, sourceRequirementIds: ["NFR-001"], sourceAcceptanceExpectationIds: ["AC-002"], sourceVerificationExpectationIds: ["VERIFY-001"] },
  ];
}

export function demoMissionPlanBlueprint(workflow?: { workflowId: string; version: number }): MissionPlanBlueprintInput {
  return {
    id: "WORK-001",
    title: "Implement Spec-driven Mission intake",
    desiredOutcome: "Operators can define, evaluate, finalize, bind, and inspect exact immutable planning lineage.",
    workflowId: workflow?.workflowId,
    workflowVersion: workflow?.version,
    sequence: 1,
    role: "WORKER",
    isMutating: true,
    priority: 2,
    riskLevel: "HIGH",
    modelComplexity: "LARGE",
    branchStrategy: "isolated-worktree",
    constraints: ["Preserve the canonical Plan approval and WorkOrder acceptance path"],
    requiredApprovals: ["HUMAN_REVIEW"],
    estimatedCostUsd: 24,
    implementationPolicy: {
      allowedCommands: ["pnpm test", "pnpm run typecheck", "pnpm run build"],
      independentVerification: { executable: "pnpm", args: ["test"], category: "CONTRACT_TEST", commandClass: "TEST", evidenceCategory: "TEST_RESULT", timeoutMs: 1_800_000 },
      maxFilesChanged: 50,
      maxLinesChanged: 5_000,
      maxCostUsd: 30,
      maxAttempts: 2,
      timeoutMinutes: 30,
      stopCondition: "Stop after exact-subject verification is durable and the review-ready candidate is linked.",
    },
    dependsOnBlueprintIds: [],
    assertionIds: ["ASSERT-001", "ASSERT-002"],
  };
}
