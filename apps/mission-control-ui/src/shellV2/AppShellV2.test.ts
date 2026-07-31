import { describe, expect, it } from "vitest";
import { shouldDeferRouteWrite, viewFromPath } from "./AppShellV2";

const VIEWS = ["command-center", "agents", "model-routing", "automations", "automation-runs"];

describe("v2 route synchronization", () => {
  it("reads a declared v2 view from a deep link", () => {
    expect(viewFromPath("/v2/agents", VIEWS)).toBe("agents");
    expect(viewFromPath("/v2/automations/automation-1", VIEWS)).toBe("automations");
    expect(viewFromPath("/v2/automation-runs/run-1", VIEWS)).toBe("automation-runs");
    expect(viewFromPath("/v2/not-a-view", VIEWS)).toBeNull();
  });

  it("does not overwrite a direct deep link with persisted view state", () => {
    expect(shouldDeferRouteWrite("/v2/agents", VIEWS, "command-center")).toBe(true);
    expect(shouldDeferRouteWrite("/v2/agents", VIEWS, "agents")).toBe(false);
  });
});
