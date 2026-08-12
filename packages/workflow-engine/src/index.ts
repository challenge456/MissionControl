/**
 * Workflow Engine
 * 
 * Multi-agent workflow execution inspired by Antfarm.
 * 
 * Key patterns:
 * - Deterministic workflows (same steps, same order)
 * - Agent verification (separate verifier checks implementer's work)
 * - Fresh context per step (Ralph loop pattern)
 * - Retry and escalation (automatic retry, then human approval)
 * - Template-based inputs ({{variable}} substitution)
 */

export {
  WorkflowExecutor,
  createExecutor,
  legacyExecutorOwnsRun,
  workflowDefinitionForRun,
  workflowEvidenceDigest,
  type WorkflowExecutorConfig,
  type StepExecutionResult,
} from "./executor";

export {
  render,
  extractVariables,
  validateContext,
  type RenderContext,
} from "./renderer";

export {
  buildBoundedContextUpdate,
  validateCompletionOutput,
} from "./handoff";

export {
  parse,
  meetsExpectations,
  extractData,
  type ParsedOutput,
} from "./parser";

export {
  loadWorkflow,
  loadAllWorkflows,
  validateWorkflow,
  type WorkflowDefinition,
  type WorkflowStepDefinition,
  type WorkflowValidationError,
} from "./loader";

export {
  compileWorkflowGraph,
  evaluateWorkflowCondition,
  getRunnableNodeIndexes,
  graphMetrics,
  validateGraphDefinition,
  validateStructuredOutput,
  type CompiledWorkflowGraph,
  type GraphStepDefinition,
  type GraphStepState,
  type GraphValidationError,
  type JsonContract,
  type WorkflowCondition,
  type WorkflowFailurePolicy,
  type WorkflowNodeKind,
  type WorkflowNodeStatus,
  type WorkflowTopology,
} from "./graph";

export type {
  ExecutorAdapter,
  ExecutorCapabilities,
  ExecutorConfigurationIssue,
  ExecutorEstimate,
  ExecutorEvent,
  ExecutorEventType,
  ExecutorHealth,
  ExecutorRequest,
  ExecutorResult,
} from "./executorAdapter";

export {
  matchesRepositoryGlob,
  normalizeRepositoryPath,
  validateChangedFileScope,
  type RepositoryScope,
  type RepositoryScopeViolation,
} from "./repositoryScope";

export {
  VerificationEngine,
  ChangeBudgetVerifier,
  NegativeConstraintVerifier,
  calculateCriterionCoverage,
  evaluateVerificationOutcome,
  matchesRepositoryPattern,
  type AcceptanceCriterionSpec,
  type CandidateChange,
  type ChangeBudget,
  type CommandClass,
  type CriterionCoverage,
  type EvidenceCategory,
  type EvidenceRequirement,
  type NegativeConstraint,
  type VerificationCategory,
  type VerificationCheckResult,
  type VerificationCheckSpec,
  type VerificationCheckStatus,
  type VerificationContract,
  type VerificationEngineResult,
  type VerificationEvidenceDraft,
  type VerificationExecutionContext,
  type VerificationVerdict,
  type Verifier,
  type WorkOrderVerificationSpec,
} from "./verification";
