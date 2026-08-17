import { describe, expect, it } from "vitest";
import { evaluateDependencyAudit } from "./dependency-audit-gate.mjs";

const report = (severity = "moderate") => ({
  advisories: {
    42: { module_name: "router", severity, findings: [{ version: "1.2.3" }] },
  },
  metadata: { vulnerabilities: { [severity]: 1 } },
});

const acceptance = {
  advisoryId: "42",
  package: "router",
  severity: "moderate",
  acceptedVersions: ["1.2.3"],
  scopes: ["production"],
  owner: "release owner",
  rationale: "Precondition absent",
  controls: ["fixed target allowlist"],
  reviewBy: "2026-09-15",
  expiresOn: "2026-11-15",
  migrationPlan: "Upgrade plan",
};

describe("dependency audit release gate", () => {
  it("accepts an exact, current moderate-risk record", () => {
    expect(evaluateDependencyAudit({ report: report(), scope: "production", acceptances: [acceptance], today: "2026-08-17" })).toMatchObject({
      passed: true,
      acceptedModerateAdvisories: ["42"],
    });
  });

  it("fails for unaccepted moderate advisories", () => {
    expect(evaluateDependencyAudit({ report: report(), scope: "production", acceptances: [], today: "2026-08-17" }).passed).toBe(false);
  });

  it("fails closed for high advisories even if an acceptance exists", () => {
    expect(evaluateDependencyAudit({ report: report("high"), scope: "production", acceptances: [acceptance], today: "2026-08-17" }).passed).toBe(false);
  });

  it("fails when an acceptance is expired or does not match the affected version", () => {
    expect(evaluateDependencyAudit({ report: report(), scope: "production", acceptances: [{ ...acceptance, expiresOn: "2026-08-16" }], today: "2026-08-17" }).passed).toBe(false);
    expect(evaluateDependencyAudit({ report: report(), scope: "production", acceptances: [{ ...acceptance, acceptedVersions: ["1.2.2"] }], today: "2026-08-17" }).passed).toBe(false);
  });
});
