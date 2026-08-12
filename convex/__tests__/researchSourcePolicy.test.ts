import { describe, expect, it } from "vitest";
import {
  isPublicResearchHostname,
  previewResearchSource,
  researchSourceActivationIssues,
  researchSourceTransitionIssue,
  researchSourceWorkspaceIssue,
} from "../lib/researchSourcePolicy";

describe("research source policy", () => {
  it("normalizes one public HTTPS feed into an activatable exact identity", () => {
    expect(previewResearchSource({
      kind: "RSS_ATOM",
      locator: "https://Example.com/feed.xml#latest",
    })).toMatchObject({
      valid: true,
      activatable: true,
      canonicalUrl: "https://example.com/feed.xml",
      canonicalProviderId: "rss_atom:https://example.com/feed.xml",
      host: "example.com",
      networkPolicy: { exactHostAllowlist: ["example.com"] },
    });
  });

  it("fails closed for credentials, non-HTTPS, localhost, private IPs, and unsupported ports", () => {
    const locators = [
      "http://example.com/feed",
      "https://user:secret@example.com/feed",
      "https://example.com/feed?access_token=do-not-store",
      "https://localhost/feed",
      "https://127.0.0.1/feed",
      "https://10.0.0.4/feed",
      "https://169.254.169.254/latest/meta-data",
      "https://192.0.2.10/feed",
      "https://198.51.100.10/feed",
      "https://203.0.113.10/feed",
      "https://[2001:db8::1]/feed",
      "https://example.com:8443/feed",
    ];
    for (const locator of locators) {
      expect(previewResearchSource({ kind: "RSS_ATOM", locator }).activatable).toBe(false);
    }
    expect(isPublicResearchHostname("::1")).toBe(false);
    expect(isPublicResearchHostname("2001:db8::1")).toBe(false);
    expect(isPublicResearchHostname("public.example.com")).toBe(true);
  });

  it("previews provider handles but requires stable provider identity before activation", () => {
    expect(previewResearchSource({ kind: "X_USER", locator: "@OpenAI" })).toMatchObject({
      valid: true,
      activatable: false,
      canonicalUrl: "https://x.com/OpenAI",
    });
    expect(previewResearchSource({ kind: "YOUTUBE_CHANNEL", locator: "https://www.youtube.com/@OpenAI" })).toMatchObject({
      valid: true,
      activatable: false,
    });
  });

  it("requires the complete policy envelope before activation", () => {
    expect(researchSourceActivationIssues({
      state: "VERIFIED",
      canonicalUrl: "https://example.com/feed.xml",
      canonicalProviderId: "rss_atom:https://example.com/feed.xml",
      validationStatus: "PASSED",
      schedule: { cadence: "DAILY", timezone: "America/Los_Angeles" },
      freshnessTargetMinutes: 1_440,
      maxItemsPerRun: 10,
      monthlyCostCeilingUsd: 5,
      retentionDays: 30,
      allowedContentClasses: ["FEED_ITEM"],
      exclusions: ["Authenticated pages"],
      policyReviewState: "APPROVED",
      policyVersion: "research-source-policy-v1",
    })).toEqual([]);
    expect(researchSourceActivationIssues({ state: "DRAFT" })).toEqual(expect.arrayContaining([
      "source-not-verified",
      "canonical-identity-missing",
      "schedule-missing",
      "policy-acknowledgement-missing",
    ]));
    expect(researchSourceActivationIssues({
      state: "PAUSED",
      canonicalUrl: "https://example.com/feed.xml",
      canonicalProviderId: "rss_atom:https://example.com/feed.xml",
      validationStatus: "PASSED",
      schedule: { cadence: "DAILY", timezone: "UTC" },
      freshnessTargetMinutes: 60,
      maxItemsPerRun: 10,
      monthlyCostCeilingUsd: 0,
      retentionDays: 30,
      allowedContentClasses: ["FEED_ITEM"],
      exclusions: ["Private content"],
      policyReviewState: "APPROVED",
      policyVersion: "research-source-policy-v1",
      lastError: "Credential rejected",
      consecutiveFailureCount: 1,
    })).toContain("source-exception-unresolved");
  });

  it("enforces lifecycle and workspace boundaries", () => {
    expect(researchSourceTransitionIssue("DRAFT", "VERIFIED")).toBeNull();
    expect(researchSourceTransitionIssue("ACTIVE", "RETIRED")).toMatch(/not permitted/);
    expect(researchSourceTransitionIssue("RETIRED", "ACTIVE")).toMatch(/not permitted/);
    expect(researchSourceWorkspaceIssue("project-a", "project-a")).toBeNull();
    expect(researchSourceWorkspaceIssue("project-a", "project-b")).toMatch(/unauthorized/);
  });
});
