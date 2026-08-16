import { SlidersHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import type { FactoryExperienceLevel } from "./recipeCatalog";

const LEVELS: Array<{
  id: FactoryExperienceLevel;
  label: string;
  description: string;
}> = [
  {
    id: "basic",
    label: "Basic",
    description:
      "Outcome, recommended workflow, progress, evidence, and required decisions",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description:
      "Workflow roles, routing intent, executor posture, gates, and retry policy",
  },
  {
    id: "advanced",
    label: "Advanced",
    description:
      "Factory Versions, exact subjects, evidence lineage, traces, and raw diagnostics",
  },
];

export function ExperienceLevelSelector({
  value,
  onChange,
  compact = false,
}: {
  value: FactoryExperienceLevel;
  onChange: (level: FactoryExperienceLevel) => void;
  compact?: boolean;
}) {
  return (
    <fieldset
      className={cn(
        "min-w-0",
        !compact && "rounded-lg border border-line bg-surface-1 p-2",
      )}
    >
      <legend className="sr-only">Software Factory experience level</legend>
      <div
        className="flex items-center gap-1"
        role="group"
        aria-label="Software Factory experience level"
      >
        {!compact ? (
          <SlidersHorizontal
            size={14}
            className="mx-1 shrink-0 text-ink-muted"
            aria-hidden
          />
        ) : null}
        {LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            aria-pressed={value === level.id}
            title={level.description}
            onClick={() => onChange(level.id)}
            className={cn(
              "min-h-8 rounded-md px-2.5 text-[11.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-info-accent/30",
              value === level.id
                ? "bg-action-primary text-action-primary-text"
                : "text-ink-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {level.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
