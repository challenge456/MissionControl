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

export type MissionRole = "ORCHESTRATOR" | "WORKER" | "VALIDATOR" | "OPERATOR";
export type MissionExecutionPolicy = "SERIAL_MUTATIONS";
export type MissionAssertionStatus = "PENDING" | "PASS" | "FAIL" | "WAIVED" | "STALE" | "UNKNOWN";
export type MissionHandoffOutcome = "COMPLETE" | "INCOMPLETE" | "NEEDS_HUMAN_INPUT";

const TRANSITIONS: Record<MissionState, MissionState[]> = {
  DRAFT: ["PLANNING", "CANCELED"],
  PLANNING: ["AWAITING_PLAN_APPROVAL", "BLOCKED", "CANCELED"],
  AWAITING_PLAN_APPROVAL: ["DRAFT", "READY", "CANCELED"],
  READY: ["IN_PROGRESS", "BLOCKED", "CANCELED"],
  IN_PROGRESS: ["AWAITING_VALIDATION", "BLOCKED", "CANCELED"],
  BLOCKED: ["READY", "CANCELED"],
  AWAITING_VALIDATION: ["IN_PROGRESS", "AWAITING_ACCEPTANCE", "BLOCKED", "CANCELED"],
  AWAITING_ACCEPTANCE: ["DONE", "IN_PROGRESS", "BLOCKED", "CANCELED"],
  DONE: ["SUPERSEDED"],
  CANCELED: [],
  SUPERSEDED: [],
};

export function canTransitionMission(from: MissionState, to: MissionState) {
  return TRANSITIONS[from].includes(to);
}

export function validateMissionWorkOrderDispatch(args: {
  missionState: MissionState;
  planApproved: boolean;
  executionPolicy: MissionExecutionPolicy;
  workOrderReleased: boolean;
  isMutating: boolean;
  hasActiveMutatingWorkOrder: boolean;
  predecessorHandoffValid: boolean;
  budgetRemaining: boolean;
  correctiveIterationsRemaining: boolean;
}) {
  if (!args.planApproved) return { ok: false as const, reason: "plan-not-approved" };
  if (!args.workOrderReleased) return { ok: false as const, reason: "work-order-not-released" };
  if (!["READY", "IN_PROGRESS"].includes(args.missionState)) {
    return { ok: false as const, reason: `mission-not-dispatchable:${args.missionState}` };
  }
  if (!args.predecessorHandoffValid) return { ok: false as const, reason: "predecessor-handoff-invalid" };
  if (!args.budgetRemaining) return { ok: false as const, reason: "mission-budget-exhausted" };
  if (!args.correctiveIterationsRemaining) return { ok: false as const, reason: "corrective-iteration-limit" };
  if (args.executionPolicy === "SERIAL_MUTATIONS" && args.isMutating && args.hasActiveMutatingWorkOrder) {
    return { ok: false as const, reason: "active-mutating-work-order-exists" };
  }
  return { ok: true as const };
}

export function validateMissionHandoff(args: {
  role: MissionRole;
  outcome: MissionHandoffOutcome;
  completedAssertionIds: string[];
  incompleteAssertionIds: string[];
  unknownAssertionIds: string[];
  commands: Array<{ command: string; exitCode: number }>;
  knownRisks: string[];
  nextAction: string;
}) {
  if (!["WORKER", "VALIDATOR"].includes(args.role)) return { ok: false as const, reason: "handoff-role-invalid" };
  if (!args.nextAction.trim()) return { ok: false as const, reason: "next-action-required" };
  if (args.commands.some((command) => !command.command.trim() || !Number.isInteger(command.exitCode))) {
    return { ok: false as const, reason: "command-evidence-invalid" };
  }
  const allAssertionIds = [
    ...args.completedAssertionIds,
    ...args.incompleteAssertionIds,
    ...args.unknownAssertionIds,
  ];
  if (new Set(allAssertionIds).size !== allAssertionIds.length) {
    return { ok: false as const, reason: "assertion-outcomes-overlap" };
  }
  if (args.outcome === "COMPLETE" && (args.incompleteAssertionIds.length > 0 || args.unknownAssertionIds.length > 0)) {
    return { ok: false as const, reason: "complete-handoff-has-open-assertions" };
  }
  if (args.outcome !== "COMPLETE" && args.knownRisks.length === 0) {
    return { ok: false as const, reason: "open-handoff-risk-required" };
  }
  return { ok: true as const };
}

export function evaluateMissionAcceptance(args: {
  assertions: Array<{
    id: string;
    status: MissionAssertionStatus;
    requiresIndependentValidation: boolean;
    validatorRunId?: string;
    waiverApprovalId?: string;
  }>;
}) {
  const missingAssertionIds: string[] = [];
  const failedAssertionIds: string[] = [];
  const staleAssertionIds: string[] = [];
  const unverifiedAssertionIds: string[] = [];
  const waiverWithoutApprovalIds: string[] = [];

  for (const assertion of args.assertions) {
    if (assertion.status === "PENDING" || assertion.status === "UNKNOWN") missingAssertionIds.push(assertion.id);
    if (assertion.status === "FAIL") failedAssertionIds.push(assertion.id);
    if (assertion.status === "STALE") staleAssertionIds.push(assertion.id);
    if (assertion.requiresIndependentValidation && assertion.status === "PASS" && !assertion.validatorRunId) {
      unverifiedAssertionIds.push(assertion.id);
    }
    if (assertion.status === "WAIVED" && !assertion.waiverApprovalId) waiverWithoutApprovalIds.push(assertion.id);
  }

  const blockingReasons = [
    ...(missingAssertionIds.length ? [`Missing assertion evidence: ${missingAssertionIds.join(", ")}`] : []),
    ...(failedAssertionIds.length ? [`Failed assertions: ${failedAssertionIds.join(", ")}`] : []),
    ...(staleAssertionIds.length ? [`Stale assertions: ${staleAssertionIds.join(", ")}`] : []),
    ...(unverifiedAssertionIds.length ? [`Independent validation missing: ${unverifiedAssertionIds.join(", ")}`] : []),
    ...(waiverWithoutApprovalIds.length ? [`Waiver approval missing: ${waiverWithoutApprovalIds.join(", ")}`] : []),
  ];

  return {
    missingAssertionIds,
    failedAssertionIds,
    staleAssertionIds,
    unverifiedAssertionIds,
    waiverWithoutApprovalIds,
    blockingReasons,
    eligible: blockingReasons.length === 0,
  };
}
