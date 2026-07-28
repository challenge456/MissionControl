import { describe, expect, it } from "vitest";
import {
  compileWorkflowGraph,
  evaluateWorkflowCondition,
  getRunnableNodeIndexes,
  graphMetrics,
  validateGraphDefinition,
  validateStructuredOutput,
} from "../graph";

describe("workflow graph", () => {
  it("compiles legacy workflows as a linear graph", () => {
    const graph = compileWorkflowGraph([{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(graph.layers).toEqual([["a"], ["b"], ["c"]]);
    expect(graph.nodes[2].dependsOn).toEqual(["b"]);
  });

  it("runs independent DAG nodes concurrently and respects the barrier", () => {
    const graph = compileWorkflowGraph(
      [
        { id: "scope" },
        { id: "research-a", dependsOn: ["scope"] },
        { id: "research-b", dependsOn: ["scope"] },
        { id: "synthesize", dependsOn: ["research-a", "research-b"] },
      ],
      { topology: "DAG", maxConcurrency: 2 }
    );
    expect(graph.layers).toEqual([
      ["scope"],
      ["research-a", "research-b"],
      ["synthesize"],
    ]);
    expect(
      getRunnableNodeIndexes(graph, [
        { stepId: "scope", status: "DONE" },
        { stepId: "research-a", status: "PENDING" },
        { stepId: "research-b", status: "PENDING" },
        { stepId: "synthesize", status: "PENDING" },
      ])
    ).toEqual([1, 2]);
    expect(graphMetrics(graph)).toEqual({
      nodeCount: 4,
      edgeCount: 4,
      depth: 3,
      maximumWidth: 2,
      parallelizableNodes: 2,
    });
  });

  it("rejects missing dependencies and cycles", () => {
    expect(
      validateGraphDefinition([{ id: "a", dependsOn: ["missing"] }], "DAG")
    ).toContainEqual({
      field: "steps[0].dependsOn",
      message: 'Unknown dependency "missing"',
    });
    expect(
      validateGraphDefinition(
        [
          { id: "a", dependsOn: ["b"] },
          { id: "b", dependsOn: ["a"] },
        ],
        "DAG"
      )
    ).toContainEqual({ field: "steps", message: "Workflow graph contains a cycle" });
  });

  it("contains failed dependencies unless continue is explicit", () => {
    const blocked = compileWorkflowGraph(
      [
        { id: "research", failurePolicy: "BLOCK" },
        { id: "synthesize", dependsOn: ["research"] },
      ],
      { topology: "DAG", maxConcurrency: 2 }
    );
    expect(
      getRunnableNodeIndexes(blocked, [
        { stepId: "research", status: "FAILED" },
        { stepId: "synthesize", status: "PENDING" },
      ])
    ).toEqual([]);

    const continuing = compileWorkflowGraph(
      [
        { id: "research", failurePolicy: "CONTINUE" },
        { id: "synthesize", dependsOn: ["research"] },
      ],
      { topology: "DAG", maxConcurrency: 2 }
    );
    expect(
      getRunnableNodeIndexes(continuing, [
        { stepId: "research", status: "FAILED" },
        { stepId: "synthesize", status: "PENDING" },
      ])
    ).toEqual([1]);
  });

  it("evaluates deterministic routes and validates output contracts", () => {
    expect(
      evaluateWorkflowCondition(
        { path: "decision.status", operator: "EQ", value: "approved" },
        { decision: { status: "approved" } }
      )
    ).toBe(true);
    expect(
      validateStructuredOutput('{"sources":[]}', {
        type: "object",
        required: ["sources"],
        properties: { sources: { type: "array" } },
      })
    ).toEqual({ ok: true, value: { sources: [] } });
    expect(
      validateStructuredOutput('{"wrong":true}', {
        type: "object",
        required: ["sources"],
      })
    ).toEqual({ ok: false, errors: ["$.sources is required"] });
  });
});
