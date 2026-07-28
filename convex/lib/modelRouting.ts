/**
 * Convex-bundleable model-routing policy resolver.
 *
 * Keep this pure module local to Convex. The workspace package cannot be
 * resolved by the Convex bundler at deployment time.
 */
export type RoutingTier = "FAST" | "BALANCED" | "POWERFUL";
export type RoutingRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RoutingSource =
  | "RUN_OVERRIDE"
  | "WORKFLOW_TIER"
  | "AGENT_OVERRIDE"
  | "POLICY_RULE"
  | "WORKSPACE_DEFAULT"
  | "SYSTEM_DEFAULT";

export interface CatalogModel {
  modelId: string;
  provider: string;
  displayName: string;
  tier: RoutingTier;
  capabilities: string[];
  supportsTools: boolean;
  riskApproved: boolean;
  availability: "HEALTHY" | "DEGRADED" | "RATE_LIMITED" | "UNAVAILABLE";
  deprecated: boolean;
  estimatedCostPerRunUsd?: number;
}

export interface RoutingRule {
  id: string;
  order: number;
  taskType?: string;
  riskLevel?: RoutingRisk;
  requiredCapabilities?: string[];
  modelId: string;
}

export interface RoutingPolicyInput {
  id?: string;
  version: number;
  defaultModelId?: string;
  safeFallbackModelId?: string;
  fallbackChain: string[];
  rules: RoutingRule[];
  budgetLimitUsd?: number;
  killSwitch: boolean;
}

export interface RouteModelInput {
  taskType?: string;
  riskLevel: RoutingRisk;
  requestedTier?: RoutingTier;
  requiredCapabilities: string[];
  budgetRemainingUsd?: number;
  authorizedRunOverride?: string;
  agentOverrideModelId?: string;
  systemDefaultModelId?: string;
}

export interface ModelRoutingResult {
  status: "SELECTED" | "EXHAUSTED" | "KILLED";
  selectedModelId?: string;
  selectedProvider?: string;
  source: RoutingSource;
  ruleId?: string;
  explanation: string;
  alternativesConsidered: Array<{ modelId: string; eligible: boolean; reason: string }>;
}

function eligibility(
  model: CatalogModel | undefined,
  input: RouteModelInput,
  policy: RoutingPolicyInput,
): { eligible: boolean; reason: string } {
  if (!model) return { eligible: false, reason: "Model is not in the catalog" };
  if (model.deprecated) return { eligible: false, reason: "Model is deprecated" };
  if (model.availability === "UNAVAILABLE" || model.availability === "RATE_LIMITED") {
    return { eligible: false, reason: `Provider is ${model.availability.toLowerCase()}` };
  }
  if ((input.riskLevel === "HIGH" || input.riskLevel === "CRITICAL") && !model.riskApproved) {
    return { eligible: false, reason: "Model is not approved for high-risk work" };
  }
  const missing = input.requiredCapabilities.filter(
    (capability) => capability !== "tools" && !model.capabilities.includes(capability),
  );
  if (input.requiredCapabilities.includes("tools") && !model.supportsTools) missing.push("tools");
  if (missing.length) return { eligible: false, reason: `Missing capabilities: ${missing.join(", ")}` };
  const budget = Math.min(input.budgetRemainingUsd ?? Infinity, policy.budgetLimitUsd ?? Infinity);
  if (model.estimatedCostPerRunUsd !== undefined && model.estimatedCostPerRunUsd > budget) {
    return { eligible: false, reason: `Estimated cost exceeds $${budget.toFixed(2)} limit` };
  }
  return { eligible: true, reason: "Eligible" };
}

export function resolveModelRoute(
  catalog: CatalogModel[],
  policy: RoutingPolicyInput,
  input: RouteModelInput,
): ModelRoutingResult {
  if (policy.killSwitch) {
    return {
      status: "KILLED",
      source: "SYSTEM_DEFAULT",
      explanation: "Routing policy kill switch is enabled; the existing runtime route remains authoritative.",
      alternativesConsidered: [],
    };
  }

  const matchingRule = [...policy.rules]
    .sort((left, right) => left.order - right.order)
    .find((rule) =>
      (!rule.taskType || rule.taskType === input.taskType) &&
      (!rule.riskLevel || rule.riskLevel === input.riskLevel) &&
      (rule.requiredCapabilities ?? []).every((capability) => input.requiredCapabilities.includes(capability)),
    );
  const tierModel = input.requestedTier
    ? catalog.find((model) => model.tier === input.requestedTier && model.availability === "HEALTHY" && !model.deprecated)?.modelId
    : undefined;
  const candidates: Array<{ modelId?: string; source: RoutingSource; ruleId?: string; reason: string }> = [
    { modelId: input.authorizedRunOverride, source: "RUN_OVERRIDE", reason: "Authorized per-run override" },
    { modelId: tierModel, source: "WORKFLOW_TIER", reason: `Workflow requested ${input.requestedTier ?? "no"} tier` },
    { modelId: input.agentOverrideModelId, source: "AGENT_OVERRIDE", reason: "Agent override" },
    { modelId: matchingRule?.modelId, source: "POLICY_RULE", ruleId: matchingRule?.id, reason: matchingRule ? `Matched policy rule ${matchingRule.id}` : "No matching policy rule" },
    { modelId: policy.defaultModelId, source: "WORKSPACE_DEFAULT", reason: "Workspace default" },
    { modelId: input.systemDefaultModelId, source: "SYSTEM_DEFAULT", reason: "System safe default" },
    ...policy.fallbackChain.map((modelId) => ({ modelId, source: "WORKSPACE_DEFAULT" as const, reason: "Workspace fallback chain" })),
    { modelId: policy.safeFallbackModelId, source: "WORKSPACE_DEFAULT", reason: "Workspace safe fallback" },
  ];

  const models = new Map(catalog.map((model) => [model.modelId, model]));
  const alternativesConsidered: ModelRoutingResult["alternativesConsidered"] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate.modelId || seen.has(candidate.modelId)) continue;
    seen.add(candidate.modelId);
    const model = models.get(candidate.modelId);
    const result = eligibility(model, input, policy);
    alternativesConsidered.push({ modelId: candidate.modelId, ...result });
    if (result.eligible && model) {
      return {
        status: "SELECTED",
        selectedModelId: model.modelId,
        selectedProvider: model.provider,
        source: candidate.source,
        ruleId: candidate.ruleId,
        explanation: `${candidate.reason}; selected ${model.displayName}.`,
        alternativesConsidered,
      };
    }
  }
  return {
    status: "EXHAUSTED",
    source: "SYSTEM_DEFAULT",
    explanation: "No catalog model satisfies the risk, capability, availability, and budget requirements.",
    alternativesConsidered,
  };
}

export function fallbackRoutingPolicy(projectDefaultModel?: string): RoutingPolicyInput {
  return {
    version: 0,
    defaultModelId: projectDefaultModel ?? "operator-default",
    safeFallbackModelId: "operator-powerful",
    fallbackChain: ["operator-powerful", "operator-default", "operator-fast"],
    rules: [],
    killSwitch: false,
  };
}

export function normalizeWorkOrderRisk(risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") {
  return risk;
}
