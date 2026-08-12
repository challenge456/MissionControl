import { describe, expect, it } from "vitest";
import { resolveApprovedVerificationCommands } from "../lib/executionPolicy";

describe("execution policy", () => {
  it("uses explicit implementation commands before broader policy", () => {
    expect(resolveApprovedVerificationCommands({
      implementationPolicy: { allowedCommands: ["pnpm test"] },
      policyRules: { allowedCommands: ["pnpm lint"] },
      constraints: ["Verification command: git diff --check"],
    })).toEqual(["pnpm test"]);
  });

  it("projects explicitly labeled WorkOrder verification commands", () => {
    expect(resolveApprovedVerificationCommands({
      constraints: [
        "Run git diff --check and do not merge the pull request.",
        "Verification command: git diff --check",
      ],
    })).toEqual(["git diff --check"]);
  });

  it("does not execute unlabeled prose from WorkOrder constraints", () => {
    expect(resolveApprovedVerificationCommands({
      constraints: ["Run arbitrary-tool --fix before publishing."],
    })).toEqual([]);
  });
});
