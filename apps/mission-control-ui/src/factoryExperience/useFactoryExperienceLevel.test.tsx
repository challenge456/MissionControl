import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FACTORY_EXPERIENCE_STORAGE_KEY,
  parseFactoryExperienceLevel,
  useFactoryExperienceLevel,
} from "./useFactoryExperienceLevel";

describe("Factory experience level", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults unknown and missing values to Basic", () => {
    expect(parseFactoryExperienceLevel(null)).toBe("basic");
    expect(parseFactoryExperienceLevel("expert")).toBe("basic");
  });

  it("persists presentation state locally without calling a mutation", () => {
    const fetchSpy = vi.spyOn(window, "fetch");
    const { result } = renderHook(() => useFactoryExperienceLevel());
    act(() => result.current[1]("advanced"));
    expect(result.current[0]).toBe("advanced");
    expect(window.localStorage.getItem(FACTORY_EXPERIENCE_STORAGE_KEY)).toBe(
      "advanced",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("synchronizes level changes across consumers in the same window", () => {
    const first = renderHook(() => useFactoryExperienceLevel());
    const second = renderHook(() => useFactoryExperienceLevel());
    act(() => first.result.current[1]("intermediate"));
    expect(second.result.current[0]).toBe("intermediate");
  });
});
