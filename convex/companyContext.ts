import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { listCompanyMemberships, requireCompanyAccess, requireWorkspaceAccess } from "./lib/companyAccess";

function exceedsLength(value: string | undefined, maximum: number): boolean {
  return Boolean(value && value.trim().length > maximum);
}

export const getSession = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const memberships = await listCompanyMemberships(ctx);
    return {
      status:
        memberships.length > 0
          ? "READY" as const
          : identity
            ? "NO_MEMBERSHIP" as const
            : "AUTH_REQUIRED" as const,
      mode: memberships[0]?.mode,
      companies: memberships.map((membership) => ({
        tenantId: membership.tenant._id,
        name: membership.tenant.name,
        slug: membership.tenant.slug,
        description: membership.tenant.description,
        missionStatement: membership.tenant.missionStatement,
        active: membership.tenant.active,
        roleNames: membership.roleNames,
        canManageCompany: membership.canManageCompany,
      })),
    };
  },
});

export const listWorkspaces = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await requireCompanyAccess(ctx, args.tenantId);
    return await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("asc")
      .collect();
  },
});

export const getWorkspace = query({
  args: { tenantId: v.id("tenants"), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const { project } = await requireWorkspaceAccess(
      ctx,
      args.tenantId,
      args.projectId
    );
    return project;
  },
});

export const getCompanySummary = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const membership = await requireCompanyAccess(ctx, args.tenantId);
    const [workspaces, operators, repositories] = await Promise.all([
      ctx.db
        .query("projects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .collect(),
      ctx.db
        .query("operators")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .collect(),
      ctx.db
        .query("workspaceRepositories")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
        .collect(),
    ]);
    return {
      company: membership.tenant,
      roleNames: membership.roleNames,
      canManageCompany: membership.canManageCompany,
      mode: membership.mode,
      counts: {
        activeWorkspaces: workspaces.filter((workspace) => workspace.status !== "ARCHIVED").length,
        activeOperators: operators.filter((operator) => operator.active).length,
        repositories: repositories.length,
      },
    };
  },
});

export const updateCompany = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    missionStatement: v.optional(v.string()),
    expectedUpdatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const membership = await requireCompanyAccess(ctx, args.tenantId, { manage: true });
    const name = args.name.trim();
    if (!name) return { success: false, error: "Company name is required." };
    if (exceedsLength(name, 120)) {
      return { success: false, error: "Company name must be 120 characters or fewer." };
    }
    if (exceedsLength(args.description, 1_000)) {
      return { success: false, error: "Company description must be 1,000 characters or fewer." };
    }
    if (exceedsLength(args.missionStatement, 1_000)) {
      return { success: false, error: "Mission statement must be 1,000 characters or fewer." };
    }
    if ((membership.tenant.updatedAt ?? 0) !== args.expectedUpdatedAt) {
      return {
        success: false,
        error: "Company profile changed in another session. Refresh and try again.",
      };
    }
    const now = Date.now();
    await ctx.db.patch(args.tenantId, {
      name,
      description: args.description?.trim() || undefined,
      missionStatement: args.missionStatement?.trim() || undefined,
      updatedAt: now,
      updatedBy: membership.operatorId,
    });
    await ctx.db.insert("activities", {
      actorType: "HUMAN",
      actorId: membership.operatorId ?? "demo:company-administrator",
      action: "COMPANY_PROFILE_UPDATED",
      description: `Company account "${name}" updated`,
      targetType: "TENANT",
      targetId: args.tenantId,
      metadata: { tenantId: args.tenantId, mode: membership.mode },
    });
    return { success: true, company: await ctx.db.get(args.tenantId) };
  },
});

export const createWorkspace = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    purpose: v.string(),
    owner: v.string(),
    defaultPolicy: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("PAUSED")),
  },
  handler: async (ctx, args) => {
    const membership = await requireCompanyAccess(ctx, args.tenantId, { manage: true });
    const name = args.name.trim();
    const slug = args.slug.trim();
    if (!name) return { success: false, error: "Workspace name is required." };
    if (exceedsLength(name, 120)) {
      return { success: false, error: "Workspace name must be 120 characters or fewer." };
    }
    if (exceedsLength(slug, 80)) {
      return { success: false, error: "Workspace slug must be 80 characters or fewer." };
    }
    if (exceedsLength(args.description, 1_000)) {
      return { success: false, error: "Workspace description must be 1,000 characters or fewer." };
    }
    if (exceedsLength(args.purpose, 500)) {
      return { success: false, error: "Workspace purpose must be 500 characters or fewer." };
    }
    if (exceedsLength(args.owner, 120)) {
      return { success: false, error: "Workspace owner must be 120 characters or fewer." };
    }
    if (exceedsLength(args.defaultPolicy, 120)) {
      return { success: false, error: "Default policy must be 120 characters or fewer." };
    }
    if (!args.purpose.trim()) return { success: false, error: "Workspace purpose is required." };
    if (!args.owner.trim()) return { success: false, error: "Workspace owner is required." };
    if (!args.defaultPolicy.trim()) {
      return { success: false, error: "Default policy is required." };
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { success: false, error: "Workspace slug is invalid." };
    }
    const duplicate = await ctx.db
      .query("projects")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", args.tenantId).eq("slug", slug))
      .first();
    if (duplicate) {
      return { success: false, error: "This company already has a workspace with that slug." };
    }
    const projectId = await ctx.db.insert("projects", {
      tenantId: args.tenantId,
      name,
      slug,
      description: args.description?.trim() || undefined,
      purpose: args.purpose.trim(),
      owner: args.owner.trim(),
      defaultPolicy: args.defaultPolicy.trim(),
      status: args.status,
      metadata: {
        companyBoundaryVersion: 1,
        createdAt: Date.now(),
        createdBy: membership.operatorId ?? "demo:company-administrator",
      },
    });
    await ctx.db.insert("activities", {
      projectId,
      actorType: "HUMAN",
      actorId: membership.operatorId ?? "demo:company-administrator",
      action: "WORKSPACE_CREATED",
      description: `Workspace "${name}" created in ${membership.tenant.name}`,
      targetType: "PROJECT",
      targetId: projectId,
      metadata: { tenantId: args.tenantId, slug, mode: membership.mode },
    });
    return { success: true, project: await ctx.db.get(projectId) };
  },
});
