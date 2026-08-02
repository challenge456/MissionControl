export const LOOP_SEMANTICS = {
  inner: {
    pillar: "autonomy",
    label: "Drives autonomy",
    definition: "Fewer corrective human interventions while the agent works.",
  },
  outer: {
    pillar: "automation",
    label: "Drives automation",
    definition: "More eligible work reaches merge readiness through trusted PR-boundary checks.",
  },
  meta: {
    pillar: "quality",
    label: "Drives quality",
    definition: "Observed execution and outcome evidence improves the inner and outer loops.",
  },
} as const;

/** Temporary compatibility names for consumers written before the pillar correction. */
export const LEGACY_LOOP_PILLAR_ALIASES = {
  innerAutomation: LOOP_SEMANTICS.inner.pillar,
  outerAutonomy: LOOP_SEMANTICS.outer.pillar,
} as const;
