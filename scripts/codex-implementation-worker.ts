#!/usr/bin/env tsx
/** One-shot governed implementation worker for an already-approved WorkOrder Attempt. */

import { execFile } from "node:child_process";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { ConvexHttpClient } from "convex/browser";
import { anyApi as api } from "convex/server";
import {
  implementationAttemptKey,
  isAllowedImplementationCommand,
  validateImplementationClaim,
  type ImplementationPolicy,
} from "../packages/workflow-engine/src/implementationPolicy";

const execFileAsync = promisify(execFile);
function requiredEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const convexUrl = requiredEnv("CONVEX_URL or VITE_CONVEX_URL", process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL);
const workflowRunId = requiredEnv("IMPLEMENTATION_WORKFLOW_RUN_ID", process.env.IMPLEMENTATION_WORKFLOW_RUN_ID);
const taskId = requiredEnv("IMPLEMENTATION_TASK_ID", process.env.IMPLEMENTATION_TASK_ID);
const repository = requiredEnv("IMPLEMENTATION_REPOSITORY", process.env.IMPLEMENTATION_REPOSITORY);
const worktree = requiredEnv("IMPLEMENTATION_WORKTREE", process.env.IMPLEMENTATION_WORKTREE);
const codex = process.env.CODEX_EXECUTABLE ?? "/Applications/Codex.app/Contents/Resources/codex";
const client = new ConvexHttpClient(convexUrl);
const SECRET_PATTERN = /(gh[opsu]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/;

function workerEnvironment(): NodeJS.ProcessEnv {
  const allowed = ["PATH", "HOME", "TMPDIR", "USER", "SHELL", "TERM", "LANG", "LC_ALL", "CODEX_HOME"];
  return Object.fromEntries(allowed.flatMap((name) => process.env[name] ? [[name, process.env[name]]] : []));
}

async function verifyGitIsolation(worktreePath: string) {
  const resolved = await realpath(worktreePath);
  const { stdout: inside } = await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: resolved });
  const { stdout: commonDir } = await execFileAsync("git", ["rev-parse", "--git-common-dir"], { cwd: resolved });
  if (inside.trim() !== "true") throw new Error("Approved worktree is not a Git worktree");
  const common = path.resolve(resolved, commonDir.trim());
  if (common === path.join(resolved, ".git")) throw new Error("Main checkout mutation is denied; an isolated linked worktree is required");
  return resolved;
}

async function main() {
  const [run, task] = await Promise.all([
    client.query(api.workflowRuns.getById, { id: workflowRunId }),
    client.query(api.tasks.get, { taskId }),
  ]);
  if (!run || !task || !run.workOrderId) throw new Error("Linked run, Task, and WorkOrder are required");
  if (["REVIEW", "DONE"].includes(task.status)) {
    console.log("Implementation Attempt already submitted; replay skipped.");
    return;
  }
  if (!["READY", "ASSIGNED", "IN_PROGRESS"].includes(task.status)) {
    throw new Error(`Task cannot be claimed from ${task.status}`);
  }
  const detail = await client.query(api.workOrders.get, { workOrderId: run.workOrderId });
  const workOrder = detail?.workOrder;
  if (!workOrder) throw new Error("Approved WorkOrder not found");
  const resolvedWorktree = await verifyGitIsolation(worktree);
  const attemptNumber = Number(task.metadata?.workflowAttempt?.attemptNumber ?? 1);
  const errors = validateImplementationClaim({
    workOrder,
    run,
    task,
    expectedRepository: repository,
    worktreePath: resolvedWorktree,
    attemptNumber,
  });
  if (errors.length) throw new Error(`Implementation claim denied: ${errors.join("; ")}`);
  const policy = workOrder.metadata.implementationPolicy as ImplementationPolicy;
  const attemptKey = implementationAttemptKey(run.runId, String(task._id), attemptNumber);
  const outputDirectory = await mkdtemp(path.join(tmpdir(), "mc-implementation-worker-"));
  const outputPath = path.join(outputDirectory, "deliverable.txt");
  const startedAt = Date.now();
  if (["READY", "ASSIGNED"].includes(task.status)) {
    const transition = await client.mutation(api.tasks.transition, {
      taskId: task._id,
      toStatus: "IN_PROGRESS",
      actorType: "AGENT",
      actorUserId: "codex-implementation-worker",
      idempotencyKey: `${attemptKey}:claim`,
      reason: "Approved isolated implementation Attempt started.",
      workPlan: {
        bullets: ["Edit only approved scope", "Run targeted allowlisted checks", "Produce a reviewable change packet"],
        estimatedCost: policy.maxCostUsd,
        estimatedDuration: `${policy.timeoutMinutes} minutes maximum`,
      },
    });
    if (!transition?.success) throw new Error("Task could not enter IN_PROGRESS");
  }
  await client.mutation(api.workflowRuns.recordEvent, {
    workflowRunId: run._id,
    eventType: attemptNumber > 1 ? "RETRY_STARTED" : "STEP_STARTED",
    workflowStep: task.metadata?.workflowStepId,
    actor: "codex-implementation-worker",
    status: "RUNNING",
    retryNumber: attemptNumber - 1,
    startedAt,
    idempotencyKey: `${attemptKey}:started`,
  });
  try {
    const codexResult = await execFileAsync(codex, [
      "exec", "--ephemeral", "--ignore-user-config", "--sandbox", "workspace-write", "--color", "never",
      "-C", resolvedWorktree, "-o", outputPath,
      [
        "Implement only the approved Task below inside this isolated worktree.",
        "Do not change scope, approve, merge, push, access secrets, or use destructive commands.",
        `Stop condition: ${policy.stopCondition}`,
        `Task: ${task.title}`,
        task.description ?? "",
      ].join("\n\n"),
    ], { cwd: resolvedWorktree, env: workerEnvironment(), timeout: policy.timeoutMinutes * 60_000, maxBuffer: 20 * 1024 * 1024 });
    const tokenMatch = `${codexResult.stdout}\n${codexResult.stderr}`.match(/tokens used\s+([\d,]+)/i);
    const tokens = tokenMatch ? Number(tokenMatch[1].replace(/,/g, "")) : 0;
    const estimatedCostUsd = (tokens / 1_000_000) * 15;
    if (estimatedCostUsd > policy.maxCostUsd) throw new Error(`Cost limit exceeded: $${estimatedCostUsd.toFixed(4)} > $${policy.maxCostUsd.toFixed(2)}`);
    const [{ stdout: changed }, { stdout: diff }] = await Promise.all([
      execFileAsync("git", ["diff", "--name-only"], { cwd: resolvedWorktree }),
      execFileAsync("git", ["diff", "--no-ext-diff"], { cwd: resolvedWorktree, maxBuffer: 20 * 1024 * 1024 }),
    ]);
    if (SECRET_PATTERN.test(diff)) throw new Error("Potential secret detected in repository diff");
    const changedFiles = changed.split("\n").filter(Boolean);
    for (const changedFile of changedFiles) {
      await client.mutation(api.workflowRuns.recordEvent, {
        workflowRunId: run._id, eventType: "FILE_CHANGED", workflowStep: task.metadata?.workflowStepId,
        actor: "codex-implementation-worker", status: "COMPLETED", commandSummary: changedFile,
        metadata: { repositoryPath: changedFile, attemptNumber }, idempotencyKey: `${attemptKey}:file:${changedFile}`,
      });
    }
    for (const command of policy.allowedCommands) {
      if (!isAllowedImplementationCommand(command, policy.allowedCommands)) throw new Error(`Denied verification command: ${command}`);
      const [program, ...args] = command.trim().split(/\s+/);
      const resultStartedAt = Date.now();
      try {
        const result = await execFileAsync(program, args, { cwd: resolvedWorktree, env: workerEnvironment(), timeout: policy.timeoutMinutes * 60_000, maxBuffer: 20 * 1024 * 1024 });
        if (SECRET_PATTERN.test(`${result.stdout}\n${result.stderr}`)) throw new Error("Potential secret detected in verification output");
        await client.mutation(api.workflowRuns.recordEvent, {
          workflowRunId: run._id, eventType: "COMMAND_EXECUTED", workflowStep: task.metadata?.workflowStepId,
          actor: "codex-implementation-worker", toolName: program, commandSummary: command, status: "PASS",
          startedAt: resultStartedAt, endedAt: Date.now(), durationMs: Date.now() - resultStartedAt,
          metadata: { exitCode: 0, outputSummary: result.stdout.slice(-2_000), tokens, estimatedCostUsd }, idempotencyKey: `${attemptKey}:command:${command}`,
        });
      } catch (error: any) {
        await client.mutation(api.workflowRuns.recordEvent, {
          workflowRunId: run._id, eventType: "COMMAND_EXECUTED", workflowStep: task.metadata?.workflowStepId,
          actor: "codex-implementation-worker", toolName: program, commandSummary: command, status: "FAIL",
          startedAt: resultStartedAt, endedAt: Date.now(), durationMs: Date.now() - resultStartedAt,
          errorCategory: "TARGETED_CHECK_FAILED", errorSummary: error?.message ?? String(error),
          metadata: { exitCode: error?.code ?? 1, outputSummary: String(error?.stdout ?? error?.stderr ?? "").slice(-2_000) }, idempotencyKey: `${attemptKey}:command:${command}`,
        });
        throw error;
      }
    }
    const deliverable = await readFile(outputPath, "utf8").catch(() => "Implementation completed.");
    if (SECRET_PATTERN.test(deliverable)) throw new Error("Potential secret detected in implementation deliverable");
    await client.mutation(api.workflowRuns.createArtifact, {
      workflowRunId: run._id, artifactType: "CODE_DIFF", name: `Attempt ${attemptNumber} change packet`,
      description: `Changed files:\n${changed.trim() || "None"}\n\n${deliverable.slice(0, 4_000)}`,
      repositoryPath: resolvedWorktree, producer: "codex-implementation-worker", idempotencyKey: `${attemptKey}:diff`,
      metadata: { changedFiles, attemptNumber, prReady: true, tokens, estimatedCostUsd, costLimitUsd: policy.maxCostUsd },
    });
    await client.mutation(api.tasks.transition, {
      taskId: task._id, toStatus: "REVIEW", actorType: "AGENT", actorUserId: "codex-implementation-worker",
      idempotencyKey: `${attemptKey}:review`, reason: "Implementation and targeted checks completed in the approved worktree.",
      deliverable: { summary: "PR-ready implementation packet", content: deliverable, artifactIds: [] },
    });
  } catch (error: any) {
    const message = error?.message ?? String(error);
    await client.mutation(api.tasks.transition, {
      taskId: task._id, toStatus: "FAILED", actorType: "AGENT", actorUserId: "codex-implementation-worker",
      idempotencyKey: `${attemptKey}:failed`, reason: message, blockedReason: message,
    });
    throw error;
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
