type WorkflowTaskLike = {
  _id?: unknown;
  source?: string;
  sourceRef?: string;
  createdBy?: string;
  createdByRef?: string;
  metadata?: any;
};

type WorkflowApprovalLike = {
  taskId?: unknown;
  actionType?: string;
  status?: string;
  decidedByUserId?: string;
  decidedAt?: number;
  actionPayload?: any;
};

export type WorkflowAttemptIdentity = {
  taskId?: unknown;
  runId: string;
  stepId: string;
};

export type WorkflowGateIdentity = WorkflowAttemptIdentity & {
  evidenceDigest: string;
  targetVersion: string;
};

export function isExecutorOwnedWorkflowAttempt(
  task: WorkflowTaskLike,
  identity: WorkflowAttemptIdentity
): boolean {
  const metadata = task.metadata ?? {};
  return (
    task.source === "MISSION_PROMPT" &&
    task.sourceRef === `workflow-run:${identity.runId}` &&
    task.createdBy === "SYSTEM" &&
    task.createdByRef === "workflow-executor" &&
    metadata.workflowStepId === identity.stepId &&
    (identity.taskId === undefined || task._id === identity.taskId)
  );
}

export function isMatchingExplicitWorkflowGateApproval(
  task: WorkflowTaskLike,
  approval: WorkflowApprovalLike,
  identity: WorkflowGateIdentity
): boolean {
  const metadata = task.metadata ?? {};
  const gate = metadata.gate ?? {};
  const payload = approval.actionPayload ?? {};
  return (
    isExecutorOwnedWorkflowAttempt(task, identity) &&
    metadata.graph?.kind === "GATE" &&
    gate.evidenceDigest === identity.evidenceDigest &&
    gate.targetVersion === identity.targetVersion &&
    approval.taskId === identity.taskId &&
    approval.actionType === "WORKFLOW_GATE" &&
    approval.status === "APPROVED" &&
    Boolean(approval.decidedByUserId) &&
    Boolean(approval.decidedAt) &&
    payload.runId === identity.runId &&
    payload.stepId === identity.stepId &&
    payload.taskId === identity.taskId &&
    payload.evidenceDigest === identity.evidenceDigest &&
    payload.targetVersion === identity.targetVersion
  );
}
