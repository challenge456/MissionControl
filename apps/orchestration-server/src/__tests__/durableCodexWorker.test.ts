import { execFile } from "node:child_process";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it, vi } from "vitest";
import {
  assertGitBoundary,
  assertSafeGitPublicationConfig,
  captureGitBoundary,
  completeChangedFileSet,
  DurableCodexWorker,
  prepareWorktree,
  pullRequestBody,
  runVerificationCommands,
} from "../durableCodexWorker.js";

const exec = promisify(execFile);

describe("durable Codex worker Git boundary", () => {
  it("creates and recovers the exact linked worktree without resetting partial changes", async () => {
    const repository = await mkdtemp(path.join(tmpdir(), "mc-worker-repo-"));
    await exec("git", ["init", "-b", "main"], { cwd: repository });
    await exec("git", ["config", "user.name", "Test"], { cwd: repository });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: repository });
    await writeFile(path.join(repository, "README.md"), "base\n");
    await exec("git", ["add", "README.md"], { cwd: repository });
    await exec("git", ["commit", "-m", "base"], { cwd: repository });
    const worktree = path.join(repository, ".mission-control", "worktrees", "attempt-1");
    const created = await prepareWorktree({ repositoryRoot: repository, worktree, branch: "mc/attempt-1", baseBranch: "main" });
    expect(created.recovered).toBe(false);
    await mkdir(path.join(worktree, "docs"), { recursive: true });
    await writeFile(path.join(worktree, "docs", "proof.md"), "partial\n");
    const recovered = await prepareWorktree({
      repositoryRoot: repository, worktree, branch: "mc/attempt-1", baseBranch: "main", checkpointBaseSha: created.baseSha,
    });
    expect(recovered.recovered).toBe(true);
    await expect(completeChangedFileSet(worktree, created.baseSha)).resolves.toEqual(["docs/proof.md"]);
  }, 180_000);

  it("renders exact Mission-to-PR lineage in the pull request body", () => {
    const body = pullRequestBody({
      runId: "run-7",
      factoryConfigurationDigest: "sha256:factory",
      lineage: { missionId: "mission-1", missionPlanId: "plan-2", workOrderId: "wo-3", taskId: "task-4", workflowRunId: "attempt-5" },
      scopes: [{ id: "scope-1", name: "Docs", includePaths: ["docs/**"], excludePaths: [] }],
    }, "abc123");
    expect(body).toContain("missionId: `mission-1`");
    expect(body).toContain("workflowRunId: `attempt-5`");
    expect(body).toContain("commit: `abc123`");
    expect(body).toContain("Docs: `docs/**`");
  });

  it("rejects a configured worktree parent that resolves outside the repository", async () => {
    const repository = await mkdtemp(path.join(tmpdir(), "mc-worker-symlink-repo-"));
    const outside = await mkdtemp(path.join(tmpdir(), "mc-worker-outside-"));
    await exec("git", ["init", "-b", "main"], { cwd: repository });
    await exec("git", ["config", "user.name", "Test"], { cwd: repository });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: repository });
    await writeFile(path.join(repository, "README.md"), "base\n");
    await exec("git", ["add", "README.md"], { cwd: repository });
    await exec("git", ["commit", "-m", "base"], { cwd: repository });
    await symlink(outside, path.join(repository, ".mission-control"));

    await expect(prepareWorktree({
      repositoryRoot: repository,
      worktree: path.join(repository, ".mission-control", "worktrees", "attempt-escape"),
      branch: "mc/attempt-escape",
      baseBranch: "main",
    })).rejects.toThrow("must resolve inside the configured repository root");
  });

  it("blocks verification commands that change Git history", async () => {
    const repository = await mkdtemp(path.join(tmpdir(), "mc-worker-verifier-boundary-"));
    await exec("git", ["init", "-b", "main"], { cwd: repository });
    await exec("git", ["config", "user.name", "Test"], { cwd: repository });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: repository });
    await writeFile(path.join(repository, "README.md"), "base\n");
    await exec("git", ["add", "README.md"], { cwd: repository });
    await exec("git", ["commit", "-m", "base"], { cwd: repository });
    const worktree = path.join(repository, ".mission-control", "worktrees", "verifier-boundary");
    await prepareWorktree({ repositoryRoot: repository, worktree, branch: "mc/verifier-boundary", baseBranch: "main" });
    await mkdir(path.join(worktree, "docs"), { recursive: true });
    await writeFile(path.join(worktree, "docs", "proof.md"), "proof\n");
    const boundary = await captureGitBoundary(worktree);

    await runVerificationCommands(
      worktree,
      ["git add -A && git commit -m verifier-history-rewrite"],
      1,
      new AbortController().signal,
      async () => undefined
    );

    await expect(assertGitBoundary(worktree, boundary, {
      expectedBranch: "mc/verifier-boundary",
      expectedHead: boundary.headSha,
    })).rejects.toThrow("changed Git history");
  });

  it("rejects local Git settings that can redirect or intercept publication", async () => {
    const repository = await mkdtemp(path.join(tmpdir(), "mc-worker-unsafe-config-"));
    await exec("git", ["init", "-b", "main"], { cwd: repository });
    await exec("git", ["config", "url.https://attacker.invalid/.insteadOf", "https://github.com/"], { cwd: repository });
    await expect(assertSafeGitPublicationConfig(repository)).rejects.toThrow("publication-unsafe settings");
  });

  it("rechecks approved file scope after verification commands mutate the worktree", async () => {
    vi.stubEnv("MISSION_CONTROL_SERVICE_COMMAND_SECRET", "test-service-command-secret");
    const repository = await mkdtemp(path.join(tmpdir(), "mc-worker-post-verification-scope-"));
    await exec("git", ["init", "-b", "main"], { cwd: repository });
    await exec("git", ["config", "user.name", "Test"], { cwd: repository });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: repository });
    await writeFile(path.join(repository, "README.md"), "base\n");
    await exec("git", ["add", "README.md"], { cwd: repository });
    await exec("git", ["commit", "-m", "base"], { cwd: repository });

    const manifest = {
      workflowRunId: "run-scope-id",
      runId: "run-scope",
      claimId: "claim-scope",
      leaseExpiresAt: Date.now() + 60_000,
      executionAttemptNumber: 1,
      projectId: "project-1",
      workOrderId: "work-order-1",
      taskId: "task-1",
      factoryDefinitionVersionId: "factory-version-1",
      factoryConfigurationDigest: "factory-digest-1",
      repositoryId: "repository-1",
      repository: "jaydubya818/MissionControl",
      defaultBranch: "main",
      worktree: path.join(repository, ".mission-control", "worktrees", "scope"),
      branch: "codex/post-verification-scope-test",
      prompt: "Create docs/proof.md",
      allowedTools: [],
      scopes: [{ id: "scope-1", name: "Docs", includePaths: ["docs/**"], excludePaths: [] }],
      policy: {
        allowedCommands: ["printf 'outside\\n' > outside.txt"],
        maxCostUsd: 5,
        maxAttempts: 3,
        timeoutMinutes: 5,
        stopCondition: "Stop after verification",
      },
      github: { installationId: "123", appId: "123", accountLogin: "jaydubya818" },
      lineage: { workflowRunId: "run-scope-id" },
      checkpoint: {},
      cancellationRequested: false,
    };
    let claimed = false;
    let finalPayload: any;
    const client = {
      action: vi.fn(async (name: string, command: { payloadJson: string }) => {
        if (name === "serviceCommands:claimExecution") {
          if (claimed) return null;
          claimed = true;
          return manifest;
        }
        if (name === "serviceCommands:heartbeatExecution") {
          return { cancellationRequested: false, leaseExpiresAt: Date.now() + 60_000 };
        }
        if (name === "serviceCommands:finalizeExecution") {
          finalPayload = JSON.parse(command.payloadJson);
        }
        return {};
      }),
    };
    const executor = {
      estimate: vi.fn().mockResolvedValue({ estimatedCostUsd: 1, estimatedRuntimeMinutes: 1, confidence: "HIGH" }),
      prepare: vi.fn(async (request: any, context: any) => ({ request, context })),
      execute: vi.fn(async (prepared: any) => prepared),
      collectResult: vi.fn(async ({ request }: any) => {
        await mkdir(path.join(request.workingDirectory, "docs"), { recursive: true });
        await writeFile(path.join(request.workingDirectory, "docs", "proof.md"), "proof\n");
        return { executionId: request.executionId, status: "COMPLETED", output: "done" };
      }),
      cleanup: vi.fn(async () => undefined),
    };
    const publisher = {
      mintInstallationToken: vi.fn(),
      findOrCreatePullRequest: vi.fn(),
    };
    const worker = new DurableCodexWorker({
      client,
      repositoryRoot: repository,
      projectId: "project-1",
      repositoryId: "repository-1",
      publisher: publisher as any,
      executor: executor as any,
    });

    await expect(worker.runOnce()).resolves.toBe(true);
    expect(finalPayload).toMatchObject({ status: "FAILED" });
    expect(finalPayload.summary).toContain("verification produced 1 changed file");
    expect(publisher.mintInstallationToken).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("retains a non-terminal lease when the worker shuts down", async () => {
    vi.stubEnv("MISSION_CONTROL_SERVICE_COMMAND_SECRET", "test-service-command-secret");
    const repository = await mkdtemp(path.join(tmpdir(), "mc-worker-restart-repo-"));
    await exec("git", ["init", "-b", "main"], { cwd: repository });
    await exec("git", ["config", "user.name", "Test"], { cwd: repository });
    await exec("git", ["config", "user.email", "test@example.com"], { cwd: repository });
    await writeFile(path.join(repository, "README.md"), "base\n");
    await exec("git", ["add", "README.md"], { cwd: repository });
    await exec("git", ["commit", "-m", "base"], { cwd: repository });

    let executionStarted!: () => void;
    const started = new Promise<void>((resolve) => { executionStarted = resolve; });
    const executor = {
      estimate: vi.fn().mockResolvedValue({ estimatedCostUsd: 1, estimatedRuntimeMinutes: 1, confidence: "HIGH" }),
      prepare: vi.fn(async (request: any, context: any) => ({ request, context })),
      execute: vi.fn(async (prepared: any) => {
        executionStarted();
        return prepared;
      }),
      collectResult: vi.fn(async ({ context }: any) => {
        if (!context.signal.aborted) {
          await new Promise<void>((resolve) => context.signal.addEventListener("abort", () => resolve(), { once: true }));
        }
        return { executionId: "run-restart:1", status: "CANCELED", error: "local child stopped" };
      }),
      cleanup: vi.fn(async () => undefined),
    };
    const actions: string[] = [];
    let claimed = false;
    const client = {
      action: vi.fn(async (name: string) => {
        actions.push(name);
        if (name === "serviceCommands:claimExecution") {
          if (claimed) return null;
          claimed = true;
          return {
            workflowRunId: "run-restart-id",
            runId: "run-restart",
            claimId: "claim-restart",
            leaseExpiresAt: Date.now() + 60_000,
            executionAttemptNumber: 1,
            projectId: "project-1",
            workOrderId: "work-order-1",
            taskId: "task-1",
            factoryDefinitionVersionId: "factory-version-1",
            factoryConfigurationDigest: "factory-digest-1",
            repositoryId: "repository-1",
            repository: "jaydubya818/MissionControl",
            defaultBranch: "main",
            worktree: path.join(repository, ".mission-control", "worktrees", "restart"),
            branch: "codex/restart-recovery-test",
            prompt: "Create docs/restart-proof.md",
            allowedTools: [],
            scopes: [{ id: "scope-1", name: "Docs", includePaths: ["docs/**"], excludePaths: [] }],
            policy: { allowedCommands: ["git diff --check"], maxCostUsd: 5, maxAttempts: 3, timeoutMinutes: 5, stopCondition: "Stop after verification" },
            github: { installationId: "installation-1", appId: "app-1", accountLogin: "jaydubya818" },
            lineage: { workflowRunId: "run-restart-id" },
            checkpoint: {},
            cancellationRequested: false,
          };
        }
        if (name === "serviceCommands:heartbeatExecution") {
          return { cancellationRequested: false, leaseExpiresAt: Date.now() + 60_000 };
        }
        return {};
      }),
    };
    const worker = new DurableCodexWorker({
      client,
      repositoryRoot: repository,
      projectId: "project-1",
      repositoryId: "repository-1",
      publisher: {} as any,
      executor: executor as any,
      pollIntervalMs: 5,
    });

    worker.start();
    await started;
    await worker.stop();

    expect(actions).not.toContain("serviceCommands:finalizeExecution");
    vi.unstubAllEnvs();
  }, 180_000);
});
