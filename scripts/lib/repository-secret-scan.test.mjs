import { describe, expect, it } from "vitest";
import { isSensitiveTrackedPath, scanTextForSecrets } from "./repository-secret-scan.mjs";

describe("repository secret scanner", () => {
  it("detects high-confidence credentials without returning their values", () => {
    const findings = scanTextForSecrets([
      "safe line",
      `ghp_${"A7".repeat(18)}`,
      `sk-proj-${"z9".repeat(16)}`,
      `eyJ${"a".repeat(12)}.${"b".repeat(12)}.${"c".repeat(12)}`,
    ].join("\n"));
    expect(findings).toEqual([
      { rule: "github-token", line: 2 },
      { rule: "provider-api-key", line: 3 },
      { rule: "jwt", line: 4 },
    ]);
    expect(JSON.stringify(findings)).not.toContain("ghp_");
  });

  it("ignores explicit placeholder fixtures", () => {
    expect(scanTextForSecrets("AKIAIOSFODNN7EXAMPLE\nsk-1234567890abcdefghijklmnopqrstuvwxyz")).toEqual([]);
    expect(scanTextForSecrets(`GITHUB_APP_PRIVATE_KEY="fixture-value-that-looks-real" // secret-scan: allow-fixture`)).toEqual([]);
  });

  it("rejects tracked credential files but allows the environment template", () => {
    expect(isSensitiveTrackedPath(".env.local")).toBe(true);
    expect(isSensitiveTrackedPath("config/service.pem")).toBe(true);
    expect(isSensitiveTrackedPath(".env.example")).toBe(false);
  });
});
