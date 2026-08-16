import {
  GENERIC_HARNESS_CONTRACT_VERSION,
  type ExecutorRequest,
  type HarnessExecutionBackend,
  type HarnessExecutorAdapter,
  type HarnessExecutorCapabilities,
} from "@mission-control/workflow-engine";

export interface HarnessAdapterBinding {
  adapter: string;
  version: string;
}

export interface RemoteHarnessInvocation {
  command: string;
  args: string[];
  resultPath?: string;
  model?: string;
  prompt: string;
  allowedPaths: string[];
  timeoutMs: number;
}

export interface RemoteHarnessInvocationContext {
  repositoryRoot: string;
  resultPath: string;
}

export type HarnessRuntimeAdapter = HarnessExecutorAdapter<any, any> & {
  createRemoteInvocation?: (
    request: ExecutorRequest,
    context: RemoteHarnessInvocationContext,
  ) => RemoteHarnessInvocation;
};

interface RegisteredHarnessAdapter {
  adapter: HarnessRuntimeAdapter;
  capabilities: HarnessExecutorCapabilities;
}

export class HarnessAdapterRegistry {
  private readonly adapters = new Map<string, RegisteredHarnessAdapter>();

  constructor(
    adapters: HarnessRuntimeAdapter[],
    options: { requiredExecutionBackends?: HarnessExecutionBackend[] } = {},
  ) {
    if (adapters.length === 0) throw new Error("Harness adapter registry requires at least one adapter.");
    for (const adapter of adapters) {
      const capabilities = snapshotCapabilities(adapter.capabilities());
      validateCapabilities(capabilities);
      const key = bindingKey(capabilities);
      if (this.adapters.has(key)) throw new Error(`Duplicate harness adapter registration: ${key}.`);
      if (capabilities.executionBackends.includes("remote-sandbox") && !adapter.createRemoteInvocation) {
        throw new Error(`Harness adapter ${key} advertises remote-sandbox without a remote invocation builder.`);
      }
      for (const backend of options.requiredExecutionBackends ?? []) {
        if (!capabilities.executionBackends.includes(backend)) {
          throw new Error(`Harness adapter ${key} does not support required worker backend ${backend}.`);
        }
      }
      this.adapters.set(key, { adapter, capabilities });
    }
  }

  resolve(binding: HarnessAdapterBinding): HarnessRuntimeAdapter | undefined {
    return this.adapters.get(bindingKey(binding))?.adapter;
  }

  require(binding: HarnessAdapterBinding): HarnessRuntimeAdapter {
    const adapter = this.resolve(binding);
    if (!adapter) throw new Error(`Worker does not provide harness adapter ${bindingKey(binding)}.`);
    return adapter;
  }

  supports(binding: HarnessAdapterBinding, backend?: HarnessExecutionBackend): boolean {
    const registration = this.adapters.get(bindingKey(binding));
    return Boolean(registration && (!backend || registration.capabilities.executionBackends.includes(backend)));
  }

  requireCapabilities(binding: HarnessAdapterBinding): HarnessExecutorCapabilities {
    const registration = this.adapters.get(bindingKey(binding));
    if (!registration) throw new Error(`Worker does not provide harness adapter ${bindingKey(binding)}.`);
    return snapshotCapabilities(registration.capabilities);
  }

  capabilities(): HarnessExecutorCapabilities[] {
    return [...this.adapters.values()].map(({ capabilities }) => snapshotCapabilities(capabilities));
  }
}

function bindingKey(binding: HarnessAdapterBinding): string {
  return `${binding.adapter}/${binding.version}`;
}

function validateCapabilities(capabilities: HarnessExecutorCapabilities) {
  if (capabilities.contractVersion !== GENERIC_HARNESS_CONTRACT_VERSION) {
    throw new Error(`Harness adapter ${bindingKey(capabilities)} does not implement ${GENERIC_HARNESS_CONTRACT_VERSION}.`);
  }
  if (!boundedIdentity(capabilities.adapter) || !boundedIdentity(capabilities.version) || !boundedIdentity(capabilities.displayName, 200)) {
    throw new Error("Harness adapter identity is invalid.");
  }
  if (capabilities.provider !== undefined && !boundedIdentity(capabilities.provider)) {
    throw new Error(`Harness adapter ${bindingKey(capabilities)} provider identity is invalid.`);
  }
  if (capabilities.executionBackends.length === 0
    || new Set(capabilities.executionBackends).size !== capabilities.executionBackends.length
    || capabilities.executionBackends.some((backend) => !["persistent-worker", "remote-sandbox"].includes(backend))) {
    throw new Error(`Harness adapter ${bindingKey(capabilities)} execution backends are invalid.`);
  }
  const authorityDomains = ["worker", "verification", "publication", "acceptance", "memory", "observability", "learning"] as const;
  const authorityKeys = Object.keys(capabilities.authority);
  const invalidAuthority = authorityDomains.find((domain) => capabilities.authority[domain] !== "NONE");
  if (authorityKeys.length !== authorityDomains.length
    || authorityKeys.some((domain) => !authorityDomains.includes(domain as typeof authorityDomains[number]))
    || invalidAuthority) {
    throw new Error(`Harness adapter ${bindingKey(capabilities)} must declare every canonical authority as NONE.`);
  }
  if (capabilities.supportsCancel !== true
    || typeof capabilities.supportsResume !== "boolean"
    || typeof capabilities.supportsRepositoryMutation !== "boolean"
    || capabilities.isolationModes.length === 0
    || new Set(capabilities.isolationModes).size !== capabilities.isolationModes.length
    || capabilities.isolationModes.some((mode) => !["READ_ONLY", "WORKSPACE_WRITE"].includes(mode))) {
    throw new Error(`Harness adapter ${bindingKey(capabilities)} execution capabilities are invalid.`);
  }
}

function snapshotCapabilities(capabilities: HarnessExecutorCapabilities): HarnessExecutorCapabilities {
  return {
    ...capabilities,
    executionBackends: [...capabilities.executionBackends],
    authority: { ...capabilities.authority },
    isolationModes: [...capabilities.isolationModes],
    emittedEvents: [...capabilities.emittedEvents],
  };
}

function boundedIdentity(value: string, maximum = 100) {
  return value === value.trim() && value.length > 0 && value.length <= maximum && !/[\0\r\n]/.test(value);
}
