import { describe, expect, it } from "vitest";
import {
  classifyObservationKind,
  phaseCounts,
  phaseInspectorSections,
  projectFactoryPhases,
} from "./phaseProjection";

describe("Factory phase projection", () => {
  const base = {
    _id: "phase",
    name: "Phase",
    type: "EVENT",
    status: "SUCCESS" as const,
    startedAt: 100,
  };

  it("separates human attention, model judgment, and deterministic compute", () => {
    expect(classifyObservationKind({ ...base, name: "Human approval" })).toBe(
      "human",
    );
    expect(
      classifyObservationKind({
        ...base,
        type: "GENERATION",
        model: "model-a",
      }),
    ).toBe("agent");
    expect(
      classifyObservationKind({ ...base, type: "TOOL", toolName: "pnpm test" }),
    ).toBe("code");
  });

  it("keeps retry, artifact, and gate facts without inventing defaults", () => {
    const phases = projectFactoryPhases([
      {
        ...base,
        _id: "test",
        name: "Run tests",
        type: "TOOL",
        toolName: "tests",
        metadata: { retryIndex: 2, gates: [{ name: "unit", passed: true }] },
        output: { artifacts: ["test.log"] },
      },
      {
        ...base,
        _id: "build",
        name: "Build",
        type: "AGENT",
        model: "model-a",
        startedAt: 50,
      },
    ]);
    expect(phases.map((phase) => phase._id)).toEqual(["build", "test"]);
    expect(phases[1]).toMatchObject({
      kind: "code",
      owner: "tests",
      retry: 2,
      artifacts: ["test.log"],
    });
    expect(phaseCounts(phases)).toEqual({ human: 0, agent: 1, code: 1 });
  });

  it("organizes only recorded execution facts for the phase inspector", () => {
    const [phase] = projectFactoryPhases([
      {
        ...base,
        type: "GENERATION",
        model: "model-a",
        provider: "provider-a",
        promptVersion: "prompt-v3",
        input: {
          request: "Build it",
          previous: { status: "success" },
          systemPrompt: "bounded",
        },
        output: { summary: "Done", notes_for_next_agent: "Run tests" },
        metadata: { tools: ["read", "write"], writeScope: ["src/**"] },
        tokenUsage: { total: 120 },
      },
    ]);
    expect(phaseInspectorSections(phase)).toMatchObject({
      input: { request: "Build it", previousHandoff: { status: "success" } },
      prompt: { systemPrompt: "bounded", version: "prompt-v3" },
      configuration: {
        model: "model-a",
        provider: "provider-a",
        tools: ["read", "write"],
        writeScope: ["src/**"],
      },
      execution: { tokens: { total: 120 }, retry: null },
      output: { summary: "Done", handoff: "Run tests" },
    });
  });
});
