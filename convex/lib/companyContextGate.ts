import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveFlag, type FlagRow } from "./flags";

type GateCtx = QueryCtx | MutationCtx;

/**
 * Compatibility gate for legacy project APIs. When company.context is off,
 * legacy behavior remains available. Once enabled globally or per workspace,
 * every project operation must pass the new server-side scope checks.
 */
export async function isCompanyContextEnforced(
  ctx: GateCtx,
  projectId?: Id<"projects">
): Promise<boolean> {
  const rows = (await ctx.db
    .query("featureFlags")
    .withIndex("by_key", (q) => q.eq("key", "company.context"))
    .collect()) as FlagRow[];
  return resolveFlag(rows, "company.context", projectId ?? null).enabled;
}

