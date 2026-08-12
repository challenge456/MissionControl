import { describe, expect, it } from "vitest";
import {
  buildAttemptProjection,
  deriveTaskGovernanceStatus,
  governanceTransitionError,
  projectTask,
  taskWorkOrderLinkError,
} from "../lib/taskProjection";

const projectId = "project-a" as any;
const otherProjectId = "project-b" as any;
const workOrderId = "work-order-a" as any;

function task(overrides: Record<string, unknown> = {}) {
  return {
    _id: "task-a",
    projectId,
    title: "Task A",
    status: "INBOX",
    metadata: {},
    ...overrides,
  } as any;
}

function workOrder(overrides: Record<string, unknown> = {}) {
  return {
    _id: workOrderId,
    projectId,
    title: "Work Order A",
    state: "READY",
    riskLevel: "LOW",
    ...overrides,
  } as any;
}

function run(startedAt: number, status = "COMPLETED", retries = 0) {
  return {
    _id: `run-${startedAt}`,
    parentTaskId: "task-a",
    startedAt,
    status,
    steps: [{ retryCount: retries }],
  } as any;
}

describe("Task governance projection", () => {
  it("classifies a valid same-workspace relationship as GOVERNED", () => {
    expect(
      deriveTaskGovernanceStatus(
        task({ workOrderId }),
        workOrder()
      )
    ).toBe("GOVERNED");
  });

  it("classifies explicitly-created parentless intake as UNGOVERNED", () => {
    expect(
      deriveTaskGovernanceStatus(
        task({ metadata: { governanceOrigin: "UNGOVERNED_INTAKE" } }),
        null
      )
    ).toBe("UNGOVERNED");
  });

  it("classifies historical parentless and broken relationships as LEGACY", () => {
    expect(deriveTaskGovernanceStatus(task(), null)).toBe("LEGACY");
    expect(
      deriveTaskGovernanceStatus(task({ workOrderId }), null)
    ).toBe("LEGACY");
  });

  it("rejects missing and cross-workspace Work Orders", () => {
    expect(taskWorkOrderLinkError(projectId, null)).toMatch(/no longer exists/i);
    expect(
      taskWorkOrderLinkError(
        projectId,
        workOrder({ projectId: otherProjectId })
      )
    ).toMatch(/same workspace/i);
  });

  it("accepts a Work Order from the selected workspace", () => {
    expect(taskWorkOrderLinkError(projectId, workOrder())).toBeNull();
  });

  it("projects the repository code scope needed for governed Task dispatch", () => {
    const projection = projectTask(
      task({ workOrderId }),
      workOrder({
        repositoryId: "repository-a",
        codeScopeIds: ["scope-docs"],
        executionEnvironment: "LOCAL",
      }),
      null,
      []
    );

    expect(projection.parentDelivery).toMatchObject({
      repositoryId: "repository-a",
      codeScopeIds: ["scope-docs"],
      executionEnvironment: "LOCAL",
    });
  });
});

describe("Ungoverned transition policy", () => {
  it("blocks execution with actionable guidance and leaves cancellation allowed", () => {
    expect(governanceTransitionError("UNGOVERNED", "ASSIGNED")).toBe(
      "Link this Task to a Work Order before execution."
    );
    expect(governanceTransitionError("UNGOVERNED", "CANCELED")).toBeNull();
  });

  it("allows governed and legacy compatibility transitions", () => {
    expect(governanceTransitionError("GOVERNED", "ASSIGNED")).toBeNull();
    expect(governanceTransitionError("LEGACY", "IN_PROGRESS")).toBeNull();
  });
});

describe("Task Attempt projection", () => {
  it("keeps multiple Attempts under one Task and selects the latest Attempt", () => {
    const projection = buildAttemptProjection([
      run(10),
      run(20, "FAILED", 1),
      run(30, "RUNNING"),
    ]);
    expect(projection.attemptCount).toBe(3);
    expect(projection.currentAttemptNumber).toBe(3);
    expect(projection.currentAttemptStatus).toBe("RUNNING");
    expect(projection.retryCount).toBe(2);
    expect(projection.internalStepRetryCount).toBe(1);
  });

  it("flags legacy retry metadata rather than creating duplicate Task cards", () => {
    const projection = projectTask(
      task({
        metadata: { workflowAttempt: { attemptNumber: 2, retryNumber: 1 } },
      }),
      null,
      null,
      []
    );
    expect(projection._id).toBe("task-a");
    expect(projection.attempt.attemptCount).toBe(0);
    expect(projection.attempt.legacyRetryAmbiguous).toBe(true);
  });
});
