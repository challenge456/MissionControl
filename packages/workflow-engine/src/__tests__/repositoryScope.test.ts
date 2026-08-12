import { describe, expect, it } from "vitest";
import { matchesRepositoryGlob, validateChangedFileScope } from "../repositoryScope.js";

describe("repository scope enforcement", () => {
  it("accepts files included by an approved scope", () => {
    expect(validateChangedFileScope(
      ["apps/mission-control-ui/src/App.tsx", "docs/golden-path.md"],
      [
        { includePaths: ["apps/mission-control-ui/src/**"], excludePaths: ["apps/mission-control-ui/src/**/__tests__/**"] },
        { includePaths: ["docs/**"] },
      ]
    )).toEqual([]);
  });

  it("blocks excluded, off-scope, and unsafe paths", () => {
    expect(validateChangedFileScope(
      ["apps/ui/src/__tests__/unsafe.test.ts", "convex/schema.ts", "../secret"],
      [{ includePaths: ["apps/ui/**"], excludePaths: ["apps/ui/src/**/__tests__/**"] }]
    )).toEqual([
      { path: "../secret", reason: "INVALID_PATH" },
      { path: "apps/ui/src/__tests__/unsafe.test.ts", reason: "EXCLUDED_BY_SCOPE" },
      { path: "convex/schema.ts", reason: "OUTSIDE_APPROVED_SCOPE" },
    ]);
  });

  it("supports directory boundaries and globstar patterns", () => {
    expect(matchesRepositoryGlob("packages/workflow-engine/src/index.ts", "packages/workflow-engine/**")).toBe(true);
    expect(matchesRepositoryGlob("packages/workflow-engine/src/index.ts", "packages/workflow-engine")).toBe(true);
    expect(matchesRepositoryGlob("packages/other/src/index.ts", "packages/workflow-engine/**")).toBe(false);
  });
});
