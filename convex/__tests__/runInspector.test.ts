import { describe, expect, it } from "vitest";
import {
  buildEvidenceLineage,
  buildFileChanges,
  buildRetryTimeline,
  orderRunEvents,
  summarizeRunEvents,
} from "../lib/runInspector";

describe("run inspector helpers", () => {
  it("orders events by sequence number", () => {
    const ordered = orderRunEvents([
      { eventType: "STEP_COMPLETED", sequenceNumber: 3 },
      { eventType: "RUN_STARTED", sequenceNumber: 1 },
      { eventType: "STEP_STARTED", sequenceNumber: 2 },
    ]);

    expect(ordered.map((event) => event.eventType)).toEqual(["RUN_STARTED", "STEP_STARTED", "STEP_COMPLETED"]);
  });

  it("summarizes human intervention and retries", () => {
    const summary = summarizeRunEvents([
      { eventType: "STEP_STARTED", sequenceNumber: 1, workflowStep: "plan" },
      { eventType: "RETRY_STARTED", sequenceNumber: 2, retryNumber: 1 },
      { eventType: "HUMAN_INTERVENTION_REQUESTED", sequenceNumber: 3 },
    ]);

    expect(summary.currentStep).toBe("plan");
    expect(summary.humanInterventionRequired).toBe(true);
    expect(summary.retryCount).toBe(1);
  });

  it("extracts file changes", () => {
    const changes = buildFileChanges([
      {
        eventType: "FILE_CHANGED",
        sequenceNumber: 2,
        metadata: { repositoryPath: "apps/ui.tsx", changeType: "modified", diffLocation: "pr#1" },
      },
    ]);

    expect(changes).toEqual([
      expect.objectContaining({ repositoryPath: "apps/ui.tsx", changeType: "modified", diffLocation: "pr#1" }),
    ]);
  });

  it("builds retry lineage", () => {
    const retries = buildRetryTimeline([
      { eventType: "RETRY_STARTED", sequenceNumber: 1, retryNumber: 2, workflowStep: "test", errorSummary: "flake", metadata: { checkpointArtifactId: "artifact-1" } },
      { eventType: "RETRY_COMPLETED", sequenceNumber: 2, retryNumber: 2, status: "COMPLETED" },
    ]);

    expect(retries).toEqual([
      expect.objectContaining({ retryNumber: 2, workflowStep: "test", reason: "flake", checkpointArtifactId: "artifact-1", outcome: "COMPLETED" }),
    ]);
  });

  it("filters evidence lineage by receipt linkage", () => {
    const lineage = buildEvidenceLineage({
      verificationReceiptId: "receipt-1",
      acceptanceCriterionId: null,
      events: [
        { eventType: "COMMAND_EXECUTED", sequenceNumber: 1, verificationReceiptId: "receipt-1" },
        { eventType: "COMMAND_EXECUTED", sequenceNumber: 2, verificationReceiptId: "receipt-2" },
      ],
      artifacts: [
        { artifactType: "TEST_OUTPUT", name: "vitest", createdAt: 1, verificationReceiptId: "receipt-1" },
        { artifactType: "TEST_OUTPUT", name: "other", createdAt: 2, verificationReceiptId: "receipt-2" },
      ],
    });

    expect(lineage.events).toHaveLength(1);
    expect(lineage.artifacts).toHaveLength(1);
    expect(lineage.artifacts[0].name).toBe("vitest");
  });
});
