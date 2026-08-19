import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { FakeSandboxProvider } from "../fakeSandboxProvider.js";
import { FakeSandboxCredentialBroker } from "../sandboxCredentials.js";
import { InMemoryRemoteSandboxJournal, RemoteSandboxExecutionError, RemoteSandboxRuntime } from "../remoteSandboxRuntime.js";
import { createPatchDescriptor, createSandboxResultBundle, encodeSandboxResultBundle, parseAndValidateSandboxResultBundle } from "../sandboxResultBundle.js";
import { runSandboxSupervisor, standaloneSandboxSupervisorSource } from "../sandboxSupervisor.js";
import { sandboxProfileDigest, stableSandboxResourceName, validateSandboxProfile, type SandboxProfileSnapshot } from "../sandboxProvider.js";
import { canonicalHash } from "@mission-control/shared";

const execFileAsync = promisify(execFile);
const sourceSha = "0123456789abcdef0123456789abcdef01234567";

describe("remote sandbox contracts", () => {
  it("normalizes unrestricted egress as dispatchable but DEGRADED", () => {
    const validation = validateSandboxProfile(profile());
    expect(validation).toMatchObject({ valid: true, dispatchable: true, readiness: "DEGRADED" });
    expect(validation.warnings).toContain("Provider egress is unrestricted; the profile must be visibly DEGRADED.");
    expect(stableSandboxResourceName({ projectId: "p1", workflowRunId: "r1", attemptId: "a1" })).toMatch(/^mc-attempt-[a-f0-9]{16}$/);
  });

  it("rejects public ports, unproven restricted egress, and resumable profiles", () => {
    const invalid = profile();
    (invalid.network as any).publicIngress = true;
    invalid.network.exposedPorts = [3000];
    invalid.network.egress = "RESTRICTED_ALLOWLIST";
    invalid.readiness.egressEnforcementProven = false;
    (invalid.teardown as any).supportsResume = true;
    const validation = validateSandboxProfile(invalid);
    expect(validation.dispatchable).toBe(false);
    expect(validation.errors.join(" ")).toMatch(/Public ingress/);
    expect(validation.errors.join(" ")).toMatch(/Restricted egress/);
    expect(validation.errors.join(" ")).toMatch(/non-resumable/);
  });

  it("detects result bundle and patch tampering", () => {
    const bundle = resultBundle();
    const expected = {
      attemptId: bundle.attemptId,
      workOrderId: bundle.workOrderId,
      workOrderRevisionNumber: bundle.workOrderRevisionNumber,
      workflowRunId: bundle.workflowRunId,
      manifestDigest: bundle.manifestDigest,
      profileDigest: bundle.profileDigest,
      sourceSha: bundle.sourceSha,
      supervisorVersion: bundle.supervisorVersion,
      harness: bundle.harness,
      acceptanceCriterionIds: ["ac-1"],
      environment: bundle.environment,
      maxRuntimeMs: 60_000,
    };
    expect(parseAndValidateSandboxResultBundle(encodeSandboxResultBundle(bundle), expected).digest).toBe(bundle.digest);
    const tampered = { ...bundle, structuredResult: { ...bundle.structuredResult, summary: "tampered" } };
    expect(() => parseAndValidateSandboxResultBundle(Buffer.from(JSON.stringify(tampered)), expected)).toThrow(/digest is invalid/);
  });

  it("preserves a typed retryable failure when no accepted structured result exists", () => {
    const completed = resultBundle();
    const failed = createSandboxResultBundle({
      ...withoutDigest(completed),
      status: "TIMED_OUT",
      failure: {
        class: "RETRYABLE_EXECUTION",
        code: "EXECUTOR_TIMEOUT",
        stage: "EXECUTOR",
        retryable: true,
        summary: "Remote executor exceeded the frozen Attempt timeout.",
      },
      resultProvenance: {
        ...completed.resultProvenance,
        source: "NONE",
      },
      structuredResult: {
        ...completed.structuredResult,
        status: "FAILED",
        completedAcceptanceCriterionIds: [],
        incompleteAcceptanceCriterionIds: [],
        unknownAcceptanceCriterionIds: [],
      },
    });
    const parsed = parseAndValidateSandboxResultBundle(encodeSandboxResultBundle(failed), {
      attemptId: failed.attemptId,
      workOrderId: failed.workOrderId,
      workOrderRevisionNumber: failed.workOrderRevisionNumber,
      workflowRunId: failed.workflowRunId,
      manifestDigest: failed.manifestDigest,
      profileDigest: failed.profileDigest,
      sourceSha: failed.sourceSha,
      supervisorVersion: failed.supervisorVersion,
      harness: failed.harness,
      acceptanceCriterionIds: ["ac-1"],
      environment: failed.environment,
      maxRuntimeMs: 60_000,
    });
    expect(parsed.failure).toMatchObject({
      class: "RETRYABLE_EXECUTION",
      code: "EXECUTOR_TIMEOUT",
      retryable: true,
    });
  });
});

describe("RemoteSandboxRuntime", () => {
  it("runs the deterministic provider path and proves credential/resource absence before returning", async () => {
    const selectedProfile = profile();
    const bundle = resultBundle(selectedProfile);
    const provider = new FakeSandboxProvider({ result: encodeSandboxResultBundle(bundle) });
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);
    const result = await runtime.execute(request(selectedProfile));

    expect(result.bundle.digest).toBe(bundle.digest);
    expect(result.termination.resourceAbsent).toBe(true);
    expect(credentials.active.size).toBe(0);
    expect(journal.allocationRequests).toHaveLength(1);
    expect(journal.allocationRequests[0].workflowRunId).toBe("workflow-doc-1");
    expect(provider.startRequest(stableSandboxResourceName({
      projectId: "project-1",
      workflowRunId: "run-1",
      attemptId: "attempt-1",
    }))?.workflowRunId).toBe("run-1");
    expect(journal.issuedCredentials[0]).not.toHaveProperty("secret");
    expect(journal.events.map((event) => event.type)).toEqual([
      "SANDBOX_REQUESTED",
      "SANDBOX_ALLOCATED",
      "SANDBOX_STARTED",
      "SANDBOX_RESULT_RECEIVED",
      "SANDBOX_CREDENTIAL_REVOKED",
      "SANDBOX_TERMINATION_REQUESTED",
      "SANDBOX_TERMINATED",
    ]);
    expect(provider.calls.at(-1)).toMatch(/^terminate:/);
  });

  it("revokes and tears down after executor startup failure", async () => {
    const selectedProfile = profile();
    const provider = new FakeSandboxProvider({ failAt: "START" });
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    await expect(runtime.execute(request(selectedProfile))).rejects.toThrow(/fake start failure/);
    expect(credentials.active.size).toBe(0);
    expect(journal.revokedCredentials).toHaveLength(1);
    expect(journal.terminations).toHaveLength(1);
    expect(journal.events.map((event) => event.type)).toContain("SANDBOX_FAILED");
  });

  it("classifies a result transport interruption as retryable infrastructure and cleans exactly", async () => {
    const selectedProfile = profile();
    const provider = new FakeSandboxProvider({ failAt: "FETCH" });
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    const failure = await runtime.execute(request(selectedProfile)).catch((error) => error);
    expect(failure).toBeInstanceOf(RemoteSandboxExecutionError);
    expect(failure.failure).toMatchObject({ class: "RETRYABLE_INFRA", code: "TRANSPORT_RESULT_READ", retryable: true });
    expect(credentials.active.size).toBe(0);
    expect(journal.revokedCredentials).toHaveLength(1);
    expect(journal.terminations).toHaveLength(1);
  });

  it("rejects a stale Attempt identity as a non-retryable result and cleans exactly", async () => {
    const selectedProfile = profile();
    const stale = createSandboxResultBundle({
      ...withoutDigest(resultBundle(selectedProfile)),
      attemptId: "stale-attempt",
      resultProvenance: {
        ...resultBundle(selectedProfile).resultProvenance,
        context: { attemptId: "stale-attempt", manifestDigest: "sha256:manifest", sourceSha },
      },
    });
    const provider = new FakeSandboxProvider({ result: encodeSandboxResultBundle(stale) });
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    const failure = await runtime.execute(request(selectedProfile)).catch((error) => error);
    expect(failure).toBeInstanceOf(RemoteSandboxExecutionError);
    expect(failure.failure).toMatchObject({ class: "NON_RETRYABLE_RESULT", code: "RESULT_BUNDLE_INVALID", retryable: false });
    expect(credentials.active.size).toBe(0);
    expect(journal.terminations).toHaveLength(1);
  });

  it("fails closed on cancellation and never converts it into an automatic retry", async () => {
    const selectedProfile = profile();
    const controller = new AbortController();
    controller.abort(new Error("Operator canceled the Attempt."));
    const provider = new FakeSandboxProvider();
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    const failure = await runtime.execute({ ...request(selectedProfile), signal: controller.signal }).catch((error) => error);
    expect(failure).toBeInstanceOf(RemoteSandboxExecutionError);
    expect(failure.failure).toMatchObject({ class: "UNKNOWN", code: "ATTEMPT_CANCELED", retryable: false });
    expect(credentials.active.size).toBe(0);
    expect(journal.terminations).toHaveLength(1);
  });

  it("classifies the frozen execution deadline as bounded retryable execution", async () => {
    const selectedProfile = profile();
    let now = 1;
    const provider = new FakeSandboxProvider({ now: () => now });
    const credentials = new FakeSandboxCredentialBroker(() => now);
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal, () => now, async () => { now += selectedProfile.runtime.maxRuntimeMs; });

    const failure = await runtime.execute(request(selectedProfile)).catch((error) => error);
    expect(failure).toBeInstanceOf(RemoteSandboxExecutionError);
    expect(failure.failure).toMatchObject({ class: "RETRYABLE_EXECUTION", code: "EXECUTOR_TIMEOUT", retryable: true });
    expect(credentials.active.size).toBe(0);
    expect(journal.terminations).toHaveLength(1);
  });

  it("rechecks the atomic result path after observing supervisor exit", async () => {
    const selectedProfile = profile();
    const provider = new FakeSandboxProvider({
      result: encodeSandboxResultBundle(resultBundle(selectedProfile)),
      diagnostics: { phase: "EXECUTOR_FINISHED", supervisorProcessRunning: false },
    });
    const fetchResult = provider.fetchResult.bind(provider);
    let resultReads = 0;
    provider.fetchResult = async (allocation) => {
      resultReads += 1;
      return resultReads === 1 ? null : await fetchResult(allocation);
    };
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    const result = await runtime.execute(request(selectedProfile));

    expect(result.bundle.status).toBe("COMPLETED");
    expect(resultReads).toBe(2);
    expect(credentials.active.size).toBe(0);
    expect(result.termination.resourceAbsent).toBe(true);
  });

  it("distinguishes a supervisor crash after execution from a generic timeout", async () => {
    const selectedProfile = profile();
    const provider = new FakeSandboxProvider({
      diagnostics: { phase: "EXECUTOR_FINISHED", supervisorProcessRunning: false },
    });
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    const failure = await runtime.execute(request(selectedProfile)).catch((error) => error);
    expect(failure).toBeInstanceOf(RemoteSandboxExecutionError);
    expect(failure.failure).toMatchObject({ class: "UNKNOWN", code: "SUPERVISOR_EXITED_BEFORE_RESULT", retryable: false });
    expect(journal.events.find((event) => event.type === "SANDBOX_FAILED")?.metadata)
      .toMatchObject({ diagnostics: { phase: "EXECUTOR_FINISHED", supervisorProcessRunning: false } });
    expect(credentials.active.size).toBe(0);
    expect(journal.terminations).toHaveLength(1);
  });

  it("durably records teardown failure after revoking the Attempt credential", async () => {
    const selectedProfile = profile();
    const bundle = resultBundle(selectedProfile);
    const provider = new FakeSandboxProvider({
      result: encodeSandboxResultBundle(bundle),
      failAt: "TERMINATE",
    });
    const credentials = new FakeSandboxCredentialBroker();
    const journal = new InMemoryRemoteSandboxJournal();
    const runtime = new RemoteSandboxRuntime(provider, credentials, journal);

    await expect(runtime.execute(request(selectedProfile))).rejects.toThrow(
      /Deterministic fake teardown failure/,
    );

    expect(credentials.active.size).toBe(0);
    expect(journal.revokedCredentials).toHaveLength(1);
    expect(journal.terminations).toHaveLength(0);
    expect(journal.events).toContainEqual(expect.objectContaining({
      type: "SANDBOX_FAILED",
      metadata: expect.objectContaining({
        phase: "CLEANUP",
        credentialRevoked: true,
        resourceAbsenceProven: false,
      }),
    }));
    expect(provider.inventory()[0].state).not.toBe("TERMINATED");
  });
});

describe("sandbox supervisor", () => {
  it("pins the source, runs a bounded executor, and writes a content-addressed binary patch", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mc-supervisor-test-"));
    try {
      await execFileAsync("git", ["init", "-q"], { cwd: directory });
      await writeFile(path.join(directory, "README.md"), "before\n");
      await execFileAsync("git", ["add", "README.md"], { cwd: directory });
      await execFileAsync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "base"], { cwd: directory });
      const head = (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: directory })).stdout.trim();
      const script = [
        "const fs=require('fs');",
        "fs.writeFileSync('README.md','after\\n');",
        `process.stdout.write(JSON.stringify(${JSON.stringify(structuredResult())}));`,
      ].join("");
      const outputPath = path.join(directory, "result.json");
      const executionManifest = remoteExecutionManifest({ sourceSha: head, profileDigest: "sha256:profile" });
      const bundle = await runSandboxSupervisor({
        executionManifest,
        attemptId: "attempt-1",
        workOrderId: "work-order-1",
        workOrderRevisionNumber: 1,
        workflowRunId: "run-1",
        manifestDigest: `sha256:${canonicalHash(executionManifest)}`,
        profileDigest: "sha256:profile",
        sourceSha: head,
        environmentDescriptor: { provider: "FAKE", image: "debian:bookworm" },
        repositoryRoot: directory,
        outputPath,
        executor: { command: process.execPath, args: ["-e", script], timeoutMs: 5_000 },
        environment: {},
      });
      expect(bundle.status).toBe("COMPLETED");
      expect(bundle.patch.byteLength).toBeGreaterThan(0);
      expect(JSON.parse(await readFile(outputPath, "utf8")).digest).toBe(bundle.digest);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("reconstructs one terminal Codex JSONL result with exact context and atomic persistence", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mc-standalone-jsonl-"));
    try {
      const head = await initializeRepository(directory);
      const executionManifest = remoteExecutionManifest({ sourceSha: head, profileDigest: "sha256:profile" });
      const manifestDigest = `sha256:${canonicalHash(executionManifest)}`;
      const supervisorPath = path.join(directory, "supervisor.mjs");
      const configPath = path.join(directory, "config.json");
      const outputPath = path.join(directory, "result.json");
      const diagnosticsPath = path.join(directory, "diagnostics.json");
      const jsonl = [
        JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: JSON.stringify(structuredResult()) } }),
        JSON.stringify({ type: "turn.completed", usage: { input_tokens: 12, output_tokens: 8 } }),
      ].join("\n");
      await writeFile(supervisorPath, standaloneSandboxSupervisorSource());
      await writeFile(configPath, JSON.stringify({
        executionManifest,
        attemptId: "attempt-1",
        workOrderId: "work-order-1",
        workOrderRevisionNumber: 1,
        workflowRunId: "run-1",
        manifestDigest,
        profileDigest: "sha256:profile",
        sourceSha: head,
        environmentDescriptor: { provider: "FAKE", image: "debian:bookworm" },
        repositoryRoot: directory,
        outputPath,
        diagnosticsPath,
        executor: {
          command: process.execPath,
          args: ["-e", `process.stdout.write(${JSON.stringify(jsonl)})`],
          resultPath: path.join(directory, "executor-result.json"),
          timeoutMs: 5_000,
        },
        environment: {},
      }));

      await execFileAsync(process.execPath, [supervisorPath, configPath], { cwd: directory });
      const bundle = parseAndValidateSandboxResultBundle(Buffer.from(await readFile(outputPath)), {
        attemptId: "attempt-1",
        workOrderId: "work-order-1",
        workOrderRevisionNumber: 1,
        workflowRunId: "run-1",
        manifestDigest,
        profileDigest: "sha256:profile",
        sourceSha: head,
        supervisorVersion: "mission-control-supervisor/v1",
        harness: harnessIdentity(),
        acceptanceCriterionIds: ["ac-1"],
        environment: { provider: "FAKE", image: "debian:bookworm" },
        maxRuntimeMs: 60_000,
      });
      expect(bundle.status).toBe("COMPLETED");
      expect(bundle.resultProvenance).toMatchObject({
        source: "CODEX_JSONL_RECONSTRUCTION",
        outputFile: { state: "ABSENT" },
        context: { attemptId: "attempt-1", manifestDigest, sourceSha: head },
      });
      expect(bundle.executor.resultOutput).toEqual({
        state: "ABSENT",
        byteLength: null,
        digest: null,
        tail: "",
        validationIssues: [],
      });
      expect(bundle.usage).toMatchObject({ inputTokens: 12, outputTokens: 8, providerCostUsd: null, inferenceCostUsd: null });
      expect(JSON.parse(await readFile(diagnosticsPath, "utf8"))).toMatchObject({ phase: "EXECUTOR_FINISHED", failure: null });
      expect((await readdir(directory)).some((name) => name.includes(".tmp-"))).toBe(false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("preserves diagnostics but no final result when the supervisor crashes after execution", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mc-standalone-crash-"));
    try {
      const head = await initializeRepository(directory);
      const executionManifest = remoteExecutionManifest({ sourceSha: head, profileDigest: "sha256:profile" });
      const manifestDigest = `sha256:${canonicalHash(executionManifest)}`;
      const supervisorPath = path.join(directory, "supervisor.mjs");
      const configPath = path.join(directory, "config.json");
      const outputPath = path.join(directory, "result.json");
      const diagnosticsPath = path.join(directory, "diagnostics.json");
      await writeFile(supervisorPath, standaloneSandboxSupervisorSource());
      await writeFile(configPath, JSON.stringify({
        executionManifest,
        attemptId: "attempt-1",
        workOrderId: "work-order-1",
        workOrderRevisionNumber: 1,
        workflowRunId: "run-1",
        manifestDigest,
        profileDigest: "sha256:profile",
        sourceSha: head,
        environmentDescriptor: { provider: "FAKE", image: "debian:bookworm" },
        repositoryRoot: directory,
        outputPath,
        diagnosticsPath,
        executor: { command: process.execPath, args: ["-e", `process.stdout.write(${JSON.stringify(JSON.stringify(structuredResult()))})`], timeoutMs: 5_000 },
        environment: {},
        faultInjection: { crashAfterDiagnostics: true },
      }));

      await expect(execFileAsync(process.execPath, [supervisorPath, configPath], { cwd: directory })).rejects.toThrow();
      await expect(readFile(outputPath)).rejects.toMatchObject({ code: "ENOENT" });
      expect(JSON.parse(await readFile(diagnosticsPath, "utf8"))).toMatchObject({
        attemptId: "attempt-1",
        manifestDigest,
        phase: "EXECUTOR_FINISHED",
        resultProvenance: { source: "EXECUTOR_STDOUT" },
      });
      expect((await readdir(directory)).some((name) => name.includes(".tmp-"))).toBe(false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("redacts an Attempt credential before truncating crash diagnostics", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "mc-standalone-secret-"));
    try {
      const head = await initializeRepository(directory);
      const executionManifest = remoteExecutionManifest({ sourceSha: head, profileDigest: "sha256:profile" });
      const manifestDigest = `sha256:${canonicalHash(executionManifest)}`;
      const supervisorPath = path.join(directory, "supervisor.mjs");
      const configPath = path.join(directory, "config.json");
      const outputPath = path.join(directory, "result.json");
      const diagnosticsPath = path.join(directory, "diagnostics.json");
      const credential = `sk-or-v1-${"A".repeat(80)}`;
      const stdout = `${credential} ${"x".repeat(15_995)}`;
      await writeFile(supervisorPath, standaloneSandboxSupervisorSource());
      await writeFile(configPath, JSON.stringify({
        executionManifest,
        attemptId: "attempt-1",
        workOrderId: "work-order-1",
        workOrderRevisionNumber: 1,
        workflowRunId: "run-1",
        manifestDigest,
        profileDigest: "sha256:profile",
        sourceSha: head,
        environmentDescriptor: { provider: "FAKE", image: "debian:bookworm" },
        repositoryRoot: directory,
        outputPath,
        diagnosticsPath,
        executor: {
          command: process.execPath,
          args: ["-e", `process.stdout.write(${JSON.stringify(stdout)})`],
          timeoutMs: 5_000,
        },
        environment: {},
        faultInjection: { crashAfterDiagnostics: true },
      }));

      await expect(execFileAsync(process.execPath, [supervisorPath, configPath], { cwd: directory })).rejects.toThrow();
      const diagnostics = await readFile(diagnosticsPath, "utf8");
      expect(diagnostics).not.toContain(credential);
      expect(diagnostics).not.toContain("A".repeat(32));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

async function initializeRepository(directory: string) {
  await execFileAsync("git", ["init", "-q"], { cwd: directory });
  await writeFile(path.join(directory, "README.md"), "before\n");
  await execFileAsync("git", ["add", "README.md"], { cwd: directory });
  await execFileAsync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "base"], { cwd: directory });
  return (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: directory })).stdout.trim();
}

function profile(): SandboxProfileSnapshot {
  return {
    schema: "factory-sandbox-profile/v1",
    profileKey: "exe-standard",
    version: 1,
    provider: "FAKE",
    providerProfile: "standard",
    providerProfileVersion: "2026-08-15",
    machine: { image: "debian:bookworm", cpu: 2, memoryMb: 4_096, diskGb: 20 },
    supervisor: { version: "mission-control-supervisor/v1", transport: "SSH" },
    runtime: { maxRuntimeMs: 300_000, resultPollIntervalMs: 250, resultRetentionMs: 86_400_000 },
    network: { egress: "UNRESTRICTED", egressAllowlist: [], publicIngress: false, exposedPorts: [] },
    credentials: { inference: "ATTEMPT_SCOPED_OPENROUTER", repositoryAccess: "CONTROL_PLANE_SNAPSHOT", githubAuthority: "NONE", providerAuthority: "NONE" },
    spend: { maxUsd: 2, enforcement: "PROVIDER_KEY_LIMIT" },
    teardown: { terminateOnEveryTerminalState: true, verifyResourceAbsent: true, supportsResume: false },
    preview: { mode: "DISABLED" },
    readiness: { state: "DEGRADED", checkedAt: Date.now(), reason: "Fake provider; unrestricted egress represented honestly.", egressEnforcementProven: false },
  };
}

function structuredResult() {
  return {
    schema: "factory-result/v1" as const,
    status: "COMPLETED" as const,
    summary: "Implemented the requested change.",
    completedAcceptanceCriterionIds: ["ac-1"],
    incompleteAcceptanceCriterionIds: [],
    unknownAcceptanceCriterionIds: [],
    verificationCommands: ["pnpm test"],
    knownRisks: [],
    nextAction: "Review the pull request.",
  };
}

function resultBundle(selectedProfile = profile()) {
  return createSandboxResultBundle({
    schema: "factory-sandbox-result/v1",
    attemptId: "attempt-1",
    workOrderId: "work-order-1",
    workOrderRevisionNumber: 1,
    workflowRunId: "run-1",
    manifestDigest: "sha256:manifest",
    profileDigest: sandboxProfileDigest(selectedProfile),
    sourceSha,
    supervisorVersion: "mission-control-supervisor/v1",
    harness: harnessIdentity(),
    environment: { provider: "FAKE", image: "debian:bookworm" },
    startedAt: 1,
    finishedAt: 2,
    status: "COMPLETED",
    resultProvenance: {
      source: "OUTPUT_FILE",
      outputFile: { state: "VALID", byteLength: 100 },
      jsonl: { byteLength: 0, lineCount: 0, malformedLineCount: 0, terminalCompletedCount: 0, terminalFailureCount: 0, validCandidateCount: 0 },
      context: { attemptId: "attempt-1", manifestDigest: "sha256:manifest", sourceSha },
    },
    structuredResult: structuredResult(),
    changedFiles: ["a"],
    diff: { filesChanged: 1, linesAdded: 1, linesDeleted: 0 },
    commandResults: [{ commandClass: "EXECUTOR", exitCode: 0, durationMs: 1, timedOut: false }],
    verificationInputs: { reportedCommands: ["pnpm test"] },
    artifacts: [],
    events: [{ type: "RESULT_WRITTEN", occurredAt: 2 }],
    patch: createPatchDescriptor(Buffer.from("diff --git a/a b/a\n")),
    executor: { exitCode: 0, stdoutDigest: "sha256:stdout", stderrDigest: "sha256:stderr", stdoutTail: "", stderrTail: "" },
    usage: { providerCostUsd: 0.01, inferenceCostUsd: 0.02, inputTokens: 10, outputTokens: 5, providerRuntimeMs: 1, observedAt: 2, enforcement: "PROVIDER_REPORTED" },
  });
}

function withoutDigest(bundle: ReturnType<typeof resultBundle>) {
  const { digest: _digest, ...value } = bundle;
  return value;
}

function request(selectedProfile: SandboxProfileSnapshot) {
  return {
    projectId: "project-1",
    workOrderId: "work-order-1",
    workOrderRevisionNumber: 1,
    workflowRunId: "workflow-doc-1",
    attemptId: "attempt-1",
    attemptLeaseId: "lease-1",
    executionManifest: {
      causation: { workflowRunId: "run-1" },
      harness: harnessIdentity(),
      intent: { acceptanceCriterionIds: ["ac-1"] },
    },
    manifestDigest: "sha256:manifest",
    sourceSha,
    profile: selectedProfile,
    repositoryBundle: Buffer.from("bundle"),
    supervisorSource: "// supervisor",
    executor: { command: "codex", args: ["exec"], model: "openai/gpt-5", prompt: "Implement it", allowedPaths: ["src/**"], timeoutMs: 300_000 },
  };
}

function remoteExecutionManifest(input: { sourceSha: string; profileDigest: string }) {
  return {
    version: "factory-execution-manifest/v1",
    causation: { workOrderId: "work-order-1", workOrderRevisionNumber: 1, workflowRunId: "run-1" },
    repository: { baseSha: input.sourceSha },
    intent: { acceptanceCriterionIds: ["ac-1"] },
    harness: { ...harnessIdentity(), executionBackend: "remote-sandbox", pullRequestAuthority: "CONTROL_PLANE_ONLY" },
    sandbox: {
      profileDigest: input.profileDigest,
      supervisorVersion: "mission-control-supervisor/v1",
      credentialGrants: [{ secretValueIncluded: false, githubAuthority: "NONE", providerAuthority: "NONE" }],
    },
  };
}

function harnessIdentity() {
  return {
    adapter: "codex",
    version: "v1",
    harnessId: "codex-cli",
    harnessVersion: "0.146.0",
    provider: "openai",
    model: "openai/gpt-5.1-codex-mini",
  };
}
