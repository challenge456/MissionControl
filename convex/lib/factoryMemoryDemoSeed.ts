import type { Id } from "../_generated/dataModel";
import { sha256Hex } from "./harnessPrChecks";
import {
  ensureFactoryEvalDefinition,
  factoryTelemetryMetadata,
  recordFactoryRetrievalObservation,
  tracePurposeForFactoryPurpose,
} from "./factoryMemoryTelemetry";
import {
  ensureAttemptTrace,
  insertEvalScore,
} from "./observabilityPersistence";

const FIXTURE_KEY = "shop-service-five-phase-v1";
const REVISION = "demo-sha-auth-0042";

type SeedInput = {
  tenantId: Id<"tenants">;
  projectId: Id<"projects">;
  now: number;
};

type FixtureSource = {
  sourceType:
    | "source-code"
    | "adr"
    | "incident"
    | "test"
    | "work-order"
    | "verification-evidence"
    | "regression-case";
  sourceId: string;
  title: string;
  path?: string;
  content: string;
};

const SOURCES: FixtureSource[] = [
  {
    sourceType: "source-code",
    sourceId: "src/auth/authMiddleware.ts",
    title: "Authentication middleware",
    path: "src/auth/authMiddleware.ts",
    content:
      "export function authMiddleware(request) { validateAccessToken(request); }\nToken refresh support must preserve authorization on every orders-api endpoint. Demo credentials remain [REDACTED].",
  },
  {
    sourceType: "adr",
    sourceId: "ADR-004",
    title: "ADR-004 Require authorization on orders endpoints",
    path: "docs/adr/ADR-004.md",
    content:
      "ADR-004 requires authentication middleware authorization on every orders-api endpoint. Unauthenticated access must return 401.",
  },
  {
    sourceType: "incident",
    sourceId: "INC-12",
    title: "Unauthenticated orders endpoint incident",
    content:
      "INC-12 affected orders-api after an authentication middleware change allowed unauthorized orders access. Reproduce the incident during verification.",
  },
  {
    sourceType: "test",
    sourceId: "auth.integration.test",
    title: "Authentication integration tests",
    path: "tests/auth.integration.test.ts",
    content:
      "Covers valid access tokens, expired-token rejection, token refresh success, and unauthenticated 401 behavior for auth-middleware.",
  },
  {
    sourceType: "test",
    sourceId: "orders.e2e.test",
    title: "Orders endpoint end-to-end tests",
    path: "tests/orders.e2e.test.ts",
    content:
      "Exercises all orders-api endpoints through authentication middleware and includes billing-client dependency smoke tests.",
  },
  {
    sourceType: "work-order",
    sourceId: "WO-42",
    title: "Previous auth middleware change",
    content:
      "WO-42 changed auth-middleware and failed verification because the unauthenticated orders endpoint returned 200 instead of 401.",
  },
  {
    sourceType: "verification-evidence",
    sourceId: "WO-42-verification",
    title: "WO-42 failed verification evidence",
    content:
      "Objective evidence recorded an orders-api authorization boundary failure after the prior auth middleware change.",
  },
  {
    sourceType: "regression-case",
    sourceId: "unauthorized-orders-access",
    title: "Unauthorized orders access regression",
    content:
      "Regression dataset case reproduces INC-12: unauthenticated orders-api access must be rejected with 401.",
  },
];

const ENTITY_SPECS = [
  ["repository", "repository:shop-service", "shop-service", ["shop service"]],
  [
    "component",
    "component:auth-middleware",
    "auth-middleware",
    ["AuthMiddleware", "authentication middleware"],
  ],
  ["service", "service:orders-api", "orders-api", ["orders API"]],
  ["service", "service:billing-client", "billing-client", ["billing client"]],
  ["adr", "adr:ADR-004", "ADR-004", []],
  ["incident", "incident:INC-12", "INC-12", []],
  ["test", "test:auth.integration.test", "auth.integration.test", []],
  ["test", "test:orders.e2e.test", "orders.e2e.test", []],
  ["workOrder", "work-order:WO-42", "WO-42", []],
  [
    "regressionCase",
    "regression:unauthorized-orders-access",
    "unauthorized-orders-access",
    [],
  ],
] as const;

const RELATIONSHIP_SPECS = [
  [
    "repository:shop-service",
    "contains",
    "component:auth-middleware",
    "deterministic",
  ],
  [
    "repository:shop-service",
    "contains",
    "service:orders-api",
    "deterministic",
  ],
  [
    "repository:shop-service",
    "contains",
    "service:billing-client",
    "deterministic",
  ],
  [
    "component:auth-middleware",
    "used_by",
    "service:orders-api",
    "deterministic",
  ],
  ["service:orders-api", "governed_by", "adr:ADR-004", "authoritative"],
  ["incident:INC-12", "affected", "service:orders-api", "authoritative"],
  ["service:orders-api", "covered_by", "test:orders.e2e.test", "deterministic"],
  [
    "test:auth.integration.test",
    "tests",
    "component:auth-middleware",
    "deterministic",
  ],
  ["work-order:WO-42", "changes", "component:auth-middleware", "authoritative"],
  [
    "regression:unauthorized-orders-access",
    "derived_from",
    "incident:INC-12",
    "authoritative",
  ],
  [
    "service:orders-api",
    "depends_on",
    "service:billing-client",
    "deterministic",
  ],
  [
    "component:auth-middleware",
    "similar_to",
    "service:billing-client",
    "inferred",
  ],
] as const;

async function hash(value: unknown): Promise<string> {
  return `sha256:${await sha256Hex(typeof value === "string" ? value : JSON.stringify(value))}`;
}

function attemptPurposeForRun(
  run: any,
): "IMPLEMENTATION" | "VERIFICATION" | "AUTOMATION" {
  if (run.attemptPurpose) return run.attemptPurpose;
  if (run.factoryPurpose === "VERIFICATION") return "VERIFICATION";
  if (run.factoryPurpose === "INTELLIGENT_AUTOMATION") return "AUTOMATION";
  return "IMPLEMENTATION";
}

export async function seedFactoryMemoryGoldenPath(ctx: any, input: SeedInput) {
  const { tenantId, projectId, now } = input;
  const counts = {
    documents: 0,
    chunks: 0,
    entities: 0,
    relationships: 0,
    contextPackages: 0,
  };
  const repository = await ctx.db
    .query("workspaceRepositories")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .first();
  const runs = await ctx.db
    .query("workflowRuns")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .collect();
  const workflowRun =
    runs.find((run: any) => run.runId === "auto-demo-3" && run.workOrderId) ??
    runs.find((run: any) => run.workOrderId);
  const workOrder = workflowRun?.workOrderId
    ? await ctx.db.get(workflowRun.workOrderId)
    : await ctx.db
        .query("workOrders")
        .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
        .first();
  if (!repository || !workOrder || !workflowRun) return counts;

  const factoryDefinition = await ctx.db
    .query("factoryDefinitions")
    .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
    .first();
  const factoryVersion = workflowRun?.factoryDefinitionVersionId
    ? await ctx.db.get(workflowRun.factoryDefinitionVersionId)
    : factoryDefinition
      ? await ctx.db
          .query("factoryDefinitionVersions")
          .withIndex("by_factory", (q: any) =>
            q.eq("factoryDefinitionId", factoryDefinition._id),
          )
          .order("desc")
          .first()
      : null;
  const linkedRun = workflowRun;
  const factoryPurpose =
    linkedRun.factoryPurpose ??
    factoryVersion?.purpose ??
    workOrder.factoryPurpose ??
    "SOFTWARE";
  const primaryTrace = await ensureAttemptTrace(ctx, linkedRun, {
    purpose: tracePurposeForFactoryPurpose(factoryPurpose),
  });

  const chunkBySource = new Map<string, any>();
  for (const source of SOURCES) {
    const provenance = {
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      path: source.path,
      revision: REVISION,
      timestamp: now - 60 * 60_000,
      derivation: "authoritative" as const,
    };
    let document = await ctx.db
      .query("factoryMemoryDocuments")
      .withIndex("by_project_repository_source", (q: any) =>
        q
          .eq("projectId", projectId)
          .eq("repositoryId", repository._id)
          .eq("sourceType", source.sourceType)
          .eq("sourceId", source.sourceId),
      )
      .first();
    if (!document) {
      const contentHash = await hash(source.content);
      const documentId = await ctx.db.insert("factoryMemoryDocuments", {
        tenantId,
        projectId,
        repositoryId: repository._id,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        workOrderId: workOrder._id,
        workflowRunId: linkedRun?._id,
        factoryDefinitionVersionId: factoryVersion?._id,
        title: source.title,
        content: source.content,
        metadata: {
          fixture: FIXTURE_KEY,
          secretPolicy: "redacted-at-ingestion",
        },
        contentHash,
        sourceRevision: REVISION,
        createdAt: now - 2 * 60 * 60_000,
        indexedAt: now - 60 * 60_000,
        provenance,
      });
      document = await ctx.db.get(documentId);
      counts.documents += 1;
    }
    let chunk = await ctx.db
      .query("factoryMemoryChunks")
      .withIndex("by_document", (q: any) => q.eq("documentId", document._id))
      .first();
    if (!chunk) {
      const chunkId = await ctx.db.insert("factoryMemoryChunks", {
        tenantId,
        projectId,
        repositoryId: repository._id,
        documentId: document._id,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        workOrderId: workOrder._id,
        workflowRunId: linkedRun?._id,
        factoryDefinitionVersionId: factoryVersion?._id,
        title: source.title,
        content: source.content,
        searchText: `${source.title}\n${source.content}`,
        chunkIndex: 0,
        estimatedTokens: Math.max(1, Math.ceil(source.content.length / 4)),
        contentHash: await hash(source.content),
        metadata: { fixture: FIXTURE_KEY },
        provenance: { ...provenance, parentDocumentId: String(document._id) },
      });
      chunk = await ctx.db.get(chunkId);
      counts.chunks += 1;
    }
    chunkBySource.set(source.sourceId, chunk);
  }

  const existingIngestion = (
    await ctx.db
      .query("factoryMemoryIngestionRuns")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .collect()
  ).find((run: any) => run.actorId === `demo:${FIXTURE_KEY}`);
  if (!existingIngestion) {
    await ctx.db.insert("factoryMemoryIngestionRuns", {
      tenantId,
      projectId,
      repositoryId: repository._id,
      status: "SUCCEEDED",
      sourceTypes: [...new Set(SOURCES.map((source) => source.sourceType))],
      indexedDocuments: SOURCES.length,
      indexedChunks: SOURCES.length,
      redactionCount: 1,
      actorId: `demo:${FIXTURE_KEY}`,
      startedAt: now - 65 * 60_000,
      completedAt: now - 60 * 60_000,
    });
  }

  const entityByKey = new Map<string, any>();
  for (const [entityType, key, label, aliases] of ENTITY_SPECS) {
    let entity = await ctx.db
      .query("factoryEntities")
      .withIndex("by_project_repository_key", (q: any) =>
        q
          .eq("projectId", projectId)
          .eq("repositoryId", repository._id)
          .eq("key", key),
      )
      .first();
    if (!entity) {
      const entityId = await ctx.db.insert("factoryEntities", {
        tenantId,
        projectId,
        repositoryId: repository._id,
        entityType,
        key,
        label,
        aliases: [...aliases],
        metadata: { fixture: FIXTURE_KEY },
        provenance: [
          {
            sourceType: "repository-document",
            sourceId: key,
            revision: REVISION,
            timestamp: now - 60 * 60_000,
            derivation: "deterministic",
          },
        ],
        createdAt: now - 60 * 60_000,
        updatedAt: now - 60 * 60_000,
      });
      entity = await ctx.db.get(entityId);
      counts.entities += 1;
    }
    entityByKey.set(key, entity);
  }

  for (const [
    sourceKey,
    relation,
    targetKey,
    derivation,
  ] of RELATIONSHIP_SPECS) {
    const source = entityByKey.get(sourceKey);
    const target = entityByKey.get(targetKey);
    const existing = await ctx.db
      .query("factoryRelationships")
      .withIndex("by_source_relation_target", (q: any) =>
        q
          .eq("sourceId", source._id)
          .eq("relation", relation)
          .eq("targetId", target._id),
      )
      .first();
    if (existing) continue;
    await ctx.db.insert("factoryRelationships", {
      tenantId,
      projectId,
      repositoryId: repository._id,
      sourceType: source.entityType,
      sourceId: source._id,
      relation,
      targetType: target.entityType,
      targetId: target._id,
      provenance: [
        {
          sourceType: "repository-document",
          sourceId: `${sourceKey}:${relation}:${targetKey}`,
          revision: REVISION,
          timestamp: now - 60 * 60_000,
          derivation,
        },
      ],
      confidence: derivation === "inferred" ? 0.42 : undefined,
      derivation,
      createdAt: now - 60 * 60_000,
    });
    counts.relationships += 1;
  }

  let retrievalPlan = (
    await ctx.db
      .query("factoryRetrievalPlans")
      .withIndex("by_work_order", (q: any) =>
        q.eq("workOrderId", workOrder._id),
      )
      .collect()
  ).find((plan: any) => plan.createdBy === `demo:${FIXTURE_KEY}`);
  if (!retrievalPlan) {
    const planId = await ctx.db.insert("factoryRetrievalPlans", {
      tenantId,
      projectId,
      repositoryId: repository._id,
      workOrderId: workOrder._id,
      workflowRunId: linkedRun?._id,
      factoryDefinitionVersionId: factoryVersion?._id,
      objective:
        "Modify authentication middleware and add token refresh support without reopening INC-12.",
      planDigest: await hash({
        fixture: FIXTURE_KEY,
        workOrderId: workOrder._id,
        workflowRunId: linkedRun?._id,
        purpose: factoryPurpose,
        version: 1,
      }),
      purpose: factoryPurpose,
      steps: [
        {
          strategy: "code",
          query: "authMiddleware validateAccessToken token refresh orders",
          sourceTypes: ["source-code", "test"],
          reason: "Resolve implementation and direct tests first.",
        },
        {
          strategy: "architecture",
          query: "ADR-004 authorization orders endpoints",
          sourceTypes: ["adr", "repository-document"],
          reason: "Recover the governing architecture decision.",
        },
        {
          strategy: "incident-history",
          query: "INC-12 unauthorized orders regression",
          sourceTypes: ["incident", "regression-case"],
          reason: "Prevent a known authorization regression.",
        },
        {
          strategy: "graph",
          entity: {
            type: "component",
            id: entityByKey.get("component:auth-middleware")._id,
          },
          reason: "Explain dependencies, tests, incident, and ADR paths.",
        },
      ],
      budget: { maxItems: 14, maxEstimatedTokens: 8_000 },
      requiredSourceTypes: ["source-code", "adr", "incident", "test"],
      maxIterations: 3,
      sufficiency: {
        sufficient: true,
        iteration: 2,
        reason:
          "Implementation, governing ADR, prior failure, and regression tests are covered.",
      },
      createdAt: now - 50 * 60_000,
      createdBy: `demo:${FIXTURE_KEY}`,
    });
    retrievalPlan = await ctx.db.get(planId);
  }

  let contextPackage = (
    await ctx.db
      .query("factoryContextPackages")
      .withIndex("by_work_order", (q: any) =>
        q.eq("workOrderId", workOrder._id),
      )
      .collect()
  ).find((candidate: any) => candidate.metadata?.fixture === FIXTURE_KEY);
  if (!contextPackage) {
    const selectedItems = SOURCES.map((source, index) => {
      const chunk = chunkBySource.get(source.sourceId);
      return {
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        documentId: chunk.documentId,
        chunkId: chunk._id,
        content: chunk.content,
        reason:
          index < 5
            ? "Required to understand the implementation, authority boundary, dependency, or direct verification surface."
            : "Preserves prior failure evidence and regression history without adding unrelated context.",
        priority: index < 5 ? ("required" as const) : ("high" as const),
        estimatedTokens: chunk.estimatedTokens,
        retrievalMethod:
          source.sourceType === "source-code"
            ? ("code" as const)
            : source.sourceType === "adr"
              ? ("graph" as const)
              : ("hybrid" as const),
        provenance: chunk.provenance,
      };
    });
    const contextPackageId = await ctx.db.insert("factoryContextPackages", {
      tenantId,
      projectId,
      repositoryId: repository._id,
      workOrderId: workOrder._id,
      workflowRunId: linkedRun._id,
      factoryDefinitionVersionId: factoryVersion?._id,
      purpose: factoryPurpose,
      attemptPurpose: attemptPurposeForRun(linkedRun),
      primaryTraceId: primaryTrace._id,
      qualityContractDigest: linkedRun.qualityContractDigest,
      generatedAt: now - 45 * 60_000,
      objective: retrievalPlan.objective,
      items: selectedItems,
      estimatedTokens: selectedItems.reduce(
        (total, item) => total + item.estimatedTokens,
        0,
      ),
      budget: retrievalPlan.budget,
      retrievalPlanId: retrievalPlan._id,
      retrievalStrategies: [
        "code",
        "architecture",
        "incident-history",
        "graph",
      ],
      contentHash: await hash({
        workflowRunId: linkedRun._id,
        primaryTraceId: primaryTrace._id,
        attemptPurpose: attemptPurposeForRun(linkedRun),
        qualityContractDigest: linkedRun.qualityContractDigest,
        items: selectedItems.map((item) => [
          item.sourceId,
          item.provenance.revision,
        ]),
      }),
      frozen: true,
      acceptanceAuthority: false,
      metadata: { fixture: FIXTURE_KEY, minimalRelevantContext: true },
      createdBy: `demo:${FIXTURE_KEY}`,
    });
    contextPackage = await ctx.db.get(contextPackageId);
    counts.contextPackages += 1;
    await ctx.db.patch(linkedRun._id, {
      factoryContextPackageId: contextPackageId,
    });
  }

  const baselineFixtureKey = `${FIXTURE_KEY}-baseline`;
  const existingBaseline = (
    await ctx.db
      .query("factoryContextPackages")
      .withIndex("by_work_order", (q: any) =>
        q.eq("workOrderId", workOrder._id),
      )
      .collect()
  ).find(
    (candidate: any) => candidate.metadata?.fixture === baselineFixtureKey,
  );
  const baselineRun = runs.find(
    (run: any) =>
      run._id !== linkedRun._id &&
      run.workOrderId === workOrder._id &&
      !run.factoryContextPackageId,
  );
  if (!existingBaseline && baselineRun) {
    const baselinePurpose = baselineRun.factoryPurpose ?? factoryPurpose;
    const baselineTrace = await ensureAttemptTrace(ctx, baselineRun, {
      purpose: tracePurposeForFactoryPurpose(baselinePurpose),
    });
    const baselineItems = contextPackage.items.slice(0, 6).map((item: any) => ({
      ...item,
      reason:
        "Earlier bounded package before verification evidence and the explicit regression case were added.",
    }));
    const baselinePackageId = await ctx.db.insert("factoryContextPackages", {
      tenantId,
      projectId,
      repositoryId: repository._id,
      workOrderId: workOrder._id,
      workflowRunId: baselineRun._id,
      factoryDefinitionVersionId:
        baselineRun.factoryDefinitionVersionId ?? factoryVersion?._id,
      purpose: baselinePurpose,
      attemptPurpose: attemptPurposeForRun(baselineRun),
      primaryTraceId: baselineTrace._id,
      qualityContractDigest: baselineRun.qualityContractDigest,
      generatedAt: now - 24 * 60 * 60_000,
      objective: retrievalPlan.objective,
      items: baselineItems,
      estimatedTokens: baselineItems.reduce(
        (total: number, item: any) => total + item.estimatedTokens,
        0,
      ),
      budget: retrievalPlan.budget,
      retrievalStrategies: ["code", "architecture", "hybrid"],
      contentHash: await hash({
        workflowRunId: baselineRun._id,
        primaryTraceId: baselineTrace._id,
        attemptPurpose: attemptPurposeForRun(baselineRun),
        qualityContractDigest: baselineRun.qualityContractDigest,
        items: baselineItems.map((item: any) => [
          item.sourceId,
          item.provenance.revision,
        ]),
      }),
      frozen: true,
      acceptanceAuthority: false,
      metadata: {
        fixture: baselineFixtureKey,
        minimalRelevantContext: true,
        comparisonBaseline: true,
      },
      createdBy: `demo:${FIXTURE_KEY}`,
    });
    await ctx.db.patch(baselineRun._id, {
      factoryContextPackageId: baselinePackageId,
    });
    counts.contextPackages += 1;
  }

  const verificationAdvisory = await ctx.db
    .query("factoryContextVerificationAdvisories")
    .withIndex("by_context_package", (q: any) =>
      q.eq("contextPackageId", contextPackage._id),
    )
    .first();
  if (!verificationAdvisory) {
    const influencedBy = ["ADR-004", "INC-12", "orders.e2e.test"].map(
      (sourceId) => {
        const source = SOURCES.find(
          (candidate) => candidate.sourceId === sourceId,
        )!;
        return { sourceType: source.sourceType, sourceId, revision: REVISION };
      },
    );
    await ctx.db.insert("factoryContextVerificationAdvisories", {
      tenantId,
      projectId,
      workOrderId: workOrder._id,
      contextPackageId: contextPackage._id,
      checks: [
        {
          id: "auth-refresh",
          name: "Token refresh preserves authenticated access",
          rationale:
            "Validate the intended auth change through integration evidence.",
          acceptanceCriterionIds: ["AC-1"],
          influencedBy,
          evidenceRequired: true,
        },
        {
          id: "orders-authorization-regression",
          name: "All unauthenticated orders endpoints return 401",
          rationale: "Reproduce INC-12 and prove ADR-004 remains enforced.",
          acceptanceCriterionIds: ["AC-2"],
          influencedBy,
          evidenceRequired: true,
        },
      ],
      advisoryOnly: true,
      acceptanceAuthority: false,
      createdAt: now - 40 * 60_000,
      createdBy: `demo:${FIXTURE_KEY}`,
    });
  }

  const [contextRun, trace] = await Promise.all([
    ctx.db.get(contextPackage.workflowRunId),
    ctx.db.get(contextPackage.primaryTraceId),
  ]);
  if (!contextRun || !trace || trace.workflowRunId !== contextRun._id) {
    throw new Error(
      "Factory Memory demo Context Package lost Attempt lineage.",
    );
  }
  const observations = await ctx.db
    .query("traceObservations")
    .withIndex("by_trace", (q: any) => q.eq("traceId", trace._id))
    .take(1_000);
  if (
    !observations.some(
      (observation: any) =>
        factoryTelemetryMetadata(observation.metadata)
          .factoryContextPackageId === String(contextPackage._id),
    )
  ) {
    const specs = [
      ["context.plan", "hybrid", 0, 4],
      ["memory.search", "hybrid", 34, SOURCES.length],
      ["graph.traversal", "graph", 12, 10],
      ["context.assemble", "hybrid", 3, SOURCES.length],
      ["context.sufficiency", "verification-history", 1, SOURCES.length],
    ] as const;
    for (const [observationType, strategy, latencyMs, resultCount] of specs) {
      await recordFactoryRetrievalObservation(ctx, contextRun, {
        observationType,
        retrievalPlanId: retrievalPlan._id,
        contextPackageId: contextPackage._id,
        strategy,
        query: "auth middleware token refresh authorization regression",
        resultCount,
        selectedCount: SOURCES.length,
        rejectedCount: 26,
        estimatedTokens: contextPackage.estimatedTokens,
        latencyMs,
        metadata: {
          fixture: FIXTURE_KEY,
          iteration: 2,
          maxIterations: 3,
        },
        createdAt: now - 35 * 60_000 + latencyMs,
      });
    }
  }

  const evaluations = await ctx.db
    .query("evalScores")
    .withIndex("by_attempt", (q: any) => q.eq("workflowRunId", contextRun._id))
    .take(1_000);
  if (
    !evaluations.some(
      (evaluation: any) =>
        factoryTelemetryMetadata(evaluation.metadata)
          .factoryContextPackageId === String(contextPackage._id),
    )
  ) {
    const specs = [
      [
        "retrieval.precision",
        0.875,
        true,
        "Seven of eight selected sources directly influenced the task.",
      ],
      [
        "retrieval.recall",
        1,
        true,
        "All required auth, ADR, incident, and test sources were recovered.",
      ],
      [
        "context.utilization",
        0.875,
        true,
        "The package omitted noisy unrelated repository history.",
      ],
      [
        "graph.correctness",
        1,
        true,
        "All expected typed paths were present with provenance.",
      ],
      [
        "verification.influence",
        1,
        true,
        "Memory influenced evidence-required checks without satisfying them.",
      ],
      [
        "noisy-context.delta",
        0.31,
        true,
        "The bounded package outperformed the oversized noisy variant.",
      ],
    ] as const;
    const evaluationSetId = await hash({
      fixture: FIXTURE_KEY,
      contextPackageId: contextPackage._id,
      version: 1,
    });
    for (const [key, score, passed, reason] of specs) {
      const definition = await ensureFactoryEvalDefinition(ctx, {
        tenantId,
        projectId,
        actorId: `demo:${FIXTURE_KEY}`,
        metricKey: key,
      });
      await insertEvalScore(ctx, {
        tenantId,
        projectId,
        definition,
        traceId: trace._id,
        workflowRunId: contextRun._id,
        value: score,
        reason,
        metadata: {
          domain: "FACTORY_MEMORY_CONTEXT",
          factoryContextPackageId: String(contextPackage._id),
          evaluationSetId,
          metricKey: key,
          passed,
          sampleSize: 1,
          acceptanceAuthority: false,
        },
        evaluator: { type: "DETERMINISTIC", version: "factory-memory-v1" },
        createdBy: `demo:${FIXTURE_KEY}`,
        idempotencyKey: `factory-memory:${String(contextPackage._id)}:${evaluationSetId}:${String(definition._id)}`,
      });
    }
  }

  return counts;
}
