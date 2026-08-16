import { describe, expect, it, vi } from "vitest";
import {
  GENERIC_HARNESS_CONTRACT_VERSION,
  NO_HARNESS_AUTHORITY,
  type HarnessAuthorityProfile,
  type HarnessExecutorAdapter,
} from "@mission-control/workflow-engine";
import { HarnessAdapterRegistry } from "../harnessAdapterRegistry.js";

describe("HarnessAdapterRegistry", () => {
  it("resolves independently implemented adapters only by their exact frozen identity", () => {
    const deepseek = fixtureAdapter("deepseek-harness", "v1");
    const loom = fixtureAdapter("loom", "v1");
    const registry = new HarnessAdapterRegistry([deepseek, loom]);

    expect(registry.resolve({ adapter: "deepseek-harness", version: "v1" })).toBe(deepseek);
    expect(registry.resolve({ adapter: "loom", version: "v1" })).toBe(loom);
    expect(registry.resolve({ adapter: "loom", version: "v2" })).toBeUndefined();
    expect(registry.capabilities().map(({ adapter, version }) => `${adapter}/${version}`)).toEqual([
      "deepseek-harness/v1",
      "loom/v1",
    ]);
  });

  it("rejects duplicate identities instead of silently choosing an adapter", () => {
    expect(() => new HarnessAdapterRegistry([
      fixtureAdapter("loom", "v1"),
      fixtureAdapter("loom", "v1"),
    ])).toThrow(/duplicate/i);
  });

  it("rejects any harness that claims canonical authority", () => {
    const authority = {
      ...NO_HARNESS_AUTHORITY,
      verification: "AUTHORITATIVE",
    } as unknown as HarnessAuthorityProfile;
    expect(() => new HarnessAdapterRegistry([
      fixtureAdapter("unsafe", "v1", { authority }),
    ])).toThrow(/authority/i);
  });

  it("rejects an incomplete zero-authority declaration", () => {
    expect(() => new HarnessAdapterRegistry([
      fixtureAdapter("unsafe", "v1", { authority: {} as HarnessAuthorityProfile }),
    ])).toThrow(/authority/i);
  });

  it("snapshots registered identity and capabilities", () => {
    const adapter = fixtureAdapter("deepseek-harness", "v1");
    const capabilities = {
      ...adapter.capabilities(),
      authority: { ...NO_HARNESS_AUTHORITY },
    };
    adapter.capabilities = () => capabilities;
    const registry = new HarnessAdapterRegistry([adapter]);

    capabilities.adapter = "mutated";
    capabilities.executionBackends.push("remote-sandbox");
    (capabilities.authority as Record<string, string>).verification = "AUTHORITATIVE";

    expect(registry.resolve({ adapter: "deepseek-harness", version: "v1" })).toBe(adapter);
    expect(registry.resolve({ adapter: "mutated", version: "v1" })).toBeUndefined();
    expect(registry.supports({ adapter: "deepseek-harness", version: "v1" }, "remote-sandbox")).toBe(false);
    expect(registry.requireCapabilities({ adapter: "deepseek-harness", version: "v1" }).authority)
      .toEqual(NO_HARNESS_AUTHORITY);
  });

  it("requires every adapter to support the worker's advertised backends", () => {
    expect(() => new HarnessAdapterRegistry(
      [fixtureAdapter("local-only", "v1")],
      { requiredExecutionBackends: ["persistent-worker", "remote-sandbox"] },
    )).toThrow(/remote-sandbox/i);
  });
});

function fixtureAdapter(
  adapter: string,
  version: string,
  overrides: { authority?: HarnessAuthorityProfile } = {},
): HarnessExecutorAdapter {
  return {
    capabilities: () => ({
      contractVersion: GENERIC_HARNESS_CONTRACT_VERSION,
      adapter,
      version,
      displayName: `${adapter} fixture`,
      provider: "fixture",
      executionBackends: ["persistent-worker"],
      authority: overrides.authority ?? NO_HARNESS_AUTHORITY,
      supportsCancel: true,
      supportsResume: false,
      supportsRepositoryMutation: true,
      isolationModes: ["READ_ONLY", "WORKSPACE_WRITE"],
      emittedEvents: ["EXECUTION_STARTED", "EXECUTION_COMPLETED"],
    }),
    validateConfiguration: () => [],
    estimate: async () => ({ estimatedCostUsd: 0, estimatedRuntimeMinutes: 1, confidence: "LOW" }),
    prepare: vi.fn(async () => ({})),
    execute: vi.fn(async () => ({})),
    collectResult: vi.fn(async () => ({ executionId: "fixture", status: "COMPLETED" as const })),
    cancel: vi.fn(async () => true),
    cleanup: vi.fn(async () => undefined),
    health: async () => ({ status: "READY", checkedAt: Date.now(), adapter, version }),
  };
}
