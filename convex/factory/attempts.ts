import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { activeLeaseMatches, evaluateAttemptClaim, renewAttemptLease } from "../lib/factoryAttempt";
import { reconcileTerminalWorkflowSteps } from "../lib/workflowRunState";

const EVENT_TYPES = new Set([
  "RUN_STARTED", "STEP_STARTED", "STEP_COMPLETED", "TOOL_CALLED",
  "COMMAND_EXECUTED", "FILE_CHANGED", "ARTIFACT_CREATED", "CHECKPOINT_CREATED",
  "RETRY_STARTED", "RETRY_COMPLETED", "HUMAN_INTERVENTION_REQUESTED",
  "RUN_PAUSED", "RUN_RESUMED", "RUN_FAILED", "RUN_COMPLETED",
]);

const ARTIFACT_TYPES = new Set([
  "CODE_DIFF", "TEST_OUTPUT", "BUILD_OUTPUT", "LOG_BUNDLE", "SCREENSHOT",
  "GENERATED_DOCUMENT", "VERIFICATION_EVIDENCE", "PULL_REQUEST", "CHECKPOINT",
  "STRUCTURED_OUTPUT", "OTHER",
]);

export const resolveScope = internalQuery({
  args: { workflowRunId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run?.projectId || !run.repositoryId || !run.workOrderId || !run.factoryDefinitionVersionId) {
      throw new Error("Factory attempt is unavailable or unbound.");
    }
    return {
      projectId: String(run.projectId),
      repositoryId: String(run.repositoryId),
      workOrderId: run.workOrderId,
      factoryDefinitionVersionId: run.factoryDefinitionVersionId,
    };
  },
});

export const claimInternal = internalMutation({
  args: {
    workflowRunId: v.id("workflowRuns"),
    leaseId: v.string(),
    ownerId: v.string(),
    leaseDurationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run) throw new Error("Factory attempt not found.");
    const decision = evaluateAttemptClaim({
      status: run.status,
      lease: run.lease,
      leaseId: args.leaseId,
      ownerId: args.ownerId,
      leaseDurationMs: args.leaseDurationMs,
      now: Date.now(),
    });
    if (!decision.ok) return { claimed: false as const, reason: decision.reason };
    if (
      !run.projectId || !run.repositoryId || !run.workOrderId
      || !run.factoryDefinitionVersionId || !run.factoryConfigurationDigest
      || !run.hostBindingId || !run.branch || !run.worktree
      || run.executorAdapter !== "codex" || run.executorVersion !== "v1"
      || !run.executionManifest || !run.executionManifestDigest
    ) {
      throw new Error("Factory attempt is missing its immutable execution binding.");
    }
    const [version, repository, workOrder, host, installation] = await Promise.all([
      ctx.db.get(run.factoryDefinitionVersionId),
      ctx.db.get(run.repositoryId),
      ctx.db.get(run.workOrderId),
      ctx.db.get(run.hostBindingId),
      ctx.db.query("githubAppInstallations")
        .withIndex("by_repository", (q) => q.eq("repositoryId", run.repositoryId!))
        .first(),
    ]);
    if (!version || version.configurationDigest !== run.factoryConfigurationDigest) {
      throw new Error("Factory attempt configuration digest no longer matches its version.");
    }
    const definition = await ctx.db.get(version.factoryDefinitionId);
    if (!definition || definition.status !== "ACTIVE" || definition.activeVersionId !== version._id) {
      throw new Error("Factory attempt requires the exact active Factory version.");
    }
    if (!repository || repository.status !== "READY" || repository.projectId !== run.projectId) {
      throw new Error("Factory attempt repository is not ready.");
    }
    if (!workOrder || workOrder.currentExecutionRunId !== run._id || workOrder.currentRevisionNumber !== run.workOrderRevisionNumber) {
      throw new Error("Factory attempt is no longer the current Work Order revision.");
    }
    const frozenWorktree = (run.executionManifest as any).repository?.worktree;
    const checkoutPrefix = `${host?.checkoutRoot?.replace(/\/+$/, "")}/`;
    if (!host || host.status !== "READY" || host.dirty || frozenWorktree !== run.worktree || !run.worktree.startsWith(checkoutPrefix)) {
      throw new Error("Factory attempt host binding is no longer ready or does not own the frozen worktree.");
    }
    if (!installation || installation.status !== "CONNECTED" || installation.projectId !== run.projectId) {
      throw new Error("Factory attempt GitHub App installation is not connected.");
    }

    await ctx.db.patch(run._id, { status: "RUNNING", lease: decision.lease });
    await insertEvent(ctx, run, {
      idempotencyKey: `factory-lease:${run.runId}:${args.leaseId}:claimed`,
      eventType: decision.reclaimed ? "RUN_RESUMED" : "CHECKPOINT_CREATED",
      workflowStep: run.steps[run.currentStepIndex]?.stepId,
      actor: `service:${args.ownerId}`,
      status: "RUNNING",
      startedAt: Date.now(),
      commandSummary: decision.reclaimed ? "Expired attempt lease reconciled and reclaimed" : "Factory attempt lease claimed",
      metadata: {
        leaseId: args.leaseId,
        expiresAt: decision.lease.expiresAt,
        executionManifestDigest: run.executionManifestDigest,
      },
    });
    return {
      claimed: true as const,
      reclaimed: decision.reclaimed,
      workflowRunId: run._id,
      runId: run.runId,
      lease: decision.lease,
      projectId: run.projectId,
      repositoryId: repository._id,
      repository: repository.repository,
      providerRepositoryId: repository.providerRepositoryId,
      defaultBranch: repository.defaultBranch,
      workOrderId: run.workOrderId,
      branch: run.branch,
      worktree: run.worktree,
      checkoutRoot: host.checkoutRoot,
      installation: {
        installationId: installation.installationId,
        appId: installation.appId,
      },
      model: run.model,
      executionManifest: run.executionManifest,
      executionManifestDigest: run.executionManifestDigest,
    };
  },
});

export const renewInternal = internalMutation({
  args: {
    workflowRunId: v.id("workflowRuns"),
    leaseId: v.string(),
    ownerId: v.string(),
    leaseDurationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run || run.status !== "RUNNING") return { renewed: false as const, reason: "attempt-not-running" };
    const result = renewAttemptLease({
      lease: run.lease,
      leaseId: args.leaseId,
      ownerId: args.ownerId,
      leaseDurationMs: args.leaseDurationMs,
      now: Date.now(),
    });
    if (!result.ok) return { renewed: false as const, reason: result.reason };
    await ctx.db.patch(run._id, { lease: result.lease });
    return { renewed: true as const, lease: result.lease };
  },
});

export const reportInternal = internalMutation({
  args: {
    workflowRunId: v.id("workflowRuns"),
    leaseId: v.string(),
    ownerId: v.string(),
    packet: v.any(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run || !activeLeaseMatches({ lease: run.lease, leaseId: args.leaseId, ownerId: args.ownerId, now: Date.now() })) {
      throw new Error("Factory attempt report requires the active matching lease.");
    }
    const packet = args.packet && typeof args.packet === "object" ? args.packet : {};
    const events = Array.isArray(packet.events) ? packet.events : [];
    const artifacts = Array.isArray(packet.artifacts) ? packet.artifacts : [];
    if (events.length > 100 || artifacts.length > 20) throw new Error("Factory attempt report exceeds packet limits.");

    const eventResults = [];
    for (const event of events) {
      if (!event?.idempotencyKey || !EVENT_TYPES.has(event.eventType)) throw new Error("Factory attempt event is invalid.");
      eventResults.push(await insertEvent(ctx, run, {
        ...event,
        actor: `service:${args.ownerId}`,
        metadata: {
          ...(event.metadata ?? {}),
          leaseId: args.leaseId,
          executionManifestDigest: run.executionManifestDigest,
        },
      }));
    }

    const artifactResults = [];
    for (const artifact of artifacts) {
      if (!artifact?.idempotencyKey || !artifact?.name || !ARTIFACT_TYPES.has(artifact.artifactType)) {
        throw new Error("Factory attempt artifact is invalid.");
      }
      const existing = await ctx.db.query("runArtifacts")
        .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", artifact.idempotencyKey))
        .first();
      if (existing) {
        artifactResults.push({ artifact: existing, created: false });
        continue;
      }
      const artifactId = await ctx.db.insert("runArtifacts", {
        tenantId: run.tenantId,
        projectId: run.projectId,
        missionId: run.missionId,
        workOrderId: run.workOrderId,
        workflowRunId: run._id,
        idempotencyKey: artifact.idempotencyKey,
        artifactType: artifact.artifactType,
        name: String(artifact.name).slice(0, 200),
        description: optionalText(artifact.description, 2_000),
        repositoryPath: optionalText(artifact.repositoryPath, 1_000),
        externalLocation: optionalText(artifact.externalLocation, 2_000),
        contentHash: optionalText(artifact.contentHash, 200),
        producer: `service:${args.ownerId}`,
        retentionPolicy: optionalText(artifact.retentionPolicy, 200),
        sensitivity: optionalText(artifact.sensitivity, 100),
        createdAt: Date.now(),
        metadata: {
          ...(artifact.metadata ?? {}),
          leaseId: args.leaseId,
          executionManifestDigest: run.executionManifestDigest,
        },
      });
      const artifactRow = await ctx.db.get(artifactId);
      artifactResults.push({ artifact: artifactRow, created: true });
      await insertEvent(ctx, run, {
        idempotencyKey: `${artifact.idempotencyKey}:event`,
        eventType: artifact.artifactType === "CHECKPOINT" ? "CHECKPOINT_CREATED" : "ARTIFACT_CREATED",
        workflowStep: run.steps[run.currentStepIndex]?.stepId,
        actor: `service:${args.ownerId}`,
        status: "COMPLETED",
        commandSummary: String(artifact.name).slice(0, 500),
        evidenceArtifactIds: [artifactId],
        metadata: { artifactType: artifact.artifactType, leaseId: args.leaseId },
      });
    }

    const terminal = packet.terminal;
    if (terminal) {
      if (!["COMPLETED", "FAILED", "CANCELED"].includes(terminal.status)) {
        throw new Error("Factory attempt terminal status is invalid.");
      }
      if (terminal.status === "COMPLETED" && run.isMutating !== false) {
        const existingPr = await ctx.db.query("runArtifacts")
          .withIndex("by_run_type", (q) => q.eq("workflowRunId", run._id).eq("artifactType", "PULL_REQUEST"))
          .first();
        const packetHasPr = artifacts.some((artifact: any) => artifact.artifactType === "PULL_REQUEST");
        if (!existingPr && !packetHasPr) throw new Error("A mutating Factory attempt cannot complete without a pull-request artifact.");
      }
      const completedAt = Date.now();
      const failureReason = optionalText(terminal.failureReason, 2_000);
      const steps = terminal.status === "COMPLETED"
        ? run.steps.map((step) => ({
            ...step,
            status: step.status === "SKIPPED" ? "SKIPPED" as const : "DONE" as const,
            completedAt: step.completedAt ?? completedAt,
          }))
        : reconcileTerminalWorkflowSteps(run.steps, terminal.status, failureReason, completedAt);
      await ctx.db.patch(run._id, {
        status: terminal.status,
        completedAt,
        failureReason,
        steps,
        lease: undefined,
      });
      await insertEvent(ctx, run, {
        idempotencyKey: `factory-terminal:${run.runId}:${terminal.status}`,
        eventType: terminal.status === "COMPLETED" ? "RUN_COMPLETED" : "RUN_FAILED",
        workflowStep: run.steps[run.currentStepIndex]?.stepId,
        actor: `service:${args.ownerId}`,
        status: terminal.status,
        startedAt: run.startedAt,
        endedAt: completedAt,
        errorCategory: terminal.status === "COMPLETED" ? undefined : "FACTORY_ATTEMPT_FAILURE",
        errorSummary: failureReason,
        commandSummary: terminal.status === "COMPLETED" ? "Factory attempt completed with review-ready pull request" : undefined,
        metadata: { leaseId: args.leaseId, executionManifestDigest: run.executionManifestDigest },
      });
      if (run.workOrderId) {
        await ctx.runMutation(internal.workOrders.syncExecutionOutcome, {
          workflowRunId: run._id,
          eventType: terminal.status === "COMPLETED" ? "RUN_COMPLETED" : terminal.status === "CANCELED" ? "RUN_CANCELED" : "RUN_FAILED",
          summary: `Factory attempt ${run.runId} ${String(terminal.status).toLowerCase()}`,
        });
      }
    }
    return {
      accepted: true,
      eventCount: eventResults.length,
      artifactCount: artifactResults.length,
      terminalStatus: terminal?.status,
    };
  },
});

async function nextSequenceNumber(ctx: any, workflowRunId: any) {
  const events = await ctx.db.query("runEvents")
    .withIndex("by_run", (q: any) => q.eq("workflowRunId", workflowRunId))
    .collect();
  return events.reduce((max: number, event: any) => Math.max(max, event.sequenceNumber), 0) + 1;
}

async function insertEvent(ctx: any, run: any, event: any) {
  const existing = await ctx.db.query("runEvents")
    .withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", event.idempotencyKey))
    .first();
  if (existing) return { event: existing, created: false };
  const eventId = await ctx.db.insert("runEvents", {
    tenantId: run.tenantId,
    projectId: run.projectId,
    workOrderId: run.workOrderId,
    workflowRunId: run._id,
    idempotencyKey: event.idempotencyKey,
    eventType: event.eventType,
    workflowStep: optionalText(event.workflowStep, 200),
    sequenceNumber: await nextSequenceNumber(ctx, run._id),
    actor: optionalText(event.actor, 200),
    toolName: optionalText(event.toolName, 200),
    commandSummary: optionalText(event.commandSummary, 500),
    status: optionalText(event.status, 100),
    startedAt: finiteNumber(event.startedAt),
    endedAt: finiteNumber(event.endedAt),
    durationMs: finiteNumber(event.durationMs),
    retryNumber: finiteNumber(event.retryNumber),
    evidenceArtifactIds: event.evidenceArtifactIds,
    errorCategory: optionalText(event.errorCategory, 200),
    errorSummary: optionalText(event.errorSummary, 2_000),
    metadata: event.metadata,
  });
  return { event: await ctx.db.get(eventId), created: true };
}

function optionalText(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
