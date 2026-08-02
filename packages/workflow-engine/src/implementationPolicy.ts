import path from "node:path";

export interface ImplementationPolicy {
  allowedCommands: string[];
  maxCostUsd: number;
  maxAttempts: number;
  timeoutMinutes: number;
  stopCondition: string;
}

export interface ImplementationClaim {
  workOrder: {
    _id: string;
    projectId?: string;
    state: string;
    approvalStatus: string;
    isMutating?: boolean;
    repository?: string;
    branchStrategy?: string;
    currentRevisionNumber?: number;
    metadata?: { implementationPolicy?: ImplementationPolicy };
  };
  run: {
    projectId?: string;
    workOrderId?: string;
    workOrderRevisionNumber?: number;
    worktree?: string;
  };
  task: { projectId?: string; workOrderId?: string };
  expectedRepository: string;
  worktreePath: string;
  attemptNumber: number;
}

const DESTRUCTIVE_COMMAND = /(^|\s)(rm\s+-rf|git\s+(reset\s+--hard|clean\s+-[a-z]*f|push\s+--force)|sudo|shutdown|reboot)(\s|$)/i;
const SHELL_CONTROL = /[;&|`]|\$\(|\n|\r/;

export function isAllowedImplementationCommand(command: string, allowed: string[]): boolean {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (!normalized || SHELL_CONTROL.test(normalized) || DESTRUCTIVE_COMMAND.test(normalized)) return false;
  return allowed.some((entry) => {
    const allowedCommand = entry.trim().replace(/\s+/g, " ");
    return normalized === allowedCommand || normalized.startsWith(`${allowedCommand} `);
  });
}

export function validateImplementationClaim(claim: ImplementationClaim): string[] {
  const { workOrder, run, task } = claim;
  const policy = workOrder.metadata?.implementationPolicy;
  const errors: string[] = [];
  if (!workOrder.isMutating) errors.push("WorkOrder is not authorized for repository mutation");
  if (!['READY', 'ACTIVE'].includes(workOrder.state)) errors.push("WorkOrder is not dispatchable or active");
  if (workOrder.approvalStatus !== "APPROVED") errors.push("Implementation approval is missing");
  if (!workOrder.repository || workOrder.repository !== claim.expectedRepository) errors.push("Repository does not match the approved scope");
  if (!workOrder.branchStrategy?.toLowerCase().includes("worktree")) errors.push("Isolated worktree strategy is required");
  if (run.workOrderId !== workOrder._id || task.workOrderId !== workOrder._id) errors.push("Task and run must share the approved WorkOrder");
  if (run.projectId !== workOrder.projectId || task.projectId !== workOrder.projectId) errors.push("Cross-workspace execution is denied");
  if (run.workOrderRevisionNumber !== workOrder.currentRevisionNumber) errors.push("WorkOrder revision is stale");
  if (!run.worktree || path.resolve(run.worktree) !== path.resolve(claim.worktreePath)) errors.push("Run worktree does not match the claimed worktree");
  if (!policy) {
    errors.push("Implementation policy is missing");
    return errors;
  }
  if (!policy.allowedCommands.length) errors.push("At least one allowed verification command is required");
  if (!(policy.maxCostUsd > 0)) errors.push("A positive cost limit is required");
  if (!(policy.timeoutMinutes > 0)) errors.push("A positive timeout is required");
  if (!(policy.maxAttempts > 0) || claim.attemptNumber > policy.maxAttempts) errors.push("Maximum Attempts exceeded");
  if (!policy.stopCondition.trim()) errors.push("A stop condition is required");
  return errors;
}

export function implementationAttemptKey(runId: string, taskId: string, attemptNumber: number): string {
  return `implementation:${runId}:${taskId}:attempt:${attemptNumber}`;
}
