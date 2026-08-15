import { describe, expect, it } from "vitest";
import { buildObservationTree, displayEvalValue, flattenObservationTree, formatDuration, timelinePosition } from "./traceViewModel";

describe("trace view model", () => {
  it("preserves nested observation hierarchy", () => {
    const tree = buildObservationTree([
      { _id: "tool", parentObservationId: "agent", name: "test", type: "TOOL", status: "SUCCESS", startedAt: 30 },
      { _id: "agent", name: "worker", type: "AGENT", status: "SUCCESS", startedAt: 10 },
      { _id: "generation", parentObservationId: "agent", name: "model", type: "GENERATION", status: "SUCCESS", startedAt: 20 },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((child) => child._id)).toEqual(["generation", "tool"]);
    expect(flattenObservationTree(tree).map((node) => node.depth)).toEqual([0, 1, 1]);
  });

  it("keeps orphaned and cyclic observations inspectable", () => {
    const tree = buildObservationTree([
      { _id: "orphan", parentObservationId: "missing", name: "orphan", type: "EVENT", status: "SUCCESS", startedAt: 1 },
      { _id: "a", parentObservationId: "b", name: "a", type: "EVENT", status: "SUCCESS", startedAt: 2 },
      { _id: "b", parentObservationId: "a", name: "b", type: "EVENT", status: "SUCCESS", startedAt: 3 },
    ]);
    expect(flattenObservationTree(tree).map((node) => node._id).sort()).toEqual(["a", "b", "orphan"]);
  });

  it("positions and formats operational measurements", () => {
    expect(timelinePosition({ traceStartedAt: 1_000, traceEndedAt: 11_000, observationStartedAt: 3_000, observationEndedAt: 5_000 }))
      .toEqual({ leftPercent: 20, widthPercent: 20 });
    expect(formatDuration(92_000)).toBe("1.5m");
    expect(displayEvalValue(0.934)).toBe("0.93");
    expect(displayEvalValue(true)).toBe("PASS");
  });
});
