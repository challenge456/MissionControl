import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePersonaPath, safeClientError } from "../orchestrationSecurity.js";

describe("orchestration security boundaries", () => {
  it("resolves an approved persona inside the configured directory", () => {
    expect(resolvePersonaPath("/srv/mission-control/agents", "release_qa-2")).toBe(
      path.resolve("/srv/mission-control/agents/release_qa-2.yaml")
    );
  });

  it.each(["../secrets", "nested/persona", "persona.yaml", "", 42])(
    "rejects a persona path escape: %s",
    (persona) => {
      expect(() => resolvePersonaPath("/srv/mission-control/agents", persona)).toThrow(
        "Persona name must contain only letters, numbers, underscores, and hyphens"
      );
    }
  );

  it("redacts host paths and secret values from public errors", () => {
    const error = new Error(
      "Failed at /Users/operator/MissionControl/agents/private.yaml; token=super-secret-value"
    );
    const message = safeClientError(error);

    expect(message).toContain("[REDACTED PATH]");
    expect(message).toContain("token=[REDACTED]");
    expect(message).not.toContain("operator");
    expect(message).not.toContain("super-secret-value");
  });

  it("preserves bounded, non-sensitive validation errors", () => {
    expect(safeClientError(new Error("Project id is required"))).toBe("Project id is required");
    expect(safeClientError(new Error("x".repeat(800)))).toHaveLength(500);
  });

  it("redacts bearer headers, standalone provider tokens, and PEM material", () => {
    const githubToken = `ghp_${"A".repeat(36)}`;
    const pem = ["-----BEGIN PRIVATE KEY-----", "credential-material", "-----END PRIVATE KEY-----"].join("\n");
    const message = safeClientError(
      new Error(`Authorization: Bearer ${githubToken}; upstream returned ${githubToken}; ${pem}`)
    );

    expect(message).not.toContain(githubToken);
    expect(message).not.toContain("credential-material");
    expect(message).toContain("Authorization=[REDACTED]");
    expect(message).toContain("[REDACTED CREDENTIAL]");
  });
});
