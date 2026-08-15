import { describe, expect, it } from "vitest";
import {
  factoryConfigurationDigest,
  validFactoryBudget,
  type FactoryConfigurationInput,
} from "../lib/factoryConfiguration";

const configuration: FactoryConfigurationInput = {
  purpose: "SOFTWARE",
  repositoryId: "repository-1",
  workflowId: "workflow-1",
  executor: { adapter: "codex", version: "v1" },
  codeScopeIds: ["scope-b", "scope-a"],
  agentBindings: [
    { workflowAgentId: "implementer", agentVersionId: "agent-version-1" },
    { workflowAgentId: "reviewer", agentVersionId: "agent-version-2" },
  ],
  policyEnvelopeId: "policy-1",
  budget: { maxCostUsd: 100, maxRuntimeMinutes: 120, maxAttempts: 2 },
  verifierIds: ["verifier-b", "verifier-a"],
  riskBoundary: "YELLOW",
  recovery: { pause: true, cancel: true, retry: true, resume: true },
};

describe("Factory configuration", () => {
  it("produces the same digest for semantically identical verifier order", () => {
    expect(factoryConfigurationDigest(configuration)).toBe(
      factoryConfigurationDigest({
        ...configuration,
        verifierIds: ["verifier-a", "verifier-b"],
      })
    );
  });

  it("changes the digest when material authority changes", () => {
    expect(factoryConfigurationDigest(configuration)).not.toBe(
      factoryConfigurationDigest({
        ...configuration,
        executor: { adapter: "codex", version: "v2" },
      })
    );
  });

  it("binds Factory purpose into the immutable configuration digest", () => {
    expect(factoryConfigurationDigest(configuration)).not.toBe(
      factoryConfigurationDigest({ ...configuration, purpose: "VERIFICATION" })
    );
  });

  it("canonicalizes code scopes and agent binding order", () => {
    expect(factoryConfigurationDigest(configuration)).toBe(
      factoryConfigurationDigest({
        ...configuration,
        codeScopeIds: ["scope-a", "scope-b"],
        agentBindings: [...configuration.agentBindings].reverse(),
      })
    );
  });

  it("changes the digest when path or agent authority changes", () => {
    expect(factoryConfigurationDigest(configuration)).not.toBe(
      factoryConfigurationDigest({
        ...configuration,
        codeScopeIds: ["scope-a"],
      })
    );
    expect(factoryConfigurationDigest(configuration)).not.toBe(
      factoryConfigurationDigest({
        ...configuration,
        agentBindings: [{ workflowAgentId: "implementer", agentVersionId: "agent-version-3" }],
      })
    );
  });

  it("enforces bounded V1 budget and retry limits", () => {
    expect(validFactoryBudget(configuration.budget)).toBe(true);
    expect(validFactoryBudget({ ...configuration.budget, maxCostUsd: 0 })).toBe(false);
    expect(validFactoryBudget({ ...configuration.budget, maxRuntimeMinutes: 481 })).toBe(false);
    expect(validFactoryBudget({ ...configuration.budget, maxAttempts: 4 })).toBe(false);
  });
});
