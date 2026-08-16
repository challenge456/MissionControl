import type { FactoryExperienceLevel } from "./recipeCatalog";

export type FactorySurface =
  | "overview"
  | "improvements"
  | "signals"
  | "experiments"
  | "agent-setup";

export interface FactorySurfaceDefinition {
  id: FactorySurface;
  label: string;
  minimumLevel: FactoryExperienceLevel;
}

export const FACTORY_SURFACES: readonly FactorySurfaceDefinition[] = [
  { id: "overview", label: "Overview", minimumLevel: "basic" },
  { id: "improvements", label: "Improvements", minimumLevel: "basic" },
  { id: "signals", label: "Signals", minimumLevel: "intermediate" },
  { id: "experiments", label: "Experiments", minimumLevel: "intermediate" },
  { id: "agent-setup", label: "Agent setup", minimumLevel: "advanced" },
] as const;

const LEVEL_RANK: Record<FactoryExperienceLevel, number> = {
  basic: 0,
  intermediate: 1,
  advanced: 2,
};

export function visibleFactorySurfaces(level: FactoryExperienceLevel) {
  return FACTORY_SURFACES.filter(
    (surface) => LEVEL_RANK[level] >= LEVEL_RANK[surface.minimumLevel],
  );
}

export function parseFactorySurface(
  value: string | null | undefined,
  level: FactoryExperienceLevel,
): FactorySurface {
  return visibleFactorySurfaces(level).some((surface) => surface.id === value)
    ? value as FactorySurface
    : "overview";
}

export function candidateStatusTone(status: string) {
  if (["WORK_ORDERED", "IMPLEMENTED", "VERIFIED", "EFFECTIVE"].includes(status)) return "success" as const;
  if (["REJECTED", "DISMISSED", "ROLLED_BACK"].includes(status)) return "error" as const;
  if (["SNOOZED", "ACCEPTED"].includes(status)) return "warning" as const;
  return "neutral" as const;
}

export function canPromoteImprovement(input: {
  candidateStatus: string;
  experimentStatus?: string;
}) {
  return input.candidateStatus === "ACCEPTED" && input.experimentStatus === "COMPLETED";
}
