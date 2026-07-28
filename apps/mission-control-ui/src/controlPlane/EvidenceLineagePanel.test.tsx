import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EvidenceLineagePanel, type EvidenceLineageStage } from "./EvidenceLineagePanel";

const stages: EvidenceLineageStage[] = [
  {
    id: "evidence",
    label: "Research evidence",
    status: "COMPLETE",
    count: 2,
    summary: "Two sources preserved.",
    details: ["Primary source", "Supporting source"],
    target: "artifacts",
  },
  {
    id: "claims",
    label: "Verified claims",
    status: "MISSING",
    count: 0,
    summary: "No accepted claims are recorded.",
    details: [],
    target: "timeline",
  },
];

describe("EvidenceLineagePanel", () => {
  it("shows every stage and makes missing lineage explicit", () => {
    render(<EvidenceLineagePanel stages={stages} />);
    expect(screen.getByRole("button", { name: /research evidence/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verified claims/i })).toHaveTextContent("MISSING");
    expect(screen.getByText("Two sources preserved.")).toBeInTheDocument();
  });

  it("opens stage detail and navigates to its durable records", () => {
    const onNavigate = vi.fn();
    render(<EvidenceLineagePanel stages={stages} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /verified claims/i }));
    expect(screen.getByText("No accepted claims are recorded.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /inspect records/i }));
    expect(onNavigate).toHaveBeenCalledWith("timeline");
  });
});
