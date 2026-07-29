import type { StatusBadgeProps } from "../components/factory/badges";

export type MissionState =
  | "DRAFT"
  | "PLANNING"
  | "AWAITING_PLAN_APPROVAL"
  | "READY"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "AWAITING_VALIDATION"
  | "AWAITING_ACCEPTANCE"
  | "DONE"
  | "CANCELED"
  | "SUPERSEDED";

export interface MissionPresentation {
  label: string;
  health: string;
  tone: StatusBadgeProps["tone"];
}

const PRESENTATION: Record<MissionState, MissionPresentation> = {
  DRAFT: { label: "Draft", health: "Planning not started", tone: "neutral" },
  PLANNING: { label: "Planning", health: "Planning", tone: "info" },
  AWAITING_PLAN_APPROVAL: {
    label: "Plan approval required",
    health: "Plan approval required",
    tone: "warning",
  },
  READY: { label: "Ready", health: "Ready", tone: "info" },
  IN_PROGRESS: { label: "In progress", health: "In progress", tone: "info" },
  BLOCKED: { label: "Needs attention", health: "Needs attention", tone: "warning" },
  AWAITING_VALIDATION: {
    label: "Validation required",
    health: "Validation required",
    tone: "warning",
  },
  AWAITING_ACCEPTANCE: {
    label: "Acceptance required",
    health: "Acceptance required",
    tone: "warning",
  },
  DONE: { label: "Validated", health: "Validated", tone: "success" },
  CANCELED: { label: "Canceled", health: "Canceled", tone: "neutral" },
  SUPERSEDED: { label: "Superseded", health: "Superseded", tone: "neutral" },
};

export function presentMissionState(state: string): MissionPresentation {
  return PRESENTATION[state as MissionState] ?? {
    label: state.replace(/_/g, " "),
    health: "Unknown state",
    tone: "neutral",
  };
}
