import { describe, expect, it } from "vitest";
import {
  AUTOMATION_DRAFT_INTERVAL_MS,
  buildAutomationDraft,
  isAutomationDraftDue,
} from "../lib/automationDispatch";

const definition = {
  id: "automation-1",
  enabled: true,
  name: "Workflow: release",
  sourcePattern: "Workflow: release",
  sourceSuggestionId: "suggestion-1",
  projectId: "project-1",
};

describe("automation dispatch", () => {
  it("creates an operator approval gate for an active definition", () => {
    expect(isAutomationDraftDue(definition, 1_000)).toBe(true);
    const draft = buildAutomationDraft(definition, 1_000);
    expect(draft).toMatchObject({
      state: "AWAITING_APPROVAL",
      isMutating: false,
      requiredApprovals: ["operator"],
      workflowId: "release",
    });
    expect(draft.acceptanceCriteria).toHaveLength(2);
  });

  it("does not schedule a disabled definition", () => {
    expect(isAutomationDraftDue({ ...definition, enabled: false }, 1_000)).toBe(false);
  });

  it("does not duplicate a draft before its weekly cadence", () => {
    expect(
      isAutomationDraftDue({ ...definition, lastDraftAt: 1_000 }, 1_000 + AUTOMATION_DRAFT_INTERVAL_MS - 1)
    ).toBe(false);
    expect(
      isAutomationDraftDue({ ...definition, lastDraftAt: 1_000 }, 1_000 + AUTOMATION_DRAFT_INTERVAL_MS)
    ).toBe(true);
  });

  it("uses a stable idempotency key within the same weekly cadence", () => {
    const first = buildAutomationDraft(definition, AUTOMATION_DRAFT_INTERVAL_MS + 100);
    const retry = buildAutomationDraft(definition, AUTOMATION_DRAFT_INTERVAL_MS + 200);
    expect(first.idempotencyKey).toBe(retry.idempotencyKey);
  });
});
