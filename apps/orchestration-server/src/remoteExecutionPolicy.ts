export type RemoteFailureClass =
  | "RETRYABLE_INFRA"
  | "RETRYABLE_EXECUTION"
  | "NON_RETRYABLE_RESULT"
  | "UNKNOWN";

export type RemoteFailureStage =
  | "PROFILE"
  | "ALLOCATION"
  | "READINESS"
  | "CREDENTIAL"
  | "UPLOAD"
  | "START"
  | "EXECUTOR"
  | "RESULT_RECONSTRUCTION"
  | "RESULT_READ"
  | "RESULT_VALIDATION"
  | "CANDIDATE"
  | "CLEANUP"
  | "UNKNOWN";

export interface RemoteFailure {
  class: RemoteFailureClass;
  code: string;
  stage: RemoteFailureStage;
  retryable: boolean;
  summary: string;
}

export interface RemoteRetryBudget {
  schema: "factory-remote-retry-policy/v1";
  maxAttempts: number;
  maxTotalWallClockMs: number;
  maxModelSpendUsd: number;
  maxProviderResources: number;
  retryableFailureClasses: Array<"RETRYABLE_INFRA" | "RETRYABLE_EXECUTION">;
}

export type RemoteRetryDecision =
  | { allowed: true; reason: "WITHIN_FROZEN_BUDGET" }
  | {
      allowed: false;
      reason:
        | "FAILURE_CLASS_NOT_RETRYABLE"
        | "MAX_ATTEMPTS_EXHAUSTED"
        | "MAX_WALL_CLOCK_EXHAUSTED"
        | "MAX_MODEL_SPEND_EXHAUSTED"
        | "MAX_PROVIDER_RESOURCES_EXHAUSTED"
        | "INVALID_FROZEN_BUDGET";
    };

export function remoteFailure(
  failureClass: RemoteFailureClass,
  code: string,
  stage: RemoteFailureStage,
  summary: string,
): RemoteFailure {
  return {
    class: failureClass,
    code,
    stage,
    retryable: failureClass === "RETRYABLE_INFRA" || failureClass === "RETRYABLE_EXECUTION",
    summary: boundedSummary(summary),
  };
}

export function classifyRemoteError(error: unknown, stage: RemoteFailureStage): RemoteFailure {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (stage === "ALLOCATION") {
    return remoteFailure("RETRYABLE_INFRA", "PROVIDER_ALLOCATION", stage, message);
  }
  if (stage === "READINESS") {
    return remoteFailure("RETRYABLE_INFRA", "PROVIDER_READINESS", stage, message);
  }
  if (stage === "UPLOAD" || stage === "START") {
    return remoteFailure("RETRYABLE_INFRA", "TRANSPORT_UPLOAD", stage, message);
  }
  if (stage === "RESULT_READ") {
    return remoteFailure("RETRYABLE_INFRA", "TRANSPORT_RESULT_READ", stage, message);
  }
  if (stage === "CLEANUP") {
    return remoteFailure("UNKNOWN", "CLEANUP_UNCLASSIFIED", stage, message);
  }
  if (stage === "EXECUTOR") {
    if (/\b429\b|rate[ -]?limit|too many requests/.test(normalized)) {
      return remoteFailure("RETRYABLE_EXECUTION", "MODEL_RATE_LIMIT", stage, message);
    }
    if (/\b(502|503|504)\b|temporar(?:y|ily) unavailable|provider overloaded|connection reset/.test(normalized)) {
      return remoteFailure("RETRYABLE_EXECUTION", "MODEL_TRANSIENT_PROVIDER", stage, message);
    }
    return remoteFailure("UNKNOWN", "EXECUTOR_UNCLASSIFIED", stage, message);
  }
  return remoteFailure("UNKNOWN", "REMOTE_UNCLASSIFIED", stage, message);
}

export function validateRemoteRetryBudget(budget: RemoteRetryBudget | undefined | null) {
  return Boolean(budget
    && budget.schema === "factory-remote-retry-policy/v1"
    && Number.isSafeInteger(budget.maxAttempts) && budget.maxAttempts >= 1 && budget.maxAttempts <= 20
    && Number.isSafeInteger(budget.maxTotalWallClockMs) && budget.maxTotalWallClockMs >= 1_000
    && Number.isFinite(budget.maxModelSpendUsd) && budget.maxModelSpendUsd > 0
    && Number.isSafeInteger(budget.maxProviderResources) && budget.maxProviderResources === 1
    && budget.retryableFailureClasses.length === 2
    && budget.retryableFailureClasses[0] === "RETRYABLE_INFRA"
    && budget.retryableFailureClasses[1] === "RETRYABLE_EXECUTION");
}

export function decideRemoteRetry(input: {
  failure: RemoteFailure;
  budget: RemoteRetryBudget;
  attemptsUsed: number;
  totalWallClockMs: number;
  observedModelSpendUsd: number | null;
  activeProviderResources: number;
}): RemoteRetryDecision {
  if (!validateRemoteRetryBudget(input.budget)
    || !Number.isSafeInteger(input.attemptsUsed) || input.attemptsUsed < 0
    || !Number.isFinite(input.totalWallClockMs) || input.totalWallClockMs < 0
    || (input.observedModelSpendUsd !== null
      && (!Number.isFinite(input.observedModelSpendUsd) || input.observedModelSpendUsd < 0))
    || !Number.isSafeInteger(input.activeProviderResources) || input.activeProviderResources < 0) {
    return { allowed: false, reason: "INVALID_FROZEN_BUDGET" };
  }
  if (!input.failure.retryable
    || !input.budget.retryableFailureClasses.includes(input.failure.class as "RETRYABLE_INFRA" | "RETRYABLE_EXECUTION")) {
    return { allowed: false, reason: "FAILURE_CLASS_NOT_RETRYABLE" };
  }
  if (input.attemptsUsed >= input.budget.maxAttempts) {
    return { allowed: false, reason: "MAX_ATTEMPTS_EXHAUSTED" };
  }
  if (input.totalWallClockMs >= input.budget.maxTotalWallClockMs) {
    return { allowed: false, reason: "MAX_WALL_CLOCK_EXHAUSTED" };
  }
  if (input.observedModelSpendUsd !== null
    && input.observedModelSpendUsd >= input.budget.maxModelSpendUsd) {
    return { allowed: false, reason: "MAX_MODEL_SPEND_EXHAUSTED" };
  }
  if (input.activeProviderResources >= input.budget.maxProviderResources) {
    return { allowed: false, reason: "MAX_PROVIDER_RESOURCES_EXHAUSTED" };
  }
  return { allowed: true, reason: "WITHIN_FROZEN_BUDGET" };
}

function boundedSummary(value: string) {
  return value.replace(/\bsk-or-v1-[A-Za-z0-9_-]+/g, "[REDACTED_OPENROUTER_KEY]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]+/g, "[REDACTED_PROVIDER_TOKEN]")
    .replace(/(authorization|cookie|token|secret|password|api[-_]?key)\s*[:=]\s*([^\s,;]+)/gi, "$1=[REDACTED]")
    .slice(0, 1_000);
}
