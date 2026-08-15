import { describe, expect, it } from "vitest";
import { buildAcceptanceEligibility, workOrderRequiresFactoryReviewPackage } from "../lib/factoryReviewReadModel";

const completedFactoryAttempt = {
  status: "COMPLETED",
  factoryDefinitionVersionId: "factory-version-1",
  executionManifestDigest: "sha256:manifest",
  executorAdapter: "codex",
};

describe("Factory WorkOrder acceptance eligibility", () => {
  it("blocks a governance-complete candidate when exact PR lineage is mismatched", () => {
    const eligibility = buildAcceptanceEligibility({
      governanceAcceptance: { eligible: true, blockingReasons: [] },
      latestRun: completedFactoryAttempt,
      reviewPackage: {
        status: "BLOCKED",
        blockers: ["Exact-head GitHub CI evidence is bound to another candidate SHA."],
      },
    });

    expect(eligibility).toEqual({
      eligible: false,
      requiresReviewPackage: true,
      reviewPackageStatus: "BLOCKED",
      blockingReasons: ["Exact-head GitHub CI evidence is bound to another candidate SHA."],
    });
  });

  it("allows the corrected retry only after its own review package is ready", () => {
    const historicalFailure = buildAcceptanceEligibility({
      governanceAcceptance: { eligible: false, blockingReasons: ["Historical verification failed."] },
      latestRun: { ...completedFactoryAttempt, status: "FAILED" },
      reviewPackage: { status: "BLOCKED", blockers: ["Attempt is failed."] },
    });
    const correctedRetry = buildAcceptanceEligibility({
      governanceAcceptance: { eligible: true, blockingReasons: [] },
      latestRun: { ...completedFactoryAttempt, retryOfWorkflowRunId: "attempt-1" },
      reviewPackage: { status: "READY", blockers: [] },
    });

    expect(historicalFailure.eligible).toBe(false);
    expect(correctedRetry).toMatchObject({
      eligible: true,
      requiresReviewPackage: true,
      reviewPackageStatus: "READY",
    });
  });

  it("preserves legacy acceptance behavior when no Factory Attempt is bound", () => {
    expect(buildAcceptanceEligibility({
      governanceAcceptance: { eligible: true, blockingReasons: [] },
      latestRun: { status: "COMPLETED" },
      reviewPackage: null,
    })).toMatchObject({ eligible: true, requiresReviewPackage: false, reviewPackageStatus: "NOT_REQUIRED" });
  });

  it("does not make repository linkage alone a Factory acceptance gate", () => {
    expect(workOrderRequiresFactoryReviewPackage({ repositoryId: "repository-1" }, { status: "COMPLETED" })).toBe(false);
    expect(workOrderRequiresFactoryReviewPackage({
      repositoryId: "repository-1",
      metadata: { implementationPolicy: { maxAttempts: 2 } },
    }, null)).toBe(true);
  });

  it("explains that a Mission WorkOrder still needs a Factory review package before dispatch", () => {
    expect(buildAcceptanceEligibility({
      governanceAcceptance: { eligible: false, blockingReasons: ["Missing criterion evidence."] },
      latestRun: null,
      factoryRequired: true,
      reviewPackage: null,
    })).toEqual({
      eligible: false,
      requiresReviewPackage: true,
      reviewPackageStatus: "INCOMPLETE",
      blockingReasons: ["Missing criterion evidence.", "Factory review package is unavailable."],
    });
  });
});
