import { describe, expect, it } from "vitest";
import {
  buildExecutionRecoverySummary,
  staleExecutionRecovery,
} from "../lib/executionRecovery";

describe("durable execution recovery", () => {
  it("records a reasoned retry from the exact expired claim and checkpoint", () => {
    expect(staleExecutionRecovery({
      run: {
        status: "RUNNING",
        executionClaimId: "claim-old",
        executionLeaseExpiresAt: 99,
        executionStaleRecoveryCount: 1,
        executionPhase: "VALIDATING",
        checkpointSummary: "Scope passed; running CI.",
      },
      newClaimId: "claim-new",
      now: 100,
    })).toEqual({
      recovered: true,
      previousClaimId: "claim-old",
      staleRecoveryCount: 2,
      retryReason: "Execution lease claim-old expired during VALIDATING; resumed from checkpoint: Scope passed; running CI.",
    });
  });

  it("does not label a fresh pending claim as stale recovery", () => {
    expect(staleExecutionRecovery({
      run: { status: "PENDING" },
      newClaimId: "claim-new",
      now: 100,
    }).recovered).toBe(false);
  });

  it("distinguishes recoverable, recovered, exhausted, and terminal states", () => {
    expect(buildExecutionRecoverySummary({
      run: { status: "RUNNING", executionClaimId: "old", executionLeaseExpiresAt: 99, executionAttemptNumber: 1 },
      now: 100,
      maxAttempts: 3,
    }).state).toBe("RECOVERABLE");
    expect(buildExecutionRecoverySummary({
      run: { status: "RUNNING", executionClaimId: "new", executionLeaseExpiresAt: 200, executionStaleRecoveryCount: 1 },
      now: 100,
      maxAttempts: 3,
    }).state).toBe("RECOVERED");
    expect(buildExecutionRecoverySummary({
      run: { status: "RUNNING", executionClaimId: "old", executionLeaseExpiresAt: 99, executionAttemptNumber: 3 },
      now: 100,
      maxAttempts: 3,
    }).state).toBe("EXHAUSTED");
    expect(buildExecutionRecoverySummary({
      run: { status: "COMPLETED", executionAttemptNumber: 2 },
      now: 100,
      maxAttempts: 3,
    }).state).toBe("TERMINAL");
  });
});
