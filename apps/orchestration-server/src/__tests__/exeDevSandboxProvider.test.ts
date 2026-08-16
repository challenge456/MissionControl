import { describe, expect, it, vi } from "vitest";
import { canonicalHash } from "@mission-control/shared";
import { ExeDevSandboxProvider, type ExeDevTransport } from "../exeDevSandboxProvider.js";
import type { SandboxProfileSnapshot } from "../sandboxProvider.js";

describe("ExeDevSandboxProvider", () => {
  it("keeps production dispatch blocked until live lifecycle certification is recorded", async () => {
    const provider = new ExeDevSandboxProvider({ lobbyJson: vi.fn(), vmText: vi.fn() } as ExeDevTransport);
    const uncertified = profile();
    uncertified.readiness.liveCertified = false;

    await expect(provider.validateProfile(uncertified)).resolves.toMatchObject({
      dispatchable: false,
      readiness: "BLOCKED",
      errors: expect.arrayContaining([expect.stringMatching(/Live exe\.dev lifecycle certification/)]),
    });
  });

  it("allocates the exact Attempt resource without public ports or embedded credentials", async () => {
    const lobbyJson = vi.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ vm_name: "mc-attempt-0123456789abcdef", id: "vm-1", status: "ready", image: "debian:bookworm" });
    const provider = new ExeDevSandboxProvider({ lobbyJson, vmText: vi.fn().mockResolvedValue("123") } as ExeDevTransport);
    const allocation = await provider.allocate(request(profile()));

    expect(allocation.state).toBe("READY");
    const createCommand = lobbyJson.mock.calls[2][0] as string[];
    expect(createCommand).toEqual(expect.arrayContaining([
      "new", "--name=mc-attempt-0123456789abcdef", "--cpu=2", "--memory=4096MB", "--disk=20GB", "--image=debian:bookworm",
    ]));
    expect(createCommand.join(" ")).not.toMatch(/--port|--env|token|secret|key=/i);
  });

  it("blocks allocation when exe.dev would attach an automatic integration", async () => {
    const lobbyJson = vi.fn().mockResolvedValueOnce([{ name: "github", attach: "auto:all" }]);
    const provider = new ExeDevSandboxProvider({ lobbyJson, vmText: vi.fn() } as ExeDevTransport);

    await expect(provider.allocate(request(profile()))).rejects.toThrow(/automatic integration/);
    expect(lobbyJson).toHaveBeenCalledTimes(1);
  });

  it("uploads the frozen inputs over SSH and confirms exact-name absence on teardown", async () => {
    const lobbyJson = vi.fn()
      .mockResolvedValueOnce([{ vm_name: "mc-attempt-0123456789abcdef", id: "vm-1", status: "ready" }])
      .mockResolvedValueOnce({ removed: true })
      .mockResolvedValueOnce([]);
    const vmText = vi.fn().mockResolvedValue("321");
    const provider = new ExeDevSandboxProvider({ lobbyJson, vmText } as ExeDevTransport);
    const allocation = { provider: "EXE_DEV" as const, providerResourceId: "vm-1", resourceName: "mc-attempt-0123456789abcdef", state: "READY" as const, createdAt: 1 };
    const executionManifest = manifest();
    await provider.start({
      allocation, executionManifest, workOrderId: "w1", workOrderRevisionNumber: 1, workflowRunId: "r1", attemptId: "a1",
      manifestDigest: `sha256:${canonicalHash(executionManifest)}`, sourceSha: "a".repeat(40), profileDigest: "sha256:profile",
      environmentDescriptor: { provider: "EXE_DEV", image: "debian:bookworm" }, repositoryArchive: Buffer.from("bundle"), supervisorSource: "// supervisor",
      executor: { command: "codex", args: ["exec"], prompt: "p", allowedPaths: ["src/**"], timeoutMs: 60_000 },
      environment: { OPENAI_API_KEY: "attempt-only", OPENAI_BASE_URL: "https://openrouter.ai/api/v1" },
    });

    expect(vmText).toHaveBeenCalledTimes(4);
    const uploadedConfig = JSON.parse(Buffer.from(vmText.mock.calls[2][2], "base64").toString("utf8"));
    expect(uploadedConfig.executionManifest).toEqual(executionManifest);
    expect(vmText.mock.calls[3][1]).toContain("git clone --quiet");
    expect(vmText.mock.calls[3][1]).not.toContain("attempt-only");
    const receipt = await provider.terminate(allocation);
    expect(receipt.resourceAbsent).toBe(true);
    expect(lobbyJson.mock.calls[1][0]).toEqual(["rm", allocation.resourceName, "--json"]);
  });

  it("fails closed when teardown cannot confirm exact absence", async () => {
    const name = "mc-attempt-0123456789abcdef";
    const record = { vm_name: name, id: "vm-1", status: "ready" };
    const lobbyJson = vi.fn().mockResolvedValue([record]);
    let now = 1;
    const provider = new ExeDevSandboxProvider(
      { lobbyJson, vmText: vi.fn() } as ExeDevTransport,
      () => now,
      async (duration) => { now += duration; },
    );
    await expect(provider.terminate({ provider: "EXE_DEV", providerResourceId: "vm-1", resourceName: name, state: "READY", createdAt: 1 }))
      .rejects.toThrow(/remains in exe.dev inventory/);
  });
});

function request(selectedProfile: SandboxProfileSnapshot) {
  return {
    resourceName: "mc-attempt-0123456789abcdef", projectId: "p1", workOrderId: "w1", workflowRunId: "r1", attemptId: "a1",
    attemptLeaseId: "l1", manifestDigest: "sha256:manifest", sourceSha: "a".repeat(40), profile: selectedProfile, requestedAt: 1,
  };
}

function profile(): SandboxProfileSnapshot {
  return {
    schema: "factory-sandbox-profile/v1", profileKey: "exe-standard", version: 1, provider: "EXE_DEV",
    providerProfile: "standard", providerProfileVersion: "v1", machine: { image: "debian:bookworm", cpu: 2, memoryMb: 4_096, diskGb: 20 },
    supervisor: { version: "mission-control-supervisor/v1", transport: "SSH" },
    runtime: { maxRuntimeMs: 60_000, resultPollIntervalMs: 250, resultRetentionMs: 86_400_000 },
    network: { egress: "UNRESTRICTED", egressAllowlist: [], publicIngress: false, exposedPorts: [] },
    credentials: { inference: "ATTEMPT_SCOPED_OPENROUTER", repositoryAccess: "CONTROL_PLANE_SNAPSHOT", githubAuthority: "NONE", providerAuthority: "NONE" },
    spend: { maxUsd: 1, enforcement: "PROVIDER_KEY_LIMIT" }, teardown: { terminateOnEveryTerminalState: true, verifyResourceAbsent: true, supportsResume: false },
    preview: { mode: "DISABLED" }, readiness: { state: "DEGRADED", checkedAt: 1, reason: "Unrestricted egress", egressEnforcementProven: false, liveCertified: true },
  };
}

function manifest() {
  return {
    version: "factory-execution-manifest/v1",
    causation: { workOrderId: "w1", workOrderRevisionNumber: 1, workflowRunId: "r1" },
    repository: { baseSha: "a".repeat(40) },
    harness: { executionBackend: "remote-sandbox", pullRequestAuthority: "CONTROL_PLANE_ONLY" },
    sandbox: {
      profileDigest: "sha256:profile", supervisorVersion: "mission-control-supervisor/v1",
      credentialGrants: [{ secretValueIncluded: false, githubAuthority: "NONE", providerAuthority: "NONE" }],
    },
  };
}
