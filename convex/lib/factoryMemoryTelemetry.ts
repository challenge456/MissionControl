import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  ensureAttemptTrace,
  recordTraceObservation,
} from "./observabilityPersistence";
import {
  sanitizeFactoryObservation,
  sanitizeFactoryText,
} from "./factoryMemory";

export type FactoryObservationType =
  | "context.plan"
  | "memory.search"
  | "code.search"
  | "graph.traversal"
  | "context.rank"
  | "context.assemble"
  | "context.sufficiency";

export type FactoryObservationInput = {
  observationType: FactoryObservationType;
  retrievalPlanId?: Id<"factoryRetrievalPlans">;
  contextPackageId?: Id<"factoryContextPackages">;
  strategy?: string;
  query?: string;
  resultCount?: number;
  selectedCount?: number;
  rejectedCount?: number;
  estimatedTokens?: number;
  latencyMs: number;
  metadata?: unknown;
  createdAt?: number;
};

export function tracePurposeForFactoryPurpose(
  purpose: Doc<"workflowRuns">["factoryPurpose"],
): "SOFTWARE" | "VERIFICATION" | "AUTOMATION" {
  if (purpose === "VERIFICATION") return "VERIFICATION";
  if (purpose === "INTELLIGENT_AUTOMATION") return "AUTOMATION";
  return "SOFTWARE";
}

export async function recordFactoryRetrievalObservation(
  ctx: Pick<MutationCtx, "db">,
  run: Doc<"workflowRuns">,
  input: FactoryObservationInput,
) {
  const trace = await ensureAttemptTrace(ctx, run, {
    purpose: tracePurposeForFactoryPurpose(run.factoryPurpose),
  });
  const startedAt = input.createdAt ?? Date.now();
  const latencyMs = Math.max(0, input.latencyMs);
  const metadata = {
    domain: "FACTORY_MEMORY",
    factoryObservationType: input.observationType,
    factoryRetrievalPlanId: input.retrievalPlanId
      ? String(input.retrievalPlanId)
      : undefined,
    factoryContextPackageId: input.contextPackageId
      ? String(input.contextPackageId)
      : undefined,
    strategy: input.strategy,
    resultCount: input.resultCount,
    selectedCount: input.selectedCount,
    rejectedCount: input.rejectedCount,
    estimatedTokens: input.estimatedTokens,
    acceptanceAuthority: false,
    detail: sanitizeFactoryObservation(input.metadata),
  };
  const idempotencyKey = await factoryTelemetryDigest({
    workflowRunId: run._id,
    ...metadata,
    query: input.query,
  });
  return recordTraceObservation(ctx, trace, {
    idempotencyKey: `factory-memory:${idempotencyKey}`,
    type: "RETRIEVAL",
    name: `Factory Memory ${input.observationType}`,
    startedAt,
    endedAt: startedAt + latencyMs,
    durationMs: latencyMs,
    status: "SUCCESS",
    input: input.query
      ? { query: sanitizeFactoryText(input.query.trim(), 2_000) }
      : undefined,
    output: {
      resultCount: input.resultCount,
      selectedCount: input.selectedCount,
      rejectedCount: input.rejectedCount,
      estimatedTokens: input.estimatedTokens,
    },
    metadata,
  });
}

export function factoryTelemetryMetadata(
  value: unknown,
): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeFactoryEvalKey(value: string): string {
  const metric = sanitizeFactoryText(value.trim(), 160)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!metric) throw new Error("Context evaluation key is required.");
  return `factory-memory-${metric}`;
}

export async function ensureFactoryEvalDefinition(
  ctx: Pick<MutationCtx, "db">,
  input: {
    tenantId: Id<"tenants">;
    projectId: Id<"projects">;
    actorId: string;
    metricKey: string;
  },
): Promise<Doc<"evalDefinitions">> {
  const key = normalizeFactoryEvalKey(input.metricKey);
  const existing = await ctx.db
    .query("evalDefinitions")
    .withIndex("by_project_key_version", (q) =>
      q.eq("projectId", input.projectId).eq("key", key),
    )
    .order("desc")
    .first();
  if (existing) {
    if (
      existing.scope !== "ATTEMPT" ||
      existing.evaluatorType !== "DETERMINISTIC" ||
      existing.scoreType !== "NUMERIC"
    ) {
      throw new Error(
        `Factory Memory evaluator ${key} conflicts with an incompatible canonical definition.`,
      );
    }
    return existing;
  }
  const definitionId = await ctx.db.insert("evalDefinitions", {
    tenantId: input.tenantId,
    projectId: input.projectId,
    key,
    name: `Factory Memory: ${sanitizeFactoryText(input.metricKey, 160)}`,
    description:
      "Advisory Factory Memory context-effectiveness metric. It has no verification or acceptance authority.",
    scope: "ATTEMPT",
    evaluatorType: "DETERMINISTIC",
    scoreType: "NUMERIC",
    configuration: {
      domain: "FACTORY_MEMORY_CONTEXT",
      metricKey: sanitizeFactoryText(input.metricKey, 160),
      acceptanceAuthority: false,
    },
    enabled: true,
    version: 1,
    createdBy: input.actorId,
    createdAt: Date.now(),
  });
  const definition = await ctx.db.get(definitionId);
  if (!definition) throw new Error("Factory Memory evaluator write failed.");
  return definition;
}

async function factoryTelemetryDigest(value: unknown): Promise<string> {
  const canonical = JSON.stringify(canonicalize(value));
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}
