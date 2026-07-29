import { describe, expect, it } from "vitest";
import { shouldDeferRouteWrite, viewFromPath } from "./AppShellV2";

const VIEWS = ["command-center", "agents", "model-routing", "missions", "mission-detail"];

describe("v2 route synchronization", () => {
  it("reads a declared v2 view from a deep link", () => {
    expect(viewFromPath("/v2/agents", VIEWS)).toBe("agents");
    expect(viewFromPath("/v2/not-a-view", VIEWS)).toBeNull();
  });

  it("does not overwrite a direct deep link with persisted view state", () => {
    expect(shouldDeferRouteWrite("/v2/agents", VIEWS, "command-center")).toBe(true);
    expect(shouldDeferRouteWrite("/v2/agents", VIEWS, "agents")).toBe(false);
  });

  it("maps canonical and legacy Mission details to the existing detail view", () => {
    expect(
      viewFromPath(
        "/v2/missions/mission-123",
        VIEWS,
        "?workspace=workspace-1"
      )
    ).toBe("mission-detail");
    expect(
      viewFromPath(
        "/v2/missions",
        VIEWS,
        "?workspace=workspace-1&mission=mission-123"
      )
    ).toBe("mission-detail");
    expect(
      shouldDeferRouteWrite(
        "/v2/missions/mission-123",
        VIEWS,
        "missions",
        "?workspace=workspace-1"
      )
    ).toBe(true);
  });
});
