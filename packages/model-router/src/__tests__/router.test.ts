import { describe, expect, it } from "vitest";
import { CostEstimator } from "../cost-estimator";
import { ModelRouter } from "../router";
import type { ModelConfig } from "../types";

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
