import { afterEach, describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import { listCompanyMemberships, requireCompanyAccess } from "../lib/companyAccess";

const originalDemoFlag = process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;

afterEach(() => {
  if (originalDemoFlag === undefined) {
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
  } else {
    process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT = originalDemoFlag;
  }
});

function fakeContext({ identity = null }: { identity?: { subject: string; tokenIdentifier: string } | null } = {}) {
  const tenantA = {
    _id: "tenant-a" as Id<"tenants">,
    _creationTime: 1,
    name: "Mission Control",
    slug: "mission-control",
    active: true,
  };
  const tenantB = {
    _id: "tenant-b" as Id<"tenants">,
    _creationTime: 2,
    name: "SellerFi",
    slug: "sellerfi",
    active: true,
  };
  const ownerRole = {
    _id: "role-owner" as Id<"roles">,
    _creationTime: 3,
    tenantId: tenantA._id,
    name: "Owner",
    permissions: ["settings.manage"],
  };
  const operator = {
    _id: "operator-a" as Id<"operators">,
    _creationTime: 4,
    tenantId: tenantA._id,
    email: "owner@example.com",
    name: "Owner",
    authId: "auth-user",
    active: true,
    createdAt: 1,
  };
  const assignment = {
    _id: "assignment-a" as Id<"roleAssignments">,
    _creationTime: 5,
    operatorId: operator._id,
    roleId: ownerRole._id,
    scope: { type: "tenant" as const, id: tenantA._id },
    assignedAt: 1,
  };
  const tables: Record<string, any[]> = {
    tenants: [tenantA, tenantB],
    operators: [operator],
    roles: [ownerRole],
    roleAssignments: [assignment],
  };
  const all = Object.values(tables).flat();

  return {
    tenantA,
    tenantB,
    ctx: {
      auth: { getUserIdentity: async () => identity },
      db: {
        get: async (id: string) => all.find((row) => row._id === id) ?? null,
        query: (table: string) => {
          let rows = [...(tables[table] ?? [])];
          const builder: any = {
            withIndex: (_name: string, apply: (q: any) => any) => {
              const conditions: Array<[string, unknown]> = [];
              const q: any = {
                eq: (field: string, value: unknown) => {
                  conditions.push([field, value]);
                  return q;
                },
              };
              apply(q);
              rows = rows.filter((row) => conditions.every(([field, value]) => row[field] === value));
              return builder;
            },
            collect: async () => rows,
          };
          return builder;
        },
      },
    } as any,
  };
}

describe("company access", () => {
  it("fails closed without authentication or the demo flag", async () => {
    delete process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT;
    const { ctx } = fakeContext();
    await expect(listCompanyMemberships(ctx)).resolves.toEqual([]);
  });

  it("resolves only companies linked to the authenticated operator", async () => {
    const { ctx, tenantA } = fakeContext({
      identity: { subject: "auth-user", tokenIdentifier: "issuer|auth-user" },
    });
    const memberships = await listCompanyMemberships(ctx);
    expect(memberships).toHaveLength(1);
    expect(memberships[0].tenant._id).toBe(tenantA._id);
    expect(memberships[0].canManageCompany).toBe(true);
    expect(memberships[0].mode).toBe("AUTHENTICATED");
  });

  it("rejects an inaccessible company", async () => {
    const { ctx, tenantB } = fakeContext({
      identity: { subject: "auth-user", tokenIdentifier: "issuer|auth-user" },
    });
    await expect(requireCompanyAccess(ctx, tenantB._id)).rejects.toThrow(
      "unavailable or unauthorized"
    );
  });

  it("exposes active companies only when local demo access is explicit", async () => {
    process.env.MC_ALLOW_ANONYMOUS_COMPANY_CONTEXT = "1";
    const { ctx } = fakeContext();
    const memberships = await listCompanyMemberships(ctx);
    expect(memberships.map((item) => item.tenant.slug)).toEqual([
      "mission-control",
      "sellerfi",
    ]);
    expect(memberships.every((item) => item.mode === "DEMO")).toBe(true);
  });
});
