import { describe, expect, it } from "vitest";
import {
  evidenceVerificationIssues,
  manualRunEligibilityIssues,
  manualRunStartDecision,
  retryDelayMs,
  stableStringify,
} from "../lib/researchIngestionPolicy";

const eligibleSource = {
  state: "ACTIVE",
  kind: "RSS_ATOM",
  validationStatus: "PASSED",
  policyReviewState: "APPROVED",
  canonicalUrl: "https://example.com/feed.xml",
  maxItemsPerRun: 20,
  retentionDays: 90,
  adapter: { name: "web-rss", authenticationMode: "NONE" },
};

describe("research ingestion policy", () => {
  it("requires the complete active Web/RSS authority envelope", () => {
    expect(manualRunEligibilityIssues(eligibleSource)).toEqual([]);
    expect(manualRunEligibilityIssues({
      ...eligibleSource,
      state: "PAUSED",
      kind: "WEBSITE",
      policyReviewState: "REVIEW_REQUIRED",
      canonicalUrl: "http://127.0.0.1/feed",
      maxItemsPerRun: 0,
      retentionDays: 0,
      adapter: { name: "web-html", authenticationMode: "API_KEY" },
    })).toEqual(expect.arrayContaining([
      "Source authority must be active.",
      "Manual collection currently supports RSS or Atom sources only.",
      "Source policy approval is required before collection.",
      "An exact canonical HTTPS source URL is required.",
      "Source item cap must be between 1 and 100.",
      "Source retention must be between 1 and 3,650 days.",
      "Source must use the approved credential-free Web/RSS adapter policy.",
    ]));
  });

  it("makes replay, collision, stale recovery, and exhaustion explicit", () => {
    const now = 1_000;
    expect(manualRunStartDecision(null, now)).toBe("START");
    expect(manualRunStartDecision({ status: "VERIFIED", attemptCount: 1 }, now)).toBe("REPLAY");
    expect(manualRunStartDecision({ status: "AWAITING_VERIFICATION", attemptCount: 1 }, now)).toBe("REPLAY");
    expect(manualRunStartDecision({ status: "RUNNING", attemptCount: 1, lease: { expiresAt: 2_000 } }, now)).toBe("IN_PROGRESS");
    expect(manualRunStartDecision({ status: "RUNNING", attemptCount: 1, lease: { expiresAt: 999 } }, now)).toBe("RETRY");
    expect(manualRunStartDecision({ status: "FAILED", retryable: true, attemptCount: 1, nextRetryAt: 1_001 }, now)).toBe("BACKOFF");
    expect(manualRunStartDecision({ status: "FAILED", retryable: true, attemptCount: 2 }, now)).toBe("RETRY");
    expect(manualRunStartDecision({ status: "FAILED", retryable: true, attemptCount: 3 }, now)).toBe("EXHAUSTED");
    expect(manualRunStartDecision({ status: "FAILED", retryable: false, attemptCount: 1 }, now)).toBe("EXHAUSTED");
  });

  it("bounds exponential and provider-directed retry delays", () => {
    expect(retryDelayMs(1)).toBe(30_000);
    expect(retryDelayMs(2)).toBe(60_000);
    expect(retryDelayMs(2, 120_000)).toBe(120_000);
    expect(retryDelayMs(99, 999_999_999)).toBe(86_400_000);
  });

  it("produces a stable evidence serialization independent of object key order", () => {
    expect(stableStringify({ z: 1, a: { y: 2, x: 3 }, omitted: undefined }))
      .toBe(stableStringify({ a: { x: 3, y: 2 }, z: 1 }));
  });

  it("fails verification on digest, count, or lineage mismatch", () => {
    const valid = {
      artifactHash: "hash",
      recomputedHash: "hash",
      artifactWorkflowRunId: "workflow-1",
      workflowRunId: "workflow-1",
      artifactProjectId: "project-1",
      projectId: "project-1",
      observations: [{
        runArtifactId: "artifact-1",
        workflowRunId: "workflow-1",
        sourceId: "source-1",
        providerItemId: "item-1",
        contentHash: "content-1",
        excerptHash: "excerpt-1",
      }],
      evidenceObservations: [{ providerItemId: "item-1", contentHash: "content-1", excerptHash: "excerpt-1" }],
      runArtifactId: "artifact-1",
      sourceId: "source-1",
      expectedObservationCount: 1,
      sourceVersion: 2,
      evidenceSourceId: "source-1",
      evidenceSourceVersion: 2,
      evidenceWorkflowRunId: "workflow-1",
      evidenceCursorAfter: { knownItems: [] },
      sourceRunCursorAfter: { knownItems: [] },
      sourceCursorState: { knownItems: [] },
      sourceCursorWorkflowRunId: "workflow-1",
    };
    expect(evidenceVerificationIssues(valid)).toEqual([]);
    expect(evidenceVerificationIssues({
      ...valid,
      recomputedHash: "tampered",
      expectedObservationCount: 2,
      evidenceSourceId: "source-other",
      evidenceSourceVersion: 1,
      evidenceWorkflowRunId: "workflow-other",
      evidenceCursorAfter: { knownItems: [{ providerItemId: "one", contentHash: "a" }] },
      sourceCursorWorkflowRunId: "workflow-other",
      observations: [{
        runArtifactId: "other",
        workflowRunId: "workflow-1",
        sourceId: "source-1",
        providerItemId: "item-1",
        contentHash: "content-1",
        excerptHash: "tampered",
      }],
    })).toHaveLength(7);
  });
});
