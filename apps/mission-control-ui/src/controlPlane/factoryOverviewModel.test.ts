import { describe, expect, it } from "vitest";
import { buildFactoryOverviewCards, summarizeAttentionLoad } from "./factoryOverviewModel";

describe("factory overview model", () => {
  it("marks exception metrics with warning or danger tones", () => {
    const cards = buildFactoryOverviewCards({
      activeWorkOrders: 5,
      blockedWorkOrders: 2,
      awaitingApproval: 1,
      staleEvidence: 3,
      runsNeedingAttention: 1,
      recentlyAccepted: 4,
      verificationFailures: 1,
      approvalsPending: 1,
    });

    expect(cards.find((card) => card.key === "blocked")?.tone).toBe("danger");
    expect(cards.find((card) => card.key === "stale")?.tone).toBe("warning");
    expect(cards.find((card) => card.key === "accepted")?.tone).toBe("success");
  });

  it("sums the operator attention load", () => {
    expect(summarizeAttentionLoad({
      activeWorkOrders: 5,
      blockedWorkOrders: 2,
      awaitingApproval: 1,
      staleEvidence: 3,
      runsNeedingAttention: 1,
      recentlyAccepted: 4,
      verificationFailures: 1,
      approvalsPending: 1,
    })).toBe(7);
  });
});
