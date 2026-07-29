import { describe, expect, it } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { selectAccessibleWorkspace } from "./workspaceSelection";

const id = (value: string) => value as Id<"projects">;
const workspaces = [
  { _id: id("workspace-mission-control"), name: "Mission Control" },
  { _id: id("workspace-research"), name: "Software Factory Research Lab" },
];

describe("selectAccessibleWorkspace", () => {
  it("selects an exact accessible request", () => {
    expect(selectAccessibleWorkspace({
      requestedWorkspace: "workspace-research",
      persistedWorkspace: "workspace-mission-control",
      workspaces,
    })).toEqual({ projectId: "workspace-research", requestedUnavailable: false });
  });

  it("uses a valid stored workspace for an invalid, deleted, or inaccessible request", () => {
    expect(selectAccessibleWorkspace({
      requestedWorkspace: "unavailable",
      persistedWorkspace: "workspace-research",
      workspaces,
    })).toEqual({ projectId: "workspace-research", requestedUnavailable: true });
  });

  it("prefers Mission Control before the first accessible workspace", () => {
    expect(selectAccessibleWorkspace({
      requestedWorkspace: "unavailable",
      persistedWorkspace: "also-unavailable",
      workspaces: [...workspaces].reverse(),
    })).toEqual({ projectId: "workspace-mission-control", requestedUnavailable: true });
  });

  it("uses stored selection when the URL has no workspace", () => {
    expect(selectAccessibleWorkspace({
      requestedWorkspace: null,
      persistedWorkspace: "workspace-research",
      workspaces,
    })).toEqual({ projectId: "workspace-research", requestedUnavailable: false });
  });

  it("fails closed without an accessible workspace", () => {
    expect(selectAccessibleWorkspace({
      requestedWorkspace: "unavailable",
      persistedWorkspace: null,
      workspaces: [],
    })).toEqual({ projectId: null, requestedUnavailable: true });
  });
});
