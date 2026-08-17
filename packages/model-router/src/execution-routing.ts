/**
 * The deterministic routing domain is shared with Convex so dispatch and
 * simulation cannot drift. This package re-exports the model-router surface.
 */
export {
  EXECUTION_ROUTING_ALGORITHM_VERSION,
  resolveExecutionRoute,
  workOrderRiskToExecutionTier,
} from "@mission-control/shared";
export type {
  ExecutionBackend,
  ExecutionEligibilityFacts,
  ExecutionEligibilityReasonCode,
  ExecutionEvidence,
  ExecutionRiskTier,
  ExecutionRoutingCandidate,
  ExecutionRoutingCandidateResult,
  ExecutionRoutingInput,
  ExecutionRoutingMetricScore,
  ExecutionRoutingMode,
  ExecutionRoutingPolicy,
  ExecutionRoutingResult,
  ExecutionTuple,
} from "@mission-control/shared";
