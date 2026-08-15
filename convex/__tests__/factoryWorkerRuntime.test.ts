import { describe, expect, it } from "vitest";
import {
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
    expect(factoryWorkerEligibility({ worker, requirements, activeSessionLeaseCount: 0, now }))
      .toEqual({ eligible: true, workerId: "worker-1", sessionId: "session-1", generation: 1 });
    expect(factoryWorkerEligibility({
      worker,
      requirements: { ...requirements, executor: { adapter: "loom", version: "v1" } },
      activeSessionLeaseCount: 0,
      now,
    })).toMatchObject({ eligible: false, reason: "worker-executor-unsupported" });
    expect(factoryWorkerEligibility({
      worker: { ...worker, workerRuntime: { ...worker.workerRuntime!, draining: true, readiness: "DRAINING" } },
      requirements,
      activeSessionLeaseCount: 0,
      now,
    })).toMatchObject({ eligible: false, reason: "worker-draining" });
  });

  it("rejects capacity exhaustion using active server-side session leases", () => {
    expect(factoryWorkerEligibility({ worker, requirements, activeSessionLeaseCount: 2, now }))
      .toMatchObject({ eligible: false, reason: "worker-capacity-exhausted" });
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
