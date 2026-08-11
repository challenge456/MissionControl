import { describe, expect, it } from "vitest";
import { createPrivateKey } from "node:crypto";
import {
  evaluateGithubAppCapabilities,
  githubInstallationIsStale,
} from "../lib/githubAppReadiness";
import { createGithubAppJwt, sha256Hex } from "../lib/githubAppAuth";

const minimumPermissions = [
  { name: "metadata", access: "read" as const },
  { name: "contents", access: "write" as const },
  { name: "pull_requests", access: "write" as const },
  { name: "checks", access: "read" as const },
];

const requiredEvents = [
  "check_run",
  "pull_request",
  "pull_request_review",
];

describe("GitHub App readiness", () => {
  it("accepts only the complete least-privilege V1 envelope", () => {
    expect(evaluateGithubAppCapabilities({
      permissions: minimumPermissions,
      subscribedEvents: requiredEvents,
    })).toMatchObject({
      ready: true,
      missingPermissions: [],
      excessivePermissions: [],
      missingEvents: [],
    });
  });

  it("reports missing and excessive authority separately", () => {
    const result = evaluateGithubAppCapabilities({
      permissions: [
        { name: "metadata", access: "read" },
        { name: "contents", access: "admin" },
        { name: "pull_requests", access: "read" },
        { name: "checks", access: "read" },
        { name: "issues", access: "write" },
      ],
      subscribedEvents: ["pull_request"],
    });

    expect(result.ready).toBe(false);
    expect(result.missingPermissions).toEqual(["pull_requests:write"]);
    expect(result.excessivePermissions).toEqual(["contents:admin", "issues:write"]);
    expect(result.missingEvents).toContain("check_run");
  });

  it("does not require GitHub lifecycle events in selectable subscriptions", () => {
    const result = evaluateGithubAppCapabilities({
      permissions: minimumPermissions,
      subscribedEvents: requiredEvents,
    });

    expect(result.ready).toBe(true);
    expect(result.missingEvents).not.toContain("installation");
    expect(result.missingEvents).not.toContain("installation_repositories");
  });

  it("treats missing and older verification evidence as stale", () => {
    const now = Date.UTC(2026, 7, 2, 12);
    expect(githubInstallationIsStale(undefined, now)).toBe(true);
    expect(githubInstallationIsStale(now - 23 * 60 * 60 * 1_000, now)).toBe(false);
    expect(githubInstallationIsStale(now - 25 * 60 * 60 * 1_000, now)).toBe(true);
  });

  it("hashes setup state and signs a short-lived GitHub App JWT", async () => {
    expect(await sha256Hex("opaque-state")).toHaveLength(64);
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const base64 = Buffer.from(pkcs8).toString("base64").match(/.{1,64}/g)?.join("\n");
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
    const now = Date.UTC(2026, 7, 2, 12);
    const token = await createGithubAppJwt({ appId: "123", privateKey, now });
    const [header, payload, signature] = token.split(".");
    const decode = (value: string) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    expect(decode(header)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decode(payload)).toMatchObject({
      iss: "123",
      iat: now / 1_000 - 60,
      exp: now / 1_000 + 9 * 60,
    });
    expect(signature.length).toBeGreaterThan(100);

    const pkcs1PrivateKey = createPrivateKey({
      key: Buffer.from(pkcs8),
      format: "der",
      type: "pkcs8",
    }).export({ format: "pem", type: "pkcs1" }).toString();
    const pkcs1Token = await createGithubAppJwt({
      appId: "123",
      privateKey: pkcs1PrivateKey,
      now,
    });
    expect(pkcs1Token.split(".")).toHaveLength(3);
  });
});
