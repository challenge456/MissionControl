export type WorkflowObservabilitySummary = {
  correlationId: string;
  status: string;
  durationMs: number;
  attempts: number;
  retries: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  usageComplete: boolean;
};

type WorkflowStep = {
  startedAt?: number;
  completedAt?: number;
  retryCount?: number;
};

type WorkflowRun = {
  runId: string;
  status: string;
  startedAt: number;
  completedAt?: number;
  steps?: WorkflowStep[];
};

type AgentRun = {
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
};

function nonNegative(value: number | undefined): number {
  return Math.max(0, Number.isFinite(value) ? value ?? 0 : 0);
}

export function summarizeWorkflowObservability(input: {
  workflowRun: WorkflowRun;
  agentRuns: AgentRun[];
  now: number;
  truncated?: boolean;
}): WorkflowObservabilitySummary {
  const steps = input.workflowRun.steps ?? [];
  const retries = steps.reduce(
    (total, step) => total + nonNegative(step.retryCount),
    0
  );
  const attempts = steps.reduce(
    (total, step) =>
      total +
      (step.startedAt !== undefined || step.completedAt !== undefined ? 1 : 0) +
      nonNegative(step.retryCount),
    0
  );

  return {
    correlationId: input.workflowRun.runId,
    status: input.workflowRun.status,
    durationMs: Math.max(
      0,
      (input.workflowRun.completedAt ?? input.now) -
        input.workflowRun.startedAt
    ),
    attempts,
    retries,
    inputTokens: input.agentRuns.reduce(
      (total, run) => total + nonNegative(run.inputTokens),
      0
    ),
    outputTokens: input.agentRuns.reduce(
      (total, run) => total + nonNegative(run.outputTokens),
      0
    ),
    costUsd: input.agentRuns.reduce(
      (total, run) => total + nonNegative(run.costUsd),
      0
    ),
    usageComplete: !input.truncated,
  };
}
