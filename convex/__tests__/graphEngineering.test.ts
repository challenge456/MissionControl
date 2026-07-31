import { describe, expect, it } from "vitest";
import { GRAPH_ENGINEERING_PERSONAS } from "../lib/graphEngineering";

describe("Graph Engineering personas", () => {
  it("provisions the exact project-scoped identities referenced by the workflow", () => {
    expect(GRAPH_ENGINEERING_PERSONAS.map((persona) => persona.name)).toEqual([
      "Research Scout",
      "Evidence Reviewer",
    ]);
    expect(GRAPH_ENGINEERING_PERSONAS.every((persona) =>
      persona.allowedTaskTypes.includes("CUSTOMER_RESEARCH")
    )).toBe(true);
  });
});
