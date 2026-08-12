export type ExecutionRecoveryState =
  | "WAITING"
  | "ACTIVE"
  | "CANCELING"
  | "RECOVERABLE"
  | "EXHAUSTED"
  | "RECOVERED"
  | "TERMINAL";

export interface ExecutionRecoveryRunLike {
  status: string;
  executionClaimId?: string;
  executionLeaseExpiresAt?: number;
  executionAttemptNumber?: number;
  executionStaleRecoveryCount?: number;
  executionRetryOfClaimId?: string;
  executionRetryReason?: string;
  executionPhase?: string;
  checkpointAt?: number;
  checkpointSummary?: string;
  cancellationRequestedAt?: number;
}

export function staleExecutionRecovery(input: {
  run: ExecutionRecoveryRunLike;
  newClaimId: string;
  now: number;
}) {
  const previousClaimId = input.run.executionClaimId;
  const recovered = input.run.status === "RUNNING"
    && (!previousClaimId || (input.run.executionLeaseExpiresAt ?? 0) <= input.now);
  if (!recovered) {
    return {
      recovered: false as const,
      previousClaimId,
      staleRecoveryCount: input.run.executionStaleRecoveryCount ?? 0,
      retryReason: undefined,
    };
  }

  const phase = input.run.executionPhase ?? "UNKNOWN";
  const checkpoint = input.run.checkpointSummary?.trim() || "No checkpoint summary was recorded.";
  const retryReason = previousClaimId
    ? `Execution lease ${previousClaimId} expired during ${phase}; resumed from checkpoint: ${checkpoint}`
    : `Interrupted execution had no active claim during ${phase}; resumed from checkpoint: ${checkpoint}`;
  return {
    recovered: true as const,
    previousClaimId,
    staleRecoveryCount: (input.run.executionStaleRecoveryCount ?? 0) + 1,
    retryReason,
  };
}

export function buildExecutionRecoverySummary(input: {
  run: ExecutionRecoveryRunLike;
  now: number;
  maxAttempts?: number | null;
}) {
  const attempts = input.run.executionAttemptNumber ?? 0;
  const maximum = input.maxAttempts && input.maxAttempts > 0
    ? Math.floor(input.maxAttempts)
    : null;
  const attemptsRemaining = maximum === null ? null : Math.max(0, maximum - attempts);
  const terminal = ["COMPLETED", "FAILED", "CANCELED"].includes(input.run.status);
  const activeLease = Boolean(
    input.run.executionClaimId
    && (input.run.executionLeaseExpiresAt ?? 0) > input.now,
  );
  const stale = input.run.status === "RUNNING" && !activeLease;

  let state: ExecutionRecoveryState;
  let nextAction: string;
  if (terminal) {
    state = "TERMINAL";
    nextAction = input.run.status === "COMPLETED"
      ? "Review the exact-head evidence package before merge."
      : "Create a governed retry only after recording what changed.";
  } else if (input.run.cancellationRequestedAt) {
    state = "CANCELING";
    nextAction = "Wait for the active worker heartbeat; cancellation is durable.";
  } else if (stale && attemptsRemaining === 0) {
    state = "EXHAUSTED";
    nextAction = "Recovery budget is exhausted; an operator must revise the plan or stop the WorkOrder.";
  } else if (stale) {
    state = "RECOVERABLE";
    nextAction = "The next authorized worker can reclaim this exact checkpoint without changing scope.";
  } else if (activeLease && (input.run.executionStaleRecoveryCount ?? 0) > 0) {
    state = "RECOVERED";
    nextAction = "Execution resumed under a new lease; monitor the current checkpoint and evidence.";
  } else if (activeLease) {
    state = "ACTIVE";
    nextAction = "No operator action is required while heartbeats remain current.";
  } else {
    state = "WAITING";
    nextAction = "Waiting for an authorized worker to claim the bounded Attempt.";
  }

  return {
    state,
    nextAction,
    activeLease,
    leaseExpired: stale,
    attempts,
    maxAttempts: maximum,
    attemptsRemaining,
    staleRecoveryCount: input.run.executionStaleRecoveryCount ?? 0,
    retryOfClaimId: input.run.executionRetryOfClaimId ?? null,
    retryReason: input.run.executionRetryReason ?? null,
    leaseExpiresAt: input.run.executionLeaseExpiresAt ?? null,
    checkpointAt: input.run.checkpointAt ?? null,
    checkpointSummary: input.run.checkpointSummary ?? null,
  };
}
