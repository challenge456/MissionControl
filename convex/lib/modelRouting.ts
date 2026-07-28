export {
  resolveModelRoute,
  type CatalogModel,
  type ModelRoutingResult,
  type RouteModelInput,
  type RoutingPolicyInput,
  type RoutingRisk,
  type RoutingRule,
  type RoutingTier,
} from "../../packages/model-router/src/policy";

import type { RoutingPolicyInput } from "../../packages/model-router/src/policy";

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
