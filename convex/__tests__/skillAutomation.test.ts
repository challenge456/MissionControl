import { describe, expect, it } from "vitest";
import {
  ADAPTER_TYPES,
  evaluateSkillEligibility,
  finalReceiptDecision,
  generateArtifact,
  generatedArtifactPath,
  validateArtifactConfiguration,
} from "../lib/skillAutomation";

const completeProfile = {
  deterministic: true,
  category: "browser validation",
  inputSchema: { type: "object" },
  outputSchema: { status: "passed" },
  preconditions: ["Demo server is available"],
  successCriteria: ["Login succeeds"],
  failureConditions: ["Login is rejected"],
  runtimeRequirements: ["Playwright"],
  requiredPermissions: ["network:local"],
  secretReferences: ["DEMO_USER"],
  verificationMethod: "Independent screenshot and assertion",
};

describe("deterministic skill Automation policy", () => {
  it("marks a complete published deterministic skill eligible", () => {
    expect(evaluateSkillEligibility({
      skillId: "mission-control/login-validation",
      version: "1.2.0",
      status: "PUBLISHED",
      profile: completeProfile,
    })).toMatchObject({
      status: "ELIGIBLE",
      recommendedAdapter: "PLAYWRIGHT",
      safetyClassification: "LEVEL_1",
      verificationReady: true,
    });
  });

  it("blocks mutating and unrestricted reasoning skills", () => {
    const result = evaluateSkillEligibility({
      skillId: "unsafe",
      version: "1.0.0",
      status: "PUBLISHED",
      profile: { ...completeProfile, requiresMutation: true, unrestrictedReasoning: true },
    });
    expect(result.status).toBe("INELIGIBLE");
    expect(result.blockers).toHaveLength(2);
  });

  it.each(ADAPTER_TYPES)("generates a bounded artifact for %s", (adapterType) => {
    const path = generatedArtifactPath(adapterType, "Login Validation");
    const content = generateArtifact({
      adapterType, name: "Login validation", description: "Validates login",
      path, configuration: { command: "pnpm run typecheck" },
    });
    expect(path).not.toContain("..");
    expect(content.length).toBeGreaterThan(30);
  });

  it("rejects unsafe paths, inline secrets, mutation, and automatic dispatch", () => {
    const findings = validateArtifactConfiguration({
      adapterType: "SHELL", path: "../../etc/passwd", command: "rm -rf /",
      secretReferences: ["TOKEN=value"], isMutating: true, automaticDispatch: true,
      approvalRequired: false, receiptRequired: false,
    });
    expect(findings.length).toBeGreaterThanOrEqual(6);
  });

  it("does not call a completed run verified without an independent receipt", () => {
    expect(finalReceiptDecision({ runStatus: "COMPLETED" })).toBe("AWAITING_VERIFICATION");
    expect(finalReceiptDecision({ runStatus: "COMPLETED", receiptStatus: "PASSED" })).toBe("VERIFIED");
    expect(finalReceiptDecision({ runStatus: "COMPLETED", receiptStatus: "FAILED" })).toBe("REJECTED");
  });
});
