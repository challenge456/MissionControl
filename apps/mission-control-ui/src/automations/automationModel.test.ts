import { describe, expect, it } from "vitest";
import {
  candidateEligibilityLabel,
  humanizeCron,
  normalizeAutomationTab,
  runStatusLabel,
} from "./automationModel";

describe("automation route model", () => {
  it("persists declared tabs and normalizes invalid values", () => {
    expect(normalizeAutomationTab("schedule")).toBe("schedule");
    expect(normalizeAutomationTab("candidates")).toBe("candidates");
    expect(normalizeAutomationTab("decisions")).toBe("decisions");
    expect(normalizeAutomationTab("unknown")).toBe("overview");
    expect(normalizeAutomationTab(null)).toBe("overview");
  });

  it("uses explicit candidate and run language", () => {
    expect(candidateEligibilityLabel({ status: "DETECTED", eligible: false })).toBe("INELIGIBLE");
    expect(candidateEligibilityLabel({ status: "ACCEPTED", eligible: true })).toBe("ACCEPTED");
    expect(runStatusLabel({
      workOrder: {
        state: "AWAITING_APPROVAL",
        approvalStatus: "PENDING",
        verificationStatus: "PENDING",
      },
    })).toBe("Awaiting approval");
    expect(humanizeCron("0 8 * * 1")).toBe("Every Monday at 8:00 AM");
  });
});
