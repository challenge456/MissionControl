export type GraphNodeStatus =
  | "PENDING"
  | "RUNNING"
  | "DONE"
  | "FAILED"
  | "SKIPPED"
  | "BLOCKED";

export interface GraphRunLike {
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "PAUSED" | "CANCELED";
  failureReason?: string;
  steps: Array<{
    status: GraphNodeStatus;
    kind?: "AGENT" | "REDUCE" | "ROUTER" | "VERIFY" | "GATE";
    error?: string;
  }>;
}

export interface GraphExecutionSummary {
  total: number;
  complete: number;
  active: number;
  failed: number;
  blocked: number;
  verificationTotal: number;
  verificationComplete: number;
  progressPercent: number;
  failureReason?: string;
}

export function summarizeGraphExecution(run: GraphRunLike): GraphExecutionSummary {
  const complete = run.steps.filter((step) =>
    step.status === "DONE" || step.status === "SKIPPED"
  ).length;
  const verificationSteps = run.steps.filter((step) => step.kind === "VERIFY");

  return {
    total: run.steps.length,
    complete,
    active: run.steps.filter((step) => step.status === "RUNNING").length,
    failed: run.steps.filter((step) => step.status === "FAILED").length,
    blocked: run.steps.filter((step) => step.status === "BLOCKED").length,
    verificationTotal: verificationSteps.length,
    verificationComplete: verificationSteps.filter((step) =>
      step.status === "DONE" || step.status === "SKIPPED"
    ).length,
    progressPercent: run.steps.length === 0
      ? 0
      : Math.round((complete / run.steps.length) * 100),
    failureReason:
      run.failureReason ??
      run.steps.find((step) => step.status === "FAILED")?.error,
  };
}

export type GraphDispatchState =
  | "LOADING"
  | "MISSING_WORK_ORDER"
  | "READY"
  | "QUEUED"
  | "RUNNING"
  | "AWAITING_APPROVAL"
  | "COMPLETED"
  | "RECOVERY_REQUIRED"
  | "UNAVAILABLE";

export function graphDispatchState(args: {
  loading: boolean;
  workOrder?: { state: string } | null;
  run?: Pick<GraphRunLike, "status" | "steps"> | null;
}): GraphDispatchState {
  if (args.loading) return "LOADING";
  if (!args.workOrder) return "MISSING_WORK_ORDER";
  if (!args.run) return args.workOrder.state === "READY" ? "READY" : "UNAVAILABLE";

  if (args.run.status === "PENDING") return "QUEUED";
  if (args.run.status === "RUNNING") {
    return args.run.steps.some(
      (step) => step.kind === "GATE" && step.status === "RUNNING"
    )
      ? "AWAITING_APPROVAL"
      : "RUNNING";
  }
  if (args.run.status === "PAUSED") return "AWAITING_APPROVAL";
  if (args.run.status === "COMPLETED") return "COMPLETED";
  if (args.run.status === "FAILED" || args.run.status === "CANCELED") {
    return "RECOVERY_REQUIRED";
  }
  return "UNAVAILABLE";
}
