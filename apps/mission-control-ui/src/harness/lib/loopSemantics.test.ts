import { describe, expect, it } from "vitest";
import { LEGACY_LOOP_PILLAR_ALIASES, LOOP_SEMANTICS } from "./loopSemantics";

describe("Loop Engineering pillar contract", () => {
  it("keeps the talk's canonical inner, outer, and meta semantics", () => {
    expect(LOOP_SEMANTICS.inner.pillar).toBe("autonomy");
    expect(LOOP_SEMANTICS.outer.pillar).toBe("automation");
    expect(LOOP_SEMANTICS.meta.pillar).toBe("quality");
  });

  it("maps the temporary reversed names onto the canonical pillars", () => {
    expect(LEGACY_LOOP_PILLAR_ALIASES).toEqual({
      innerAutomation: "autonomy",
      outerAutonomy: "automation",
    });
  });
});
