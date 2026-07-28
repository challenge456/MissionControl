export {
  resolveModelRoute,
  type CatalogModel,
  type ModelRoutingResult,
  type RouteModelInput,
  type RoutingPolicyInput,
  type RoutingRisk,
  type RoutingRule,
  type RoutingTier,
} from "@mission-control/model-router";

import type { RoutingPolicyInput } from "@mission-control/model-router";

export function fallbackRoutingPolicy(
  projectDefaultModel?: string
): RoutingPolicyInput {
  return {
    version: 0,
    defaultModelId: projectDefaultModel ?? "operator-default",
    safeFallbackModelId: "operator-powerful",
    fallbackChain: ["operator-powerful", "operator-default", "operator-fast"],
    rules: [],
    killSwitch: false,
  };
}

export function normalizeWorkOrderRisk(
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
) {
  return risk;
}
