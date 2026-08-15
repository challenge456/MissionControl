export const FACTORY_WORKER_HEARTBEAT_MAX_AGE_MS = 2 * 60_000;

export type FactoryWorkerReadiness = "STARTING" | "READY" | "DRAINING" | "BLOCKED";

export interface FactoryWorkerExecutorCapability {
  adapter: string;
  version: string;
  supportsCancel: boolean;
  supportsResume: boolean;
  isolationModes: Array<"READ_ONLY" | "WORKSPACE_WRITE">;
}

export interface FactoryWorkerRuntimeSnapshot {
  sessionId: string;
  generation: number;
  hostRuntimeType: string;
  executionBackends: string[];
  supportedExecutors: FactoryWorkerExecutorCapability[];
  sandboxCapabilities: string[];
  repositoryAccess: Array<{
    repositoryId: string;
    access: "READ" | "READ_WRITE";
  }>;
  readiness: FactoryWorkerReadiness;
  draining: boolean;
  lastHeartbeatAt: number;
}

export interface FactoryWorkerCandidate {
  workerId: string;
  status: string;
  dirty: boolean;
  capacity?: {
    maxConcurrentRuns: number;
    currentRuns: number;
  };
  workerRuntime?: FactoryWorkerRuntimeSnapshot;
}

export interface FactoryWorkerRequirements {
  repositoryId: string;
  executor: { adapter: string; version: string };
  isolation: "READ_ONLY" | "WORKSPACE_WRITE";
  sandboxCapabilities: string[];
  executionBackend?: string;
}

export function nextFactoryWorkerGeneration(
  current: Pick<FactoryWorkerRuntimeSnapshot, "sessionId" | "generation"> | undefined,
  sessionId: string,
) {
  if (current?.sessionId === sessionId) return current.generation;
  return Math.max(0, current?.generation ?? 0) + 1;
}

export function factoryWorkerEligibility(input: {
  worker: FactoryWorkerCandidate;
  requirements: FactoryWorkerRequirements;
  activeSessionLeaseCount: number;
  now: number;
}) {
  const { worker, requirements, now } = input;
  const runtime = worker.workerRuntime;
  if (worker.status !== "READY" || worker.dirty) {
    return { eligible: false as const, reason: "worker-host-not-ready" };
  }
  if (!runtime || !runtime.sessionId.trim()) {
    return { eligible: false as const, reason: "worker-session-not-registered" };
  }
  if (runtime.readiness !== "READY" || runtime.draining) {
    return { eligible: false as const, reason: runtime.draining ? "worker-draining" : "worker-not-ready" };
  }
  if (now - runtime.lastHeartbeatAt > FACTORY_WORKER_HEARTBEAT_MAX_AGE_MS) {
    return { eligible: false as const, reason: "worker-heartbeat-stale" };
  }
  if (!worker.capacity
    || !Number.isSafeInteger(worker.capacity.maxConcurrentRuns)
    || worker.capacity.maxConcurrentRuns < 1) {
    return { eligible: false as const, reason: "worker-capacity-invalid" };
  }
  if (input.activeSessionLeaseCount >= worker.capacity.maxConcurrentRuns) {
    return { eligible: false as const, reason: "worker-capacity-exhausted" };
  }
  const executor = runtime.supportedExecutors.find((candidate) =>
    candidate.adapter === requirements.executor.adapter
    && candidate.version === requirements.executor.version
  );
  if (!executor) return { eligible: false as const, reason: "worker-executor-unsupported" };
  if (!executor.isolationModes.includes(requirements.isolation)) {
    return { eligible: false as const, reason: "worker-isolation-unsupported" };
  }
  if (requirements.executionBackend
    && !runtime.executionBackends.includes(requirements.executionBackend)) {
    return { eligible: false as const, reason: "worker-backend-unsupported" };
  }
  if (!requirements.sandboxCapabilities.every((capability) => runtime.sandboxCapabilities.includes(capability))) {
    return { eligible: false as const, reason: "worker-sandbox-capability-missing" };
  }
  const repository = runtime.repositoryAccess.find((candidate) => candidate.repositoryId === requirements.repositoryId);
  if (!repository || repository.access !== "READ_WRITE") {
    return { eligible: false as const, reason: "worker-repository-access-missing" };
  }
  return {
    eligible: true as const,
    workerId: worker.workerId,
    sessionId: runtime.sessionId,
    generation: runtime.generation,
  };
}

export function factoryWorkerRegistrationIssues(input: {
  sessionId: string;
  hostRuntimeType: string;
  executionBackends: string[];
  supportedExecutors: FactoryWorkerExecutorCapability[];
  sandboxCapabilities: string[];
  repositoryAccess: Array<{ repositoryId: string; access: "READ" | "READ_WRITE" }>;
}) {
  const issues: string[] = [];
  if (!boundedIdentity(input.sessionId, 200)) issues.push("session-id-invalid");
  if (!boundedIdentity(input.hostRuntimeType, 100)) issues.push("host-runtime-type-invalid");
  if (!boundedUniqueStrings(input.executionBackends, 16, 100)) issues.push("execution-backends-invalid");
  if (!boundedUniqueStrings(input.sandboxCapabilities, 32, 100)) issues.push("sandbox-capabilities-invalid");
  if (input.supportedExecutors.length < 1 || input.supportedExecutors.length > 16
    || new Set(input.supportedExecutors.map((executor) => `${executor.adapter}\0${executor.version}`)).size !== input.supportedExecutors.length
    || input.supportedExecutors.some((executor) =>
      !boundedIdentity(executor.adapter, 100)
      || !boundedIdentity(executor.version, 100)
      || executor.isolationModes.length < 1
      || new Set(executor.isolationModes).size !== executor.isolationModes.length
    )) {
    issues.push("executor-capabilities-invalid");
  }
  if (input.repositoryAccess.length < 1 || input.repositoryAccess.length > 100
    || new Set(input.repositoryAccess.map((repository) => repository.repositoryId)).size !== input.repositoryAccess.length
    || input.repositoryAccess.some((repository) => !boundedIdentity(repository.repositoryId, 200))) {
    issues.push("repository-access-invalid");
  }
  return issues;
}

function boundedIdentity(value: string, maximum: number) {
  return value === value.trim() && value.length > 0 && value.length <= maximum;
}

function boundedUniqueStrings(values: string[], maximumItems: number, maximumLength: number) {
  return values.length > 0
    && values.length <= maximumItems
    && new Set(values).size === values.length
    && values.every((value) => boundedIdentity(value, maximumLength));
}
