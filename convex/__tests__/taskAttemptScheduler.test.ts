import { describe, expect, it } from "vitest";
import {
  nextTaskAttemptNumbers,
  taskAttemptErrorMessage,
  validateTaskAttemptSelection,
  validateTaskAttemptStart,
  type TaskAttemptRun,
} from "../lib/taskAttemptScheduler";

const task = {
  _id: "task-a",
  projectId: "project-a",
  workOrderId: "work-order-a",
  status: "READY",
  metadata: {
    authorityScope: {
      kind: "WORK_ORDER_DESIRED_OUTCOME",
      workOrderId: "work-order-a",
      workOrderRevisionNumber: 1,
      authorityRef: "work-order:work-order-a:revision:1:desired-outcome",
      objective: "Research reasoned retry scheduling.",
    },
  },
};

const authority = {
  workOrderRevisionNumber: 1,
  workOrderDesiredOutcome: "Research reasoned retry scheduling.",
};

function attempt(
  id: string,
  status: string,
  startedAt: number,
  parentTaskId = task._id,
): TaskAttemptRun {
  return {
    _id: id,
    parentTaskId,
    workOrderId: task.workOrderId,
    status,
    startedAt,
  };
}

describe("Task Attempt selection", () => {
  it("requires explicit Task selection when canonical children exist", () => {
    expect(
      validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: true,
      }),
    ).toEqual({ ok: false, reason: "task-selection-required" });
  });

  it("preserves legacy dispatch when no canonical children exist", () => {
    expect(
      validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: false,
      }),
    ).toEqual({ ok: true, taskId: null });
  });

  it("accepts a governed same-workspace Child Task", () => {
    expect(
      validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: true,
        task,
      }),
    ).toEqual({ ok: true, taskId: task._id });
  });

  it("keeps legacy ASSIGNED Child Tasks schedulable during compatibility", () => {
    expect(
      validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: true,
        task: { ...task, status: "ASSIGNED" },
      }),
    ).toEqual({ ok: true, taskId: task._id });
  });

  it("allows a failed Child Task only for an explicit recovery dispatch", () => {
    expect(
      validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: true,
        allowFailedRecovery: true,
        task: { ...task, status: "FAILED" },
      }),
    ).toEqual({ ok: true, taskId: task._id });
  });

  it.each([
    [{ ...task, workOrderId: "other" }, "task-work-order-mismatch"],
    [{ ...task, projectId: "other" }, "task-workspace-mismatch"],
    [{ ...task, status: "INBOX" }, "task-not-schedulable:INBOX"],
    [{ ...task, status: "REVIEW" }, "task-not-schedulable:REVIEW"],
    [{ ...task, status: "DONE" }, "task-terminal:DONE"],
    [{ ...task, status: "CANCELED" }, "task-terminal:CANCELED"],
  ])("rejects invalid Task target %#", (candidate, reason) => {
    expect(
      validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: true,
        task: candidate,
      }),
    ).toEqual({ ok: false, reason });
  });

  it("fails closed when Task authority is missing or stale", () => {
    for (const [candidate, reason] of [
      [{ ...task, metadata: {} }, "task-authority-missing"],
      [{
        ...task,
        metadata: {
          authorityScope: {
            ...task.metadata.authorityScope,
            objective: "Audit accessibility.",
          },
        },
      }, "task-authority-mismatch"],
    ] as const) {
      expect(validateTaskAttemptSelection({
        workOrderId: task.workOrderId,
        projectId: task.projectId,
        ...authority,
        hasCanonicalChildTasks: true,
        task: candidate,
      })).toEqual({ ok: false, reason });
    }
  });
});

describe("Task Attempt start and retry", () => {
  it("allows the first Attempt", () => {
    expect(
      validateTaskAttemptStart({ taskId: task._id, attempts: [] }),
    ).toEqual({ ok: true });
  });

  it("requires retry after an Attempt already exists", () => {
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [attempt("run-1", "COMPLETED", 1)],
      }),
    ).toEqual({ ok: false, reason: "task-retry-required" });
  });

  it.each(["PENDING", "RUNNING", "PAUSED"])(
    "blocks a new Attempt while %s is active",
    (status) => {
      expect(
        validateTaskAttemptStart({
          taskId: task._id,
          attempts: [attempt("run-1", status, 1)],
        }),
      ).toEqual({ ok: false, reason: "active-task-attempt-exists" });
    },
  );

  it("allows a reasoned retry of the latest failed Attempt", () => {
    const failed = attempt("run-2", "FAILED", 2);
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [attempt("run-1", "FAILED", 1), failed],
        retryOfRun: failed,
        retryReason: "Environment configuration was corrected.",
      }),
    ).toEqual({ ok: true });
  });

  it("allows a reasoned retry of the latest canceled Attempt", () => {
    const canceled = attempt("run-1", "CANCELED", 1);
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [canceled],
        retryOfRun: canceled,
        retryReason: "The operator reopened the canceled work order.",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects retry of another Task or an older Attempt", () => {
    const older = attempt("run-1", "FAILED", 1);
    const latest = attempt("run-2", "FAILED", 2);
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [older, latest],
        retryOfRun: older,
        retryReason: "Retry the older failed run.",
      }),
    ).toEqual({ ok: false, reason: "retry-run-not-latest" });
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [latest],
        retryOfRun: { ...latest, parentTaskId: "task-b" },
        retryReason: "Retry the other Task run.",
      }),
    ).toEqual({ ok: false, reason: "retry-run-task-mismatch" });
  });

  it("requires a recoverable run and an actionable reason", () => {
    const completed = attempt("run-1", "COMPLETED", 1);
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [completed],
        retryOfRun: completed,
        retryReason: "This run should not retry.",
      }),
    ).toEqual({
      ok: false,
      reason: "retry-run-not-recoverable:COMPLETED",
    });

    const failed = attempt("run-2", "FAILED", 2);
    expect(
      validateTaskAttemptStart({
        taskId: task._id,
        attempts: [failed],
        retryOfRun: failed,
        retryReason: "retry",
      }),
    ).toEqual({ ok: false, reason: "retry-reason-required" });
  });

  it("assigns one Attempt number and one retry number per immutable run", () => {
    expect(nextTaskAttemptNumbers([], false)).toEqual({
      attemptNumber: 1,
      retryNumber: 0,
    });
    expect(
      nextTaskAttemptNumbers(
        [attempt("run-1", "FAILED", 1), attempt("run-2", "FAILED", 2)],
        true,
      ),
    ).toEqual({ attemptNumber: 3, retryNumber: 2 });
  });

  it("returns actionable operator errors", () => {
    expect(taskAttemptErrorMessage("task-selection-required")).toBe(
      "Select a Child Task before dispatch.",
    );
    expect(taskAttemptErrorMessage("retry-run-not-latest")).toBe(
      "Only the latest failed or canceled Attempt can be retried.",
    );
  });
});
