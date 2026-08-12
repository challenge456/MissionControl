import { describe, expect, it } from "vitest";
import {
  buildMissionSuggestionIntake,
  evaluateMissionPromptReadiness,
} from "../lib/missionPromptScheduling";

describe("mission prompt scheduling readiness", () => {
  it.each([undefined, null, "", "   "])(
    "blocks scheduling without an actionable mission statement (%s)",
    (missionStatement) => {
      expect(evaluateMissionPromptReadiness(missionStatement)).toEqual({
        allowed: false,
        reason: "No mission statement set. Configure the workspace mission before running this job.",
      });
    },
  );

  it("allows scheduling when the mission statement contains content", () => {
    expect(
      evaluateMissionPromptReadiness("  Ship governed, evidence-backed work.  "),
    ).toEqual({
      allowed: true,
      reason: "Mission statement configured",
    });
  });

  it("creates idempotent unassigned intake while retaining the suggested assignee", () => {
    const suggestion = {
      title: "Analyze mission progress",
      description: "Find the current bottlenecks.",
      type: "OPS",
      priority: 2,
      suggestedAssignee: "Hermes",
      reasoning: "The operator needs evidence before releasing work.",
    };
    const intake = buildMissionSuggestionIntake({
      projectId: "project-1",
      suggestion,
      suggestedAgentId: "agent-1",
    });

    expect(intake).not.toHaveProperty("assigneeIds");
    expect(intake).toMatchObject({
      source: "MISSION_PROMPT",
      createdBy: "SYSTEM",
      idempotencyKey: expect.stringMatching(/^mission-prompt:project-1:/),
      metadata: {
        suggestedAssigneeId: "agent-1",
        suggestedAssigneeName: "Hermes",
        requiresWorkOrderPromotion: true,
      },
    });
    expect(buildMissionSuggestionIntake({ projectId: "project-1", suggestion, suggestedAgentId: "agent-1" }))
      .toEqual(intake);
  });
});
