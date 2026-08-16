export type ExecutorEventType =
  | "EXECUTION_STARTED"
  | "COMMAND_STARTED"
  | "COMMAND_COMPLETED"
  | "ARTIFACT_PRODUCED"
  | "EXECUTION_COMPLETED"
  | "EXECUTION_FAILED"
  | "EXECUTION_CANCELED";

export const GENERIC_HARNESS_CONTRACT_VERSION = "generic-harness-contract/v1" as const;

export type HarnessExecutionBackend = "persistent-worker" | "remote-sandbox";
export type HarnessAuthorityLevel = "NONE";

export interface HarnessAuthorityProfile {
  readonly worker: HarnessAuthorityLevel;
  readonly verification: HarnessAuthorityLevel;
  readonly publication: HarnessAuthorityLevel;
  readonly acceptance: HarnessAuthorityLevel;
  readonly memory: HarnessAuthorityLevel;
  readonly observability: HarnessAuthorityLevel;
  readonly learning: HarnessAuthorityLevel;
}

export const NO_HARNESS_AUTHORITY: HarnessAuthorityProfile = Object.freeze({
  worker: "NONE",
  verification: "NONE",
  publication: "NONE",
  acceptance: "NONE",
  memory: "NONE",
  observability: "NONE",
  learning: "NONE",
});

export interface HarnessExecutorCapabilities {
  contractVersion: typeof GENERIC_HARNESS_CONTRACT_VERSION;
  adapter: string;
  version: string;
  displayName: string;
  provider?: string;
  executionBackends: HarnessExecutionBackend[];
  authority: HarnessAuthorityProfile;
  supportsCancel: boolean;
  supportsResume: boolean;
  supportsRepositoryMutation: boolean;
  isolationModes: Array<"READ_ONLY" | "WORKSPACE_WRITE">;
  emittedEvents: ExecutorEventType[];
}

export interface ExecutorConfigurationIssue {
  field: string;
  message: string;
}

export interface ExecutorEstimate {
  estimatedCostUsd: number;
  estimatedRuntimeMinutes: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export interface ExecutorRequest {
  executionId: string;
  repositoryRoot: string;
  workingDirectory: string;
  prompt: string;
  model?: string;
  allowedPaths: string[];
  timeoutMs: number;
  isolation: "READ_ONLY" | "WORKSPACE_WRITE";
}

export interface ExecutorEvent {
  executionId: string;
  sequence: number;
  type: ExecutorEventType;
  occurredAt: number;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutorResult {
  executionId: string;
  status: "COMPLETED" | "FAILED" | "CANCELED";
  exitCode?: number;
  output?: string;
  error?: string;
}

export interface ExecutorHealth {
  status: "READY" | "DEGRADED" | "UNAVAILABLE";
  checkedAt: number;
  adapter: string;
  version: string;
  details?: string;
}

export interface ExecutorProcessObserver {
  started(process: { pid: number; startedAt: number }): Promise<void> | void;
  terminated(process: { pid: number; terminatedAt: number; exitCode?: number }): Promise<void> | void;
}

export interface HarnessExecutionContext {
  emit: (event: ExecutorEvent) => Promise<void> | void;
  signal?: AbortSignal;
  processObserver?: ExecutorProcessObserver;
}

export interface HarnessExecutorAdapter<TPrepared = unknown, THandle = unknown> {
  capabilities(): HarnessExecutorCapabilities;
  validateConfiguration(request: ExecutorRequest): ExecutorConfigurationIssue[];
  estimate(request: ExecutorRequest): Promise<ExecutorEstimate>;
  prepare(
    request: ExecutorRequest,
    context: HarnessExecutionContext,
  ): Promise<TPrepared>;
  execute(prepared: TPrepared): Promise<THandle>;
  collectResult(handle: THandle): Promise<ExecutorResult>;
  cancel(handle: THandle, reason?: string): Promise<boolean>;
  cleanup(handle: THandle): Promise<void>;
  health(): Promise<ExecutorHealth>;
}

export async function runHarnessExecution<TPrepared, THandle>(
  adapter: HarnessExecutorAdapter<TPrepared, THandle>,
  request: ExecutorRequest,
  context: HarnessExecutionContext,
): Promise<ExecutorResult> {
  const prepared = await adapter.prepare(request, context);
  const handle = await adapter.execute(prepared);
  let cancellation: Promise<boolean> | undefined;
  const requestCancellation = () => {
    cancellation ??= Promise.resolve().then(() => adapter.cancel(handle, abortReason(context.signal)));
    void cancellation.catch(() => undefined);
  };
  if (context.signal?.aborted) requestCancellation();
  else context.signal?.addEventListener("abort", requestCancellation, { once: true });
  try {
    return await adapter.collectResult(handle);
  } finally {
    context.signal?.removeEventListener("abort", requestCancellation);
    try {
      if (cancellation) await cancellation;
    } finally {
      await adapter.cleanup(handle);
    }
  }
}

function abortReason(signal?: AbortSignal): string | undefined {
  if (!signal?.aborted || signal.reason === undefined) return undefined;
  return signal.reason instanceof Error ? signal.reason.message : String(signal.reason);
}

// Compatibility aliases keep downstream type imports stable while the product
// terminology moves from a Codex-specific executor to a generic harness.
export type ExecutorCapabilities = HarnessExecutorCapabilities;
export type ExecutorAdapter<TPrepared = unknown, THandle = unknown> = HarnessExecutorAdapter<TPrepared, THandle>;
