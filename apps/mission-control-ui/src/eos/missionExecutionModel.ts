export type MissionExecutionAction =
  | "WAITING"
  | "CREATE_TASK"
  | "DISPATCH"
  | "INSPECT_RUN"
  | "RETRY_RUN"
  | "ACCEPT_WORK_ORDER"
  | "RECORD_HANDOFF"
  | "COMPLETE";

const ACTIVE_RUN_STATES = new Set(["PENDING", "RUNNING", "WAITING", "PAUSED"]);
const READY_TASK_STATES = new Set(["READY", "ASSIGNED"]);

export function deriveMissionExecutionAction(workOrder: any): {
  action: MissionExecutionAction;
  label: string;
  detail: string;
} {
  if (workOrder.state === "DONE" && workOrder.latestHandoff?.outcome === "COMPLETE") {
    return { action: "COMPLETE", label: "Handoff complete", detail: "This delivery stage is fully evidenced." };
  }
  if (!workOrder.missionEligibility?.eligible) {
    return {
      action: "WAITING",
      label: "Waiting on predecessor",
      detail: workOrder.missionEligibility?.reason ?? "A predecessor handoff must complete first.",
    };
  }
  const approvalsSatisfied = (workOrder.requiredApprovals ?? []).every((approvalType: string) =>
    (workOrder.approvalDecisions ?? []).some((decision: any) =>
      decision.approvalType === approvalType && ["APPROVED", "CONDITIONAL"].includes(decision.status)
    )
  );
  if (!approvalsSatisfied) {
    return { action: "WAITING", label: "Approval required", detail: "Open the Work Order to request or decide its required approval." };
  }
  const readyTask = (workOrder.childTasks ?? []).find((task: any) => READY_TASK_STATES.has(task.status));
  const latestRun = workOrder.executionRuns?.[0];
  if (!readyTask && !latestRun) {
    return { action: "CREATE_TASK", label: "Create assigned Task", detail: "Add an assigned, execution-ready Task within this Work Order." };
  }
  if (!latestRun) {
    return { action: "DISPATCH", label: "Dispatch attempt", detail: "Open the Work Order and dispatch the ready Task." };
  }
  if (["FAILED", "CANCELED"].includes(latestRun.status)) {
    return { action: "RETRY_RUN", label: "Recover failed attempt", detail: "Inspect the evidence, then start a bounded retry from this run." };
  }
  if (ACTIVE_RUN_STATES.has(latestRun.status)) {
    return { action: "INSPECT_RUN", label: "Inspect active attempt", detail: "Execution is active; follow its live steps and evidence." };
  }
  if (latestRun.status === "COMPLETED" && workOrder.state !== "DONE") {
    return { action: "ACCEPT_WORK_ORDER", label: "Verify and accept Work Order", detail: "Record receipts for every criterion, then explicitly accept the Work Order." };
  }
  if (workOrder.state === "DONE" && workOrder.latestHandoff?.outcome !== "COMPLETE") {
    return { action: "RECORD_HANDOFF", label: "Record structured handoff", detail: "Account for the approved assertions and transfer evidence to the next role." };
  }
  return { action: "INSPECT_RUN", label: "Inspect Work Order", detail: "Review the current execution and governance state." };
}
