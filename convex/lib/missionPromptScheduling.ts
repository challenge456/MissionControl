export type MissionPromptReadiness =
  | { allowed: true; reason: "Mission statement configured" }
  | { allowed: false; reason: "No mission statement set. Configure the workspace mission before running this job." };

export function evaluateMissionPromptReadiness(
  missionStatement: unknown,
): MissionPromptReadiness {
  if (typeof missionStatement !== "string" || missionStatement.trim().length === 0) {
    return {
      allowed: false,
      reason: "No mission statement set. Configure the workspace mission before running this job.",
    };
  }

  return { allowed: true, reason: "Mission statement configured" };
}

type MissionTaskSuggestion = {
  title: string;
  description: string;
  type: string;
  priority: number;
  reasoning: string;
  suggestedAssignee?: string;
};

/**
 * Scheduled mission prompting creates governed intake, not executable work.
 * The suggested assignee is retained as planning context until an operator
 * promotes the intake through a WorkOrder and explicitly assigns its Task.
 */
export function buildMissionSuggestionIntake<TProjectId, TAgentId>(args: {
  projectId?: TProjectId;
  suggestion: MissionTaskSuggestion;
  suggestedAgentId?: TAgentId;
}) {
  return {
    projectId: args.projectId,
    title: args.suggestion.title,
    description: `${args.suggestion.description}\n\n**Mission Alignment:** ${args.suggestion.reasoning}`,
    type: args.suggestion.type,
    priority: args.suggestion.priority,
    source: "MISSION_PROMPT",
    sourceRef: "mission-reverse-prompt",
    createdBy: "SYSTEM",
    createdByRef: "mission-reverse-prompt",
    idempotencyKey: `mission-prompt:${String(args.projectId ?? "tenant")}:${stableKey(args.suggestion.title)}`,
    metadata: {
      intakeKind: "MISSION_SUGGESTION",
      suggestedAssigneeId: args.suggestedAgentId,
      suggestedAssigneeName: args.suggestion.suggestedAssignee,
      missionAlignmentReasoning: args.suggestion.reasoning,
      requiresWorkOrderPromotion: true,
    },
  };
}

function stableKey(value: string) {
  let hash = 2_166_136_261;
  for (const character of value.trim().toLowerCase()) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
