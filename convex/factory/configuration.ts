import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "../lib/companyAccess";
import {
  factoryConfigurationDigest,
  validFactoryBudget,
  type FactoryConfigurationInput,
} from "../lib/factoryConfiguration";
import { evaluateGithubAppCapabilities, githubInstallationIsStale } from "../lib/githubAppReadiness";
import { canonicalRepositoryKey } from "../lib/workspaceRepositories";

const budget = v.object({
  maxCostUsd: v.number(),
  maxRuntimeMinutes: v.number(),
  maxAttempts: v.number(),
});
const recovery = v.object({
  pause: v.boolean(),
  cancel: v.boolean(),
  retry: v.boolean(),
  resume: v.boolean(),
});
const riskBoundary = v.union(v.literal("GREEN"), v.literal("YELLOW"), v.literal("RED"));

export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    return await ctx.db.query("factoryDefinitions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getDetail = query({
  args: { factoryDefinitionId: v.id("factoryDefinitions") },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.factoryDefinitionId);
    if (!definition) throw new Error("Factory is unavailable or unauthorized.");
    await requireWorkspacePermission(ctx, definition.projectId, FACTORY_PERMISSIONS.VIEW);
    const versions = await ctx.db.query("factoryDefinitionVersions")
      .withIndex("by_factory", (q) => q.eq("factoryDefinitionId", definition._id))
      .collect();
    const assessments = await ctx.db.query("factoryReadinessAssessments")
      .withIndex("by_factory", (q) => q.eq("factoryDefinitionId", definition._id))
      .collect();
    return {
      definition,
      versions: versions.sort((left, right) => right.version - left.version),
      assessments: assessments.sort((left, right) => right.assessedAt - left.assessedAt),
    };
  },
});

export const getActiveForWorkOrder = query({
  args: { workOrderId: v.id("workOrders") },
  handler: async (ctx, args) => {
    const workOrder = await ctx.db.get(args.workOrderId);
    if (!workOrder?.projectId || !workOrder.repository) return null;
    await requireWorkspacePermission(ctx, workOrder.projectId, FACTORY_PERMISSIONS.VIEW);
    const repositories = await ctx.db.query("workspaceRepositories")
      .withIndex("by_project", (q) => q.eq("projectId", workOrder.projectId!))
      .collect();
    const repository = repositories.find((candidate) =>
      canonicalRepositoryKey(candidate.repository) === canonicalRepositoryKey(workOrder.repository!)
    );
    if (!repository) return null;
    const definition = await ctx.db.query("factoryDefinitions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
      .filter((q) => q.eq(q.field("status"), "ACTIVE"))
      .first();
    if (!definition?.activeVersionId) return null;
    const version = await ctx.db.get(definition.activeVersionId);
    return version ? { definition, version, repository } : null;
  },
});

export const create = mutation({
  args: { repositoryId: v.id("workspaceRepositories"), name: v.string() },
  handler: async (ctx, args) => {
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) throw new Error("Repository connection is unavailable or unauthorized.");
    const access = await requireWorkspacePermission(
      ctx,
      repository.projectId,
      FACTORY_PERMISSIONS.MANAGE_AUTOMATION
    );
    const existing = await ctx.db.query("factoryDefinitions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
      .filter((q) => q.neq(q.field("status"), "ARCHIVED"))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("factoryDefinitions", {
      tenantId: repository.tenantId,
      projectId: repository.projectId,
      repositoryId: repository._id,
      name: args.name.trim() || `${repository.displayName} Factory`,
      status: "DRAFT",
      latestVersion: 0,
      createdBy: access.actorId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createVersion = mutation({
  args: {
    factoryDefinitionId: v.id("factoryDefinitions"),
    workflowId: v.id("workflows"),
    executor: v.object({ adapter: v.string(), version: v.string() }),
    policyEnvelopeId: v.optional(v.id("policyEnvelopes")),
    environmentId: v.optional(v.id("environments")),
    budget,
    verifierIds: v.array(v.id("contextVerifiers")),
    riskBoundary,
    recovery,
  },
  handler: async (ctx, args) => {
    const definition = await ctx.db.get(args.factoryDefinitionId);
    if (!definition || definition.status === "ARCHIVED") throw new Error("Factory is unavailable or archived.");
    const access = await requireWorkspacePermission(ctx, definition.projectId, FACTORY_PERMISSIONS.MANAGE_AUTOMATION);
    const repository = await ctx.db.get(definition.repositoryId);
    const workflow = await ctx.db.get(args.workflowId);
    const policy = args.policyEnvelopeId ? await ctx.db.get(args.policyEnvelopeId) : null;
    const environment = args.environmentId ? await ctx.db.get(args.environmentId) : null;
    const verifiers = await Promise.all(args.verifierIds.map((id) => ctx.db.get(id)));
    if (!repository || repository.projectId !== definition.projectId) throw new Error("Factory repository scope is invalid.");
    if (!workflow) throw new Error("Workflow not found.");
    if (policy && policy.projectId && policy.projectId !== definition.projectId) throw new Error("Policy is outside the Factory workspace.");
    if (environment && definition.tenantId && environment.tenantId !== definition.tenantId) throw new Error("Environment is outside the Factory company.");
    if (verifiers.some((item) => !item || item.projectId !== definition.projectId)) throw new Error("Verifier is outside the Factory workspace.");
    if (!validFactoryBudget(args.budget)) {
      throw new Error("Factory budget must use positive V1 limits: cost <= $1,000, runtime <= 480 minutes, attempts <= 3.");
    }

    const configuration: FactoryConfigurationInput = {
      repositoryId: String(repository._id),
      workflowId: String(workflow._id),
      executor: args.executor,
      policyEnvelopeId: args.policyEnvelopeId ? String(args.policyEnvelopeId) : undefined,
      environmentId: args.environmentId ? String(args.environmentId) : undefined,
      budget: args.budget,
      verifierIds: args.verifierIds.map(String),
      riskBoundary: args.riskBoundary,
      recovery: args.recovery,
    };
    const configurationDigest = factoryConfigurationDigest(configuration);
    const duplicate = await ctx.db.query("factoryDefinitionVersions")
      .withIndex("by_digest", (q) => q.eq("configurationDigest", configurationDigest))
      .filter((q) => q.eq(q.field("factoryDefinitionId"), definition._id))
      .first();
    if (duplicate) return duplicate._id;
    const version = definition.latestVersion + 1;
    const versionId = await ctx.db.insert("factoryDefinitionVersions", {
      tenantId: definition.tenantId,
      projectId: definition.projectId,
      factoryDefinitionId: definition._id,
      version,
      configurationDigest,
      repositoryId: repository._id,
      workflowId: workflow._id,
      executor: args.executor,
      policyEnvelopeId: args.policyEnvelopeId,
      environmentId: args.environmentId,
      budget: args.budget,
      verifierIds: args.verifierIds,
      riskBoundary: args.riskBoundary,
      recovery: args.recovery,
      createdBy: access.actorId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(definition._id, { latestVersion: version, updatedAt: Date.now() });
    return versionId;
  },
});

export const assessReadiness = mutation({
  args: { factoryDefinitionVersionId: v.id("factoryDefinitionVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.factoryDefinitionVersionId);
    if (!version) throw new Error("Factory version not found.");
    const access = await requireWorkspacePermission(ctx, version.projectId, FACTORY_PERMISSIONS.MANAGE_AUTOMATION);
    const now = Date.now();
    const expiry = now + 24 * 60 * 60 * 1_000;
    const [repository, workflow, policy, installation, bindings, verifiers] = await Promise.all([
      ctx.db.get(version.repositoryId),
      ctx.db.get(version.workflowId),
      version.policyEnvelopeId ? ctx.db.get(version.policyEnvelopeId) : null,
      ctx.db.query("githubAppInstallations").withIndex("by_repository", (q) => q.eq("repositoryId", version.repositoryId)).first(),
      ctx.db.query("workspaceHostBindings").withIndex("by_project", (q) => q.eq("projectId", version.projectId)).collect(),
      Promise.all(version.verifierIds.map((id) => ctx.db.get(id))),
    ]);
    const github = installation ? evaluateGithubAppCapabilities(installation) : null;
    const githubReady = Boolean(
      repository && installation?.status === "CONNECTED" && github?.ready &&
      !githubInstallationIsStale(installation.verifiedAt, now)
    );
    const host = bindings.find((candidate) =>
      repository && canonicalRepositoryKey(candidate.repository) === canonicalRepositoryKey(repository.repository)
    );
    const checks = [
      check("github", "GitHub App connection", githubReady, now, expiry, "Install or repair the exact least-privilege GitHub App connection."),
      check("repository", "Repository access", repository?.status === "READY", now, expiry, "Validate repository access before activation."),
      check("workflow", "Workflow version", workflow?.active === true, now, undefined, "Select an active versioned workflow."),
      check("executor", "Codex executor adapter", version.executor.adapter === "codex" && version.executor.version === "v1", now, undefined, "Select the approved codex/v1 executor adapter."),
      check("policy", "Governance policy", Boolean(policy?.active), now, undefined, "Select an active workspace policy envelope."),
      check("budget", "Bounded budget", validFactoryBudget(version.budget), now, undefined, "Set positive V1 limits: cost <= $1,000, runtime <= 480 minutes, attempts <= 3."),
      check("verifiers", "Independent verifiers", verifiers.length > 0 && verifiers.every((item) => item?.active && item.projectId === version.projectId), now, expiry, "Select at least one active workspace verifier."),
      check("host", "Sandbox host binding", Boolean(host && host.status === "READY" && !host.dirty && now - host.checkedAt <= 24 * 60 * 60 * 1_000), now, expiry, "Report a clean, current READY checkout for this repository."),
      check("recovery", "Recovery controls", Object.values(version.recovery).every(Boolean), now, undefined, "Enable pause, resume, cancel, and bounded retry controls."),
    ];
    const status = checks.every((item) => item.status === "VERIFIED") ? "PASS" as const : "BLOCKED" as const;
    return await ctx.db.insert("factoryReadinessAssessments", {
      tenantId: version.tenantId,
      projectId: version.projectId,
      factoryDefinitionId: version.factoryDefinitionId,
      factoryDefinitionVersionId: version._id,
      configurationDigest: version.configurationDigest,
      status,
      checks,
      assessedBy: access.actorId,
      assessedAt: now,
      expiresAt: expiry,
    });
  },
});

export const activate = mutation({
  args: { factoryDefinitionVersionId: v.id("factoryDefinitionVersions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.factoryDefinitionVersionId);
    if (!version) throw new Error("Factory version not found.");
    const access = await requireWorkspacePermission(ctx, version.projectId, FACTORY_PERMISSIONS.APPROVE);
    const assessments = await ctx.db.query("factoryReadinessAssessments")
      .withIndex("by_version", (q) => q.eq("factoryDefinitionVersionId", version._id))
      .collect();
    const latest = assessments.sort((left, right) => right.assessedAt - left.assessedAt)[0];
    if (!latest || latest.status !== "PASS" || latest.expiresAt <= Date.now() || latest.configurationDigest !== version.configurationDigest) {
      throw new Error("A current passing readiness assessment for this exact Factory version is required.");
    }
    const definition = await ctx.db.get(version.factoryDefinitionId);
    if (!definition) throw new Error("Factory not found.");
    const now = Date.now();
    await ctx.db.patch(definition._id, { status: "ACTIVE", activeVersionId: version._id, updatedAt: now });
    await ctx.db.insert("activities", {
      tenantId: definition.tenantId,
      projectId: definition.projectId,
      actorType: "HUMAN",
      actorId: access.actorId,
      action: "FACTORY_VERSION_ACTIVATED",
      description: `Activated ${definition.name} version ${version.version}`,
      targetType: "FACTORY_DEFINITION_VERSION",
      targetId: version._id,
      metadata: { configurationDigest: version.configurationDigest, assessmentId: latest._id },
    });
    return { factoryDefinitionId: definition._id, activeVersionId: version._id };
  },
});

function check(
  id: string,
  label: string,
  passing: boolean,
  checkedAt: number,
  expiresAt: number | undefined,
  remediation: string
) {
  return {
    id,
    label,
    status: passing ? "VERIFIED" as const : "MISSING" as const,
    checkedAt,
    expiresAt,
    remediation: passing ? undefined : remediation,
    rootBlocker: passing ? undefined : id,
  };
}
