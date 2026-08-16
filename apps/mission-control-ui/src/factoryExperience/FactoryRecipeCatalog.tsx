import { Check, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import {
  FACTORY_RECIPES,
  type FactoryRecipeRecommendation,
} from "./recipeCatalog";

export function FactoryRecipeCatalog({
  selectedId,
  recommendation,
  onSelect,
}: {
  selectedId: string;
  recommendation: FactoryRecipeRecommendation | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section aria-labelledby="recipe-catalog-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-info-accent">
            Governed patterns
          </div>
          <h2
            id="recipe-catalog-title"
            className="mt-1 text-[17px] font-semibold text-ink"
          >
            Recipe catalog
          </h2>
        </div>
        <div className="text-[10.5px] text-ink-muted">
          8 deterministic compositions
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {FACTORY_RECIPES.map((recipe) => {
          const selected = recipe.id === selectedId;
          const recommended = recommendation?.recipeId === recipe.id;
          return (
            <button
              key={recipe.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(recipe.id)}
              className={cn(
                "group rounded-xl border bg-surface-1 p-3.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-info-accent/30",
                selected
                  ? "border-info-accent/60"
                  : "border-line hover:border-line-strong",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-semibold text-ink">
                  {recipe.name}
                </div>
                {selected ? (
                  <Check size={14} className="text-info-accent" />
                ) : (
                  <ChevronRight
                    size={14}
                    className="text-ink-muted transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </div>
              <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-ink-secondary">
                {recipe.shortDescription}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[9.5px] text-ink-muted">
                  {recipe.complexity}
                </span>
                {recommended ? (
                  <span className="rounded border border-info-accent/25 bg-info-soft px-1.5 py-0.5 text-[9.5px] text-info-accent">
                    Recommended
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
