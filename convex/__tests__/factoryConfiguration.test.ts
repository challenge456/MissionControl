import { describe, expect, it } from "vitest";
import {
  factoryConfigurationDigest,
  validFactoryBudget,
  type FactoryConfigurationInput,
} from "../lib/factoryConfiguration";

const configuration: FactoryConfigurationInput = {
  repositoryId: "repository-1",
  workflowId: "workflow-1",
  executor: { adapter: "codex", version: "v1" },
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

  it("enforces bounded V1 budget and retry limits", () => {
    expect(validFactoryBudget(configuration.budget)).toBe(true);
    expect(validFactoryBudget({ ...configuration.budget, maxCostUsd: 0 })).toBe(false);
    expect(validFactoryBudget({ ...configuration.budget, maxRuntimeMinutes: 481 })).toBe(false);
    expect(validFactoryBudget({ ...configuration.budget, maxAttempts: 4 })).toBe(false);
  });
});
