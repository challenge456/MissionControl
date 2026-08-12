import { describe, expect, it } from "vitest";

import { resolveVercelReleaseIdentity } from "../api/release.ts";

describe("Vercel release provenance", () => {
  it("maps a provider-authored preview deployment to staging", () => {
    expect(resolveVercelReleaseIdentity({
      VERCEL_GIT_COMMIT_SHA: "A".repeat(40),
      VERCEL_DEPLOYMENT_ID: "dpl_release_1",
      VERCEL_ENV: "preview",
    })).toEqual({
      ok: true,
      identity: {
        commitSha: "a".repeat(40),
        deploymentId: "dpl_release_1",
        environment: "staging",
      },
    });
  });

  it("maps a provider-authored production deployment to production", () => {
    expect(resolveVercelReleaseIdentity({
      VERCEL_GIT_COMMIT_SHA: "b".repeat(40),
      VERCEL_DEPLOYMENT_ID: "dpl_release_2",
      VERCEL_ENV: "production",
    })).toMatchObject({
      ok: true,
      identity: { environment: "production" },
    });
  });

  it("fails closed when provider identity is missing or malformed", () => {
    expect(resolveVercelReleaseIdentity({
      VERCEL_GIT_COMMIT_SHA: "not-a-sha",
      VERCEL_ENV: "development",
    })).toEqual({
      ok: false,
      missing: ["VERCEL_GIT_COMMIT_SHA", "VERCEL_DEPLOYMENT_ID", "VERCEL_ENV"],
    });
  });
});

