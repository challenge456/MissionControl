import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FactoryPhaseInspector } from "./FactoryPhaseInspector";
import type { FactoryPhaseProjection } from "./phaseProjection";

const phase: FactoryPhaseProjection = {
  _id: "phase-1",
  type: "GENERATION",
  name: "Plan change",
  status: "SUCCESS",
  startedAt: 1,
  input: { request: "Build it", systemPrompt: "Stay bounded" },
  output: { summary: "Plan complete" },
  model: "model-a",
  promptVersion: "v3",
  tokenUsage: { total: 100 },
  kind: "agent",
  owner: "Planner",
  retry: null,
  artifacts: [],
  gates: [],
};

describe("FactoryPhaseInspector", () => {
  it("keeps prompt and agent configuration hidden in Basic", () => {
    render(<FactoryPhaseInspector phase={phase} level="basic" />);
    expect(
      screen.queryByRole("heading", { name: "Prompt" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Execution" }),
    ).toBeInTheDocument();
  });

  it("reveals composition facts in Intermediate and raw telemetry only in Advanced", () => {
    const { rerender } = render(
      <FactoryPhaseInspector phase={phase} level="intermediate" />,
    );
    expect(screen.getByRole("heading", { name: "Prompt" })).toBeInTheDocument();
    expect(screen.queryByText("Raw observation")).not.toBeInTheDocument();
    rerender(<FactoryPhaseInspector phase={phase} level="advanced" />);
    expect(screen.getByText("Raw observation")).toBeInTheDocument();
  });
});
