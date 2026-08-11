import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type {
  ExecutorAdapter,
  ExecutorCapabilities,
  ExecutorConfigurationIssue,
  ExecutorEstimate,
  ExecutorEvent,
  ExecutorHealth,
  ExecutorRequest,
  ExecutorResult,
} from "@mission-control/workflow-engine";

type ProcessRunner = (args: {
  executable: string;
  argv: string[];
  cwd: string;
  timeoutMs: number;
  signal: AbortSignal;
  outputPath: string;
}) => Promise<{ exitCode: number; output: string; diagnostics?: string }>;

export class CodexV1ExecutorAdapter implements ExecutorAdapter {
  private readonly active = new Map<string, AbortController>();

  constructor(
    private readonly executable = process.env.CODEX_EXECUTABLE ?? "codex",
    private readonly runner: ProcessRunner = runCodexProcess
  ) {}

  capabilities(): ExecutorCapabilities {
    return {
      adapter: "codex",
      version: "v1",
      supportsCancel: true,
      supportsResume: false,
      supportsRepositoryMutation: true,
      isolationModes: ["READ_ONLY", "WORKSPACE_WRITE"],
      emittedEvents: [
        "EXECUTION_STARTED",
        "COMMAND_STARTED",
        "COMMAND_COMPLETED",
        "ARTIFACT_PRODUCED",
        "EXECUTION_COMPLETED",
        "EXECUTION_FAILED",
        "EXECUTION_CANCELED",
      ],
    };
  }

  validateConfiguration(request: ExecutorRequest): ExecutorConfigurationIssue[] {
    const issues: ExecutorConfigurationIssue[] = [];
    if (!path.isAbsolute(request.repositoryRoot)) issues.push({ field: "repositoryRoot", message: "Repository root must be absolute." });
    if (!path.isAbsolute(request.workingDirectory)) issues.push({ field: "workingDirectory", message: "Working directory must be absolute." });
    if (path.isAbsolute(request.repositoryRoot) && path.isAbsolute(request.workingDirectory)) {
      const relative = path.relative(path.resolve(request.repositoryRoot), path.resolve(request.workingDirectory));
      if (relative.startsWith("..") || path.isAbsolute(relative)) issues.push({ field: "workingDirectory", message: "Working directory must remain inside the repository root." });
    }
    if (!request.prompt.trim()) issues.push({ field: "prompt", message: "Execution prompt is required." });
    if (request.allowedPaths.length === 0) issues.push({ field: "allowedPaths", message: "At least one repository-relative path boundary is required." });
    if (request.allowedPaths.some((candidate) => path.isAbsolute(candidate) || candidate.split(/[\\/]/).includes(".."))) {
      issues.push({ field: "allowedPaths", message: "Allowed paths must be repository-relative and cannot traverse upward." });
    }
    if (!Number.isSafeInteger(request.timeoutMs) || request.timeoutMs < 1_000 || request.timeoutMs > 8 * 60 * 60 * 1_000) {
      issues.push({ field: "timeoutMs", message: "Timeout must be between one second and eight hours." });
    }
    return issues;
  }

  async estimate(request: ExecutorRequest): Promise<ExecutorEstimate> {
    const complexity = Math.max(1, Math.ceil(request.prompt.length / 2_000));
    return {
      estimatedCostUsd: Math.min(100, Number((complexity * 1.5).toFixed(2))),
      estimatedRuntimeMinutes: Math.min(Math.ceil(request.timeoutMs / 60_000), complexity * 15),
      confidence: "LOW",
    };
  }

  async execute(
    request: ExecutorRequest,
    emit: (event: ExecutorEvent) => Promise<void> | void,
    signal?: AbortSignal
  ): Promise<ExecutorResult> {
    const issues = this.validateConfiguration(request);
    if (issues.length) {
      const error = issues.map((issue) => `${issue.field}: ${issue.message}`).join(" ");
      await emit(event(request.executionId, 1, "EXECUTION_FAILED", error));
      return { executionId: request.executionId, status: "FAILED", error };
    }
    if (this.active.has(request.executionId)) {
      return { executionId: request.executionId, status: "FAILED", error: "Execution ID is already active." };
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    this.active.set(request.executionId, controller);
    const outputDirectory = await mkdtemp(path.join(tmpdir(), "mc-codex-v1-"));
    const outputPath = path.join(outputDirectory, "result.txt");
    let sequence = 0;
    const send = async (type: ExecutorEvent["type"], summary: string, metadata?: Record<string, unknown>) => {
      sequence += 1;
      await emit(event(request.executionId, sequence, type, summary, metadata));
    };

    try {
      await send("EXECUTION_STARTED", "Codex execution started.", {
        adapter: "codex/v1",
        isolation: request.isolation,
        allowedPaths: request.allowedPaths,
      });
      await send("COMMAND_STARTED", "Codex CLI command started.");
      const result = await this.runner({
        executable: this.executable,
        argv: commandArguments(request, outputPath),
        cwd: request.workingDirectory,
        timeoutMs: request.timeoutMs,
        signal: controller.signal,
        outputPath,
      });
      await send("COMMAND_COMPLETED", "Codex CLI command completed.", { exitCode: result.exitCode });
      if (result.exitCode !== 0) throw new Error(result.diagnostics || `Codex exited with status ${result.exitCode}.`);
      await send("ARTIFACT_PRODUCED", "Codex produced the execution result.", { artifactType: "CODEX_RESULT" });
      await send("EXECUTION_COMPLETED", "Codex execution completed.");
      return { executionId: request.executionId, status: "COMPLETED", exitCode: 0, output: result.output };
    } catch (cause) {
      const canceled = controller.signal.aborted;
      const message = redact(cause instanceof Error ? cause.message : String(cause));
      await send(canceled ? "EXECUTION_CANCELED" : "EXECUTION_FAILED", canceled ? "Codex execution canceled." : message);
      return { executionId: request.executionId, status: canceled ? "CANCELED" : "FAILED", error: message };
    } finally {
      signal?.removeEventListener("abort", abort);
      this.active.delete(request.executionId);
      await rm(outputDirectory, { recursive: true, force: true });
    }
  }

  async cancel(executionId: string): Promise<boolean> {
    const controller = this.active.get(executionId);
    if (!controller) return false;
    controller.abort();
    return true;
  }

  async health(): Promise<ExecutorHealth> {
    try {
      if (path.isAbsolute(this.executable) || this.executable.includes(path.sep)) {
        await access(this.executable, constants.X_OK);
      } else {
        await new Promise<void>((resolve, reject) => {
          execFile(this.executable, ["--version"], { timeout: 5_000 }, (error) => error ? reject(error) : resolve());
        });
      }
      return { status: "READY", checkedAt: Date.now(), adapter: "codex", version: "v1" };
    } catch {
      return { status: "UNAVAILABLE", checkedAt: Date.now(), adapter: "codex", version: "v1", details: "Codex executable is unavailable or not executable." };
    }
  }
}

function commandArguments(request: ExecutorRequest, outputPath: string): string[] {
  return [
    "exec",
    "--ephemeral",
    "--sandbox",
    request.isolation === "READ_ONLY" ? "read-only" : "workspace-write",
    "--color",
    "never",
    "-C",
    request.repositoryRoot,
    "-o",
    outputPath,
    ...(request.model ? ["-m", request.model] : []),
    [
      request.prompt,
      "",
      "Repository mutation is limited to these approved repository-relative boundaries:",
      ...request.allowedPaths.map((candidate) => `- ${candidate}`),
      "Do not expose credentials in output, artifacts, or logs.",
    ].join("\n"),
  ];
}

async function runCodexProcess(args: Parameters<ProcessRunner>[0]): Promise<{ exitCode: number; output: string; diagnostics?: string }> {
  return await new Promise((resolve, reject) => {
    const child = execFile(args.executable, args.argv, {
      cwd: args.cwd,
      timeout: args.timeoutMs,
      signal: args.signal,
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
    }, async (error, stdout, stderr) => {
      if (error && args.signal.aborted) return reject(error);
      const output = await readFile(args.outputPath, "utf8").catch(() => stdout || "");
      resolve({
        exitCode: typeof (error as any)?.code === "number" ? (error as any).code : error ? 1 : 0,
        output: output.trim(),
        diagnostics: error ? redact(stderr || error.message) : undefined,
      });
    });
    // `codex exec` appends piped stdin to an explicit prompt. `execFile` opens
    // a stdin pipe by default, so close it immediately or the CLI waits
    // indefinitely for EOF before it starts the model request.
    child.stdin?.end();
  });
}

function event(
  executionId: string,
  sequence: number,
  type: ExecutorEvent["type"],
  summary: string,
  metadata?: Record<string, unknown>
): ExecutorEvent {
  return { executionId, sequence, type, occurredAt: Date.now(), summary, metadata };
}

function redact(value: string): string {
  return value.replace(/(authorization|cookie|token|secret|password|api[-_]?key)\s*[:=]\s*([^\s,;]+)/gi, "$1=[REDACTED]").slice(0, 2_000);
}
