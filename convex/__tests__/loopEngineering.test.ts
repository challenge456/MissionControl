import { describe, expect, it } from "vitest";
import {
  classifyFreshness,
  normalizeSourceUrl,
  validateLoopAdvance,
  type LoopGateState,
} from "../lib/loopEngineering";

const emptyState: LoopGateState = {
  sources: [],
  recommendations: [],
  validations: [],
  measurements: [],
};

describe("Loop Engineering gates", () => {
  it("classifies publication freshness at the PRD boundaries", () => {
    const now = Date.UTC(2026, 6, 27);
    expect(classifyFreshness(now - 30 * 86_400_000, now)).toBe("CURRENT");
    expect(classifyFreshness(now - 240 * 86_400_000, now)).toBe("RECENT");
    expect(classifyFreshness(now - 500 * 86_400_000, now)).toBe("RELEVANT");
    expect(classifyFreshness(now - 900 * 86_400_000, now)).toBe("FOUNDATIONAL");
    expect(classifyFreshness(undefined, now)).toBe("UNKNOWN");
  });

  it("normalizes equivalent source URLs for duplicate detection", () => {
    expect(normalizeSourceUrl("HTTPS://Example.com:443/report/?b=2&a=1#results"))
      .toBe("https://example.com/report?a=1&b=2");
    expect(normalizeSourceUrl("https://example.com/report?a=1&b=2"))
      .toBe("https://example.com/report?a=1&b=2");
  });

  it("requires collected sources before verification", () => {
    expect(validateLoopAdvance("RESEARCH", emptyState)).toEqual({
      ok: false,
      reason: "Record at least one source before verification.",
    });
  });

  it("requires a decision for every source and one accepted source", () => {
    expect(
      validateLoopAdvance("VERIFY", {
        ...emptyState,
        sources: [{ decision: "ACCEPTED" }, { decision: "PENDING" }],
      })
    ).toMatchObject({ ok: false });

    expect(
      validateLoopAdvance("VERIFY", {
        ...emptyState,
        sources: [{ decision: "REJECTED" }],
      })
    ).toMatchObject({ ok: false });

    expect(
      validateLoopAdvance("VERIFY", {
        ...emptyState,
        sources: [{ decision: "ACCEPTED" }, { decision: "REJECTED" }],
      })
    ).toEqual({ ok: true, nextPhase: "RECOMMEND" });
  });

  it("keeps approval separate from a generic phase advance", () => {
    expect(validateLoopAdvance("AWAITING_APPROVAL", emptyState)).toEqual({
      ok: false,
      reason: "An explicit approval decision is required.",
    });
  });

  it("requires passing validation and a measurement before feedback", () => {
    expect(
      validateLoopAdvance("VALIDATE", {
        ...emptyState,
        validations: [{ status: "FAIL" }],
      })
    ).toMatchObject({ ok: false });

    expect(
      validateLoopAdvance("VALIDATE", {
        ...emptyState,
        validations: [{ status: "PASS" }],
      })
    ).toEqual({ ok: true, nextPhase: "MEASURE" });

    expect(
      validateLoopAdvance("MEASURE", {
        ...emptyState,
        measurements: [{ passed: true }],
      })
    ).toEqual({ ok: true, nextPhase: "READY_FOR_NEXT_CYCLE" });
  });
});
