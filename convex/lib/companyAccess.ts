import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type CompanyCtx = QueryCtx | MutationCtx;

export type CompanyAccessMode = "AUTHENTICATED" | "DEMO";

export const COMPANY_PERMISSIONS = {
  MANAGE_COMPANY: "company.manage",
  MANAGE_MEMBERS: "members.manage",
  CREATE_WORKSPACES: "workspaces.create",
  MANAGE_WORKSPACES: "workspaces.manage",
} as const;

export const FACTORY_PERMISSIONS = {
  VIEW: "factory.read",
  IMPROVE: "factory.improve",
  APPROVE: "factory.approve",
  MANAGE_AUTOMATION: "factory.automation.manage",
} as const;

export type CompanyPermission =
  (typeof COMPANY_PERMISSIONS)[keyof typeof COMPANY_PERMISSIONS];

export type FactoryPermission =
  (typeof FACTORY_PERMISSIONS)[keyof typeof FACTORY_PERMISSIONS];

export interface CompanyMembership {
  tenant: Doc<"tenants">;
  operatorId?: Id<"operators">;
  roleNames: string[];
  permissions: string[];
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

function roleGrantsPermission(
  role: Doc<"roles">,
  permission: CompanyPermission
): boolean {
  if (role.permissions.includes(permission)) return true;
  if (
    permission === COMPANY_PERMISSIONS.MANAGE_COMPANY ||
    permission === COMPANY_PERMISSIONS.MANAGE_MEMBERS ||
    permission === COMPANY_PERMISSIONS.MANAGE_WORKSPACES
  ) {
    return isCompanyAdminRole(role);
  }
  if (permission === COMPANY_PERMISSIONS.CREATE_WORKSPACES) {
    return isCompanyAdminRole(role) || role.permissions.includes("projects.create");
  }
  return false;
}

async function getOperatorRoles(
  ctx: CompanyCtx,
  operator: Doc<"operators">,
  tenantId: Id<"tenants">,
  projectId?: Id<"projects">
) {
  const assignments = await ctx.db
    .query("roleAssignments")
    .withIndex("by_operator", (q) => q.eq("operatorId", operator._id))
    .collect();
  const applicable = assignments.filter(
    (assignment) =>
      !assignment.scope ||
      (assignment.scope.type === "tenant" && assignment.scope.id === tenantId) ||
      (projectId != null &&
        assignment.scope.type === "project" &&
        assignment.scope.id === projectId)
  );
  const roles = (
    await Promise.all(applicable.map((assignment) => ctx.db.get(assignment.roleId)))
  ).filter((role): role is Doc<"roles"> => Boolean(role && role.tenantId === tenantId));
  return roles;
}

function roleGrantsFactoryPermission(
  role: Doc<"roles">,
  permission: FactoryPermission
): boolean {
  if (role.permissions.includes(permission) || isCompanyAdminRole(role)) return true;

  const legacyPermissionAliases: Record<FactoryPermission, string[]> = {
    [FACTORY_PERMISSIONS.VIEW]: [
      "missions.read",
      "missions.write",
      "workorders.read",
      "workorders.write",
      "tasks.read",
      "tasks.view",
      "tasks.write",
      "tasks.update",
      "telemetry.read",
      "evidence.read",
      "evidence.write",
      "approvals.read",
      "approvals.view",
      "approvals.decide",
    ],
    [FACTORY_PERMISSIONS.IMPROVE]: [
      "missions.write",
      "workorders.write",
      "tasks.write",
      "tasks.update",
      "tasks.create",
      "evidence.write",
    ],
    [FACTORY_PERMISSIONS.APPROVE]: [
      "missions.approve",
      "workorders.dispatch",
      "approvals.decide",
    ],
    [FACTORY_PERMISSIONS.MANAGE_AUTOMATION]: [
      "policy.manage",
      "deployments.activate",
      "settings.manage",
    ],
  };
  return legacyPermissionAliases[permission].some((candidate) =>
    role.permissions.includes(candidate)
  );
}

async function getAuthenticatedOperators(ctx: CompanyCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return { identity: null, operators: [] as Doc<"operators">[] };

  const operators = await ctx.db
    .query("operators")
    .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
    .collect();
  return { identity, operators: operators.filter((operator) => operator.active) };
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
          permissions: [...new Set(roles.flatMap((role) => role.permissions))],
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
        permissions: [
          ...new Set([...existing.permissions, ...membership.permissions]),
        ],
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
    permissions: Object.values(COMPANY_PERMISSIONS),
    canManageCompany: true,
    mode: "DEMO" as const,
  }));
}

export async function requireCompanyPermission(
  ctx: CompanyCtx,
  tenantId: Id<"tenants">,
  permission: CompanyPermission
): Promise<CompanyMembership> {
  const membership = await requireCompanyAccess(ctx, tenantId);
  if (membership.mode === "DEMO") return membership;

  const operator = membership.operatorId
    ? await ctx.db.get(membership.operatorId)
    : null;
  if (!operator) throw new Error("Authenticated operator membership is required.");
  const roles = await getOperatorRoles(ctx, operator, tenantId);
  if (!roles.some((role) => roleGrantsPermission(role, permission))) {
    throw new Error("Your company role does not permit this action.");
  }
  return membership;
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

export async function requireWorkspacePermission(
  ctx: CompanyCtx,
  projectId: Id<"projects">,
  permission: FactoryPermission
) {
  const project = await ctx.db.get(projectId);
  if (!project?.tenantId) {
    throw new Error("Workspace is unavailable or unauthorized.");
  }
  const { membership } = await requireWorkspaceAccess(
    ctx,
    project.tenantId,
    projectId
  );
  if (membership.mode === "DEMO") {
    return {
      membership,
      project,
      actorId: "demo:company-administrator",
      permission,
    };
  }
  const operator = membership.operatorId
    ? await ctx.db.get(membership.operatorId)
    : null;
  if (!operator) throw new Error("Authenticated operator membership is required.");
  const roles = await getOperatorRoles(ctx, operator, project.tenantId, projectId);
  if (!roles.some((role) => roleGrantsFactoryPermission(role, permission))) {
    throw new Error("Your workspace role does not permit this factory action.");
  }
  return {
    membership,
    project,
    actorId: String(operator._id),
    permission,
  };
}
