import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RunRecoveryPanel } from "./RunRecoveryPanel";

describe("RunRecoveryPanel", () => {
  it("requires a meaningful reason and preserves the original failure message", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    render(
      <RunRecoveryPanel
        runId="failed-123"
        failureSummary="Environment bootstrap failed"
        onRetry={onRetry}
      />
    );

    expect(
      screen.getByText((_, element) =>
        element?.textContent === "Original failure: Environment bootstrap failed"
      )
    ).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "Retry as new run" });
    expect(retryButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("What changed before retrying?"), {
      target: { value: "Bootstrap configuration was corrected." },
    });
    expect(retryButton).toBeEnabled();
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledWith("Bootstrap configuration was corrected.");
    });
    expect(await screen.findByText(/Recovery run created/)).toBeInTheDocument();
  });

  it("communicates a failed recovery request without losing the entered reason", async () => {
    const onRetry = vi.fn().mockRejectedValue(new Error("An active run already exists."));
    render(
      <RunRecoveryPanel
        runId="failed-456"
        failureSummary="Verification timed out"
        onRetry={onRetry}
      />
    );

    const reason = screen.getByLabelText("What changed before retrying?");
    fireEvent.change(reason, {
      target: { value: "The verification service is available again." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Retry as new run" }));

    expect(await screen.findByText("An active run already exists.")).toBeInTheDocument();
    expect(reason).toHaveValue("The verification service is available again.");
  });

  it("explains why recovery is unavailable outside the linked WorkOrder", () => {
    render(
      <RunRecoveryPanel
        runId="failed-789"
        failureSummary="Agent unavailable"
      />
    );

    expect(screen.getByText("Recovery requires the linked WorkOrder")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry as new run" })).not.toBeInTheDocument();
  });
});
