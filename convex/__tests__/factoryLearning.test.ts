import { describe, expect, it } from "vitest";
import {
  aggregateLearningSignals,
  buildImprovementCandidate,
  learningClusterKey,
  normalizeLearningSignature,
  recommendImprovementPromotion,
  type LearningSignalInput,
} from "../lib/factoryLearning";
import { getDashboard, refresh } from "../factory/learning";

function functionHandler<T extends (...args: any[]) => any>(registered: unknown): T {
  return (registered as { _handler: T })._handler;
}

function signal(
  overrides: Partial<LearningSignalInput> = {},
): LearningSignalInput {
  return {
    projectId: "workspace-a",
    repositoryKey: "sellerfi/marketplace",
    signalType: "HUMAN_CORRECTION",
    deterministicKey: "typescript:typecheck",
    evidenceFingerprint: "evidence-1",
    evidenceRefs: ["trace:trace-1"],
    observedAt: Date.UTC(2026, 7, 16),
    confidence: 0.9,
    severity: "MEDIUM",
    reason: "TypeScript typecheck was requested after the build completed.",
    acceptanceAuthority: false,
    ...overrides,
  };
}

describe("Factory Learning deterministic domain", () => {
  it("fails dashboard reads and refresh writes closed for anonymous callers", async () => {
    const originalDemoFlag = process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    try {
      const project = { _id: "project-1", tenantId: "tenant-1", githubRepo: "sellerfi/marketplace" };
      const ctx = {
        db: { get: async (id: string) => id === project._id ? project : null },
        auth: { getUserIdentity: async () => null },
      } as any;
      await expect(functionHandler(getDashboard)(ctx, { projectId: project._id })).rejects.toThrow(/unavailable or unauthorized/);
      await expect(functionHandler(refresh)(ctx, { projectId: project._id })).rejects.toThrow(/unavailable or unauthorized/);
    } finally {
      if (originalDemoFlag === undefined) delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
      else process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT = originalDemoFlag;
    }
  });

  it("normalizes volatile error details into a stable recurring identity", () => {
    expect(
      normalizeLearningSignature(
        "TS2322 at src/cart.ts:184 — commit 9efbd401c2f8 and run 182731",
      ),
    ).toBe(
      normalizeLearningSignature(
        "TS2322 at src/cart.ts:291 — commit d0e5ff2ff57d and run 182799",
      ),
    );
  });

  it("turns three identical correction signals into one cluster and one candidate", () => {
    const signals = [
      signal(),
      signal({ evidenceFingerprint: "evidence-2", evidenceRefs: ["trace:trace-2"] }),
      signal({ evidenceFingerprint: "evidence-3", evidenceRefs: ["trace:trace-3"] }),
    ];

    const result = aggregateLearningSignals(signals, {
      minimumOccurrences: 3,
      maximumEvidenceItems: 20,
      windowStart: Date.UTC(2026, 7, 1),
    });

    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0]).toMatchObject({
      occurrenceCount: 3,
      evidenceCount: 3,
      qualifiesForCandidate: true,
      acceptanceAuthority: false,
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      candidateType: "ADD_DETERMINISTIC_GATE",
      risk: "MEDIUM",
      acceptanceAuthority: false,
    });
  });

  it("suppresses duplicate evidence and cannot create infinite candidates", () => {
    const duplicate = signal();
    const result = aggregateLearningSignals(
      [duplicate, duplicate, duplicate, duplicate],
      { minimumOccurrences: 3, maximumEvidenceItems: 20, windowStart: 0 },
    );

    expect(result.clusters[0]).toMatchObject({
      occurrenceCount: 1,
      evidenceCount: 1,
      qualifiesForCandidate: false,
    });
    expect(result.duplicatesSuppressed).toBe(3);
    expect(result.candidates).toHaveLength(0);
  });

  it("never clusters signals across workspace or repository scope", () => {
    const result = aggregateLearningSignals(
      [
        signal(),
        signal({ evidenceFingerprint: "evidence-2", repositoryKey: "sellerfi/api" }),
        signal({ evidenceFingerprint: "evidence-3", projectId: "workspace-b" }),
      ],
      { minimumOccurrences: 1, maximumEvidenceItems: 20, windowStart: 0 },
    );

    expect(result.clusters).toHaveLength(3);
    expect(new Set(result.clusters.map((cluster) => cluster.clusterKey)).size).toBe(3);
    expect(learningClusterKey(signal())).not.toBe(
      learningClusterKey(signal({ repositoryKey: "sellerfi/api" })),
    );
  });

  it("maps deterministic work, context misses, and routing mismatches to bounded candidates", () => {
    const automation = buildImprovementCandidate({
      ...aggregateLearningSignals(
        [signal({ signalType: "UNNECESSARY_AGENT_USAGE", deterministicKey: "tool:format" })],
        { minimumOccurrences: 1, maximumEvidenceItems: 20, windowStart: 0 },
      ).clusters[0],
    });
    const context = buildImprovementCandidate({
      ...aggregateLearningSignals(
        [signal({ signalType: "CONTEXT_MISS", deterministicKey: "source:adr-004" })],
        { minimumOccurrences: 1, maximumEvidenceItems: 20, windowStart: 0 },
      ).clusters[0],
    });
    const routing = buildImprovementCandidate({
      ...aggregateLearningSignals(
        [signal({ signalType: "MODEL_ROUTING_MISMATCH", deterministicKey: "planner:economy" })],
        { minimumOccurrences: 1, maximumEvidenceItems: 20, windowStart: 0 },
      ).clusters[0],
    });

    expect(automation).toMatchObject({
      candidateType: "ADD_DETERMINISTIC_GATE",
      observedCostImpact: undefined,
    });
    expect(context.candidateType).toBe("UPDATE_CONTEXT_POLICY");
    expect(routing).toMatchObject({
      candidateType: "CHANGE_MODEL_ROUTING",
      risk: "HIGH",
    });
  });

  it("compares baseline and candidate without claiming significance or auto-promoting", () => {
    const lowSample = recommendImprovementPromotion({
      baseline: {
        sampleSize: 4,
        successRate: 0.5,
        firstPassVerificationRate: 0.5,
        averageRetries: 1.5,
        humanInterventionRate: 0.5,
        averageDurationMs: 12_000,
        averageTokens: 1_200,
        averageCostUsd: 3,
        deterministicFailures: 2,
      },
      candidate: {
        sampleSize: 4,
        successRate: 0.75,
        firstPassVerificationRate: 0.75,
        averageRetries: 0.5,
        humanInterventionRate: 0.25,
        averageDurationMs: 9_000,
        averageTokens: 900,
        averageCostUsd: 2,
        deterministicFailures: 1,
      },
    });

    expect(lowSample).toMatchObject({
      recommendation: "PROMOTION_RECOMMENDED",
      sampleLabel: "LOW_SAMPLE",
      statisticallySignificant: false,
      autoPromote: false,
    });

    const regression = recommendImprovementPromotion({
      baseline: { sampleSize: 40, successRate: 0.9, deterministicFailures: 1 },
      candidate: { sampleSize: 40, successRate: 0.8, deterministicFailures: 3 },
    });
    expect(regression.recommendation).toBe("REJECT_RECOMMENDED");
    expect(regression.autoPromote).toBe(false);
  });
});
