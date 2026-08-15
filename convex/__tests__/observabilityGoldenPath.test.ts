import { describe, expect, it } from "vitest";
import {
  aggregateTraceMetrics,
  compareExperimentVariants,
  evaluateDurationThreshold,
  evaluateFixtureJudge,
  sanitizeTraceValue,
} from "../lib/observability";
import { ensureAttemptTrace, finishAttemptTrace, recordTraceObservation } from "../lib/observabilityPersistence";
import { getWorkspaceDashboard, promoteTraceToDataset } from "../observability";

function functionHandler<T extends (...args: any[]) => any>(registered: unknown): T {
  return (registered as { _handler: T })._handler;
}

function createDb(initial: Record<string, any[]> = {}) {
  const tables: Record<string, any[]> = { traces: [], traceObservations: [], ...initial };
  let sequence = 1;
  const db = {
    get: async (id: string) => Object.values(tables).flat().find((row) => row._id === id) ?? null,
    insert: async (table: string, value: any) => {
      const id = `${table}-${sequence++}`;
      (tables[table] ??= []).push({ _id: id, _creationTime: sequence, ...value });
      return id;
    },
    patch: async (id: string, patch: any) => {
      const row = Object.values(tables).flat().find((item) => item._id === id);
      if (!row) throw new Error(`Missing ${id}`);
      Object.assign(row, patch);
    },
    query: (table: string) => {
      let rows = [...(tables[table] ?? [])];
      const builder: any = {
        withIndex: (_name: string, apply: (q: any) => any) => {
          const conditions: Array<[string, unknown]> = [];
          const q: any = { eq: (field: string, value: unknown) => { conditions.push([field, value]); return q; } };
          apply(q);
          rows = rows.filter((row) => conditions.every(([field, value]) => row[field] === value));
          return builder;
        },
        order: (direction: string) => {
          rows.sort((a, b) => ((a.startedAt ?? a.createdAt ?? a._creationTime) - (b.startedAt ?? b.createdAt ?? b._creationTime)) * (direction === "desc" ? -1 : 1));
          return builder;
        },
        first: async () => rows[0] ?? null,
        collect: async () => [...rows],
        take: async (count: number) => rows.slice(0, count),
      };
      return builder;
    },
  };
  return { db, tables };
}

describe("observability golden path", () => {
  it("fails public trace reads and dataset promotion closed for anonymous callers", async () => {
    const originalDemoFlag = process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    try {
      const project = { _id: "project-1", tenantId: "tenant-1", name: "Factory", slug: "factory" };
      const trace = {
        _id: "trace-1", projectId: project._id, tenantId: project.tenantId,
        traceKey: "trace-1", externalTraceId: "1234567890abcdef", purpose: "SOFTWARE",
        name: "Unauthorized trace", status: "RUNNING", startedAt: 1, createdAt: 1, updatedAt: 1,
      };
      const { db } = createDb({ projects: [project], traces: [trace] });
      const ctx = { db, auth: { getUserIdentity: async () => null } } as any;

      await expect(functionHandler(getWorkspaceDashboard)(ctx, { projectId: project._id }))
        .rejects.toThrow(/unavailable or unauthorized/);
      await expect(functionHandler(promoteTraceToDataset)(ctx, { traceId: trace._id }))
        .rejects.toThrow(/unavailable or unauthorized/);
    } finally {
      if (originalDemoFlag === undefined) delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
      else process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT = originalDemoFlag;
    }
  });

  it("persists Codex and Loom Attempts with nested, redacted observations", async () => {
    const run = {
      _id: "run-codex", projectId: "project-1", tenantId: "tenant-1", workOrderId: "wo-1",
      runId: "attempt-1", workflowId: "loom-delivery", status: "RUNNING", startedAt: 1_000,
      executorAdapter: "codex", executorVersion: "v1", model: "gpt-5", initialInput: "Build the approved change",
      context: { task: "bounded task", apiKey: "must-not-persist" },
    };
    const loomRun = { ...run, _id: "run-loom", runId: "attempt-2", executorAdapter: "loom", model: "claude-sonnet" };
    const canceledRun = {
      ...run,
      _id: "run-canceled",
      runId: "attempt-3",
      status: "CANCELED",
      completedAt: 12_000,
    };
    const { db, tables } = createDb({ workflowRuns: [run, loomRun, canceledRun], factoryDefinitionVersions: [] });
    const trace = await ensureAttemptTrace({ db }, run);
    const planning = await recordTraceObservation({ db }, trace, {
      idempotencyKey: "planning", type: "AGENT", name: "Planning", startedAt: 1_100, endedAt: 2_000, status: "SUCCESS",
    });
    const generation = await recordTraceObservation({ db }, trace, {
      idempotencyKey: "planning-generation", parentObservationId: planning._id, type: "GENERATION", name: "Plan model call",
      startedAt: 1_200, endedAt: 1_800, status: "SUCCESS", model: "gpt-5", provider: "openai",
      tokenUsage: { input: 100, output: 50 }, input: { authorization: "Bearer secret-value", prompt: "safe" },
    });
    await recordTraceObservation({ db }, trace, {
      idempotencyKey: "tool-test", parentObservationId: planning._id, type: "TOOL", name: "pnpm test",
      toolName: "shell", startedAt: 1_800, endedAt: 2_100, status: "SUCCESS", output: { exitCode: 0 },
    });
    await recordTraceObservation({ db }, trace, {
      idempotencyKey: "verification", type: "EVALUATOR", name: "Independent verification",
      verificationRunId: "verification-1", evidenceEnvelopeIds: ["evidence-1"],
      startedAt: 8_000, endedAt: 9_000, status: "SUCCESS", output: { verdict: "VERIFIED" },
    });
    await finishAttemptTrace({ db }, run, { status: "COMPLETED", completedAt: 11_000, output: { pullRequest: 42 } });

    const loomTrace = await ensureAttemptTrace({ db }, loomRun);
    await recordTraceObservation({ db }, loomTrace, {
      idempotencyKey: "loom-worker", type: "AGENT", name: "Loom story worker", startedAt: 2_000, status: "RUNNING",
      metadata: { adapter: "loom", boundaryVersion: "v1" },
    });
    const canceledTrace = await ensureAttemptTrace({ db }, canceledRun);
    const canceledRoot = tables.traceObservations.find((row) =>
      row.traceId === canceledTrace._id && row.idempotencyKey === "attempt-root"
    );

    expect(run.primaryTraceId).toBe(trace._id);
    expect(tables.traces).toHaveLength(3);
    expect((await db.get(trace._id)).status).toBe("SUCCESS");
    expect(generation.parentObservationId).toBe(planning._id);
    await expect(recordTraceObservation({ db }, trace, {
      idempotencyKey: "planning", parentObservationId: generation._id, type: "AGENT", name: "Planning",
      startedAt: 1_100, endedAt: 2_000, status: "SUCCESS",
    })).rejects.toThrow(/create a cycle/);
    expect(JSON.stringify(generation.input)).not.toContain("secret-value");
    expect(tables.traceObservations.find((row) => row.verificationRunId === "verification-1")?.evidenceEnvelopeIds).toEqual(["evidence-1"]);
    expect(tables.traceObservations.find((row) => row.traceId === loomTrace._id)?.name).toContain("Attempt");
    expect(tables.traceObservations.some((row) => row.name === "Loom story worker")).toBe(true);
    expect(canceledTrace.status).toBe("CANCELED");
    expect(canceledRoot?.status).toBe("FAILED");
  });

  it("keeps deterministic, judge, experiment, and aggregate results attributable", () => {
    expect(evaluateDurationThreshold({ durationMs: 9_000, thresholdMs: 10_000 }).value).toBe(true);
    expect(evaluateFixtureJudge({ rubric: "Assess planning quality", rubricVersion: "v4", score: 0.93, reason: "Complete and bounded." }))
      .toMatchObject({ value: 0.93, evaluatorVersion: "v4" });
    expect(() => evaluateFixtureJudge({ rubric: "x", rubricVersion: "latest", score: 1, reason: "x" })).toThrow(/versioned rubric/);

    const variants = compareExperimentVariants([
      { name: "Factory v14", samples: [{ success: false, durationMs: 14_000, costUsd: 4, score: 0.8 }] },
      { name: "Factory v15", samples: [{ success: true, durationMs: 8_000, costUsd: 2, score: 0.95 }] },
    ]);
    expect(variants[1]).toMatchObject({ sampleSize: 1, metrics: { successRate: 1, averageScore: 0.95 } });
    expect(aggregateTraceMetrics([
      { status: "SUCCESS", durationMs: 8_000, estimatedCostUsd: 2, tokenUsage: { total: 100 }, humanInterventionCount: 0 },
      { status: "FAILED", durationMs: 14_000, estimatedCostUsd: 4, tokenUsage: { total: 200 }, humanInterventionCount: 1 },
    ])).toMatchObject({ attempts: 2, successRate: 0.5, averageCostUsd: 3, averageTokens: 150, humanInterventionRate: 0.5 });
    expect(sanitizeTraceValue({ password: "secret", nested: { token: "abc" } })).toEqual({ password: "[REDACTED]", nested: { token: "[REDACTED]" } });
  });
});
