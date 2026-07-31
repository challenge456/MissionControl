import { describe, expect, it } from "vitest";
import {
  canonicalMissionLocation,
  isCanonicalMissionDetail,
  missionDetailPath,
  missionIdFromLocation,
} from "./missionRoutes";

describe("Mission routes", () => {
  it("creates and reads a canonical stable-ID route", () => {
    const pathname = missionDetailPath("mission-123");
    expect(pathname).toBe("/v2/missions/mission-123");
    expect(missionIdFromLocation(pathname, "?workspace=workspace-1")).toBe("mission-123");
    expect(isCanonicalMissionDetail(pathname)).toBe(true);
  });

  it.each([
    "/v2/mission-detail?workspace=workspace-1&mission=mission-123",
    "/v2/missions?workspace=workspace-1&mission=mission-123",
  ])("normalizes %s while retaining workspace", (legacyUrl) => {
    const url = new URL(legacyUrl, "http://localhost");
    expect(canonicalMissionLocation(url.pathname, url.search)).toEqual({
      pathname: "/v2/missions/mission-123",
      search: "?workspace=workspace-1",
    });
  });

  it("does not renormalize a canonical route", () => {
    expect(
      canonicalMissionLocation(
        "/v2/missions/mission-123",
        "?workspace=workspace-1"
      )
    ).toBeNull();
  });

  it("does not treat a portfolio route without a Mission ID as detail", () => {
    expect(missionIdFromLocation("/v2/missions", "?workspace=workspace-1")).toBeNull();
  });
});
