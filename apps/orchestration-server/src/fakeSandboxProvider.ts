import type {
  SandboxAllocation,
  SandboxAllocationRequest,
  SandboxProvider,
  SandboxProfileSnapshot,
  SandboxProfileValidation,
  SandboxStartReceipt,
  SandboxStartRequest,
  SandboxTerminationReceipt,
} from "./sandboxProvider.js";
import { validateSandboxProfile } from "./sandboxProvider.js";

export interface FakeSandboxProviderOptions {
  result?: Buffer | ((request: SandboxStartRequest) => Buffer | Promise<Buffer>);
  diagnostics?: Record<string, unknown> | ((request: SandboxStartRequest) => Record<string, unknown> | Promise<Record<string, unknown>>);
  allocationDelayMs?: number;
  resultDelayMs?: number;
  failAt?: "ALLOCATE" | "START" | "FETCH" | "TERMINATE";
  now?: () => number;
}

interface FakeRecord {
  allocation: SandboxAllocation;
  request: SandboxAllocationRequest;
  startRequest?: SandboxStartRequest;
  result?: Buffer;
  resultReadyAt?: number;
  canceled: boolean;
}

export class FakeSandboxProvider implements SandboxProvider {
  readonly kind = "FAKE" as const;
  private readonly records = new Map<string, FakeRecord>();
  readonly calls: string[] = [];

  constructor(private readonly options: FakeSandboxProviderOptions = {}) {}

  async validateProfile(profile: SandboxProfileSnapshot): Promise<SandboxProfileValidation> {
    this.calls.push(`validate:${profile.profileKey}:${profile.version}`);
    if (profile.provider !== "FAKE") {
      const validation = validateSandboxProfile(profile);
      return { ...validation, valid: false, dispatchable: false, readiness: "BLOCKED", errors: [...validation.errors, "Fake provider requires a FAKE profile."] };
    }
    return validateSandboxProfile(profile);
  }

  async allocate(request: SandboxAllocationRequest): Promise<SandboxAllocation> {
    this.calls.push(`allocate:${request.resourceName}`);
    if (this.options.failAt === "ALLOCATE") throw new Error("Deterministic fake allocation failure.");
    if (this.records.has(request.resourceName)) return structuredClone(this.records.get(request.resourceName)!.allocation);
    await delay(this.options.allocationDelayMs ?? 0);
    const now = this.now();
    const allocation: SandboxAllocation = {
      provider: this.kind,
      providerResourceId: `fake:${request.resourceName}`,
      resourceName: request.resourceName,
      state: "READY",
      createdAt: now,
      readyAt: now,
      lastHeartbeatAt: now,
      providerMetadata: { deterministic: true },
    };
    this.records.set(request.resourceName, { allocation, request, canceled: false });
    return structuredClone(allocation);
  }

  async inspect(allocation: SandboxAllocation): Promise<SandboxAllocation> {
    this.calls.push(`inspect:${allocation.resourceName}`);
    const record = this.requireRecord(allocation.resourceName);
    if (record.result && this.now() >= (record.resultReadyAt ?? 0)) record.allocation.state = "RESULT_READY";
    record.allocation.lastHeartbeatAt = this.now();
    return structuredClone(record.allocation);
  }

  async start(request: SandboxStartRequest): Promise<SandboxStartReceipt> {
    this.calls.push(`start:${request.allocation.resourceName}`);
    if (this.options.failAt === "START") throw new Error("Deterministic fake start failure.");
    const record = this.requireRecord(request.allocation.resourceName);
    if (record.startRequest) return { processId: `fake-process:${request.attemptId}`, startedAt: record.allocation.startedAt!, state: "RUNNING" };
    record.startRequest = request;
    record.allocation.state = "RUNNING";
    record.allocation.startedAt = this.now();
    record.result = typeof this.options.result === "function" ? await this.options.result(request) : this.options.result;
    record.resultReadyAt = this.now() + (this.options.resultDelayMs ?? 0);
    return { processId: `fake-process:${request.attemptId}`, startedAt: record.allocation.startedAt, state: "RUNNING" };
  }

  async fetchResult(allocation: SandboxAllocation): Promise<Buffer | null> {
    this.calls.push(`fetch:${allocation.resourceName}`);
    if (this.options.failAt === "FETCH") throw new Error("Deterministic fake result failure.");
    const record = this.requireRecord(allocation.resourceName);
    if (!record.result || this.now() < (record.resultReadyAt ?? 0)) return null;
    return Buffer.from(record.result);
  }

  async fetchDiagnostics(allocation: SandboxAllocation): Promise<Record<string, unknown> | null> {
    this.calls.push(`diagnostics:${allocation.resourceName}`);
    const record = this.requireRecord(allocation.resourceName);
    if (!record.startRequest || !this.options.diagnostics) return null;
    return structuredClone(typeof this.options.diagnostics === "function"
      ? await this.options.diagnostics(record.startRequest)
      : this.options.diagnostics);
  }

  async cancel(allocation: SandboxAllocation, _reason: string): Promise<void> {
    this.calls.push(`cancel:${allocation.resourceName}`);
    const record = this.requireRecord(allocation.resourceName);
    record.canceled = true;
    record.allocation.state = "CANCELING";
  }

  async terminate(allocation: SandboxAllocation): Promise<SandboxTerminationReceipt> {
    this.calls.push(`terminate:${allocation.resourceName}`);
    if (this.options.failAt === "TERMINATE") throw new Error("Deterministic fake teardown failure.");
    const record = this.requireRecord(allocation.resourceName);
    const requestedAt = this.now();
    record.allocation.state = "TERMINATED";
    record.allocation.terminatedAt = this.now();
    return {
      providerResourceId: record.allocation.providerResourceId,
      resourceName: allocation.resourceName,
      requestedAt,
      confirmedAbsentAt: this.now(),
      resourceAbsent: true,
    };
  }

  inventory() {
    return [...this.records.values()].map((record) => structuredClone(record.allocation));
  }

  startRequest(resourceName: string) {
    return this.requireRecord(resourceName).startRequest;
  }

  private requireRecord(resourceName: string) {
    const record = this.records.get(resourceName);
    if (!record) throw new Error(`Unknown fake sandbox ${resourceName}.`);
    return record;
  }

  private now() {
    return this.options.now?.() ?? Date.now();
  }
}

async function delay(durationMs: number) {
  if (durationMs > 0) await new Promise((resolve) => setTimeout(resolve, durationMs));
}
