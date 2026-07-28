import { describe, expect, it } from "vitest";
import {
  isExecutorOwnedWorkflowAttempt,
  isMatchingExplicitWorkflowGateApproval,
} from "../lib/workflowTaskGuards";

const identity = {
  taskId: "task-1",
  runId: "run-1",
  stepId: "approval",
  evidenceDigest: "sha256:accepted",
  targetVersion: "loop-engineering:v4",
};

const task = {
  _id: "task-1",
  source: "MISSION_PROMPT",
  sourceRef: "workflow-run:run-1",
  createdBy: "SYSTEM",
  createdByRef: "workflow-executor",
  metadata: {
    workflowStepId: "approval",
    graph: { kind: "GATE" },
    gate: {
      evidenceDigest: "sha256:accepted",
      targetVersion: "loop-engineering:v4",
    },
  },
};

const approval = {
  taskId: "task-1",
  actionType: "WORKFLOW_GATE",
  status: "APPROVED",
  decidedByUserId: "operator",
  decidedAt: 1_700_000_000_000,
  actionPayload: {
    runId: "run-1",
    stepId: "approval",
    taskId: "task-1",
    evidenceDigest: "sha256:accepted",
    targetVersion: "loop-engineering:v4",
  },
};

describe("workflow task guards", () => {
  it("limits supersession to the exact executor-owned attempt", () => {
    expect(isExecutorOwnedWorkflowAttempt(task, identity)).toBe(true);
    expect(
      isExecutorOwnedWorkflowAttempt(
        { ...task, createdByRef: "another-service" },
        identity
      )
    ).toBe(false);
    expect(
      isExecutorOwnedWorkflowAttempt(task, { ...identity, runId: "another-run" })
    ).toBe(false);
  });

  it("accepts only an explicit human decision bound to the same gate identity", () => {
    expect(
      isMatchingExplicitWorkflowGateApproval(task, approval, identity)
    ).toBe(true);
    expect(
      isMatchingExplicitWorkflowGateApproval(
        task,
        { ...approval, decidedByUserId: undefined },
        identity
      )
    ).toBe(false);
    expect(
      isMatchingExplicitWorkflowGateApproval(task, approval, {
        ...identity,
        evidenceDigest: "sha256:different",
      })
    ).toBe(false);
    expect(
      isMatchingExplicitWorkflowGateApproval(task, approval, {
        ...identity,
        targetVersion: "loop-engineering:v5",
      })
    ).toBe(false);
  });
});
