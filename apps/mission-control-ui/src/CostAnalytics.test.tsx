import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CostAnalytics } from "./CostAnalytics";

const calls = vi.hoisted(() => [] as Array<{ query: string; args: unknown }>);

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    runs: { listRecent: "runs.listRecent" },
    agents: { listAll: "agents.listAll" },
    tasks: { listAll: "tasks.listAll" },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (query: string, args: unknown) => {
    calls.push({ query, args });
    return undefined;
  },
}));

describe("CostAnalytics", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("scopes every cost input query to the selected workspace", () => {
    render(<CostAnalytics projectId={"project-1" as never} onClose={vi.fn()} />);

    expect(calls).toEqual([
      { query: "runs.listRecent", args: { projectId: "project-1", limit: 1000 } },
      { query: "agents.listAll", args: { projectId: "project-1" } },
      { query: "tasks.listAll", args: { projectId: "project-1" } },
    ]);
  });

  it("does not fall back to global cost data without a workspace", () => {
    render(<CostAnalytics projectId={null} onClose={vi.fn()} />);

    expect(calls).toEqual([
      { query: "runs.listRecent", args: "skip" },
      { query: "agents.listAll", args: "skip" },
      { query: "tasks.listAll", args: "skip" },
    ]);
  });
});
