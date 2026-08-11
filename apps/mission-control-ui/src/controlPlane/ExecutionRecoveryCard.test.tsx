import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExecutionRecoveryCard } from "./ExecutionRecoveryCard";

describe("ExecutionRecoveryCard", () => {
  it("explains a recoverable stale lease without hiding the checkpoint", () => {
    render(<ExecutionRecoveryCard recovery={{
      state: "RECOVERABLE",
      nextAction: "The next authorized worker can reclaim this exact checkpoint without changing scope.",
      activeLease: false,
      leaseExpired: true,
      attempts: 1,
      maxAttempts: 3,
      attemptsRemaining: 2,
      staleRecoveryCount: 1,
      retryOfClaimId: "claim-old",
      retryReason: "Lease expired during validation.",
      leaseExpiresAt: 100,
      checkpointAt: 90,
      checkpointSummary: "Scope passed; running CI.",
    }} />);
    expect(screen.getByText("RECOVERABLE")).toBeInTheDocument();
    expect(screen.getByText("Scope passed; running CI.")).toBeInTheDocument();
    expect(screen.getByText("Lease expired during validation.")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
