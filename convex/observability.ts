import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "./lib/companyAccess";
import {
  aggregateTraceMetrics,
  compareExperimentVariants,
  evaluateDurationThreshold,
  evaluateFixtureJudge,
  finiteNonNegative,
  optionalString,
  sanitizeTraceValue,
} from "./lib/observability";
import {
  ensureAttemptTrace,
  finishAttemptTrace,
  recordTraceObservation,
} from "./lib/observabilityPersistence";

const traceStatus = v.union(
  v.literal("RUNNING"),
  v.literal("SUCCESS"),
  v.literal("FAILED"),
  v.literal("CANCELED")
);
const tracePurpose = v.union(
  v.literal("SOFTWARE"),
  v.literal("VERIFICATION"),
  v.literal("AUTOMATION"),
  v.literal("EVALUATION"),
  v.literal("SYSTEM")
);
const evalScope = v.union(
  v.literal("OBSERVATION"),
  v.literal("TRACE"),
  v.literal("ATTEMPT"),
  v.literal("EXPERIMENT")
);
const evaluatorType = v.union(
  v.literal("DETERMINISTIC"),
  v.literal("LLM_JUDGE"),
  v.literal("HUMAN"),
  v.literal("EXTERNAL")
);
const scoreType = v.union(
  v.literal("NUMERIC"),
  v.literal("BOOLEAN"),
  v.literal("CATEGORICAL"),
  v.literal("TEXT")
);

export const getWorkspaceDashboard = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(traceStatus),
    purpose: v.optional(tracePurpose),
    executor: v.optional(v.string()),
    model: v.optional(v.string()),
    search: v.optional(v.string()),
    startedAfter: v.optional(v.number()),
    startedBefore: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    const requestedLimit = Math.max(1, Math.min(Math.floor(args.limit ?? 100), 250));
    const rows = await ctx.db
      .query("traces")
      .withIndex("by_project_started", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(500);
    const search = args.search?.trim().toLowerCase();
    const filtered = rows.filter((trace) => {
      if (args.status && trace.status !== args.status) return false;
      if (args.purpose && trace.purpose !== args.purpose) return false;
      if (args.executor && trace.executor !== args.executor) return false;
      if (args.model && trace.model !== args.model) return false;
      if (args.startedAfter !== undefined && trace.startedAt < args.startedAfter) return false;
      if (args.startedBefore !== undefined && trace.startedAt > args.startedBefore) return false;
      if (search && ![trace.name, trace.executor, trace.model, trace.externalTraceId, ...(trace.tags ?? [])]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(search))) return false;
      return true;
    }).slice(0, requestedLimit);

    const [definitions, scores, datasets, experiments] = await Promise.all([
      ctx.db.query("evalDefinitions").withIndex("by_project", (q) => q.eq("projectId", args.projectId)).take(500),
      ctx.db.query("evalScores").withIndex("by_project_created", (q) => q.eq("projectId", args.projectId)).order("desc").take(5_000),
      ctx.db.query("evalDatasets").withIndex("by_project_updated", (q) => q.eq("projectId", args.projectId)).order("desc").take(100),
      ctx.db.query("experiments").withIndex("by_project_created", (q) => q.eq("projectId", args.projectId)).order("desc").take(100),
    ]);
    const traceIds = new Set(filtered.map((trace) => String(trace._id)));
    const filteredScores = scores.filter((score) => score.traceId && traceIds.has(String(score.traceId)));
    const definitionById = new Map(definitions.map((definition) => [String(definition._id), definition]));
    const traceSummaries = await Promise.all(filtered.map(async (trace) => {
      const [workOrder, run, observations] = await Promise.all([
        trace.workOrderId ? ctx.db.get(trace.workOrderId) : null,
        trace.workflowRunId ? ctx.db.get(trace.workflowRunId) : null,
        ctx.db.query("traceObservations").withIndex("by_trace", (q) => q.eq("traceId", trace._id)).take(5_001),
      ]);
      const traceScores = filteredScores.filter((score) => score.traceId === trace._id);
      return {
        ...trace,
        workOrderTitle: workOrder?.title,
        runId: run?.runId,
        observationCount: Math.min(observations.length, 5_000),
        observationCountCapped: observations.length > 5_000,
        generationCount: observations.filter((observation) => observation.type === "GENERATION").length,
        toolCount: observations.filter((observation) => observation.type === "TOOL").length,
        evalCount: traceScores.length,
        latestScores: traceScores.sort((left, right) => right.createdAt - left.createdAt).slice(0, 4).map((score) => ({
          ...score,
          definitionName: definitionById.get(String(score.evalDefinitionId))?.name ?? "Unknown evaluator",
          definitionVersion: definitionById.get(String(score.evalDefinitionId))?.version,
        })),
      };
    }));
    const evalAnalytics = definitions.map((definition) => {
      const definitionScores = scores.filter((score) => score.evalDefinitionId === definition._id);
      const numeric = definitionScores.filter((score) => typeof score.value === "number").map((score) => score.value as number);
      const boolean = definitionScores.filter((score) => typeof score.value === "boolean").map((score) => score.value as boolean);
      return {
        ...definition,
        executionCount: definitionScores.length,
        averageScore: numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : undefined,
        passRate: boolean.length ? boolean.filter(Boolean).length / boolean.length : undefined,
        failureRate: boolean.length ? boolean.filter((value) => !value).length / boolean.length : undefined,
        lastRunAt: definitionScores.reduce<number | undefined>((latest, score) => !latest || score.createdAt > latest ? score.createdAt : latest, undefined),
      };
    });
    return {
      metrics: aggregateTraceMetrics(filtered),
      traces: traceSummaries,
      evalAnalytics,
      datasets: await Promise.all(datasets.map(async (dataset) => ({
        ...dataset,
        itemCount: (await ctx.db.query("evalDatasetItems").withIndex("by_dataset", (q) => q.eq("datasetId", dataset._id)).take(5_000)).length,
      }))),
      experiments: await Promise.all(experiments.map(async (experiment) => ({
        ...experiment,
        variants: await ctx.db.query("experimentVariants").withIndex("by_experiment", (q) => q.eq("experimentId", experiment._id)).take(100),
      }))),
      filters: {
        executors: [...new Set(rows.map((trace) => trace.executor).filter((value): value is string => Boolean(value)))].sort(),
        models: [...new Set(rows.map((trace) => trace.model).filter((value): value is string => Boolean(value)))].sort(),
      },
    };
  },
});

export const getTraceDetail = query({
  args: { traceId: v.id("traces") },
  handler: async (ctx, args) => {
    const trace = await ctx.db.get(args.traceId);
    if (!trace) return null;
    await requireWorkspacePermission(ctx, trace.projectId, FACTORY_PERMISSIONS.VIEW);
    const [observations, scores, run, workOrder, factoryVersion, verificationRuns] = await Promise.all([
      ctx.db.query("traceObservations").withIndex("by_trace_started", (q) => q.eq("traceId", trace._id)).take(5_001),
      ctx.db.query("evalScores").withIndex("by_trace", (q) => q.eq("traceId", trace._id)).take(1_000),
      trace.workflowRunId ? ctx.db.get(trace.workflowRunId) : null,
      trace.workOrderId ? ctx.db.get(trace.workOrderId) : null,
      trace.factoryDefinitionVersionId ? ctx.db.get(trace.factoryDefinitionVersionId) : null,
      trace.workflowRunId
        ? ctx.db.query("verificationRuns").withIndex("by_run", (q) => q.eq("workflowRunId", trace.workflowRunId!)).take(100)
        : Promise.resolve([]),
    ]);
    const definitionIds = [...new Set(scores.map((score) => score.evalDefinitionId))];
    const definitions = (await Promise.all(definitionIds.map((id) => ctx.db.get(id)))).filter(
      (definition): definition is Doc<"evalDefinitions"> => Boolean(definition)
    );
    const definitionById = new Map(definitions.map((definition) => [String(definition._id), definition]));
    return {
      trace,
      observations: observations.slice(0, 5_000),
      observationsTruncated: observations.length > 5_000,
      scores: scores.sort((left, right) => right.createdAt - left.createdAt).map((score) => ({
        ...score,
        definition: definitionById.get(String(score.evalDefinitionId)),
      })),
      run,
      workOrder,
      factoryVersion,
      verificationRuns,
    };
  },
});

export const createEvalDefinitionVersion = mutation({
  args: {
    projectId: v.id("projects"),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    scope: evalScope,
    evaluatorType,
    scoreType,
    rubric: v.optional(v.string()),
    configuration: v.optional(v.any()),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const access = await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.IMPROVE);
    const key = args.key.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
    if (!key) throw new Error("Evaluator key is required.");
    if (args.evaluatorType === "LLM_JUDGE" && !args.rubric?.trim()) {
      throw new Error("LLM judge evaluators require an explicit versioned rubric.");
    }
    const latestVersion = await ctx.db.query("evalDefinitions")
      .withIndex("by_project_key_version", (q) => q.eq("projectId", args.projectId).eq("key", key))
      .order("desc")
      .first();
    const version = (latestVersion?.version ?? 0) + 1;
    const definitionId = await ctx.db.insert("evalDefinitions", {
      tenantId: access.project.tenantId,
      projectId: args.projectId,
      key,
      name: optionalString(args.name, 200) ?? key,
      description: optionalString(args.description, 2_000),
      scope: args.scope,
      evaluatorType: args.evaluatorType,
      scoreType: args.scoreType,
      rubric: optionalString(args.rubric, 20_000),
      configuration: sanitizeTraceValue(args.configuration),
      enabled: args.enabled,
      version,
      createdBy: access.actorId,
      createdAt: Date.now(),
    });
    return await ctx.db.get(definitionId);
  },
});

export const runDurationEvaluator = mutation({
  args: {
    traceId: v.id("traces"),
    evalDefinitionId: v.id("evalDefinitions"),
    thresholdMs: v.number(),
  },
  handler: async (ctx, args) => {
    const [trace, definition] = await Promise.all([ctx.db.get(args.traceId), ctx.db.get(args.evalDefinitionId)]);
    if (!trace || !definition || trace.projectId !== definition.projectId) throw new Error("Trace evaluator scope is invalid.");
    const access = await requireWorkspacePermission(ctx, trace.projectId, FACTORY_PERMISSIONS.IMPROVE);
    if (definition.evaluatorType !== "DETERMINISTIC" || definition.scoreType !== "BOOLEAN") {
      throw new Error("Duration threshold requires a deterministic boolean evaluator definition.");
    }
    const result = evaluateDurationThreshold({ durationMs: trace.durationMs, thresholdMs: args.thresholdMs });
    return insertScore(ctx, {
      projectId: trace.projectId,
      tenantId: trace.tenantId,
      definition,
      traceId: trace._id,
      workflowRunId: trace.workflowRunId,
      value: result.value,
      reason: result.reason,
      evaluator: { type: "DETERMINISTIC", version: `v${definition.version}` },
      createdBy: access.actorId,
      idempotencyKey: `duration:${trace._id}:${definition._id}:${Date.now()}`,
    });
  },
});

export const recordHumanScore = mutation({
  args: {
    traceId: v.id("traces"),
    observationId: v.optional(v.id("traceObservations")),
    evalDefinitionId: v.id("evalDefinitions"),
    value: v.union(v.number(), v.boolean(), v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [trace, definition, observation] = await Promise.all([
      ctx.db.get(args.traceId),
      ctx.db.get(args.evalDefinitionId),
      args.observationId ? ctx.db.get(args.observationId) : null,
    ]);
    if (!trace || !definition || trace.projectId !== definition.projectId || (observation && observation.traceId !== trace._id)) {
      throw new Error("Human evaluation target is invalid.");
    }
    const access = await requireWorkspacePermission(ctx, trace.projectId, FACTORY_PERMISSIONS.IMPROVE);
    if (definition.evaluatorType !== "HUMAN") throw new Error("Selected evaluator is not a human evaluator.");
    assertScoreValue(definition.scoreType, args.value);
    return insertScore(ctx, {
      projectId: trace.projectId,
      tenantId: trace.tenantId,
      definition,
      traceId: trace._id,
      observationId: observation?._id,
      workflowRunId: trace.workflowRunId,
      value: args.value,
      reason: args.reason,
      evaluator: { type: "HUMAN", version: `v${definition.version}` },
      createdBy: access.actorId,
      idempotencyKey: `human:${trace._id}:${observation?._id ?? "trace"}:${definition._id}:${Date.now()}`,
    });
  },
});

export const promoteTraceToDataset = mutation({
  args: {
    traceId: v.id("traces"),
    datasetId: v.optional(v.id("evalDatasets")),
    datasetName: v.optional(v.string()),
    expectedOutcome: v.optional(v.any()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const trace = await ctx.db.get(args.traceId);
    if (!trace) throw new Error("Trace not found.");
    const access = await requireWorkspacePermission(ctx, trace.projectId, FACTORY_PERMISSIONS.IMPROVE);
    let dataset = args.datasetId ? await ctx.db.get(args.datasetId) : null;
    if (dataset && dataset.projectId !== trace.projectId) throw new Error("Dataset belongs to another workspace.");
    if (!dataset) {
      const name = optionalString(args.datasetName, 200) ?? "Software Factory Regression";
      dataset = await ctx.db.query("evalDatasets")
        .withIndex("by_project_name", (q) => q.eq("projectId", trace.projectId).eq("name", name))
        .first();
      if (!dataset) {
        const now = Date.now();
        const datasetId = await ctx.db.insert("evalDatasets", {
          tenantId: trace.tenantId,
          projectId: trace.projectId,
          name,
          description: "Regression cases promoted from governed execution traces.",
          version: 1,
          createdBy: access.actorId,
          createdAt: now,
          updatedAt: now,
        });
        dataset = await ctx.db.get(datasetId);
      }
    }
    if (!dataset) throw new Error("Dataset could not be created.");
    const idempotencyKey = `dataset:${dataset._id}:trace:${trace._id}`;
    const existing = await ctx.db.query("evalDatasetItems")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", idempotencyKey))
      .first();
    if (existing) return { dataset, item: existing, created: false };
    const [workOrder, run] = await Promise.all([
      trace.workOrderId ? ctx.db.get(trace.workOrderId) : null,
      trace.workflowRunId ? ctx.db.get(trace.workflowRunId) : null,
    ]);
    const now = Date.now();
    const itemId = await ctx.db.insert("evalDatasetItems", {
      tenantId: trace.tenantId,
      projectId: trace.projectId,
      datasetId: dataset._id,
      sourceTraceId: trace._id,
      sourceWorkOrderId: trace.workOrderId,
      sourceWorkflowRunId: trace.workflowRunId,
      idempotencyKey,
      input: sanitizeTraceValue({
        trace: { purpose: trace.purpose, name: trace.name, input: trace.input, tags: trace.tags },
        workOrder: workOrder ? {
          title: workOrder.title,
          desiredOutcome: workOrder.desiredOutcome,
          acceptanceCriteria: workOrder.acceptanceCriteria,
          constraints: workOrder.constraints,
        } : undefined,
        attempt: run ? { workflowId: run.workflowId, initialInput: run.initialInput } : undefined,
      }),
      expectedOutcome: sanitizeTraceValue(args.expectedOutcome),
      metadata: sanitizeTraceValue({ ...objectRecord(args.metadata), sourceTraceStatus: trace.status }),
      createdBy: access.actorId,
      createdAt: now,
    });
    await ctx.db.patch(dataset._id, { version: dataset.version + 1, updatedAt: now });
    return { dataset: await ctx.db.get(dataset._id), item: await ctx.db.get(itemId), created: true };
  },
});

export const createExperiment = mutation({
  args: {
    projectId: v.id("projects"),
    datasetId: v.id("evalDatasets"),
    name: v.string(),
    evalDefinitionIds: v.array(v.id("evalDefinitions")),
    variants: v.array(v.object({
      name: v.string(),
      factoryDefinitionVersionId: v.optional(v.id("factoryDefinitionVersions")),
      executor: v.optional(v.string()),
      model: v.optional(v.string()),
      configuration: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const access = await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.IMPROVE);
    const dataset = await ctx.db.get(args.datasetId);
    if (!dataset || dataset.projectId !== args.projectId) throw new Error("Experiment dataset is invalid.");
    if (args.variants.length < 2 || args.variants.length > 8) throw new Error("Experiments require two to eight variants.");
    if (args.evalDefinitionIds.length < 1 || args.evalDefinitionIds.length > 20) {
      throw new Error("Experiments require one to twenty evaluator definitions.");
    }
    if (new Set(args.evalDefinitionIds.map(String)).size !== args.evalDefinitionIds.length) {
      throw new Error("Experiment evaluator definitions must be unique.");
    }
    const definitions = await Promise.all(args.evalDefinitionIds.map((id) => ctx.db.get(id)));
    if (definitions.some((definition) => !definition || definition.projectId !== args.projectId)) {
      throw new Error("Experiment evaluators must belong to the workspace.");
    }
    const now = Date.now();
    const experimentId = await ctx.db.insert("experiments", {
      tenantId: access.project.tenantId,
      projectId: args.projectId,
      datasetId: dataset._id,
      datasetVersion: dataset.version,
      name: optionalString(args.name, 200) ?? "Factory comparison",
      status: "DRAFT",
      evalDefinitionIds: args.evalDefinitionIds,
      createdBy: access.actorId,
      createdAt: now,
    });
    const variantIds = [];
    for (const variant of args.variants) {
      variantIds.push(await ctx.db.insert("experimentVariants", {
        tenantId: access.project.tenantId,
        projectId: args.projectId,
        experimentId,
        name: optionalString(variant.name, 200) ?? "Variant",
        factoryDefinitionVersionId: variant.factoryDefinitionVersionId,
        executor: optionalString(variant.executor, 100),
        model: optionalString(variant.model, 200),
        configuration: sanitizeTraceValue(variant.configuration),
        sampleSize: 0,
        createdAt: now,
      }));
    }
    return { experiment: await ctx.db.get(experimentId), variantIds };
  },
});

export const ensureAttemptTraceInternal = internalMutation({
  args: { workflowRunId: v.id("workflowRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run) throw new Error("Attempt not found.");
    return ensureAttemptTrace(ctx, run);
  },
});

export const recordObservationInternal = internalMutation({
  args: { workflowRunId: v.id("workflowRuns"), observation: v.any() },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run) throw new Error("Attempt not found.");
    const trace = await ensureAttemptTrace(ctx, run);
    return recordTraceObservation(ctx, trace, args.observation);
  },
});

export const finishAttemptTraceInternal = internalMutation({
  args: {
    workflowRunId: v.id("workflowRuns"),
    status: v.union(v.literal("COMPLETED"), v.literal("FAILED"), v.literal("CANCELED")),
    completedAt: v.number(),
    failureReason: v.optional(v.string()),
    output: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.workflowRunId);
    if (!run) throw new Error("Attempt not found.");
    return finishAttemptTrace(ctx, run, args);
  },
});

export const completeDeterministicExperimentInternal = internalMutation({
  args: {
    experimentId: v.id("experiments"),
    samples: v.array(v.object({
      variantId: v.id("experimentVariants"),
      success: v.boolean(),
      durationMs: v.number(),
      costUsd: v.number(),
      score: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) throw new Error("Experiment not found.");
    const variants = await ctx.db.query("experimentVariants")
      .withIndex("by_experiment", (q) => q.eq("experimentId", experiment._id))
      .collect();
    const comparison = compareExperimentVariants(variants.map((variant) => ({
      name: variant.name,
      samples: args.samples.filter((sample) => sample.variantId === variant._id),
    })));
    const now = Date.now();
    for (const [index, result] of comparison.entries()) {
      await ctx.db.patch(variants[index]._id, { sampleSize: result.sampleSize, metrics: result.metrics, completedAt: now });
    }
    await ctx.db.patch(experiment._id, { status: "COMPLETED", completedAt: now, metadata: { deterministicFixture: true } });
    return comparison;
  },
});

export const recordFixtureJudgeInternal = internalMutation({
  args: {
    traceId: v.id("traces"),
    observationId: v.optional(v.id("traceObservations")),
    evalDefinitionId: v.id("evalDefinitions"),
    rubric: v.string(),
    rubricVersion: v.string(),
    score: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const [trace, definition] = await Promise.all([ctx.db.get(args.traceId), ctx.db.get(args.evalDefinitionId)]);
    if (!trace || !definition || definition.projectId !== trace.projectId || definition.evaluatorType !== "LLM_JUDGE") {
      throw new Error("Fixture judge scope is invalid.");
    }
    const result = evaluateFixtureJudge(args);
    const evaluatorObservation = await recordTraceObservation(ctx, trace, {
      idempotencyKey: `evaluator:${definition.key}:${definition.version}:${args.rubricVersion}`,
      parentObservationId: args.observationId,
      type: "EVALUATOR",
      name: definition.name,
      startedAt: Date.now(),
      endedAt: Date.now(),
      status: "SUCCESS",
      input: { rubric: args.rubric, rubricVersion: args.rubricVersion },
      output: { score: result.value, reason: result.reason },
      promptVersion: args.rubricVersion,
      metadata: { fixture: true, liveModelCall: false },
    });
    return insertScore(ctx, {
      projectId: trace.projectId,
      tenantId: trace.tenantId,
      definition,
      traceId: trace._id,
      observationId: evaluatorObservation._id,
      workflowRunId: trace.workflowRunId,
      value: result.value,
      reason: result.reason,
      evaluator: { type: "LLM_JUDGE", model: "fixture-judge", version: result.evaluatorVersion },
      createdBy: "system:fixture-judge",
      idempotencyKey: `fixture-judge:${trace._id}:${definition._id}:${result.evaluatorVersion}`,
    });
  },
});

async function insertScore(ctx: MutationCtx, input: {
  projectId: Id<"projects">;
  tenantId?: Id<"tenants">;
  definition: Doc<"evalDefinitions">;
  traceId?: Id<"traces">;
  observationId?: Id<"traceObservations">;
  workflowRunId?: Id<"workflowRuns">;
  experimentId?: Id<"experiments">;
  experimentVariantId?: Id<"experimentVariants">;
  value: number | boolean | string;
  reason?: string;
  evaluator: { type: "DETERMINISTIC" | "LLM_JUDGE" | "HUMAN" | "EXTERNAL"; model?: string; version: string };
  createdBy: string;
  idempotencyKey: string;
}) {
  assertScoreValue(input.definition.scoreType, input.value);
  if (!input.traceId && !input.observationId && !input.workflowRunId && !input.experimentId) {
    throw new Error("Eval score requires an attributable target.");
  }
  const existing = await ctx.db.query("evalScores")
    .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", input.idempotencyKey))
    .first();
  if (existing) return existing;
  const scoreId = await ctx.db.insert("evalScores", {
    tenantId: input.tenantId,
    projectId: input.projectId,
    evalDefinitionId: input.definition._id,
    traceId: input.traceId,
    observationId: input.observationId,
    workflowRunId: input.workflowRunId,
    experimentId: input.experimentId,
    experimentVariantId: input.experimentVariantId,
    idempotencyKey: input.idempotencyKey,
    scoreType: input.definition.scoreType,
    value: input.value,
    reason: optionalString(input.reason, 4_000),
    evaluator: input.evaluator,
    createdBy: input.createdBy,
    createdAt: Date.now(),
  });
  return await ctx.db.get(scoreId);
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function assertScoreValue(type: string, value: number | boolean | string) {
  if (type === "NUMERIC" && typeof value !== "number") throw new Error("Numeric evaluator requires a number.");
  if (type === "BOOLEAN" && typeof value !== "boolean") throw new Error("Boolean evaluator requires true or false.");
  if ((type === "CATEGORICAL" || type === "TEXT") && typeof value !== "string") {
    throw new Error(`${type === "TEXT" ? "Text" : "Categorical"} evaluator requires a string.`);
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Eval score must be finite.");
}
