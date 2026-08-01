import { describe, expect, it } from "vitest";
import { resolveAuthMode } from "./authMode";

describe("resolveAuthMode", () => {
  it("preserves legacy behavior when no mode is configured", () => {
    expect(resolveAuthMode({})).toEqual({ mode: "legacy" });
  });

  it("requires a Clerk publishable key in Clerk mode", () => {
    expect(
      resolveAuthMode({ configuredMode: "clerk" })
    ).toMatchObject({ mode: "invalid" });
  });

  it("accepts explicitly configured Clerk mode", () => {
    expect(
      resolveAuthMode({
        configuredMode: "clerk",
        clerkPublishableKey: "pk_test_example",
      })
    ).toEqual({ mode: "clerk" });
  });

  it("accepts explicit demo mode without silently selecting Clerk", () => {
    expect(
      resolveAuthMode({ configuredMode: "demo" })
    ).toEqual({ mode: "demo" });
  });
});
