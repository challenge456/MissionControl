import { describe, expect, it } from "vitest";
import {
  candidatesFromProjectRecords,
  isCandidateEligibleForActivation,
} from "../lib/repetitiveTaskCandidates";

const NOW = 1_000;

describe("repetitive task candidate loading", () => {
  it("keeps candidate records and receipts inside the requested workspace", () => {
    const candidates = candidatesFromProjectRecords(
      [
        { _id: "a-1", projectId: "project-a", workflowId: "release", state: "DONE" },
        { _id: "a-2", projectId: "project-a", workflowId: "release", state: "DONE" },
        { _id: "b-1", projectId: "project-b", workflowId: "release", state: "DONE" },
        { _id: "b-2", projectId: "project-b", workflowId: "release", state: "DONE" },
      ],
      [
        { projectId: "project-a", workOrderId: "a-1", status: "PASSED" },
        { projectId: "project-b", workOrderId: "b-1", status: "PASSED" },
        { projectId: "project-b", workOrderId: "a-2", status: "PASSED" },
      ],
      "project-a",
      NOW
    );

    expect(candidates).toEqual([
      expect.objectContaining({
        id: "workflow:release",
        occurrences: 2,
        receiptCount: 1,
        supportingWorkOrderIds: ["a-1", "a-2"],
      }),
    ]);
  });

  it("counts only fresh, passing, non-invalidated receipts", () => {
    const candidates = candidatesFromProjectRecords(
      [
        { _id: "one", projectId: "project-a", workflowId: "quality", state: "DONE" },
        { _id: "two", projectId: "project-a", workflowId: "quality", state: "DONE" },
      ],
      [
        { projectId: "project-a", workOrderId: "one", status: "PASSED", validUntil: NOW + 1 },
        { projectId: "project-a", workOrderId: "one", status: "FAILED" },
        { projectId: "project-a", workOrderId: "one", status: "STALE" },
        { projectId: "project-a", workOrderId: "two", status: "PASSED", validUntil: NOW },
        { projectId: "project-a", workOrderId: "two", status: "PASSED", invalidatedAt: NOW - 1 },
      ],
      "project-a",
      NOW
    );

    expect(candidates[0]).toMatchObject({
      id: "workflow:quality",
      completedCount: 2,
      receiptCount: 1,
    });
  });

  it("requires two completed comparable WorkOrders and preserves stable IDs", () => {
    const first = [
      { _id: "one", projectId: "project-a", workflowId: "deploy", state: "DONE" },
    ];
    expect(candidatesFromProjectRecords(first, [], "project-a", NOW)).toEqual([]);

    const repeated = [
      ...first,
      { _id: "two", projectId: "project-a", workflowId: "deploy", state: "DONE" },
    ];
    const firstDetection = candidatesFromProjectRecords(repeated, [], "project-a", NOW);
    const retryDetection = candidatesFromProjectRecords([...repeated].reverse(), [], "project-a", NOW);

    expect(firstDetection[0]?.id).toBe("workflow:deploy");
    expect(retryDetection[0]?.id).toBe(firstDetection[0]?.id);
  });

  it("retains Workflow identity and rejects repository-only activation", () => {
    const workflowCandidate = candidatesFromProjectRecords(
      [
        { _id: "w-1", projectId: "project-a", workflowId: "feature-dev", state: "DONE" },
        { _id: "w-2", projectId: "project-a", workflowId: "feature-dev", state: "DONE" },
      ],
      [{ projectId: "project-a", workOrderId: "w-1", status: "PASSED" }],
      "project-a",
      NOW
    )[0]!;
    const repositoryCandidate = candidatesFromProjectRecords(
      [
        { _id: "r-1", projectId: "project-a", repository: "sellerfi/app", state: "DONE" },
        { _id: "r-2", projectId: "project-a", repository: "sellerfi/app", state: "DONE" },
      ],
      [{ projectId: "project-a", workOrderId: "r-1", status: "PASSED" }],
      "project-a",
      NOW
    )[0]!;

    expect(workflowCandidate).toMatchObject({
      id: "workflow:feature-dev",
      workflowId: "feature-dev",
    });
    expect(isCandidateEligibleForActivation(workflowCandidate)).toBe(true);
    expect(repositoryCandidate.id).toBe("repository:sellerfi/app");
    expect(isCandidateEligibleForActivation(repositoryCandidate)).toBe(false);
  });
});
