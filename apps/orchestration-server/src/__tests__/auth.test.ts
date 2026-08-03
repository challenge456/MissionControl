import { describe, expect, it } from "vitest";
import { orchestrationAuthFailure } from "../auth.js";

describe("orchestration authentication", () => {
  it("fails closed in production when no inbound token is configured", () => {
    expect(orchestrationAuthFailure(null, true)).toEqual({
      status: 503,
      error: "Orchestration authentication is not configured",
    });
  });

  it("permits explicit tokenless local development only", () => {
    expect(orchestrationAuthFailure(null, false)).toBeNull();
  });

  it("accepts only an exact bearer credential", () => {
    expect(orchestrationAuthFailure("expected", true, "Bearer expected")).toBeNull();
    expect(orchestrationAuthFailure("expected", true, "Bearer wrong")).toMatchObject({ status: 401 });
  });
});
