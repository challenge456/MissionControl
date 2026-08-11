import { createHash, randomUUID } from "node:crypto";
import type { ConvexHttpClient } from "convex/browser";
import type { ExecutorEvent } from "@mission-control/workflow-engine";
import { CodexV1ExecutorAdapter } from "./codexExecutorAdapter.js";
import { ConvexActions, ConvexQueries } from "./convexCalls.js";
import { createSignedServiceCommand } from "./serviceCommandClient.js";
import { commitFactoryChanges, ensureFactoryWorktree, listChangedFiles, pushFactoryBranch } from "./factoryGitRuntime.js";
import { validateChangedFileScope } from "./factoryPathScope.js";
import { createOrReusePullRequest, loadGithubAppPrivateKey, mintInstallationToken } from "./githubAppRuntime.js";

const LEASE_DURATION_MS = 60_000;
const HEARTBEAT_INTERVAL_MS = 20_000;
const MAX_RESULT_BYTES = 64_000;

export interface FactoryAttemptWorkerStatus {
  enabled: boolean;
  activeRunIds: string[];
  completedCount: number;
  failedCount: number;
  lastPollAt: number | null;
  lastError: string | null;
  credentialsConfigured: boolean;
}

export class FactoryAttemptWorker {
  private readonly active = new Map<string, AbortController>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private polling = false;
  private stopped = false;
  private completedCount = 0;
  private failedCount = 0;
  private lastPollAt: number | null = null;
  private lastError: string | null = null;

  constructor(
    private readonly client: ConvexHttpClient,
    private readonly adapter = new CodexV1ExecutorAdapter(),
    private readonly enabled = process.env.FACTORY_EXECUTION_ENABLED === "1",
    private readonly pollIntervalMs = boundedInteger(process.env.FACTORY_EXECUTION_POLL_MS, 5_000, 300_000, 15_000)
  ) {}

  start() {
    if (!this.enabled || this.pollTimer || this.stopped) return;
    this.pollTimer = setInterval(() => void this.tick(), this.pollIntervalMs);
    void this.tick();
  }

  async stop() {
    this.stopped = true;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    for (const controller of this.active.values()) controller.abort();
  }

  status(): FactoryAttemptWorkerStatus {
    let privateKeyConfigured = false;
    try {
      privateKeyConfigured = Boolean(loadGithubAppPrivateKey());
    } catch {
      privateKeyConfigured = false;
    }
    return {
      enabled: this.enabled,
      activeRunIds: [...this.active.keys()],
      completedCount: this.completedCount,
      failedCount: this.failedCount,
      lastPollAt: this.lastPollAt,
      lastError: this.lastError,
      credentialsConfigured: Boolean(process.env.GITHUB_APP_ID?.trim() && privateKeyConfigured),
    };
  }

  async tick() {
    if (!this.enabled || this.polling || this.stopped) return;
    this.polling = true;
    this.lastPollAt = Date.now();
    try {
      const [pending, running] = await Promise.all([
        this.client.query(ConvexQueries.workflowRuns.list as any, { status: "PENDING", limit: 100 }),
        this.client.query(ConvexQueries.workflowRuns.list as any, { status: "RUNNING", limit: 100 }),
      ]) as [any[], any[]];
      for (const run of [...pending, ...running]) {
        if (this.stopped || this.active.size > 0) break;
        if (!isBoundFactoryAttempt(run) || this.active.has(String(run._id))) continue;
        const controller = new AbortController();
        this.active.set(String(run._id), controller);
        void this.execute(run, controller)
          .catch((error) => {
            this.failedCount += 1;
            this.lastError = safeError(error);
            console.error(`[factory-worker] Attempt ${run.runId} failed: ${this.lastError}`);
          })
          .finally(() => this.active.delete(String(run._id)));
      }
    } catch (error) {
      this.lastError = safeError(error);
      console.error(`[factory-worker] Poll failed: ${this.lastError}`);
    } finally {
      this.polling = false;
    }
  }

  private async execute(run: any, controller: AbortController) {
    const leaseId = randomUUID();
    const claim = await this.command("claimFactoryAttempt", "attempts.claim", run, {
      workflowRunId: run._id,
      leaseId,
      leaseDurationMs: LEASE_DURATION_MS,
    });
    if (!claim?.claimed) return;

    let heartbeatTask: Promise<void> | null = null;
    let leaseHealthy = true;
    const heartbeat = setInterval(() => {
      if (heartbeatTask || controller.signal.aborted) return;
      heartbeatTask = (async () => {
        try {
          const result = await this.command("renewFactoryAttempt", "attempts.renew", run, {
            workflowRunId: run._id,
            leaseId,
            leaseDurationMs: LEASE_DURATION_MS,
          });
          if (!result?.renewed) throw new Error(`Attempt lease renewal rejected (${result?.reason ?? "unknown"}).`);
        } catch (error) {
          leaseHealthy = false;
          this.lastError = safeError(error);
          controller.abort();
        }
      })().finally(() => {
        heartbeatTask = null;
      });
    }, HEARTBEAT_INTERVAL_MS);

    const report = async (packet: any) => {
      if (packet?.terminal) {
        clearInterval(heartbeat);
        if (heartbeatTask) await heartbeatTask;
      }
      if (!leaseHealthy) throw new Error("Factory attempt lease was lost before evidence could be recorded.");
      await this.command("reportFactoryAttempt", "attempts.report", run, {
        workflowRunId: run._id,
        leaseId,
        packet,
      });
    };

    try {
      const manifest = validateClaimManifest(claim);
      await ensureFactoryWorktree({
        checkoutRoot: claim.checkoutRoot,
        worktree: claim.worktree,
        branch: claim.branch,
        defaultBranch: claim.defaultBranch,
      });

      const executorEvents: ExecutorEvent[] = [];
      const result = await this.adapter.execute({
        executionId: `${claim.runId}:${claim.executionManifestDigest}`,
        repositoryRoot: claim.worktree,
        workingDirectory: claim.worktree,
        prompt: manifest.compiledPrompt,
        model: claim.model ?? manifest.workflow.steps[0]?.modelRoute,
        allowedPaths: manifest.repository.allowedPaths,
        timeoutMs: manifest.harness.timeoutMs,
        isolation: "WORKSPACE_WRITE",
      }, (event) => {
        executorEvents.push(event);
      }, controller.signal);

      const mappedEvents = executorEvents.map((event) => mapExecutorEvent(claim.runId, event));
      if (result.status !== "COMPLETED") {
        await report({
          events: mappedEvents,
          terminal: { status: result.status === "CANCELED" ? "CANCELED" : "FAILED", failureReason: result.error ?? "Codex execution failed." },
        });
        this.failedCount += 1;
        return;
      }

      const structuredResult = parseFactoryResult(result.output ?? "");
      if (structuredResult.status !== "COMPLETED") {
        await report({
          events: mappedEvents,
          artifacts: [structuredResultArtifact(claim, structuredResult)],
          terminal: { status: "FAILED", failureReason: `Codex reported ${structuredResult.status}: ${structuredResult.nextAction}` },
        });
        this.failedCount += 1;
        return;
      }

      const scopeResult = validateChangedFileScope(
        await listChangedFiles(claim.worktree, claim.defaultBranch),
        { allowedPaths: manifest.repository.allowedPaths, excludedPaths: manifest.repository.excludedPaths }
      );
      if (!scopeResult.ok) {
        await report({
          events: mappedEvents,
          artifacts: [
            structuredResultArtifact(claim, structuredResult),
            {
              idempotencyKey: `factory:${claim.runId}:path-scope-deviation`,
              artifactType: "OTHER",
              name: "Repository path-scope deviation",
              description: "Pull-request creation was blocked because changed files exceeded the frozen code scopes.",
              metadata: { changedFiles: scopeResult.changedFiles, outsideScope: scopeResult.outsideScope },
            },
          ],
          terminal: { status: "FAILED", failureReason: `Changed files outside approved code scopes: ${scopeResult.outsideScope.join(", ")}` },
        });
        this.failedCount += 1;
        return;
      }
      if (scopeResult.changedFiles.length === 0) {
        await report({
          events: mappedEvents,
          artifacts: [structuredResultArtifact(claim, structuredResult)],
          terminal: { status: "FAILED", failureReason: "Codex completed without producing a reviewable code change." },
        });
        this.failedCount += 1;
        return;
      }

      const headSha = await commitFactoryChanges({
        worktree: claim.worktree,
        changedFiles: scopeResult.changedFiles,
        title: String(manifest.intent?.title ?? structuredResult.summary ?? "Mission Control Work Order"),
      });
      const privateKey = loadGithubAppPrivateKey();
      const configuredAppId = process.env.GITHUB_APP_ID?.trim();
      if (!privateKey || !configuredAppId) throw new Error("GitHub App runtime credentials are not configured.");
      if (configuredAppId !== claim.installation.appId) throw new Error("GitHub App runtime identity does not match the frozen installation.");
      if (!claim.providerRepositoryId) throw new Error("GitHub provider repository identity is not frozen.");
      const installationToken = await mintInstallationToken({
        appId: configuredAppId,
        installationId: claim.installation.installationId,
        providerRepositoryId: claim.providerRepositoryId,
        privateKey,
      });
      if (installationToken.expiresAt <= Date.now() + 60_000) throw new Error("GitHub installation token expires too soon for a safe push.");
      await pushFactoryBranch({
        worktree: claim.worktree,
        repository: claim.repository,
        branch: claim.branch,
        installationToken: installationToken.token,
      });
      const pullRequest = await createOrReusePullRequest({
        repository: claim.repository,
        branch: claim.branch,
        base: claim.defaultBranch,
        title: structuredResult.summary,
        body: buildPullRequestBody(claim, structuredResult, scopeResult.changedFiles),
        token: installationToken.token,
        headSha,
      });
      const pullRequestLineage = {
        ...manifest.causation,
        repositoryId: String(claim.repositoryId),
        repository: claim.repository,
        installationId: claim.installation.installationId,
        branch: claim.branch,
        headSha,
        pullRequestNumber: pullRequest.number,
        pullRequestUrl: pullRequest.url,
        changedFiles: scopeResult.changedFiles,
        executionManifestDigest: claim.executionManifestDigest,
      };
      await report({
        events: mappedEvents,
        artifacts: [
          structuredResultArtifact(claim, structuredResult),
          {
            idempotencyKey: `factory:${claim.runId}:code-diff:${headSha}`,
            artifactType: "CODE_DIFF",
            name: `Reviewable code change ${headSha.slice(0, 12)}`,
            contentHash: `git:${headSha}`,
            metadata: { changedFiles: scopeResult.changedFiles, branch: claim.branch, headSha },
          },
          {
            idempotencyKey: `factory:${claim.runId}:pull-request`,
            artifactType: "PULL_REQUEST",
            name: `Pull request #${pullRequest.number}`,
            description: "Review-ready pull request created by the governed GitHub App boundary. Human merge remains required.",
            externalLocation: pullRequest.url,
            contentHash: `sha256:${createHash("sha256").update(JSON.stringify(pullRequestLineage)).digest("hex")}`,
            metadata: pullRequestLineage,
          },
        ],
        terminal: { status: "COMPLETED" },
      });
      this.completedCount += 1;
      this.lastError = null;
    } catch (error) {
      const reason = safeError(error);
      if (leaseHealthy) {
        await report({ terminal: { status: controller.signal.aborted ? "CANCELED" : "FAILED", failureReason: reason } })
          .catch((reportError) => {
            this.lastError = `Execution failed (${reason}); terminal report failed (${safeError(reportError)}).`;
          });
      }
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
  }

  private async command(
    action: keyof typeof ConvexActions.serviceCommands,
    capability: "attempts.claim" | "attempts.renew" | "attempts.report",
    run: any,
    payload: unknown
  ) {
    const command = createSignedServiceCommand({
      capability,
      projectId: String(run.projectId),
      repositoryId: String(run.repositoryId),
      payload,
    });
    return await this.client.action(ConvexActions.serviceCommands[action] as any, command) as any;
  }
}

function isBoundFactoryAttempt(run: any) {
  return Boolean(
    run?._id && run.projectId && run.repositoryId && run.factoryDefinitionVersionId
    && run.executionManifestDigest && run.executorAdapter === "codex" && run.executorVersion === "v1"
    && ["PENDING", "RUNNING"].includes(run.status)
  );
}

function validateClaimManifest(claim: any) {
  const manifest = claim?.executionManifest;
  if (
    manifest?.version !== "factory-execution-manifest/v1"
    || manifest?.harness?.adapter !== "codex"
    || manifest?.harness?.version !== "v1"
    || manifest?.harness?.isolation !== "WORKSPACE_WRITE"
    || manifest?.harness?.pullRequestAuthority !== "CONTROL_PLANE_ONLY"
    || !Number.isSafeInteger(manifest?.harness?.timeoutMs)
    || manifest.harness.timeoutMs < 1_000
    || manifest.harness.timeoutMs > 8 * 60 * 60 * 1_000
    || !Array.isArray(manifest?.repository?.allowedPaths)
    || manifest.repository.allowedPaths.length === 0
    || !Array.isArray(manifest?.repository?.excludedPaths)
    || !Array.isArray(manifest?.workflow?.steps)
    || typeof manifest?.compiledPrompt !== "string"
    || !manifest.compiledPrompt.trim()
  ) throw new Error("Claimed Factory execution manifest is invalid.");
  return manifest;
}

function mapExecutorEvent(runId: string, event: ExecutorEvent) {
  const eventType = {
    EXECUTION_STARTED: "STEP_STARTED",
    COMMAND_STARTED: "TOOL_CALLED",
    COMMAND_COMPLETED: "COMMAND_EXECUTED",
    ARTIFACT_PRODUCED: "COMMAND_EXECUTED",
    EXECUTION_COMPLETED: "STEP_COMPLETED",
    EXECUTION_FAILED: "RUN_FAILED",
    EXECUTION_CANCELED: "RUN_FAILED",
  }[event.type];
  return {
    idempotencyKey: `factory:${runId}:executor:${event.sequence}`,
    eventType,
    workflowStep: "factory-execution",
    toolName: event.type.startsWith("COMMAND") ? "codex/v1" : undefined,
    commandSummary: event.summary,
    status: event.type.endsWith("FAILED") ? "FAILED" : event.type.endsWith("CANCELED") ? "CANCELED" : "RECORDED",
    startedAt: event.occurredAt,
    metadata: { executorEventType: event.type, executorSequence: event.sequence, ...(event.metadata ?? {}) },
  };
}

function parseFactoryResult(output: string) {
  if (Buffer.byteLength(output, "utf8") > MAX_RESULT_BYTES) throw new Error("Codex structured result exceeds the 64 KB context budget.");
  let result: any;
  try {
    result = JSON.parse(output);
  } catch {
    throw new Error("Codex did not return the required factory-result/v1 JSON object.");
  }
  const statuses = ["COMPLETED", "BLOCKED", "FAILED"];
  const arrayFields = [
    "completedAcceptanceCriterionIds", "incompleteAcceptanceCriterionIds",
    "unknownAcceptanceCriterionIds", "verificationCommands", "knownRisks",
  ];
  if (!result || typeof result !== "object" || !statuses.includes(result.status)
    || typeof result.summary !== "string" || !result.summary.trim()
    || typeof result.nextAction !== "string"
    || arrayFields.some((field) => !Array.isArray(result[field]) || result[field].some((item: unknown) => typeof item !== "string"))) {
    throw new Error("Codex factory-result/v1 JSON failed schema validation.");
  }
  return result as {
    status: "COMPLETED" | "BLOCKED" | "FAILED";
    summary: string;
    completedAcceptanceCriterionIds: string[];
    incompleteAcceptanceCriterionIds: string[];
    unknownAcceptanceCriterionIds: string[];
    verificationCommands: string[];
    knownRisks: string[];
    nextAction: string;
  };
}

function structuredResultArtifact(claim: any, result: ReturnType<typeof parseFactoryResult>) {
  return {
    idempotencyKey: `factory:${claim.runId}:structured-result`,
    artifactType: "STRUCTURED_OUTPUT",
    name: "Codex factory-result/v1",
    description: result.summary,
    contentHash: `sha256:${createHash("sha256").update(JSON.stringify(result)).digest("hex")}`,
    metadata: { schema: "factory-result/v1", result },
  };
}

function buildPullRequestBody(claim: any, result: ReturnType<typeof parseFactoryResult>, changedFiles: string[]) {
  return [
    "## Mission Control Work Order",
    "",
    result.summary,
    "",
    `- Run: \`${claim.runId}\``,
    `- Factory manifest: \`${claim.executionManifestDigest}\``,
    `- Branch: \`${claim.branch}\``,
    `- Changed files: ${changedFiles.length}`,
    "- Merge authority: human only",
    "",
    "## Verification reported by the execution harness",
    "",
    ...(result.verificationCommands.length ? result.verificationCommands.map((command) => `- \`${command}\``) : ["- No commands reported; independent verification is still required."]),
    "",
    "## Known risks",
    "",
    ...(result.knownRisks.length ? result.knownRisks.map((risk) => `- ${risk}`) : ["- None reported by the execution harness."]),
  ].join("\n");
}

function boundedInteger(raw: string | undefined, min: number, max: number, fallback: number) {
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= min && value <= max ? value : fallback;
}

function safeError(error: unknown) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/(authorization|cookie|token|secret|password|api[-_]?key)\s*[:=]\s*([^\s,;]+)/gi, "$1=[REDACTED]")
    .slice(0, 2_000);
}
