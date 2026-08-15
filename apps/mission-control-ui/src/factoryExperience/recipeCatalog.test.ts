import { describe, expect, it, vi } from "vitest";
import {
  factoryExperienceMetadata,
  recommendFactoryRecipe,
  recipeIdFromTrace,
  resolveRecipeWorkflow,
} from "./recipeCatalog";

describe("Factory recipe catalog", () => {
  it.each([
    [
      "Investigate why checkout tests are flaky and report findings only",
      "scout",
    ],
    ["Write an implementation plan for the onboarding change", "plan"],
    ["Run lint, typecheck, and tests", "quality"],
    ["Fix a tiny typo and run the tests", "build-test"],
    ["Update the README installation section", "build"],
    ["Change the authorization policy for production acceptance", "full-sdlc"],
    ["Implement a new buyer confidence panel", "plan-build-test"],
  ])("recommends a sufficient governed recipe for %s", (request, recipeId) => {
    expect(recommendFactoryRecipe(request)?.recipeId).toBe(recipeId);
  });

  it("returns no recommendation for an empty or meaningless request", () => {
    expect(recommendFactoryRecipe("fix")).toBeNull();
  });

  it("resolves a recipe to an existing canonical workflow without creating another engine", () => {
    const workflows = [
      { workflowId: "quality-audit", name: "Quality Audit" },
      { workflowId: "feature-dev", name: "Feature Development" },
    ];
    expect(resolveRecipeWorkflow("plan-build-test", workflows)).toEqual(
      workflows[1],
    );
    expect(resolveRecipeWorkflow("quality", workflows)).toEqual(workflows[0]);
    expect(resolveRecipeWorkflow("scout", workflows)).toBeUndefined();
  });

  it("retains recommendation and override provenance on Mission metadata", () => {
    vi.spyOn(Date, "now").mockReturnValue(1234);
    const recommendation = recommendFactoryRecipe(
      "Implement a new buyer confidence panel",
    )!;
    const metadata = factoryExperienceMetadata({
      level: "basic",
      recommendation,
      selectedRecipeId: "full-sdlc",
      repositoryIntent: "jaydubya818/MissionControl",
    });
    expect(metadata).toMatchObject({
      recommendedRecipeId: "plan-build-test",
      selectedRecipeId: "full-sdlc",
      operatorOverrodeRecommendation: true,
      uiModeAtCreation: "basic",
      repositoryIntent: "jaydubya818/MissionControl",
      requestedAt: 1234,
    });
    vi.restoreAllMocks();
  });

  it("reads a recipe projection without treating it as trace authority", () => {
    expect(recipeIdFromTrace({ tags: ["recipe:build-test"] })).toBe(
      "build-test",
    );
    expect(
      recipeIdFromTrace({
        metadata: { factoryExperience: { selectedRecipeId: "scout" } },
      }),
    ).toBe("scout");
    expect(recipeIdFromTrace({ tags: ["recipe:unknown"] })).toBeUndefined();
  });
});
