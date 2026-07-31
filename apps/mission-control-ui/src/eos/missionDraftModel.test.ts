import { describe, expect, it } from "vitest";
import {
  missionDraftPayload,
  validateMissionDraft,
  type MissionDraftValues,
} from "./missionDraftModel";

const validDraft: MissionDraftValues = {
  title: "Trusted routing",
  objective: "Make Mission routing reliable",
  context: "PR 1",
  constraints: ["No state-machine changes"],
  sourceOfTruthRefs: [{ kind: "PRD", label: "PR 1", location: "docs/pr1.md" }],
  owner: "Platform",
  budgetUsd: "12.50",
  stopCondition: "Focused tests pass",
  maxReadOnlyConcurrency: "2",
  maxCorrectiveIterations: "1",
};

describe("Mission draft model", () => {
  it("accepts and serializes the supported draft contract", () => {
    expect(validateMissionDraft(validDraft)).toEqual({});
    expect(missionDraftPayload(validDraft)).toMatchObject({
      title: "Trusted routing",
      budgetUsd: 12.5,
      maxReadOnlyConcurrency: 2,
      maxCorrectiveIterations: 1,
    });
  });

  it("rejects negative budgets and invalid bounded integers", () => {
    expect(validateMissionDraft({
      ...validDraft,
      budgetUsd: "-1",
      maxReadOnlyConcurrency: "0",
      maxCorrectiveIterations: "1.5",
    })).toMatchObject({
      budgetUsd: "Budget must be zero or greater.",
      maxReadOnlyConcurrency: "Concurrency must be a whole number of at least 1.",
      maxCorrectiveIterations: "Corrective iterations must be a whole number of at least 0.",
    });
  });
});
