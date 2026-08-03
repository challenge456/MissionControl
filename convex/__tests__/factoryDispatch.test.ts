import { describe, expect, it } from "vitest";
import { evaluateFactoryDispatchPreflight, type FactoryDispatchPreflightInput } from "../lib/factoryDispatch";

const ready: FactoryDispatchPreflightInput = {
  missionLinked: true,
  versionProvided: true,
  definitionActive: true,
  versionIsActive: true,
  assessmentPasses: true,
  assessmentCurrent: true,
  digestMatches: true,
  repositoryReady: true,
  githubReady: true,
  workflowMatches: true,
  executorReady: true,
  policyReady: true,
  verifiersReady: true,
  hostReady: true,
  budgetReady: true,
  recoveryReady: true,
  worktreeProvided: true,
  mutating: true,
  activeRepositoryMutation: false,
};

describe("Factory dispatch preflight", () => {
  it("requires a Factory version for Mission-linked execution", () => {
    expect(evaluateFactoryDispatchPreflight({ ...ready, versionProvided: false })).toMatchObject({
      ok: false,
      blocker: "factory-version-required",
    });
  });

  it("returns the first actionable readiness root cause", () => {
    expect(evaluateFactoryDispatchPreflight({ ...ready, githubReady: false, hostReady: false })).toEqual({
      ok: false,
      blocker: "github-app-not-ready",
      remediation: "Repair and reverify the GitHub App installation.",
    });
  });

  it("blocks a second mutating attempt across Missions for one repository", () => {
    expect(evaluateFactoryDispatchPreflight({ ...ready, activeRepositoryMutation: true })).toMatchObject({
      ok: false,
      blocker: "repository-mutation-already-active",
    });
  });

  it("preserves legacy non-Mission dispatch while migration is in progress", () => {
    expect(evaluateFactoryDispatchPreflight({ ...ready, missionLinked: false, versionProvided: false })).toEqual({ ok: true });
  });
});
