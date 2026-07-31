import { describe, expect, it } from "vitest";
import {
  canonicalRepositoryKey,
  findOverlappingScopes,
  normalizeCodePath,
  normalizeCodePaths,
  repositoryDisplayName,
  validateCodeScopeInput,
  validateRepositoryInput,
} from "../lib/workspaceRepositories";

describe("workspace repository contracts", () => {
  it("normalizes repository identity without changing its display name", () => {
    expect(canonicalRepositoryKey(" SellerFi/Marketplace ")).toBe("sellerfi/marketplace");
    expect(repositoryDisplayName("SellerFi/Marketplace")).toBe("Marketplace");
  });

  it("validates repository and default branch input", () => {
    expect(validateRepositoryInput({ repository: "SellerFi/Marketplace", defaultBranch: "main" })).toBeNull();
    expect(validateRepositoryInput({ repository: "Marketplace", defaultBranch: "main" })).toBe(
      "Use the repository format owner/repository."
    );
    expect(validateRepositoryInput({ repository: "SellerFi/Marketplace", defaultBranch: "" })).toBe(
      "Default branch is required."
    );
  });

  it("normalizes repository-relative code paths", () => {
    expect(normalizeCodePath("./apps\\buyer-portal/")).toBe("apps/buyer-portal");
    expect(normalizeCodePaths(["apps/api", "./apps/api/", "packages/shared"])).toEqual([
      "apps/api",
      "packages/shared",
    ]);
    expect(normalizeCodePath("../secrets")).toBe("");
  });

  it("requires valid, bounded code scopes", () => {
    expect(
      validateCodeScopeInput({
        name: "Buyer portal",
        slug: "buyer-portal",
        includePaths: ["apps/buyer-portal"],
        excludePaths: ["apps/buyer-portal/generated"],
      })
    ).toBeNull();
    expect(
      validateCodeScopeInput({
        name: "Buyer portal",
        slug: "Buyer Portal",
        includePaths: ["apps/buyer-portal"],
        excludePaths: [],
      })
    ).toContain("slug");
    expect(
      validateCodeScopeInput({
        name: "Buyer portal",
        slug: "buyer-portal",
        includePaths: ["../buyer-portal"],
        excludePaths: [],
      })
    ).toContain("include path");
  });

  it("reports exact and nested scope overlaps", () => {
    expect(
      findOverlappingScopes(["apps/buyer-portal/checkout"], [
        { name: "Buyer portal", includePaths: ["apps/buyer-portal"] },
        { name: "Seller portal", includePaths: ["apps/seller-portal"] },
      ])
    ).toEqual(["Buyer portal"]);
  });
});
