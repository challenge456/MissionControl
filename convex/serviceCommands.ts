import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { canonicalRepositoryKey } from "./lib/workspaceRepositories";
import {
  canonicalServiceCommand,
  validateServiceCommandEnvelope,
  type ServiceCommandEnvelope,
} from "./lib/serviceCommandAuth";

const envelope = v.object({
  serviceId: v.string(),
  capability: v.string(),
  projectId: v.string(),
  repositoryId: v.string(),
  commandId: v.string(),
  issuedAt: v.number(),
  expiresAt: v.number(),
  payloadDigest: v.string(),
  signature: v.string(),
});

type SignatureStatus = "VALID" | "INVALID" | "MISSING";

export const resolveWorkOrderScope = internalQuery({
  args: {
    workOrderId: v.id("workOrders"),
    factoryDefinitionVersionId: v.id("factoryDefinitionVersions"),
  },
  handler: async (ctx, args) => {
    const [workOrder, version] = await Promise.all([
      ctx.db.get(args.workOrderId),
      ctx.db.get(args.factoryDefinitionVersionId),
    ]);
    if (!workOrder || !workOrder.projectId) throw new Error("WorkOrder is unavailable or unscoped.");
    if (!version || version.projectId !== workOrder.projectId) throw new Error("Factory version is outside the WorkOrder workspace.");
    const [definition, repository] = await Promise.all([
      ctx.db.get(version.factoryDefinitionId),
      ctx.db.get(version.repositoryId),
    ]);
    if (!definition || definition.status !== "ACTIVE" || definition.activeVersionId !== version._id) {
      throw new Error("Service execution requires the active Factory version.");
    }
    if (!repository || repository.projectId !== workOrder.projectId || repository.status !== "READY") {
      throw new Error("Service execution repository is not ready.");
    }
    if (workOrder.repository && canonicalRepositoryKey(workOrder.repository) !== canonicalRepositoryKey(repository.repository)) {
      throw new Error("WorkOrder repository does not match the active Factory version.");
    }
    return { projectId: String(workOrder.projectId), repositoryId: String(repository._id) };
  },
});

export const resolveExecutionScope = internalQuery({
  args: { workflowRunId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run?.projectId || !run.repositoryId) {
      throw new Error("Execution run is unavailable or unscoped.");
    }
    return {
      projectId: String(run.projectId),
      repositoryId: String(run.repositoryId),
    };
  },
});

export const resolveRepositoryScope = internalQuery({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("workspaceRepositories"),
  },
  handler: async (ctx, args) => {
    const repository = await ctx.db.get(args.repositoryId);
    if (
      !repository ||
      repository.projectId !== args.projectId ||
      repository.status !== "READY"
    ) {
      throw new Error("Execution repository is unavailable or not ready.");
    }
    return {
      projectId: String(args.projectId),
      repositoryId: String(args.repositoryId),
    };
  },
});

export const claim = internalMutation({
  args: { envelope },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("serviceCommandReceipts")
      .withIndex("by_command", (q) => q.eq("commandId", args.envelope.commandId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        attemptCount: existing.attemptCount + 1,
        replayDetectedAt: Date.now(),
      });
      return { accepted: false as const, receiptId: existing._id };
    }
    const receiptId = await ctx.db.insert("serviceCommandReceipts", {
      serviceId: args.envelope.serviceId,
      capability: args.envelope.capability,
      commandId: args.envelope.commandId,
      claimedProjectId: args.envelope.projectId,
      claimedRepositoryId: args.envelope.repositoryId,
      payloadDigest: args.envelope.payloadDigest,
      signatureStatus: "VALID",
      status: "RECEIVED",
      issuedAt: args.envelope.issuedAt,
      expiresAt: args.envelope.expiresAt,
      receivedAt: Date.now(),
      attemptCount: 1,
    });
    return { accepted: true as const, receiptId };
  },
});

export const deny = internalMutation({
  args: {
    envelope,
    signatureStatus: v.union(v.literal("VALID"), v.literal("INVALID"), v.literal("MISSING")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("serviceCommandReceipts")
      .withIndex("by_command", (q) => q.eq("commandId", args.envelope.commandId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { attemptCount: existing.attemptCount + 1, replayDetectedAt: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("serviceCommandReceipts", {
      serviceId: args.envelope.serviceId,
      capability: args.envelope.capability,
      commandId: args.envelope.commandId,
      claimedProjectId: args.envelope.projectId,
      claimedRepositoryId: args.envelope.repositoryId,
      payloadDigest: args.envelope.payloadDigest,
      signatureStatus: args.signatureStatus,
      status: "DENIED",
      issuedAt: args.envelope.issuedAt,
      expiresAt: args.envelope.expiresAt,
      receivedAt: Date.now(),
      completedAt: Date.now(),
      attemptCount: 1,
      reason: args.reason,
    });
  },
});

export const complete = internalMutation({
  args: {
    receiptId: v.id("serviceCommandReceipts"),
    status: v.union(v.literal("SUCCEEDED"), v.literal("FAILED")),
    reason: v.optional(v.string()),
    resultReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.receiptId, {
      status: args.status,
      completedAt: Date.now(),
      reason: args.reason,
      resultReference: args.resultReference,
    });
  },
});

export const dispatchWorkOrder = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "workorders.dispatch");
    const scope = await ctx.runQuery(internal.serviceCommands.resolveWorkOrderScope, {
      workOrderId: payload.workOrderId,
      factoryDefinitionVersionId: payload.factoryDefinitionVersionId,
    });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.workOrders.dispatchServiceInternal, {
        workOrderId: payload.workOrderId,
        taskId: payload.taskId,
        workflowId: payload.workflowId,
        actorType: "SYSTEM",
        actorId: `service:${args.envelope.serviceId}`,
        idempotencyKey: payload.idempotencyKey,
        runtime: payload.runtime,
        authorizedModelOverride: payload.authorizedModelOverride,
        model: payload.model,
        worktree: payload.worktree,
        retryOfWorkflowRunId: payload.retryOfWorkflowRunId,
        retryReason: payload.retryReason,
        factoryDefinitionVersionId: payload.factoryDefinitionVersionId,
        branch: payload.branch,
      });
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId,
        status: "SUCCEEDED",
        resultReference: result?.run?._id ? String(result.run._id) : undefined,
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const ingestReceiptPacket = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "receipts.ingest");
    const scope = await ctx.runQuery(internal.serviceCommands.resolveWorkOrderScope, {
      workOrderId: payload.workOrderId,
      factoryDefinitionVersionId: payload.factoryDefinitionVersionId,
    });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation((internal as any)["factory/piBridge"].ingestReceiptPacketInternal, {
        workOrderId: payload.workOrderId,
        workflowRunId: payload.workflowRunId,
        piSessionId: payload.piSessionId,
        piExecutionId: payload.piExecutionId,
        markRunCompleted: payload.markRunCompleted,
        receipts: payload.receipts ?? [],
        handoff: payload.handoff,
        idempotencyKey: payload.idempotencyKey,
        contextActivationReceiptId: payload.contextActivationReceiptId,
        serviceId: args.envelope.serviceId,
      });
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId,
        status: "SUCCEEDED",
        resultReference: String(payload.workflowRunId),
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const claimFactoryAttempt = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "attempts.claim");
    const scope = await ctx.runQuery(internal.factory.attempts.resolveScope, {
      workflowRunId: payload.workflowRunId,
    });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.factory.attempts.claimInternal, {
        workflowRunId: payload.workflowRunId,
        leaseId: payload.leaseId,
        ownerId: args.envelope.serviceId,
        leaseDurationMs: payload.leaseDurationMs,
      });
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId,
        status: "SUCCEEDED",
        resultReference: result?.claimed ? String(payload.workflowRunId) : result?.reason,
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const renewFactoryAttempt = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "attempts.renew");
    const scope = await ctx.runQuery(internal.factory.attempts.resolveScope, {
      workflowRunId: payload.workflowRunId,
    });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.factory.attempts.renewInternal, {
        workflowRunId: payload.workflowRunId,
        leaseId: payload.leaseId,
        ownerId: args.envelope.serviceId,
        leaseDurationMs: payload.leaseDurationMs,
      });
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId,
        status: result?.renewed ? "SUCCEEDED" : "FAILED",
        reason: result?.renewed ? undefined : result?.reason,
        resultReference: String(payload.workflowRunId),
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const reportFactoryAttempt = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "attempts.report");
    const scope = await ctx.runQuery(internal.factory.attempts.resolveScope, {
      workflowRunId: payload.workflowRunId,
    });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.factory.attempts.reportInternal, {
        workflowRunId: payload.workflowRunId,
        leaseId: payload.leaseId,
        ownerId: args.envelope.serviceId,
        packet: payload.packet,
      });
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId,
        status: "SUCCEEDED",
        resultReference: String(payload.workflowRunId),
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const claimExecution = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "executions.claim");
    const scope = await ctx.runQuery(internal.serviceCommands.resolveRepositoryScope, {
      projectId: payload.projectId,
      repositoryId: payload.repositoryId,
    });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.executionWorker.claimInternal, {
        projectId: payload.projectId,
        repositoryId: payload.repositoryId,
        workerId: payload.workerId,
        claimId: payload.claimId,
        leaseDurationMs: payload.leaseDurationMs,
      });
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId,
        status: "SUCCEEDED",
        resultReference: result?.workflowRunId ? String(result.workflowRunId) : "no-claimable-execution",
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const heartbeatExecution = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "executions.heartbeat");
    const scope = await ctx.runQuery(internal.serviceCommands.resolveExecutionScope, { workflowRunId: payload.workflowRunId });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.executionWorker.heartbeatInternal, payload);
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId, status: "SUCCEEDED", resultReference: String(payload.workflowRunId),
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const reportExecution = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "executions.report");
    const scope = await ctx.runQuery(internal.serviceCommands.resolveExecutionScope, { workflowRunId: payload.workflowRunId });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.executionWorker.reportInternal, payload);
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId, status: "SUCCEEDED", resultReference: String(payload.workflowRunId),
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

export const finalizeExecution = action({
  args: { envelope, payloadJson: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await authorize(ctx, args.envelope, args.payloadJson, "executions.finalize");
    const scope = await ctx.runQuery(internal.serviceCommands.resolveExecutionScope, { workflowRunId: payload.workflowRunId });
    const receipt = await claimScoped(ctx, args.envelope, scope);
    try {
      const result = await ctx.runMutation(internal.executionWorker.finalizeInternal, payload);
      await ctx.runMutation(internal.serviceCommands.complete, {
        receiptId: receipt.receiptId, status: "SUCCEEDED", resultReference: result?.pullRequestUrl ?? String(payload.workflowRunId),
      });
      return result;
    } catch (error) {
      await fail(ctx, receipt.receiptId, error);
      throw error;
    }
  },
});

async function authorize(ctx: any, candidate: ServiceCommandEnvelope, payloadJson: string, capability: string): Promise<any> {
  const expectedServiceId = process.env.MISSION_CONTROL_SERVICE_ID?.trim() || "orchestration-server";
  const secret = process.env.MISSION_CONTROL_SERVICE_COMMAND_SECRET?.trim();
  const now = Date.now();
  const syntaxError = validateServiceCommandEnvelope(candidate, now, { serviceId: expectedServiceId, capability });
  if (payloadJson.length > 256_000) {
    await ctx.runMutation(internal.serviceCommands.deny, { envelope: candidate, signatureStatus: "INVALID", reason: "payload-too-large" });
    throw new Error("Service command denied (payload-too-large).");
  }
  const payloadDigest = await sha256(payloadJson);
  const signatureStatus: SignatureStatus = !candidate.signature ? "MISSING" : "INVALID";
  if (!secret || syntaxError || payloadDigest !== candidate.payloadDigest || !await verifyHmac(secret, candidate)) {
    const reason = !secret ? "service-command-secret-not-configured" : syntaxError ?? (payloadDigest !== candidate.payloadDigest ? "payload-digest-mismatch" : "signature-invalid");
    await ctx.runMutation(internal.serviceCommands.deny, { envelope: candidate, signatureStatus, reason });
    throw new Error(`Service command denied (${reason}).`);
  }
  try {
    return JSON.parse(payloadJson);
  } catch {
    await ctx.runMutation(internal.serviceCommands.deny, { envelope: candidate, signatureStatus: "VALID", reason: "payload-json-invalid" });
    throw new Error("Service command denied (payload-json-invalid).");
  }
}

async function claimScoped(ctx: any, candidate: ServiceCommandEnvelope, scope: { projectId: string; repositoryId: string }) {
  if (candidate.projectId !== scope.projectId || candidate.repositoryId !== scope.repositoryId) {
    await ctx.runMutation(internal.serviceCommands.deny, {
      envelope: candidate,
      signatureStatus: "VALID",
      reason: "command-scope-mismatch",
    });
    throw new Error("Service command denied (command-scope-mismatch).");
  }
  const receipt = await ctx.runMutation(internal.serviceCommands.claim, { envelope: candidate });
  if (!receipt.accepted) throw new Error("Service command denied (command-replay-detected).");
  return receipt;
}

async function fail(ctx: any, receiptId: any, error: unknown) {
  await ctx.runMutation(internal.serviceCommands.complete, {
    receiptId,
    status: "FAILED",
    reason: error instanceof Error ? error.message.slice(0, 500) : "service-command-failed",
  });
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `sha256=${bytesToHex(new Uint8Array(digest))}`;
}

async function verifyHmac(secret: string, candidate: ServiceCommandEnvelope): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = hexToBytes(candidate.signature.slice("sha256=".length));
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signature.buffer as ArrayBuffer,
    new TextEncoder().encode(canonicalServiceCommand(candidate))
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string): Uint8Array {
  return new Uint8Array(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}
