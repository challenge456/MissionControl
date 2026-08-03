export type ExecutorEventType =
  | "EXECUTION_STARTED"
  | "COMMAND_STARTED"
  | "COMMAND_COMPLETED"
  | "ARTIFACT_PRODUCED"
  | "EXECUTION_COMPLETED"
  | "EXECUTION_FAILED"
  | "EXECUTION_CANCELED";

export interface ExecutorCapabilities {
  adapter: string;
  version: string;
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

export interface ExecutorAdapter {
  capabilities(): ExecutorCapabilities;
  validateConfiguration(request: ExecutorRequest): ExecutorConfigurationIssue[];
  estimate(request: ExecutorRequest): Promise<ExecutorEstimate>;
  execute(
    request: ExecutorRequest,
    emit: (event: ExecutorEvent) => Promise<void> | void,
    signal?: AbortSignal
  ): Promise<ExecutorResult>;
  cancel(executionId: string): Promise<boolean>;
  resume?(executionId: string): Promise<ExecutorResult>;
  health(): Promise<ExecutorHealth>;
}
