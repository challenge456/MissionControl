import { describe, expect, it } from "vitest";

import type { Id } from "../_generated/dataModel";
import {
  overview,
  recordContextEvaluations,
  search,
  upsertDocument,
  upsertEntity,
  upsertRelationship,
} from "../factoryMemory";
import {
  isEnabled as isFeatureEnabled,
  setFlag as setFeatureFlag,
} from "../featureFlags";
import {
  FACTORY_MEMORY_LIMITS,
  prepareFactoryMemoryContent,
  scoreFactorySearchCandidate,
  validateFactoryRelationship,
} from "../lib/factoryMemory";

function functionHandler<T extends (...args: any[]) => any>(
  registered: unknown,
): T {
  return (registered as { _handler: T })._handler;
}

function createContext(
  options: {
    identity?: { subject: string; tokenIdentifier: string } | null;
    hybridEnabled?: boolean;
    manageMemoryFlags?: boolean;
  } = {},
) {
  const tenantId = "tenant-a" as Id<"tenants">;
  const projectId = "project-a" as Id<"projects">;
  const otherProjectId = "project-b" as Id<"projects">;
  const repositoryId = "repository-a" as Id<"workspaceRepositories">;
  const siblingRepositoryId = "repository-a-2" as Id<"workspaceRepositories">;
  const otherRepositoryId = "repository-b" as Id<"workspaceRepositories">;
  const operatorId = "operator-a" as Id<"operators">;
  const roleId = "role-a" as Id<"roles">;
  const identity =
    options.identity === undefined
      ? { subject: "auth-user", tokenIdentifier: "issuer|auth-user" }
      : options.identity;
  const tables: Record<string, any[]> = {
    tenants: [
      {
        _id: tenantId,
        _creationTime: 1,
        name: "Mission Control",
        slug: "mission-control",
        active: true,
      },
    ],
    projects: [
      {
        _id: projectId,
        _creationTime: 2,
        tenantId,
        name: "Primary",
        slug: "primary",
      },
      {
        _id: otherProjectId,
        _creationTime: 3,
        tenantId,
        name: "Other",
        slug: "other",
      },
    ],
    workspaceRepositories: [
      {
        _id: repositoryId,
        _creationTime: 4,
        projectId,
        tenantId,
        slug: "shop-service",
      },
      {
        _id: otherRepositoryId,
        _creationTime: 5,
        projectId: otherProjectId,
        tenantId,
        slug: "private-service",
      },
      {
        _id: siblingRepositoryId,
        _creationTime: 5,
        projectId,
        tenantId,
        slug: "billing-service",
      },
    ],
    operators: [
      {
        _id: operatorId,
        _creationTime: 6,
        tenantId,
        authId: "auth-user",
        email: "operator@example.com",
        name: "Operator",
        active: true,
        createdAt: 1,
      },
    ],
    roles: [
      {
        _id: roleId,
        _creationTime: 7,
        tenantId,
        name: "Factory operator",
        permissions: [
          "factory.read",
          "factory.improve",
          ...(options.manageMemoryFlags ? ["factory.automation.manage"] : []),
        ],
      },
    ],
    roleAssignments: [
      {
        _id: "assignment-a",
        _creationTime: 8,
        operatorId,
        roleId,
        scope: { type: "project", id: projectId },
        assignedAt: 1,
      },
    ],
    teamMemberships: [],
    orgMembers: [],
    featureFlags:
      options.hybridEnabled === false
        ? []
        : [
            "factory-memory.hybrid",
            "factory-memory.relationships",
            "factory-memory.agentic-retrieval",
            "factory-memory.knowledge-graph",
            "factory-memory.context-engine",
          ].map((key, index) => ({
            _id: `flag-${index}`,
            _creationTime: 9 + index,
            projectId,
            key,
            enabled: true,
            createdAt: 1,
            updatedAt: 1,
          })),
    factoryMemoryDocuments: [],
    factoryMemoryChunks: [],
    factoryMemoryIngestionRuns: [],
    factoryEntities: [],
    factoryRelationships: [],
    factoryRetrievalPlans: [],
    factoryContextPackages: [],
    factoryContextVerificationAdvisories: [],
    factoryRetrievalObservations: [],
    factoryContextEvaluations: [],
    metaLoopSuggestions: [],
    activities: [],
    workOrders: [],
    workflowRuns: [],
    factoryDefinitionVersions: [],
  };
  let sequence = 100;
  const db = {
    get: async (id: string) =>
      Object.values(tables)
        .flat()
        .find((row) => row._id === id) ?? null,
    insert: async (table: string, value: Record<string, unknown>) => {
      const id = `${table}-${sequence++}`;
      (tables[table] ??= []).push({
        _id: id,
        _creationTime: sequence,
        ...value,
      });
      return id;
    },
    patch: async (id: string, value: Record<string, unknown>) => {
      const row = Object.values(tables)
        .flat()
        .find((item) => item._id === id);
      if (!row) throw new Error(`Missing row ${id}`);
      Object.assign(row, value);
    },
    delete: async (id: string) => {
      for (const rows of Object.values(tables)) {
        const index = rows.findIndex((row) => row._id === id);
        if (index >= 0) rows.splice(index, 1);
      }
    },
    query: (table: string) => {
      let rows = [...(tables[table] ?? [])];
      const builder: any = {
        withIndex: (_name: string, apply: (q: any) => any) => {
          const conditions: Array<{ field: string; value: unknown }> = [];
          const q: any = {
            eq: (field: string, value: unknown) => {
              conditions.push({ field, value });
              return q;
            },
          };
          apply(q);
          rows = rows.filter((row) =>
            conditions.every((condition) =>
              condition.value === undefined
                ? row[condition.field] === undefined
                : row[condition.field] === condition.value,
            ),
          );
          return builder;
        },
        withSearchIndex: (_name: string, apply: (q: any) => any) => {
          const conditions: Array<{ field: string; value: unknown }> = [];
          let search = "";
          const q: any = {
            search: (_field: string, value: string) => {
              search = value.toLowerCase();
              return q;
            },
            eq: (field: string, value: unknown) => {
              conditions.push({ field, value });
              return q;
            },
          };
          apply(q);
          rows = rows.filter(
            (row) =>
              conditions.every(
                (condition) => row[condition.field] === condition.value,
              ) &&
              (!search ||
                String(row.searchText ?? "")
                  .toLowerCase()
                  .includes(search.split(/\s+/)[0])),
          );
          return builder;
        },
        order: (direction: "asc" | "desc") => {
          const multiplier = direction === "desc" ? -1 : 1;
          rows.sort(
            (left, right) =>
              ((left.indexedAt ?? left.createdAt ?? left._creationTime) -
                (right.indexedAt ?? right.createdAt ?? right._creationTime)) *
              multiplier,
          );
          return builder;
        },
        collect: async () => [...rows],
        first: async () => rows[0] ?? null,
        take: async (limit: number) => rows.slice(0, limit),
      };
      return builder;
    },
  };
  return {
    ctx: {
      auth: { getUserIdentity: async () => identity },
      db,
    } as any,
    tables,
    tenantId,
    projectId,
    repositoryId,
    siblingRepositoryId,
    otherRepositoryId,
    operatorId,
  };
}

describe("Factory Memory deterministic helpers", () => {
  it("redacts, bounds, chunks, and scores source content", () => {
    const prepared = prepareFactoryMemoryContent({
      content: `${"Authorization: Bearer liveCredential12345\n"}${"auth middleware token refresh\n".repeat(
        500,
      )}`,
      metadata: {
        api_key: "should-not-persist",
        symbols: ["authMiddleware"],
      },
    });
    expect(prepared.content).not.toContain("liveCredential12345");
    expect(prepared.metadata.api_key).toBe("[REDACTED]");
    expect(prepared.chunks.length).toBeGreaterThan(1);
    expect(prepared.chunks.length).toBeLessThanOrEqual(
      FACTORY_MEMORY_LIMITS.maxChunksPerDocument,
    );
    const scored = scoreFactorySearchCandidate(
      "authentication refresh middleware",
      {
        _id: "chunk-a",
        sourceType: "source-code",
        sourceId: "auth.ts",
        content: prepared.chunks[0].content,
        searchText: prepared.chunks[0].searchText,
        estimatedTokens: prepared.chunks[0].estimatedTokens,
        provenance: {
          path: "src/authMiddleware.ts",
          timestamp: Date.now(),
          derivation: "authoritative",
        },
        metadata: { symbols: ["authMiddleware"] },
      },
      Date.now(),
    );
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.retrievalMethod).toBe("hybrid");
  });

  it("requires confidence and provenance for inferred relationships", () => {
    expect(() =>
      validateFactoryRelationship({
        sourceId: "a",
        targetId: "b",
        relation: "similar_to",
        derivation: "inferred",
        provenance: [{}],
      }),
    ).toThrow("require confidence");
    expect(() =>
      validateFactoryRelationship({
        sourceId: "a",
        targetId: "b",
        relation: "depends_on",
        derivation: "deterministic",
        provenance: [],
      }),
    ).toThrow("require provenance");
  });
});

describe("Factory Memory authorization and persistence", () => {
  it("fails reads closed for anonymous callers", async () => {
    const state = createContext({ identity: null });
    await expect(
      functionHandler(overview)(state.ctx, { projectId: state.projectId }),
    ).rejects.toThrow("unavailable or unauthorized");
  });

  it("fails closed when the phase flag is disabled", async () => {
    const state = createContext({ hybridEnabled: false });
    await expect(
      functionHandler(search)(state.ctx, {
        projectId: state.projectId,
        query: "authorization",
      }),
    ).rejects.toThrow("factory-memory.hybrid");
  });

  it("authorizes workspace-scoped Factory Memory flags and derives the actor", async () => {
    const anonymous = createContext({ identity: null });
    await expect(
      functionHandler(isFeatureEnabled)(anonymous.ctx, {
        projectId: anonymous.projectId,
        key: "factory-memory.hybrid",
      }),
    ).rejects.toThrow("unavailable or unauthorized");

    const unauthorized = createContext();
    await expect(
      functionHandler(setFeatureFlag)(unauthorized.ctx, {
        projectId: unauthorized.projectId,
        key: "factory-memory.hybrid",
        enabled: false,
        actorId: "spoofed-actor",
      }),
    ).rejects.toThrow("does not permit");

    const authorized = createContext({ manageMemoryFlags: true });
    await functionHandler(setFeatureFlag)(authorized.ctx, {
      projectId: authorized.projectId,
      key: "factory-memory.hybrid",
      enabled: false,
      actorId: "spoofed-actor",
    });
    expect(authorized.tables.activities.at(-1)?.actorId).toBe(
      authorized.operatorId,
    );
    expect(authorized.tables.featureFlags.at(-1)?.projectId).toBe(
      authorized.projectId,
    );
  });

  it("derives tenant and actor, redacts secrets, and rejects another repository", async () => {
    const state = createContext();
    const write = functionHandler(upsertDocument);
    const result = await write(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      sourceType: "adr",
      sourceId: "ADR-004",
      title: "Authorization boundary credential=hidden-title-token",
      path: "docs/adr/ADR-004.md?access_token=hidden-path-token",
      revision: "ghp_abcdefghijklmnopqrstuvwxyz",
      content:
        "Authorization: Bearer liveCredential12345\nUnauthenticated access returns 401.",
      metadata: { refresh_token: "never-store-this" },
    });
    expect(result.reindexed).toBe(true);
    expect(state.tables.factoryMemoryDocuments[0]).toMatchObject({
      tenantId: state.tenantId,
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      sourceId: "ADR-004",
    });
    expect(state.tables.factoryMemoryDocuments[0].content).not.toContain(
      "liveCredential12345",
    );
    expect(state.tables.factoryMemoryDocuments[0].metadata.refresh_token).toBe(
      "[REDACTED]",
    );
    expect(state.tables.factoryMemoryDocuments[0].title).not.toContain(
      "hidden-title-token",
    );
    expect(
      state.tables.factoryMemoryDocuments[0].provenance.path,
    ).not.toContain("hidden-path-token");
    expect(state.tables.factoryMemoryDocuments[0].sourceRevision).not.toContain(
      "abcdefghijklmnopqrstuvwxyz",
    );
    expect(state.tables.activities[0].actorId).toBe(state.operatorId);

    await expect(
      write(state.ctx, {
        projectId: state.projectId,
        repositoryId: state.otherRepositoryId,
        sourceType: "adr",
        sourceId: "ADR-HIDDEN",
        content: "Hidden",
      }),
    ).rejects.toThrow("unavailable or unauthorized");
  });

  it("keeps document and entity identities isolated by repository", async () => {
    const state = createContext();
    const writeDocument = functionHandler(upsertDocument);
    await writeDocument(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      sourceType: "source-code",
      sourceId: "src/auth.ts",
      revision: "same-revision",
      content: "export const service = 'orders';",
    });
    await writeDocument(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.siblingRepositoryId,
      sourceType: "source-code",
      sourceId: "src/auth.ts",
      revision: "same-revision",
      content: "export const service = 'billing';",
    });

    expect(state.tables.factoryMemoryDocuments).toHaveLength(2);
    expect(
      state.tables.factoryMemoryDocuments.every(
        (document) => document.invalidatedAt === undefined,
      ),
    ).toBe(true);

    const writeEntity = functionHandler(upsertEntity);
    const provenance = [
      {
        sourceType: "source-code",
        sourceId: "src/auth.ts",
        timestamp: 1,
        derivation: "deterministic",
      },
    ];
    await writeEntity(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      entityType: "component",
      key: "component:auth",
      label: "orders-auth",
      provenance,
    });
    await writeEntity(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.siblingRepositoryId,
      entityType: "component",
      key: "component:auth",
      label: "billing-auth",
      provenance,
    });

    expect(state.tables.factoryEntities).toHaveLength(2);

    const result = await functionHandler(search)(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      query: "service",
    });
    expect(result.results.map((candidate: any) => candidate.content)).toEqual([
      "export const service = 'orders';",
    ]);
    expect(
      result.results.every(
        (candidate: any) => candidate.acceptanceAuthority === false,
      ),
    ).toBe(true);
  });

  it("audits typed graph mutations with server-derived actors", async () => {
    const state = createContext();
    const provenance = [
      {
        sourceType: "repository-document",
        sourceId: "architecture",
        timestamp: 1,
        derivation: "authoritative",
      },
    ];
    const sourceId = await functionHandler(upsertEntity)(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      entityType: "component",
      key: "component:auth",
      label: "auth",
      provenance,
    });
    const targetId = await functionHandler(upsertEntity)(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      entityType: "service",
      key: "service:orders",
      label: "orders",
      provenance,
    });
    await functionHandler(upsertRelationship)(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      sourceType: "component",
      sourceId,
      relation: "used_by",
      targetType: "service",
      targetId,
      provenance,
      derivation: "authoritative",
    });

    expect(state.tables.activities.map((activity) => activity.action)).toEqual([
      "FACTORY_ENTITY_CREATED",
      "FACTORY_ENTITY_CREATED",
      "FACTORY_RELATIONSHIP_CREATED",
    ]);
    expect(
      state.tables.activities.every(
        (activity) => activity.actorId === state.operatorId,
      ),
    ).toBe(true);
  });

  it("appends immutable context-quality sets without acceptance authority", async () => {
    const state = createContext();
    const contextPackageId = await state.ctx.db.insert(
      "factoryContextPackages",
      {
        tenantId: state.tenantId,
        projectId: state.projectId,
        workOrderId: "work-order-a",
        items: [],
        acceptanceAuthority: false,
      },
    );
    const record = functionHandler(recordContextEvaluations);
    const evaluations = [
      {
        key: "context_precision",
        score: 0.9,
        passed: true,
        reason: "Deterministic fixture relevance set.",
        sampleSize: 8,
      },
    ];
    const firstIds = await record(state.ctx, {
      projectId: state.projectId,
      contextPackageId,
      evaluations,
    });
    const duplicateIds = await record(state.ctx, {
      projectId: state.projectId,
      contextPackageId,
      evaluations,
    });
    await record(state.ctx, {
      projectId: state.projectId,
      contextPackageId,
      evaluations: [{ ...evaluations[0], score: 0.8 }],
    });

    expect(duplicateIds).toEqual(firstIds);
    expect(state.tables.factoryContextEvaluations).toHaveLength(2);
    expect(
      state.tables.factoryContextEvaluations.every(
        (evaluation) => evaluation.acceptanceAuthority === false,
      ),
    ).toBe(true);
    expect(
      new Set(
        state.tables.factoryContextEvaluations.map(
          (evaluation) => evaluation.evaluationSetId,
        ),
      ).size,
    ).toBe(2);
  });

  it("rejects relationships whose endpoints cross repository scope", async () => {
    const state = createContext();
    const writeEntity = functionHandler(upsertEntity);
    const provenance = [
      {
        sourceType: "repository-document",
        sourceId: "architecture",
        timestamp: 1,
        derivation: "authoritative",
      },
    ];
    const sourceId = await writeEntity(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.repositoryId,
      entityType: "component",
      key: "component:orders",
      label: "orders",
      provenance,
    });
    const targetId = await writeEntity(state.ctx, {
      projectId: state.projectId,
      repositoryId: state.siblingRepositoryId,
      entityType: "component",
      key: "component:billing",
      label: "billing",
      provenance,
    });

    await expect(
      functionHandler(upsertRelationship)(state.ctx, {
        projectId: state.projectId,
        sourceType: "component",
        sourceId,
        relation: "similar_to",
        targetType: "component",
        targetId,
        provenance,
        confidence: 0.4,
        derivation: "inferred",
      }),
    ).rejects.toThrow("must share repository scope");
  });
});
