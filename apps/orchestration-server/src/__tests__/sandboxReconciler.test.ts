import { describe, expect, it } from "vitest";
import { FakeSandboxCredentialBroker } from "../sandboxCredentials.js";
import { FakeSandboxProvider } from "../fakeSandboxProvider.js";
import { reconcileSandboxOrphans } from "../sandboxReconciler.js";
import type { SandboxAllocation, SandboxProfileSnapshot } from "../sandboxProvider.js";

describe("sandbox orphan reconciliation", () => {
  it("revokes the Attempt credential and terminates the exact resource when the canonical lease is no longer current", async () => {
    const now = 1_800_000_000_000;
    const provider = new FakeSandboxProvider({ now: () => now });
    const allocation = await provider.allocate(request(profile(), now));
    const broker = new FakeSandboxCredentialBroker(() => now);
    const credential = await broker.mint({
      projectId: "project-1", workflowRunId: "run-1", attemptId: "attempt-1", attemptLeaseId: "lease-1",
      maxCostUsd: 1, expiresAt: now + 60_000,
    });
    const receipts: any[] = [];

    const health = await reconcileSandboxOrphans({
      candidates: [{ allocation: { ...allocation, providerCostUsd: 0.2 } as any, attemptLeaseCurrent: false, credential }],
      providers: new Map([["FAKE", provider]]),
      credentialBroker: broker,
      now,
      onReceipt: async (receipt) => { receipts.push(receipt); },
    });

    expect(health).toMatchObject({ activeSandboxes: 1, orphaned: 1, reconciled: 1, failed: 0, activeEphemeralCredentials: 1, unreconciledCostUsd: 0.2 });
    expect(broker.active.size).toBe(0);
    expect(provider.inventory()[0].state).toBe("TERMINATED");
    expect(receipts[0]).toMatchObject({ eventType: "ORPHAN_RECONCILED", credentialRevoked: true, termination: { resourceAbsent: true } });
  });

  it("does not touch a resource whose canonical Attempt lease is current and exposes fail-closed cleanup", async () => {
    const now = 1_800_000_000_000;
    const healthyProvider = new FakeSandboxProvider({ now: () => now });
    const healthy = await healthyProvider.allocate(request(profile(), now));
    const failingProvider = new FakeSandboxProvider({ now: () => now, failAt: "TERMINATE" });
    const failing = await failingProvider.allocate(request(profile(), now, "mc-attempt-fedcba9876543210"));

    const health = await reconcileSandboxOrphans({
      candidates: [
        { allocation: healthy, attemptLeaseCurrent: true },
        { allocation: failing, attemptLeaseCurrent: false },
      ],
      providers: new Map([["FAKE", {
        ...failingProvider,
        kind: "FAKE",
        validateProfile: failingProvider.validateProfile.bind(failingProvider),
        allocate: failingProvider.allocate.bind(failingProvider),
        inspect: failingProvider.inspect.bind(failingProvider),
        start: failingProvider.start.bind(failingProvider),
        fetchResult: failingProvider.fetchResult.bind(failingProvider),
        cancel: failingProvider.cancel.bind(failingProvider),
        terminate: async (allocation: SandboxAllocation) => allocation.resourceName === healthy.resourceName
          ? await healthyProvider.terminate(allocation)
          : await failingProvider.terminate(allocation),
      } as any]]),
      credentialBroker: new FakeSandboxCredentialBroker(() => now),
      now,
    });

    expect(health.healthy).toBe(1);
    expect(health.failed).toBe(1);
    expect(health.failures[0]).toMatchObject({ resourceName: failing.resourceName });
    expect(healthyProvider.inventory()[0].state).toBe("READY");
  });

  it("still removes provider compute when credential revocation fails", async () => {
    const now = 1_800_000_000_000;
    const provider = new FakeSandboxProvider({ now: () => now });
    const allocation = await provider.allocate(request(profile(), now));
    const broker = new FakeSandboxCredentialBroker(() => now);
    const credential = await broker.mint({
      projectId: "project-1", workflowRunId: "run-1", attemptId: "attempt-1", attemptLeaseId: "lease-1",
      maxCostUsd: 1, expiresAt: now + 60_000,
    });

    const health = await reconcileSandboxOrphans({
      candidates: [{ allocation, attemptLeaseCurrent: false, credential }],
      providers: new Map([["FAKE", provider]]),
      credentialBroker: { mint: broker.mint.bind(broker), revoke: async () => { throw new Error("revocation unavailable"); } },
      now,
    });

    expect(health.failed).toBe(1);
    expect(provider.inventory()[0].state).toBe("TERMINATED");
  });
});

function request(selectedProfile: SandboxProfileSnapshot, requestedAt: number, resourceName = "mc-attempt-0123456789abcdef") {
  return {
    resourceName, projectId: "project-1", workOrderId: "work-order-1", workflowRunId: "run-1", attemptId: "attempt-1",
    attemptLeaseId: "lease-1", manifestDigest: "sha256:manifest", sourceSha: "a".repeat(40), profile: selectedProfile, requestedAt,
  };
}

function profile(): SandboxProfileSnapshot {
  return {
    schema: "factory-sandbox-profile/v1", profileKey: "fake-standard", version: 1, provider: "FAKE",
    providerProfile: "deterministic", providerProfileVersion: "v1", machine: { image: "fake:test", cpu: 2, memoryMb: 4096, diskGb: 20 },
    supervisor: { version: "mission-control-supervisor/v1", transport: "SSH" },
    runtime: { maxRuntimeMs: 60_000, resultPollIntervalMs: 250, resultRetentionMs: 86_400_000 },
    network: { egress: "UNRESTRICTED", egressAllowlist: [], publicIngress: false, exposedPorts: [] },
    credentials: { inference: "ATTEMPT_SCOPED_OPENROUTER", repositoryAccess: "CONTROL_PLANE_SNAPSHOT", githubAuthority: "NONE", providerAuthority: "NONE" },
    spend: { maxUsd: 1, enforcement: "PROVIDER_KEY_LIMIT" }, teardown: { terminateOnEveryTerminalState: true, verifyResourceAbsent: true, supportsResume: false },
    preview: { mode: "DISABLED" }, readiness: { state: "DEGRADED", checkedAt: 1, reason: "Fake provider", egressEnforcementProven: false },
  };
}
