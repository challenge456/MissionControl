import { describe, expect, it } from "vitest";
import {
  isValidRepositorySlug,
  validateHostBinding,
} from "../lib/workspaceBindings";

describe("workspace repository bindings", () => {
  it("accepts canonical owner/repository slugs", () => {
    expect(isValidRepositorySlug("jaydubya818/MissionControl")).toBe(true);
    expect(isValidRepositorySlug("owner/repo.with-dashes")).toBe(true);
    expect(isValidRepositorySlug("missing-owner")).toBe(false);
    expect(isValidRepositorySlug("owner/repo/extra")).toBe(false);
  });

  it("rejects checkout reports for the wrong repository", () => {
    expect(
      validateHostBinding({
        expectedRepository: "owner/right",
        repository: "owner/wrong",
        hostId: "executor-1",
        checkoutRoot: "/workspace/right",
      })
    ).toBe("Checkout repository does not match the workspace repository");
  });

  it("requires a host and checkout root", () => {
    expect(
      validateHostBinding({
        expectedRepository: "owner/repo",
        repository: "owner/repo",
        hostId: "",
        checkoutRoot: "/workspace/repo",
      })
    ).toBe("Host ID is required");
    expect(
      validateHostBinding({
        expectedRepository: "owner/repo",
        repository: "owner/repo",
        hostId: "executor-1",
        checkoutRoot: "",
      })
    ).toBe("Checkout root is required");
  });
});
