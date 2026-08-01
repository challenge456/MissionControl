import type { Id } from "../../../../convex/_generated/dataModel";

export interface AccessibleCompany {
  tenantId: Id<"tenants">;
}

export function selectAccessibleCompany({
  requestedCompany,
  persistedCompany,
  companies,
}: {
  requestedCompany: string | null;
  persistedCompany: string | null;
  companies: AccessibleCompany[];
}): { tenantId: Id<"tenants"> | null; requestedUnavailable: boolean } {
  if (companies.length === 0) {
    return { tenantId: null, requestedUnavailable: Boolean(requestedCompany) };
  }
  const requested = companies.find((company) => company.tenantId === requestedCompany);
  if (requested) return { tenantId: requested.tenantId, requestedUnavailable: false };

  const persisted = companies.find((company) => company.tenantId === persistedCompany);
  return {
    tenantId: persisted?.tenantId ?? companies[0].tenantId,
    requestedUnavailable: Boolean(requestedCompany),
  };
}
