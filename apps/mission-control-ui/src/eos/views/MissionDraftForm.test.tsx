import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissionDraftForm } from "./MissionDraftForm";

const mocks = vi.hoisted(() => ({
  updateDraft: vi.fn(),
}));

vi.mock("convex/react", () => ({
  useMutation: () => mocks.updateDraft,
}));

const mission = {
  _id: "mission-1",
  state: "DRAFT",
  title: "Original title",
  objective: "Reliable Mission editing",
  context: "",
  constraints: [],
  sourceOfTruthRefs: [],
  owner: undefined,
  budgetUsd: undefined,
  stopCondition: "Focused tests pass",
  maxReadOnlyConcurrency: 2,
  maxCorrectiveIterations: 1,
};

describe("MissionDraftForm", () => {
  beforeEach(() => {
    mocks.updateDraft.mockReset();
  });

  it("blocks duplicate saves while the first update is in flight", () => {
    mocks.updateDraft.mockReturnValue(new Promise(() => undefined));
    render(<MissionDraftForm mission={mission} projectId={"workspace-1" as any} />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Changed title" },
    });
    const save = screen.getByRole("button", { name: "Save draft" });
    fireEvent.click(save);
    fireEvent.click(save);

    expect(mocks.updateDraft).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });

  it("associates invalid budget feedback with the field", () => {
    render(<MissionDraftForm mission={mission} projectId={"workspace-1" as any} />);

    const budget = screen.getByLabelText("Budget (USD)");
    fireEvent.change(budget, { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    expect(budget).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Budget must be zero or greater."
    );
    expect(mocks.updateDraft).not.toHaveBeenCalled();
  });
});
