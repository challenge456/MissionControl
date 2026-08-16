import { execFile, spawn, type ChildProcess } from "node:child_process";
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
  ExecutorProcessObserver,
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
  onSpawn?: (pid: number) => Promise<void> | void;
  onExit?: (pid: number, exitCode?: number) => Promise<void> | void;
}) => Promise<{ exitCode: number; output: string; diagnostics?: string }>;

const PROCESS_TERMINATION_GRACE_MS = 5_000;

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
    signal?: AbortSignal,
    processObserver?: ExecutorProcessObserver,
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
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", abort, { once: true });
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
        onSpawn: (pid) => processObserver?.started({ pid, startedAt: Date.now() }),
        onExit: (pid, exitCode) => processObserver?.terminated({ pid, exitCode, terminatedAt: Date.now() }),
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
    let child: ChildProcess;
    let settled = false;
    let timedOut = false;
    let lifecycleError: unknown;
    let ownedProcessGroupId: number | undefined;
    let startedNotification: Promise<void> = Promise.resolve();
    let forcedTermination: ReturnType<typeof setTimeout> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      args.signal.removeEventListener("abort", requestTermination);
      if (forcedTermination) clearTimeout(forcedTermination);
      if (timeout) clearTimeout(timeout);
    };
    const signalOwnedProcessTree = (signal: NodeJS.Signals) => {
      if (typeof child.pid !== "number") return;
      if (process.platform !== "win32" && ownedProcessGroupId) {
        try {
          process.kill(-ownedProcessGroupId, signal);
          return;
        } catch {
          // The group may have already exited. Fall back only while the exact
          // child object still proves that its owned process is live.
        }
      }
      if (child.exitCode === null && child.signalCode === null) child.kill(signal);
    };
    let terminationRequested = false;
    const requestTermination = () => {
      if (settled || terminationRequested) return;
      terminationRequested = true;
      try {
        signalOwnedProcessTree("SIGTERM");
      } catch (error) {
        lifecycleError ??= error;
      }
      forcedTermination = setTimeout(() => {
        if (settled) return;
        try {
          signalOwnedProcessTree("SIGKILL");
        } catch (error) {
          lifecycleError ??= error;
        }
      }, PROCESS_TERMINATION_GRACE_MS);
      forcedTermination.unref?.();
    };
    const complete = async (error: any, stdout: string, stderr: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        await startedNotification;
        if (typeof child.pid === "number") {
          await args.onExit?.(child.pid, typeof error?.code === "number" ? error.code : error ? 1 : 0);
        }
      } catch (observerError) {
        lifecycleError ??= observerError;
      }
      if (lifecycleError) return reject(lifecycleError);
      if (args.signal.aborted) return reject(error ?? new Error("Codex execution was canceled."));
      const output = await readFile(args.outputPath, "utf8").catch(() => stdout || "");
      resolve({
        exitCode: typeof error?.code === "number" ? error.code : error ? 1 : 0,
        output: output.trim(),
        diagnostics: error
          ? redact(timedOut ? `Codex execution timed out after ${args.timeoutMs}ms.` : stderr || error.message)
          : undefined,
      });
    };
    let stdout = "";
    let stderr = "";
    let spawnError: Error | undefined;
    const appendBounded = (current: string, chunk: Buffer) => {
      const next = current + chunk.toString("utf8");
      if (Buffer.byteLength(next) > 20 * 1024 * 1024) {
        lifecycleError ??= new Error("Codex process output exceeded the 20 MB runtime limit.");
        requestTermination();
        return next.slice(-20 * 1024 * 1024);
      }
      return next;
    };
    child = spawn(args.executable, args.argv, {
      cwd: args.cwd,
      detached: process.platform !== "win32",
      env: codexChildEnvironment(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    child.stdout?.on("data", (chunk: Buffer) => { stdout = appendBounded(stdout, chunk); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr = appendBounded(stderr, chunk); });
    child.once("error", (error) => { spawnError = error; });
    child.once("close", (code, signal) => {
      const error = spawnError ?? (code === 0 ? undefined : Object.assign(
        new Error(signal ? `Codex exited after ${signal}.` : `Codex exited with status ${code ?? 1}.`),
        { code: code ?? 1, signal },
      ));
      void complete(error, stdout, stderr).catch(reject);
    });
    if (typeof child.pid === "number") {
      // Node guarantees that a detached POSIX spawn is the leader of a new
      // process group, so the owned PGID is the exact live child PID.
      ownedProcessGroupId = process.platform === "win32" ? undefined : child.pid;
      startedNotification = Promise.resolve(args.onSpawn?.(child.pid)).catch((error) => {
        lifecycleError = error;
        requestTermination();
      });
      if (lifecycleError) requestTermination();
    } else {
      lifecycleError = new Error("Codex executor did not expose an owned process identity.");
      requestTermination();
    }
    args.signal.addEventListener("abort", requestTermination, { once: true });
    if (args.signal.aborted) requestTermination();
    timeout = setTimeout(() => {
      timedOut = true;
      requestTermination();
    }, args.timeoutMs);
    timeout.unref?.();
    // `codex exec` appends piped stdin to an explicit prompt. `execFile` opens
    // a stdin pipe by default, so close it immediately or the CLI waits
    // indefinitely for EOF before it starts the model request.
    child.stdin?.end();
  });
}

export function codexChildEnvironment(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const allowed = ["PATH", "HOME", "TMPDIR", "USER", "SHELL", "TERM", "LANG", "LC_ALL", "CODEX_HOME"];
  return {
    ...Object.fromEntries(allowed.flatMap((name) => env[name] ? [[name, env[name]]] : [])),
    CI: "true",
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "never",
    GH_PROMPT_DISABLED: "1",
  };
}

export function codexOwnedProcessGroupExists(processGroupId: number) {
  if (process.platform === "win32") return false;
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch {
    return false;
  }
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
