import { describe, expect, it } from "vitest";
import { aggregateOperatorEval, defaultFleetOperatorScenarios, scoreScenarioStructure } from "../lib/operatorEvals";

describe("operator persona evaluation", () => {
  it("seeds eight grounded operator scenarios with all durability variants", () => {
    const scenarios = defaultFleetOperatorScenarios();
    expect(scenarios).toHaveLength(8);
    for (const scenario of scenarios) {
      expect(new Set(scenario.variants.map((variant) => variant.kind))).toEqual(
        new Set(["REORDER", "REWORD", "MISSING_EVIDENCE", "ADVERSARIAL"])
      );
      expect(scenario.rubric.prohibitedAssumptions.length).toBeGreaterThan(0);
    }
  });

  it("labels structural proxy results and scores complete contracts", () => {
    const scenario = defaultFleetOperatorScenarios()[0];
    const result = scoreScenarioStructure("scenario-1", scenario);
    expect(result.notes).toContain("Structural proxy");
    expect(result.scores.grounding).toBe(100);
    expect(result.variantAgreementPct).toBe(100);
  });

  it("aggregates dimensions without hiding unsupported assumptions", () => {
    const scenario = defaultFleetOperatorScenarios()[0];
    const first = scoreScenarioStructure("scenario-1", scenario);
    const second = { ...first, scenarioId: "scenario-2", unsupportedAssumptions: ["Invented policy"], scores: { ...first.scores, authority: 50 } };
    const aggregate = aggregateOperatorEval([first, second]);
    expect(aggregate.dimensionScores.authority).toBe(75);
    expect(aggregate.unsupportedAssumptionCount).toBe(1);
    expect(aggregate.completedScenarios).toBe(2);
  });
});
