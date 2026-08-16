import { describe, expect, it } from "vitest";
import {
  canPromoteImprovement,
  parseFactorySurface,
  visibleFactorySurfaces,
} from "./factoryLearningModel";

describe("Factory Learning progressive disclosure", () => {
  it("keeps the basic view focused on overview and reviewable improvements", () => {
    expect(visibleFactorySurfaces("basic").map((surface) => surface.id)).toEqual([
      "overview",
      "improvements",
    ]);
    expect(parseFactorySurface("agent-setup", "basic")).toBe("overview");
  });

  it("adds evidence and experiments at intermediate level", () => {
    expect(visibleFactorySurfaces("intermediate").map((surface) => surface.id)).toEqual([
      "overview",
      "improvements",
      "signals",
      "experiments",
    ]);
  });

  it("reserves configuration registry detail for advanced level", () => {
    expect(parseFactorySurface("agent-setup", "advanced")).toBe("agent-setup");
  });
});

describe("Factory Learning governance", () => {
  it("requires accepted review and completed experiment before promotion", () => {
    expect(canPromoteImprovement({ candidateStatus: "OPEN", experimentStatus: "COMPLETED" })).toBe(false);
    expect(canPromoteImprovement({ candidateStatus: "ACCEPTED", experimentStatus: "DRAFT" })).toBe(false);
    expect(canPromoteImprovement({ candidateStatus: "ACCEPTED", experimentStatus: "COMPLETED" })).toBe(true);
  });
});
