import { describe, expect, it } from "vitest";
import { filterEvidenceArtifacts, latestHumanAttention, orderTimelineEvents } from "./runInspectorModel";

describe("run inspector model", () => {
  it("orders timeline events by sequence", () => {
    const ordered = orderTimelineEvents([
      { eventType: "RUN_COMPLETED", sequenceNumber: 3 },
      { eventType: "RUN_STARTED", sequenceNumber: 1 },
      { eventType: "STEP_STARTED", sequenceNumber: 2 },
    ]);

    expect(ordered.map((event) => event.eventType)).toEqual(["RUN_STARTED", "STEP_STARTED", "RUN_COMPLETED"]);
  });

  it("finds the latest human attention signal", () => {
    const attention = latestHumanAttention([
      { eventType: "STEP_STARTED", sequenceNumber: 1 },
      { eventType: "HUMAN_INTERVENTION_REQUESTED", sequenceNumber: 2, errorSummary: "Need operator approval" },
    ]);

    expect(attention).toBe("Need operator approval");
  });

  it("filters artifacts linked to receipt evidence", () => {
    const artifacts = filterEvidenceArtifacts([
      { artifactType: "TEST_OUTPUT", name: "a", createdAt: 1, verificationReceiptId: "receipt-1" },
      { artifactType: "SCREENSHOT", name: "b", createdAt: 2, acceptanceCriterionId: "ac-2" },
    ], { verificationReceiptId: "receipt-1" });

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0].name).toBe("a");
  });
});
