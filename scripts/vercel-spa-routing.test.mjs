import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
);

const rewrites = config.rewrites ?? [];

function matchesMissionControlSpaRewrite(pathname) {
  return rewrites.some(({ source }) => {
    if (source === "/v2") return pathname === "/v2";
    if (source === "/v2/:path*") return pathname.startsWith("/v2/");
    return false;
  });
}

describe("Vercel SPA routing contract", () => {
  it("serves the application shell only for canonical Mission Control routes", () => {
    expect(rewrites).toEqual([
      { source: "/v2", destination: "/index.html" },
      { source: "/v2/:path*", destination: "/index.html" },
    ]);

    expect(matchesMissionControlSpaRewrite("/v2")).toBe(true);
    expect(matchesMissionControlSpaRewrite("/v2/deployments")).toBe(true);
    expect(matchesMissionControlSpaRewrite("/v2/missions/mission-123")).toBe(true);
  });

  it("does not capture API, health, provenance, static, or auth-owned paths", () => {
    const protectedPaths = [
      "/",
      "/api/health",
      "/api/release",
      "/api/not-found",
      "/assets/application.js",
      "/favicon.svg",
      "/.well-known/openid-configuration",
      "/sso-callback",
    ];

    for (const pathname of protectedPaths) {
      expect(matchesMissionControlSpaRewrite(pathname), pathname).toBe(false);
    }
  });

  it("preserves the existing Vite build and avoids legacy route overrides", () => {
    expect(config.outputDirectory).toBe("apps/mission-control-ui/dist");
    expect(config.framework).toBeNull();
    expect(config.routes).toBeUndefined();
  });
});
