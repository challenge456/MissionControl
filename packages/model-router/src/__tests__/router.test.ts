import { describe, expect, it } from "vitest";
import { CostEstimator } from "../cost-estimator";
import { ModelRouter } from "../router";
import type { ModelConfig } from "../types";
import { resolveModelRoute } from "../policy";

const STANDARD_MODEL: ModelConfig = {
  id: "standard-test",
  provider: "anthropic",
  tier: "standard",
  displayName: "Standard test model",
  maxTokens: 4_000,
  inputCostPer1k: 0.003,
  outputCostPer1k: 0.015,
  contextWindow: 100_000,
  supportsVision: false,
  supportsTools: true,
};

describe("CostEstimator", () => {
  it("estimates tokens and request cost deterministically", () => {
    const estimator = new CostEstimator();

    expect(estimator.estimateTokens("12345")).toBe(2);
    expect(estimator.estimateCost(STANDARD_MODEL, 1_000, 500)).toBeCloseTo(0.0105);
  });

  it("reports whether an estimated request fits its budget", () => {
    const estimator = new CostEstimator();
    const result = estimator.isWithinBudget(STANDARD_MODEL, 1_000, 500, 0.02);

    expect(result).toMatchObject({
      withinBudget: true,
      budgetLimit: 0.02,
    });
    expect(result.estimatedCost).toBeCloseTo(0.0105);
  });
});

describe("ModelRouter", () => {
  it("uses task overrides and tier routing without provider calls", () => {
    const router = new ModelRouter();

    expect(router.selectModel({ messages: [], taskType: "ENGINEERING" })).toBe(
      "claude-sonnet-4-20250514"
    );
    expect(router.selectModel({ messages: [], taskType: "DOCS" })).toBe(
      "claude-3-haiku-20240307"
    );
    expect(router.selectModel({ messages: [], preferredTier: "fast" })).toBe(
      "claude-3-haiku-20240307"
    );
  });

  it("downgrades to the fast tier when the requested budget is too small", () => {
    const router = new ModelRouter();

    expect(
      router.selectModel({
        messages: [{ role: "user", content: "x".repeat(8_000) }],
        preferredTier: "standard",
        maxTokens: 4_000,
        budgetLimit: 0.001,
      })
    ).toBe("claude-3-haiku-20240307");
  });

  it("routes RED risk to an initialized flagship provider", () => {
    const router = new ModelRouter();
    router.initialize({ openaiApiKey: "test-key" });

    expect(router.selectModel({ messages: [], riskLevel: "RED" })).toBe("gpt-4o");
  });
});

describe("resolveModelRoute", () => {
  const catalog = [
    {
      modelId: "fast",
      provider: "test",
      displayName: "Fast",
      tier: "FAST" as const,
      capabilities: ["text"],
      supportsTools: false,
      riskApproved: false,
      availability: "HEALTHY" as const,
      deprecated: false,
      estimatedCostPerRunUsd: 0.02,
    },
    {
      modelId: "safe",
      provider: "test",
      displayName: "Safe",
      tier: "POWERFUL" as const,
      capabilities: ["text", "code"],
      supportsTools: true,
      riskApproved: true,
      availability: "HEALTHY" as const,
      deprecated: false,
      estimatedCostPerRunUsd: 0.2,
    },
  ];
  const policy = {
    version: 3,
    defaultModelId: "fast",
    safeFallbackModelId: "safe",
    fallbackChain: ["safe"],
    rules: [],
    killSwitch: false,
  };

  it("uses the safe fallback instead of an unsafe downgrade", () => {
    const result = resolveModelRoute(catalog, policy, {
      riskLevel: "HIGH",
      requiredCapabilities: ["tools"],
    });
    expect(result).toMatchObject({
      status: "SELECTED",
      selectedModelId: "safe",
    });
  });

  it("uses a matching complexity policy before a workflow tier", () => {
    const result = resolveModelRoute(catalog, {
      ...policy,
      rules: [{ id: "small-low-risk", order: 0, complexity: "SMALL", riskLevel: "LOW", modelId: "safe" }],
    }, {
      riskLevel: "LOW",
      complexity: "SMALL",
      requestedTier: "FAST",
      requiredCapabilities: [],
    });
    expect(result).toMatchObject({
      selectedModelId: "safe",
      source: "POLICY_RULE",
      ruleId: "small-low-risk",
    });
  });

  it("uses workflow tier before an agent override when policy has no match", () => {
    const result = resolveModelRoute(catalog, policy, {
      riskLevel: "LOW",
      requestedTier: "FAST",
      requiredCapabilities: [],
      agentOverrideModelId: "safe",
    });
    expect(result).toMatchObject({
      selectedModelId: "fast",
      source: "WORKFLOW_TIER",
    });
  });

  it("reports exhausted routes instead of choosing an unsafe model", () => {
    const result = resolveModelRoute(catalog, policy, {
      riskLevel: "CRITICAL",
      requiredCapabilities: ["vision"],
    });
    expect(result.status).toBe("EXHAUSTED");
  });

  it("selects a policy-approved local model for low-risk work", () => {
    const localCatalog = [
      ...catalog,
      {
        modelId: "local:ollama:qwen3",
        provider: "local:ollama",
        displayName: "Local Qwen",
        tier: "FAST" as const,
        capabilities: ["local", "text", "code"],
        supportsTools: true,
        riskApproved: false,
        availability: "HEALTHY" as const,
        deprecated: false,
        estimatedCostPerRunUsd: 0,
      },
    ];
    const result = resolveModelRoute(localCatalog, {
      ...policy,
      rules: [{ id: "local-low-risk", order: 0, complexity: "SMALL", riskLevel: "LOW", modelId: "local:ollama:qwen3" }],
    }, {
      riskLevel: "LOW",
      complexity: "SMALL",
      requiredCapabilities: ["tools"],
    });
    expect(result).toMatchObject({
      status: "SELECTED",
      selectedModelId: "local:ollama:qwen3",
      selectedProvider: "local:ollama",
      source: "POLICY_RULE",
    });
  });

  it("uses a cheaper approved reviewer for a straightforward review", () => {
    const result = resolveModelRoute(catalog, {
      ...policy,
      lanePools: [{ lane: "REVIEW", modelIds: ["safe", "fast"] }],
    }, {
      operatingLane: "REVIEW",
      riskLevel: "LOW",
      complexity: "SMALL",
      requestedTier: "POWERFUL",
      requiredCapabilities: ["text"],
    });
    expect(result).toMatchObject({
      selectedModelId: "fast",
      source: "LANE_POOL",
    });
    expect(result.explanation).toContain("FAST quality floor");
  });

  it("escalates consequential reviews to an approved powerful model", () => {
    const result = resolveModelRoute(catalog, {
      ...policy,
      lanePools: [{ lane: "REVIEW", modelIds: ["fast", "safe"] }],
    }, {
      operatingLane: "REVIEW",
      riskLevel: "HIGH",
      complexity: "SMALL",
      requiredCapabilities: ["tools"],
    });
    expect(result).toMatchObject({
      selectedModelId: "safe",
      source: "LANE_POOL",
    });
    expect(result.explanation).toContain("POWERFUL quality floor");
  });

  it("does not apply a local-lane rule to review work", () => {
    const result = resolveModelRoute(catalog, {
      ...policy,
      rules: [{ id: "local-small", order: 0, operatingLane: "LOCAL", riskLevel: "LOW", complexity: "SMALL", modelId: "fast" }],
      lanePools: [{ lane: "REVIEW", modelIds: ["safe"] }],
    }, {
      operatingLane: "REVIEW",
      riskLevel: "LOW",
      complexity: "SMALL",
      requiredCapabilities: ["text"],
    });
    expect(result).toMatchObject({ selectedModelId: "safe", source: "LANE_POOL" });
  });

  it("keeps new lane models out of normal traffic until their canary cohort", () => {
    const canaryPolicy = {
      ...policy,
      lanePools: [{ lane: "REVIEW" as const, modelIds: ["fast", "safe"], canaryModelIds: ["fast"] }],
    };
    const normal = resolveModelRoute(catalog, canaryPolicy, {
      operatingLane: "REVIEW",
      riskLevel: "LOW",
      complexity: "SMALL",
      requiredCapabilities: ["text"],
      allowCanary: false,
    });
    const canary = resolveModelRoute(catalog, canaryPolicy, {
      operatingLane: "REVIEW",
      riskLevel: "LOW",
      complexity: "SMALL",
      requiredCapabilities: ["text"],
      allowCanary: true,
    });
    expect(normal.selectedModelId).toBe("safe");
    expect(canary.selectedModelId).toBe("fast");
  });

  it("rejects lane candidates when the lane spend envelope is exhausted", () => {
    const result = resolveModelRoute(catalog, {
      ...policy,
      defaultModelId: undefined,
      safeFallbackModelId: undefined,
      fallbackChain: [],
      lanePools: [{ lane: "REVIEW", modelIds: ["fast", "safe"] }],
    }, {
      operatingLane: "REVIEW",
      riskLevel: "LOW",
      complexity: "SMALL",
      requiredCapabilities: ["text"],
      laneBudgetRemainingUsd: 0,
    });
    expect(result.status).toBe("EXHAUSTED");
    expect(result.alternativesConsidered[0]?.reason).toContain("Estimated cost exceeds");
  });
});
