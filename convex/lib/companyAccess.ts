import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type CompanyCtx = QueryCtx | MutationCtx;

export type CompanyAccessMode = "AUTHENTICATED" | "DEMO";

export interface CompanyMembership {
  tenant: Doc<"tenants">;
  operatorId?: Id<"operators">;
  roleNames: string[];
  canManageCompany: boolean;
  mode: CompanyAccessMode;
}

function anonymousDemoEnabled(): boolean {
  return process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT === "1";
}

function isCompanyAdminRole(role: Doc<"roles">): boolean {
  const name = role.name.trim().toLowerCase();
  return (
    name === "owner" ||
    name === "company owner" ||
    name === "admin" ||
    name === "company admin" ||
    role.permissions.includes("settings.manage") ||
    role.permissions.includes("projects.create")
  );
}

async function getOperatorRoles(
  ctx: CompanyCtx,
  operator: Doc<"operators">,
  tenantId: Id<"tenants">
) {
  const assignments = await ctx.db
    .query("roleAssignments")
    .withIndex("by_operator", (q) => q.eq("operatorId", operator._id))
    .collect();
  const applicable = assignments.filter(
    (assignment) =>
      !assignment.scope ||
      (assignment.scope.type === "tenant" && assignment.scope.id === tenantId)
  );
  const roles = (
    await Promise.all(applicable.map((assignment) => ctx.db.get(assignment.roleId)))
  ).filter((role): role is Doc<"roles"> => Boolean(role && role.tenantId === tenantId));
  return roles;
}

async function getAuthenticatedOperators(ctx: CompanyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return { identity: null, operators: [] as Doc<"operators">[] };

  const authIds = [...new Set([identity.subject, identity.tokenIdentifier].filter(Boolean))];
  const operatorGroups = await Promise.all(
    authIds.map((authId) =>
      ctx.db
        .query("operators")
        .withIndex("by_auth_id", (q) => q.eq("authId", authId))
        .collect()
    )
  );
  const byId = new Map<Id<"operators">, Doc<"operators">>();
  for (const operator of operatorGroups.flat()) {
    if (operator.active) byId.set(operator._id, operator);
  }
  return { identity, operators: [...byId.values()] };
}

export async function listCompanyMemberships(ctx: CompanyCtx): Promise<CompanyMembership[]> {
  const { identity, operators } = await getAuthenticatedOperators(ctx);

  if (identity) {
    const memberships = await Promise.all(
      operators.map(async (operator) => {
        const tenant = await ctx.db.get(operator.tenantId);
        if (!tenant?.active) return null;
        const roles = await getOperatorRoles(ctx, operator, tenant._id);
        return {
          tenant,
          operatorId: operator._id,
          roleNames: roles.map((role) => role.name),
          canManageCompany: roles.some(isCompanyAdminRole),
          mode: "AUTHENTICATED" as const,
        };
      })
    );
    const byTenant = new Map<Id<"tenants">, CompanyMembership>();
    for (const membership of memberships.filter((item) => item !== null)) {
      const existing = byTenant.get(membership.tenant._id);
      if (!existing) {
        byTenant.set(membership.tenant._id, membership);
        continue;
      }
      byTenant.set(membership.tenant._id, {
        ...existing,
        operatorId:
          existing.canManageCompany || !membership.canManageCompany
            ? existing.operatorId
            : membership.operatorId,
        roleNames: [...new Set([...existing.roleNames, ...membership.roleNames])],
        canManageCompany:
          existing.canManageCompany || membership.canManageCompany,
      });
    }
    return [...byTenant.values()];
  }

  if (!anonymousDemoEnabled()) return [];

  const tenants = await ctx.db
    .query("tenants")
    .withIndex("by_active", (q) => q.eq("active", true))
    .collect();
  return tenants.map((tenant) => ({
    tenant,
    roleNames: ["Demo administrator"],
    canManageCompany: true,
    mode: "DEMO" as const,
  }));
}

export async function requireCompanyAccess(
  ctx: CompanyCtx,
  tenantId: Id<"tenants">,
  options: { manage?: boolean } = {}
): Promise<CompanyMembership> {
  const membership = (await listCompanyMemberships(ctx)).find(
    (item) => item.tenant._id === tenantId
  );
  if (!membership) throw new Error("Company account is unavailable or unauthorized.");
  if (options.manage && !membership.canManageCompany) {
    throw new Error("Company administrator access is required.");
  }
  return membership;
}

export async function requireWorkspaceAccess(
  ctx: CompanyCtx,
  tenantId: Id<"tenants">,
  projectId: Id<"projects">,
  options: { manage?: boolean } = {}
) {
  const membership = await requireCompanyAccess(ctx, tenantId, options);
  const project = await ctx.db.get(projectId);
  if (!project || project.tenantId !== tenantId) {
    throw new Error("Workspace does not belong to the selected company account.");
  }
  return { membership, project };
}
