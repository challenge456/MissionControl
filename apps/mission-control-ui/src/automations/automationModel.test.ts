import { describe, expect, it } from "vitest";
import { normalizeAutomationTab } from "./automationModel";

describe("automation route model", () => {
  it("persists declared tabs and normalizes invalid values", () => {
    expect(normalizeAutomationTab("schedule")).toBe("schedule");
    expect(normalizeAutomationTab("candidates")).toBe("candidates");
    expect(normalizeAutomationTab("unknown")).toBe("overview");
    expect(normalizeAutomationTab(null)).toBe("overview");
  });
});
