type WorkflowStepStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED" | "SKIPPED" | "BLOCKED";

export function reconcileTerminalWorkflowSteps<T extends {
  status: WorkflowStepStatus;
  completedAt?: number;
  error?: string;
}>(
  steps: T[],
  runStatus: string,
  reason: string | undefined,
  completedAt: number
): T[] {
  if (runStatus !== "FAILED" && runStatus !== "CANCELED") return steps;

  return steps.map((step) => {
    if (["DONE", "FAILED", "SKIPPED"].includes(step.status)) return step;
    if (runStatus === "CANCELED") {
      return { ...step, status: "SKIPPED", completedAt };
    }
    if (step.status === "RUNNING") {
      return {
        ...step,
        status: "FAILED",
        completedAt,
        error: reason ?? "Workflow run failed.",
      };
    }
    return { ...step, status: "BLOCKED", completedAt };
  });
}
