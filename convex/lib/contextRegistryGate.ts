/**
 * Feature-flag gate for the context package registry.
 *
 * Shared by convex/context/packages.ts and convex/context/importSkills.ts.
 * Lives in lib/ (rather than convex/context/) so downstream composite
 * TypeScript projects that include `convex/lib/**` can resolve it without
 * listing the context/ modules.
 */

import { resolveFlag, type FlagRow } from "./flags";

export const CONTEXT_REGISTRY_FLAG = "context.registry";

/** Throws unless the `context.registry` feature flag resolves enabled. */
export async function requireContextRegistryEnabled(
  ctx: { db: any },
  projectId?: string | null
): Promise<void> {
  const rows = (await ctx.db
    .query("featureFlags")
    .withIndex("by_key", (q: any) => q.eq("key", CONTEXT_REGISTRY_FLAG))
    .collect()) as FlagRow[];
  const resolved = resolveFlag(rows, CONTEXT_REGISTRY_FLAG, projectId ?? null);
  if (!resolved.enabled) {
    throw new Error(
      `Context registry is disabled — enable the "${CONTEXT_REGISTRY_FLAG}" feature flag first`
    );
  }
}
