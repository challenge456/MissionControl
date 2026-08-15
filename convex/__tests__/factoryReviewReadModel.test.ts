import { describe, expect, it } from "vitest";
import { buildFactoryAttemptReviewReadModel } from "../lib/factoryReviewReadModel";

describe("Factory review read model", () => {
  it("recovers an immutable executor identity only from the exact manifest-bound Factory claim event", () => {
    const run = {
      _id: "run-1",
      runId: "attempt-1",
      status: "COMPLETED",
      executionManifestDigest: "sha256:manifest",
      executorAdapter: "codex",
      executorVersion: "v1",
      executorHostId: "local-macos-dev",
      steps: [],
      currentStepIndex: 0,
    };
    const input = {
      now: 100,
      run,
      workOrder: { _id: "wo-1", acceptanceCriteria: [] },
      artifacts: [],
      receipts: [],
      prChecks: [],
      events: [{
        eventType: "CHECKPOINT_CREATED",
        status: "RUNNING",
        commandSummary: "Factory attempt lease claimed",
        actor: "service:orchestration-server",
        sequenceNumber: 1,
        metadata: { executionManifestDigest: "sha256:manifest" },
      }],
    };

    const exact = buildFactoryAttemptReviewReadModel(input);
    const mismatched = buildFactoryAttemptReviewReadModel({
      ...input,
      events: [{ ...input.events[0], metadata: { executionManifestDigest: "sha256:other" } }],
    });

    expect(exact.run.executionClaimedBy).toBe(
      "service:orchestration-server|executor:codex/v1|host:local-macos-dev",
    );
    expect(mismatched.run.executionClaimedBy).toBeUndefined();
  });
});
