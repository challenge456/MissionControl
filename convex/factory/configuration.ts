import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { FACTORY_PERMISSIONS, requireWorkspacePermission } from "../lib/companyAccess";
import {
  factoryConfigurationDigest,
  validFactoryBudget,
  type FactoryConfigurationInput,
} from "../lib/factoryConfiguration";
import { evaluateGithubAppCapabilities, githubInstallationIsStale } from "../lib/githubAppReadiness";
import { canonicalRepositoryKey } from "../lib/workspaceRepositories";
import { codexV1RecoveryReady, selectCurrentFactoryHost } from "../lib/factoryDispatch";
import { factoryWorkflowContractIssues } from "../lib/factoryWorkflowContract";

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
const factoryPurpose = v.union(v.literal("SOFTWARE"), v.literal("VERIFICATION"), v.literal("INTELLIGENT_AUTOMATION"));

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

export const getVersionOptions = query({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("workspaceRepositories"),
  },
  handler: async (ctx, args) => {
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository || repository.projectId !== args.projectId) {
      throw new Error("Factory repository is outside the workspace.");
    }
    const [codeScopes, approvedVersions] = await Promise.all([
      ctx.db.query("repositoryCodeScopes")
        .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
        .collect(),
      ctx.db.query("agentVersions")
        .withIndex("by_status", (q) => q.eq("status", "APPROVED"))
        .collect(),
    ]);
    const agentVersions = (await Promise.all(approvedVersions
      .filter((version) => !version.projectId || version.projectId === args.projectId)
      .map(async (version) => {
        const template = await ctx.db.get(version.templateId);
        if (!template?.active || (template.projectId && template.projectId !== args.projectId)) return null;
        return {
          _id: version._id,
          version: version.version,
          genomeHash: version.genomeHash,
          modelConfig: version.genome.modelConfig,
          promptBundleHash: version.genome.promptBundleHash,
          toolManifestHash: version.genome.toolManifestHash,
          template: { _id: template._id, name: template.name, slug: template.slug },
        };
      })))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return {
      codeScopes: codeScopes.filter((scope) => scope.active),
      agentVersions,
    };
  },
});

async function loadActiveFactoryContext(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  repositoryId: Id<"workspaceRepositories">,
) {
  const repository = await ctx.db.get(repositoryId);
  if (!repository || repository.projectId !== projectId) return null;
  const definition = await ctx.db.query("factoryDefinitions")
    .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
    .filter((q) => q.eq(q.field("status"), "ACTIVE"))
    .first();
  if (!definition?.activeVersionId) return null;
  const version = await ctx.db.get(definition.activeVersionId);
  if (!version || version.factoryDefinitionId !== definition._id) return null;
  const [workflow, codeScopes, assessments, bindings] = await Promise.all([
    ctx.db.get(version.workflowId),
    Promise.all((version.codeScopeIds ?? []).map((scopeId) => ctx.db.get(scopeId))),
    ctx.db.query("factoryReadinessAssessments")
      .withIndex("by_version", (q) => q.eq("factoryDefinitionVersionId", version._id))
      .collect(),
    ctx.db.query("workspaceHostBindings")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect(),
  ]);
  const now = Date.now();
  const latestAssessment = assessments.sort((left, right) => right.assessedAt - left.assessedAt)[0] ?? null;
  const host = selectCurrentFactoryHost(bindings, repository.repository, now);
  return {
    definition,
    version,
    repository,
    workflow,
    codeScopes: codeScopes.filter((scope): scope is NonNullable<typeof scope> => Boolean(scope?.active)),
    assessment: latestAssessment,
    host: host ? {
      _id: host._id,
      hostId: host.hostId,
      status: host.status,
      runtime: host.runtime,
      observedBranch: host.observedBranch,
      checkedAt: host.checkedAt,
    } : null,
    readyForBrowserDispatch: Boolean(
      repository.status === "READY"
      && workflow?.active
      && latestAssessment?.status === "PASS"
      && latestAssessment.expiresAt > now
      && latestAssessment.configurationDigest === version.configurationDigest
      && host
    ),
  };
}

export const getActiveForRepository = query({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("workspaceRepositories"),
  },
  handler: async (ctx, args) => {
    await requireWorkspacePermission(ctx, args.projectId, FACTORY_PERMISSIONS.VIEW);
    return await loadActiveFactoryContext(ctx, args.projectId, args.repositoryId);
  },
});

export const getActiveForWorkOrder = query({
  args: { workOrderId: v.id("workOrders") },
  handler: async (ctx, args) => {
    const workOrder = await ctx.db.get(args.workOrderId);
    if (!workOrder?.projectId || (!workOrder.repositoryId && !workOrder.repository)) return null;
    await requireWorkspacePermission(ctx, workOrder.projectId, FACTORY_PERMISSIONS.VIEW);
    let repositoryId = workOrder.repositoryId;
    if (!repositoryId) {
      const repositories = await ctx.db.query("workspaceRepositories")
        .withIndex("by_project", (q) => q.eq("projectId", workOrder.projectId!))
        .collect();
      repositoryId = repositories.find((candidate) =>
        workOrder.repository
        && canonicalRepositoryKey(candidate.repository) === canonicalRepositoryKey(workOrder.repository)
      )?._id;
    }
    return repositoryId
      ? await loadActiveFactoryContext(ctx, workOrder.projectId, repositoryId)
      : null;
  },
});

export const create = mutation({
  args: { repositoryId: v.id("workspaceRepositories"), name: v.string(), purpose: v.optional(factoryPurpose) },
  handler: async (ctx, args) => {
    const repository = await ctx.db.get(args.repositoryId);
    if (!repository) throw new Error("Repository connection is unavailable or unauthorized.");
    const access = await requireWorkspacePermission(
      ctx,
      repository.projectId,
      FACTORY_PERMISSIONS.MANAGE_AUTOMATION
    );
    const purpose = args.purpose ?? "SOFTWARE";
    const existingDefinitions = await ctx.db.query("factoryDefinitions")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
      .collect();
    const existing = existingDefinitions.find((definition) => definition.status !== "ARCHIVED" && (definition.purpose ?? "SOFTWARE") === purpose);
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("factoryDefinitions", {
      tenantId: repository.tenantId,
      projectId: repository.projectId,
      repositoryId: repository._id,
      purpose,
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
    codeScopeIds: v.array(v.id("repositoryCodeScopes")),
    agentBindings: v.array(v.object({
      workflowAgentId: v.string(),
      agentVersionId: v.id("agentVersions"),
    })),
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
    const [verifiers, codeScopes, agentVersions] = await Promise.all([
      Promise.all(args.verifierIds.map((id) => ctx.db.get(id))),
      Promise.all(args.codeScopeIds.map((id) => ctx.db.get(id))),
      Promise.all(args.agentBindings.map((binding) => ctx.db.get(binding.agentVersionId))),
    ]);
    if (!repository || repository.projectId !== definition.projectId) throw new Error("Factory repository scope is invalid.");
    if (!workflow) throw new Error("Workflow not found.");
    const workflowContractIssues = factoryWorkflowContractIssues(workflow);
    if (workflowContractIssues.length > 0) {
      throw new Error(`Workflow execution contract is unsafe (${workflowContractIssues.join(", ")}).`);
    }
    if (policy && policy.projectId && policy.projectId !== definition.projectId) throw new Error("Policy is outside the Factory workspace.");
    if (environment && definition.tenantId && environment.tenantId !== definition.tenantId) throw new Error("Environment is outside the Factory company.");
    if (verifiers.some((item) => !item || item.projectId !== definition.projectId)) throw new Error("Verifier is outside the Factory workspace.");
    if (args.codeScopeIds.length === 0 || codeScopes.some((scope) =>
      !scope || !scope.active || scope.repositoryId !== repository._id || scope.projectId !== definition.projectId
    )) {
      throw new Error("Select at least one active code scope from the Factory repository.");
    }
    const workflowAgentIds = new Set(workflow.agents.map((agent) => agent.id));
    const boundAgentIds = new Set(args.agentBindings.map((binding) => binding.workflowAgentId));
    if (
      args.agentBindings.length !== workflowAgentIds.size
      || boundAgentIds.size !== workflowAgentIds.size
      || [...workflowAgentIds].some((id) => !boundAgentIds.has(id))
      || args.agentBindings.some((binding) => !workflowAgentIds.has(binding.workflowAgentId))
    ) {
      throw new Error("Every workflow agent must bind to exactly one approved agent version.");
    }
    for (let index = 0; index < agentVersions.length; index += 1) {
      const version = agentVersions[index];
      if (!version || version.status !== "APPROVED" || (version.projectId && version.projectId !== definition.projectId)) {
        throw new Error("Every workflow agent binding must reference an approved workspace agent version.");
      }
      const template = await ctx.db.get(version.templateId);
      if (!template?.active || (template.projectId && template.projectId !== definition.projectId)) {
        throw new Error("Every workflow agent binding must reference an active workspace agent template.");
      }
      if (!version.genome.promptBundleHash.trim() || !version.genome.toolManifestHash.trim() || !version.genome.modelConfig.modelId.trim()) {
        throw new Error("Approved agent versions require prompt, tool, and model manifests.");
      }
    }
    if (args.executor.adapter === "codex" && args.executor.version === "v1" && !codexV1RecoveryReady(args.recovery)) {
      throw new Error("codex/v1 supports cancel and bounded retry, but does not support pause or in-process resume.");
    }
    if (!validFactoryBudget(args.budget)) {
      throw new Error("Factory budget must use positive V1 limits: cost <= $1,000, runtime <= 480 minutes, attempts <= 3.");
    }

    const configuration: FactoryConfigurationInput = {
      purpose: definition.purpose ?? "SOFTWARE",
      repositoryId: String(repository._id),
      workflowId: String(workflow._id),
      executor: args.executor,
      codeScopeIds: args.codeScopeIds.map(String),
      agentBindings: args.agentBindings.map((binding) => ({
        workflowAgentId: binding.workflowAgentId,
        agentVersionId: String(binding.agentVersionId),
      })),
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
      purpose: definition.purpose ?? "SOFTWARE",
      workflowId: workflow._id,
      executor: args.executor,
      codeScopeIds: args.codeScopeIds,
      agentBindings: args.agentBindings,
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
    const [repository, workflow, policy, installation, bindings, verifiers, codeScopes, agentVersions] = await Promise.all([
      ctx.db.get(version.repositoryId),
      ctx.db.get(version.workflowId),
      version.policyEnvelopeId ? ctx.db.get(version.policyEnvelopeId) : null,
      ctx.db.query("githubAppInstallations").withIndex("by_repository", (q) => q.eq("repositoryId", version.repositoryId)).first(),
      ctx.db.query("workspaceHostBindings").withIndex("by_project", (q) => q.eq("projectId", version.projectId)).collect(),
      Promise.all(version.verifierIds.map((id) => ctx.db.get(id))),
      Promise.all((version.codeScopeIds ?? []).map((id) => ctx.db.get(id))),
      Promise.all((version.agentBindings ?? []).map((binding) => ctx.db.get(binding.agentVersionId))),
    ]);
    const github = installation ? evaluateGithubAppCapabilities(installation) : null;
    const agentTemplates = await Promise.all(agentVersions.map((agentVersion) =>
      agentVersion ? ctx.db.get(agentVersion.templateId) : null
    ));
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
      check("workflow-contract", "Structured workflow contract", factoryWorkflowContractIssues(workflow).length === 0, now, undefined, "Replace heuristic completion and provider authority with schema-validated handoffs."),
      check("executor", "Codex executor adapter", version.executor.adapter === "codex" && version.executor.version === "v1", now, undefined, "Select the approved codex/v1 executor adapter."),
      check("code-scopes", "Frozen code scopes", Boolean(
        version.codeScopeIds?.length
        && repository
        && codeScopes.every((scope) => scope?.active && scope.repositoryId === repository._id)
      ), now, undefined, "Create a new Factory version with at least one active repository code scope."),
      check("agent-manifests", "Approved agent manifests", Boolean(
        workflow
        && version.agentBindings?.length === workflow.agents.length
        && new Set(version.agentBindings?.map((binding) => binding.workflowAgentId)).size === workflow.agents.length
        && agentVersions.every((agentVersion) =>
          agentVersion?.status === "APPROVED"
          && Boolean(agentVersion.genome.promptBundleHash.trim())
          && Boolean(agentVersion.genome.toolManifestHash.trim())
          && Boolean(agentVersion.genome.modelConfig.modelId.trim())
        )
        && agentTemplates.every((template) => template?.active)
      ), now, undefined, "Bind every workflow agent to an approved agent version."),
      check("policy", "Governance policy", Boolean(policy?.active), now, undefined, "Select an active workspace policy envelope."),
      check("budget", "Bounded budget", validFactoryBudget(version.budget), now, undefined, "Set positive V1 limits: cost <= $1,000, runtime <= 480 minutes, attempts <= 3."),
      check("verifiers", "Independent verifiers", verifiers.length > 0 && verifiers.every((item) => item?.active && item.projectId === version.projectId), now, expiry, "Select at least one active workspace verifier."),
      check("host", "Sandbox host binding", Boolean(host && host.status === "READY" && !host.dirty && now - host.checkedAt <= 24 * 60 * 60 * 1_000), now, expiry, "Report a clean, current READY checkout for this repository."),
      check("recovery", "Executor-compatible recovery", codexV1RecoveryReady(version.recovery), now, undefined, "Enable cancel and bounded retry; codex/v1 cannot advertise pause or in-process resume."),
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
