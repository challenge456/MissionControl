import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type CatalogCtx = Pick<QueryCtx | MutationCtx, "db">;

export async function loadModelCatalogForProject(
  ctx: CatalogCtx,
  projectId: Id<"projects">,
) {
  const catalog = await ctx.db.query("modelCatalog").collect();
  const scoped = catalog.filter((model) => model.projectId === projectId);
  const scopedKeys = new Set(scoped.map((model) => `${model.provider}\0${model.modelId}`));
  const shared = catalog.filter((model) =>
    !model.projectId && !scopedKeys.has(`${model.provider}\0${model.modelId}`)
  );
  return [...scoped, ...shared];
}

export async function findModelCatalogEntry(
  ctx: CatalogCtx,
  projectId: Id<"projects">,
  modelId: string,
) {
  const matches = await ctx.db
    .query("modelCatalog")
    .withIndex("by_model_id", (query) => query.eq("modelId", modelId))
    .collect();
  return matches.find((model) => model.projectId === projectId)
    ?? matches.find((model) => !model.projectId)
    ?? null;
}
