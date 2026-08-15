import {
  finiteNonNegative,
  mapRunEventToObservation,
  normalizeTokenUsage,
  optionalString,
  sanitizeTraceValue,
} from "./observability";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type PersistenceCtx = Pick<MutationCtx, "db">;

export interface ObservationWrite {
  idempotencyKey: string;
  parentObservationId?: Id<"traceObservations">;
  parentIdempotencyKey?: string;
  runEventId?: Id<"runEvents">;
  verificationRunId?: Id<"verificationRuns">;
  evidenceEnvelopeIds?: Id<"evidenceEnvelopes">[];
  type: "SPAN" | "GENERATION" | "AGENT" | "TOOL" | "RETRIEVAL" | "EMBEDDING" | "EVENT" | "EVALUATOR";
  name: string;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  status?: "RUNNING" | "SUCCESS" | "FAILED";
  level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";
  input?: unknown;
  output?: unknown;
  metadata?: unknown;
  model?: string;
  provider?: string;
  promptVersion?: string;
  toolName?: string;
  tokenUsage?: unknown;
  estimatedCostUsd?: number;
  error?: { code?: string; message: string };
}

export async function ensureAttemptTrace(
  ctx: PersistenceCtx,
  run: Doc<"workflowRuns">,
  overrides: { purpose?: "SOFTWARE" | "VERIFICATION" | "AUTOMATION" | "EVALUATION" | "SYSTEM"; name?: string } = {}
) {
  if (!run?.projectId) throw new Error("Trace creation requires a workspace-scoped Attempt.");
  if (run.primaryTraceId) {
    const primary = await ctx.db.get(run.primaryTraceId);
    if (primary?.workflowRunId === run._id) return primary;
  }
  const existing = await ctx.db
    .query("traces")
    .withIndex("by_attempt", (q) => q.eq("workflowRunId", run._id))
    .first();
  if (existing) {
    if (run.primaryTraceId !== existing._id) await ctx.db.patch(run._id, { primaryTraceId: existing._id });
    return existing;
  }

  const now = Date.now();
  const traceKey = `attempt:${String(run._id)}:primary`;
  let factoryDefinitionId;
  if (run.factoryDefinitionVersionId) {
    const version = await ctx.db.get(run.factoryDefinitionVersionId);
    factoryDefinitionId = version?.factoryDefinitionId;
  }
  const traceId = await ctx.db.insert("traces", {
    tenantId: run.tenantId,
    projectId: run.projectId,
    traceKey,
    externalTraceId: stableTelemetryId(traceKey, 32),
    workOrderId: run.workOrderId,
    workflowRunId: run._id,
    factoryDefinitionId,
    factoryDefinitionVersionId: run.factoryDefinitionVersionId,
    purpose: overrides.purpose ?? purposeForRun(run),
    name: optionalString(overrides.name, 300) ?? `Attempt ${run.runId ?? String(run._id)}`,
    status: traceStatusForRun(run.status),
    startedAt: finiteNonNegative(run.startedAt) ?? now,
    endedAt: finiteNonNegative(run.completedAt),
    durationMs: duration(run.startedAt, run.completedAt),
    environment: optionalString(run.executionEnvironment, 100),
    executor: optionalString(run.executorAdapter ?? run.runtime, 100),
    executorVersion: optionalString(run.executorVersion, 100),
    model: optionalString(run.model, 200),
    tags: ["attempt", run.workflowId ? `workflow:${String(run.workflowId).slice(0, 100)}` : undefined]
      .filter((value): value is string => Boolean(value)),
    input: sanitizeTraceValue({ instruction: run.initialInput, context: boundedAttemptContext(run.context) }),
    metadata: sanitizeTraceValue({
      workflowId: run.workflowId,
      workflowVersion: run.workflowVersion,
      topology: run.topology,
      taskAttemptNumber: run.context?.taskAttemptNumber,
      taskRetryNumber: run.context?.taskRetryNumber,
      executionManifestDigest: run.executionManifestDigest,
    }),
    estimatedCostUsd: finiteNonNegative(run.spentUsd),
    humanInterventionCount: finiteNonNegative(run.humanInterventions),
    error: run.failureReason ? { message: optionalString(run.failureReason) ?? "Attempt failed." } : undefined,
    createdAt: now,
    updatedAt: now,
  });
  await ctx.db.patch(run._id, { primaryTraceId: traceId });
  const createdTrace = requiredDocument(await ctx.db.get(traceId), "Created trace is unavailable.");
  await recordTraceObservation(ctx, createdTrace, {
    idempotencyKey: "attempt-root",
    type: "AGENT",
    name: `Attempt ${run.runId ?? String(run._id)}`,
    startedAt: finiteNonNegative(run.startedAt) ?? now,
    endedAt: finiteNonNegative(run.completedAt),
    durationMs: duration(run.startedAt, run.completedAt),
    status: run.status === "FAILED" || run.status === "CANCELED"
      ? "FAILED"
      : run.status === "COMPLETED"
        ? "SUCCESS"
        : "RUNNING",
    model: optionalString(run.model, 200),
    metadata: { workflowId: run.workflowId, executor: run.executorAdapter ?? run.runtime },
    error: run.failureReason ? { message: optionalString(run.failureReason) ?? "Attempt failed." } : undefined,
  });
  return requiredDocument(await ctx.db.get(traceId), "Created trace is unavailable.");
}

export async function recordTraceObservation(
  ctx: PersistenceCtx,
  trace: Doc<"traces">,
  observation: ObservationWrite
) {
  if (!trace) throw new Error("Trace observation requires an existing trace.");
  const idempotencyKey = optionalString(observation.idempotencyKey, 300);
  if (!idempotencyKey) throw new Error("Trace observation requires an idempotency key.");
  const existing = await ctx.db
    .query("traceObservations")
    .withIndex("by_trace_idempotency", (q) =>
      q.eq("traceId", trace._id).eq("idempotencyKey", idempotencyKey)
    )
    .first();
  const now = Date.now();
  const startedAt = finiteNonNegative(observation.startedAt) ?? existing?.startedAt ?? now;
  const endedAt = finiteNonNegative(observation.endedAt);
  const status = observation.status ?? (endedAt ? "SUCCESS" : "RUNNING");
  let parentObservationId = observation.parentObservationId;
  const parentIdempotencyKey = observation.parentIdempotencyKey;
  if (!parentObservationId && parentIdempotencyKey) {
    const parent = await ctx.db
      .query("traceObservations")
      .withIndex("by_trace_idempotency", (q) =>
        q.eq("traceId", trace._id).eq("idempotencyKey", parentIdempotencyKey)
      )
      .first();
    parentObservationId = parent?._id;
  }
  if (!parentObservationId && idempotencyKey !== "attempt-root") {
    const root = await ctx.db
      .query("traceObservations")
      .withIndex("by_trace_idempotency", (q) => q.eq("traceId", trace._id).eq("idempotencyKey", "attempt-root"))
      .first();
    parentObservationId = root?._id;
  }
  if (parentObservationId) {
    const parent = await ctx.db.get(parentObservationId);
    if (!parent || parent.traceId !== trace._id) throw new Error("Observation parent must belong to the same trace.");
    if (existing) {
      await assertAcyclicObservationParent(ctx, trace._id, existing._id, parent);
    }
  }
  const normalizedTokens = normalizeTokenUsage(observation.tokenUsage);
  const patch = {
    parentObservationId,
    runEventId: observation.runEventId ?? existing?.runEventId,
    verificationRunId: observation.verificationRunId ?? existing?.verificationRunId,
    evidenceEnvelopeIds: observation.evidenceEnvelopeIds ?? existing?.evidenceEnvelopeIds,
    type: observation.type,
    name: optionalString(observation.name, 300) ?? "Execution observation",
    startedAt,
    endedAt,
    durationMs: finiteNonNegative(observation.durationMs) ?? duration(startedAt, endedAt),
    status,
    level: observation.level ?? (status === "FAILED" ? "ERROR" : "DEFAULT"),
    input: observation.input === undefined ? existing?.input : sanitizeTraceValue(observation.input),
    output: observation.output === undefined ? existing?.output : sanitizeTraceValue(observation.output),
    metadata: observation.metadata === undefined ? existing?.metadata : sanitizeTraceValue(observation.metadata),
    model: optionalString(observation.model, 200) ?? existing?.model,
    provider: optionalString(observation.provider, 100) ?? existing?.provider,
    promptVersion: optionalString(observation.promptVersion, 100) ?? existing?.promptVersion,
    toolName: optionalString(observation.toolName, 200) ?? existing?.toolName,
    tokenUsage: normalizedTokens ?? existing?.tokenUsage,
    estimatedCostUsd: finiteNonNegative(observation.estimatedCostUsd) ?? existing?.estimatedCostUsd,
    error: observation.error
      ? {
          code: optionalString(observation.error.code, 200),
          message: optionalString(observation.error.message, 2_000) ?? "Execution observation failed.",
        }
      : existing?.error,
    updatedAt: now,
  };
  if (existing) {
    await ctx.db.patch(existing._id, patch);
    return requiredDocument(await ctx.db.get(existing._id), "Updated observation is unavailable.");
  }
  const observationId = await ctx.db.insert("traceObservations", {
    tenantId: trace.tenantId,
    projectId: trace.projectId,
    traceId: trace._id,
    idempotencyKey,
    externalSpanId: stableTelemetryId(`${trace.externalTraceId}:${idempotencyKey}`, 16),
    ...patch,
    createdAt: now,
  });
  return requiredDocument(await ctx.db.get(observationId), "Created observation is unavailable.");
}

async function assertAcyclicObservationParent(
  ctx: PersistenceCtx,
  traceId: Id<"traces">,
  observationId: Id<"traceObservations">,
  initialParent: Doc<"traceObservations">
) {
  const visited = new Set<string>();
  let current: Doc<"traceObservations"> | null = initialParent;
  for (let depth = 0; current; depth += 1) {
    const currentId = String(current._id);
    if (currentId === String(observationId)) {
      throw new Error("Observation parent would create a cycle.");
    }
    if (visited.has(currentId) || depth >= 100) {
      throw new Error("Observation parent hierarchy is cyclic or exceeds the supported depth.");
    }
    visited.add(currentId);
    if (!current.parentObservationId) return;
    current = await ctx.db.get(current.parentObservationId);
    if (!current || current.traceId !== traceId) {
      throw new Error("Observation parent must belong to the same trace.");
    }
  }
}

export async function recordRunEventObservation(
  ctx: PersistenceCtx,
  run: Doc<"workflowRuns">,
  event: Doc<"runEvents">
) {
  const trace = await ensureAttemptTrace(ctx, run);
  const mapped = mapRunEventToObservation(event);
  return recordTraceObservation(ctx, trace, {
    idempotencyKey: `run-event:${event.idempotencyKey ?? event._id}`,
    parentIdempotencyKey: event.metadata?.traceParentObservationKey,
    runEventId: event._id,
    verificationRunId: event.verificationRunId,
    evidenceEnvelopeIds: event.evidenceEnvelopeIds,
    ...mapped,
    startedAt: mapped.startedAt ?? event._creationTime ?? Date.now(),
    metadata: { ...((mapped.metadata as any) ?? {}), runEventType: event.eventType, sequenceNumber: event.sequenceNumber },
  });
}

export async function finishAttemptTrace(
  ctx: PersistenceCtx,
  run: Doc<"workflowRuns">,
  terminal: { status: "COMPLETED" | "FAILED" | "CANCELED"; completedAt: number; failureReason?: string; output?: unknown }
) {
  const trace = await ensureAttemptTrace(ctx, run);
  const loadedObservations = await ctx.db
    .query("traceObservations")
    .withIndex("by_trace", (q) => q.eq("traceId", trace._id))
    .take(5_001);
  const observations = loadedObservations.slice(0, 5_000);
  const tokenUsage = sumTokenUsage(observations.map((observation) => observation.tokenUsage));
  const observedCost = observations.reduce(
    (sum, observation) => sum + (finiteNonNegative(observation.estimatedCostUsd) ?? 0),
    0
  );
  const error = terminal.status === "COMPLETED"
    ? undefined
    : { message: optionalString(terminal.failureReason, 2_000) ?? `Attempt ${terminal.status.toLowerCase()}.` };
  await ctx.db.patch(trace._id, {
    status: terminal.status === "COMPLETED" ? "SUCCESS" : terminal.status === "CANCELED" ? "CANCELED" : "FAILED",
    endedAt: terminal.completedAt,
    durationMs: duration(trace.startedAt, terminal.completedAt),
    output: terminal.output === undefined ? trace.output : sanitizeTraceValue(terminal.output),
    tokenUsage,
    estimatedCostUsd: observedCost || finiteNonNegative(run.spentUsd),
    humanInterventionCount: finiteNonNegative(run.humanInterventions),
    error,
    metadata: sanitizeTraceValue({
      ...objectRecord(trace.metadata),
      observationAggregation: {
        limit: 5_000,
        truncated: loadedObservations.length > observations.length,
      },
    }),
    updatedAt: terminal.completedAt,
  });
  await recordTraceObservation(ctx, trace, {
    idempotencyKey: "attempt-root",
    type: "AGENT",
    name: `Attempt ${run.runId ?? String(run._id)}`,
    startedAt: trace.startedAt,
    endedAt: terminal.completedAt,
    status: terminal.status === "COMPLETED" ? "SUCCESS" : "FAILED",
    model: run.model,
    output: terminal.output,
    error,
  });
  return requiredDocument(await ctx.db.get(trace._id), "Finished trace is unavailable.");
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function purposeForRun(run: Doc<"workflowRuns">): "SOFTWARE" | "VERIFICATION" | "AUTOMATION" | "EVALUATION" | "SYSTEM" {
  if (run.missionRole === "VALIDATOR" || /verif/i.test(run.workflowId ?? "")) return "VERIFICATION";
  if (/autom/i.test(run.workflowId ?? "")) return "AUTOMATION";
  if (/eval/i.test(run.workflowId ?? "")) return "EVALUATION";
  return "SOFTWARE";
}

function traceStatusForRun(status: string) {
  if (status === "COMPLETED") return "SUCCESS" as const;
  if (status === "FAILED") return "FAILED" as const;
  if (status === "CANCELED") return "CANCELED" as const;
  return "RUNNING" as const;
}

function duration(startedAt: unknown, endedAt: unknown): number | undefined {
  const start = finiteNonNegative(startedAt);
  const end = finiteNonNegative(endedAt);
  return start !== undefined && end !== undefined && end >= start ? end - start : undefined;
}

function boundedAttemptContext(context: unknown) {
  if (!context || typeof context !== "object") return undefined;
  const source = context as Record<string, unknown>;
  return {
    task: source.task,
    workOrderDesiredOutcome: source.workOrderDesiredOutcome,
    authorityScope: source.authorityScope,
    revisionNumber: source.revisionNumber,
    retryReason: source.retryReason,
  };
}

function sumTokenUsage(values: unknown[]) {
  const normalized = values.map(normalizeTokenUsage).filter((value): value is NonNullable<ReturnType<typeof normalizeTokenUsage>> => Boolean(value));
  if (!normalized.length) return undefined;
  const sum = (key: "input" | "output" | "cached" | "total") => normalized.reduce((total, value) => total + (value[key] ?? 0), 0);
  return { input: sum("input"), output: sum("output"), cached: sum("cached"), total: sum("total") };
}

function stableTelemetryId(value: string, length: 16 | 32): string {
  const chunks: string[] = [];
  for (let seed = 0; chunks.join("").length < length; seed += 1) {
    let hash = 0x811c9dc5 ^ seed;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    chunks.push((hash >>> 0).toString(16).padStart(8, "0"));
  }
  const result = chunks.join("").slice(0, length);
  return /^0+$/.test(result) ? `${"0".repeat(length - 1)}1` : result;
}

function requiredDocument<T>(value: T | null, message: string): T {
  if (!value) throw new Error(message);
  return value;
}
