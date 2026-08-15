import { describe, expect, it } from "vitest";
import {
  countActiveFactoryWorkerLeases,
  factoryWorkerEligibility,
  factoryWorkerRegistrationIssues,
  nextFactoryWorkerGeneration,
  type FactoryWorkerCandidate,
  type FactoryWorkerRequirements,
} from "../lib/factoryWorkerRuntime";

const now = 100_000;
const requirements: FactoryWorkerRequirements = {
  repositoryId: "repository-1",
  executor: { adapter: "codex", version: "v1" },
  isolation: "WORKSPACE_WRITE",
  sandboxCapabilities: ["git-worktree", "workspace-write"],
  executionBackend: "persistent-worker",
};
const worker: FactoryWorkerCandidate = {
  workerId: "worker-1",
  status: "READY",
  dirty: false,
  capacity: { maxConcurrentRuns: 2, currentRuns: 0 },
  workerRuntime: {
    sessionId: "session-1",
    generation: 1,
    hostRuntimeType: "persistent-worker",
    executionBackends: ["persistent-worker"],
    supportedExecutors: [{
      adapter: "codex",
      version: "v1",
      supportsCancel: true,
      supportsResume: false,
      isolationModes: ["READ_ONLY", "WORKSPACE_WRITE"],
    }],
    sandboxCapabilities: ["git-worktree", "workspace-write", "read-only"],
    repositoryAccess: [{ repositoryId: "repository-1", access: "READ_WRITE" }],
    readiness: "READY",
    draining: false,
    lastHeartbeatAt: now,
  },
};

describe("Factory worker runtime", () => {
  it("keeps a generation for one session and increments it on restart", () => {
    expect(nextFactoryWorkerGeneration(undefined, "session-1")).toBe(1);
    expect(nextFactoryWorkerGeneration({ sessionId: "session-1", generation: 3 }, "session-1")).toBe(3);
    expect(nextFactoryWorkerGeneration({ sessionId: "session-1", generation: 3 }, "session-2")).toBe(4);
  });

  it("matches provider-neutral executor, sandbox, backend, repository, readiness, and heartbeat requirements", () => {
    expect(factoryWorkerEligibility({ worker, requirements, activeWorkerLeaseCount: 0, now }))
      .toEqual({ eligible: true, workerId: "worker-1", sessionId: "session-1", generation: 1 });
    expect(factoryWorkerEligibility({
      worker,
      requirements: { ...requirements, executor: { adapter: "loom", version: "v1" } },
      activeWorkerLeaseCount: 0,
      now,
    })).toMatchObject({ eligible: false, reason: "worker-executor-unsupported" });
    expect(factoryWorkerEligibility({
      worker: { ...worker, workerRuntime: { ...worker.workerRuntime!, draining: true, readiness: "DRAINING" } },
      requirements,
      activeWorkerLeaseCount: 0,
      now,
    })).toMatchObject({ eligible: false, reason: "worker-draining" });
  });

  it("rejects capacity exhaustion using active server-side session leases", () => {
    expect(factoryWorkerEligibility({ worker, requirements, activeWorkerLeaseCount: 2, now }))
      .toMatchObject({ eligible: false, reason: "worker-capacity-exhausted" });
  });

  it("counts active leases globally by stable worker ID across repositories and sessions", () => {
    expect(countActiveFactoryWorkerLeases({
      runs: [
        { status: "RUNNING", lease: { workerId: "worker-1", expiresAt: now + 1 } },
        { status: "RUNNING", lease: { workerId: "worker-1", expiresAt: now + 2 } },
        { status: "RUNNING", lease: { workerId: "worker-2", expiresAt: now + 3 } },
        { status: "RUNNING", lease: { workerId: "worker-1", expiresAt: now } },
        { status: "FAILED", lease: { workerId: "worker-1", expiresAt: now + 4 } },
      ],
      workerId: "worker-1",
      now,
    })).toBe(2);
  });

  it("ignores worker-reported occupied slots and fails closed on every capability mismatch", () => {
    const falselyIdleWorker = { ...worker, capacity: { maxConcurrentRuns: 1, currentRuns: 0 } };
    expect(factoryWorkerEligibility({
      worker: falselyIdleWorker,
      requirements,
      activeWorkerLeaseCount: 1,
      now,
    })).toMatchObject({ eligible: false, reason: "worker-capacity-exhausted" });
    for (const mismatched of [
      { ...requirements, repositoryId: "repository-2" },
      { ...requirements, executionBackend: "disposable-sandbox" },
      { ...requirements, sandboxCapabilities: [...requirements.sandboxCapabilities, "network-denied"] },
      { ...requirements, isolation: "READ_ONLY" as const },
    ]) {
      expect(factoryWorkerEligibility({
        worker: { ...worker, workerRuntime: { ...worker.workerRuntime!, supportedExecutors: [{ ...worker.workerRuntime!.supportedExecutors[0], isolationModes: ["WORKSPACE_WRITE"] }] } },
        requirements: mismatched,
        activeWorkerLeaseCount: 0,
        now,
      }).eligible).toBe(false);
    }
  });

  it("rejects malformed or unbounded registration snapshots", () => {
    expect(factoryWorkerRegistrationIssues({
      sessionId: " session ",
      hostRuntimeType: "persistent-worker",
      executionBackends: ["persistent-worker"],
      supportedExecutors: [],
      sandboxCapabilities: ["git-worktree"],
      repositoryAccess: [{ repositoryId: "repository-1", access: "READ_WRITE" }],
    })).toEqual(["session-id-invalid", "executor-capabilities-invalid"]);
    expect(factoryWorkerRegistrationIssues({
      sessionId: "session-1",
      hostRuntimeType: "persistent-worker",
      executionBackends: ["persistent-worker"],
      supportedExecutors: [worker.workerRuntime!.supportedExecutors[0], worker.workerRuntime!.supportedExecutors[0]],
      sandboxCapabilities: ["git-worktree"],
      repositoryAccess: [{ repositoryId: "repository-1", access: "READ_WRITE" }],
    })).toContain("executor-capabilities-invalid");
  });
});
