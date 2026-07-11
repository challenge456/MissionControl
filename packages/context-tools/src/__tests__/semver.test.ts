import { describe, expect, it } from "vitest";
import {
  SemverError,
  compareVersions,
  isValidRange,
  parseRange,
  parseVersion,
  satisfies,
} from "../semver.js";

describe("parseVersion", () => {
  it("parses a plain version", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
    expect(parseVersion("0.0.0")).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseVersion("10.20.30")).toEqual({ major: 10, minor: 20, patch: 30 });
  });

  it.each([
    ["1.2"],
    ["1"],
    ["1.2.3.4"],
    ["v1.2.3"],
    ["1.02.3"],
    ["1.2.3-beta.1"],
    ["1.2.3+build"],
    [""],
    ["a.b.c"],
  ])("rejects %j", (input) => {
    expect(() => parseVersion(input)).toThrow(SemverError);
  });
});

describe("compareVersions", () => {
  it.each([
    ["1.2.3", "1.2.3", 0],
    ["1.2.3", "1.2.4", -1],
    ["1.2.4", "1.2.3", 1],
    ["1.3.0", "1.2.9", 1],
    ["2.0.0", "1.99.99", 1],
    ["0.9.0", "0.10.0", -1],
    ["10.0.0", "9.0.0", 1],
  ])("compareVersions(%s, %s) === %i", (a, b, expected) => {
    expect(compareVersions(a, b)).toBe(expected);
  });
});

describe("parseRange / isValidRange", () => {
  it("classifies the four supported forms", () => {
    expect(parseRange("1.2.3").kind).toBe("exact");
    expect(parseRange("^1.2.3").kind).toBe("caret");
    expect(parseRange("~1.2.3").kind).toBe("tilde");
    expect(parseRange(">=1.2.3").kind).toBe("gte");
  });

  it.each([["*"], ["1.x"], ["1.2.3 - 2.0.0"], ["<2.0.0"], ["<=2.0.0"], [">1.0.0"], ["=1.2.3"], ["^1.2.3 || ^2.0.0"], [""]])(
    "rejects unsupported syntax %j",
    (range) => {
      expect(() => parseRange(range)).toThrow(SemverError);
      expect(isValidRange(range)).toBe(false);
    },
  );

  it("isValidRange accepts supported forms", () => {
    expect(isValidRange("1.2.3")).toBe(true);
    expect(isValidRange("^0.4.2")).toBe(true);
    expect(isValidRange("~2.0.0")).toBe(true);
    expect(isValidRange(">=0.0.1")).toBe(true);
  });
});

describe("satisfies", () => {
  it.each([
    // exact
    ["1.2.3", "1.2.3", true],
    ["1.2.4", "1.2.3", false],
    // caret, major > 0
    ["1.2.3", "^1.2.3", true],
    ["1.9.9", "^1.2.3", true],
    ["1.2.2", "^1.2.3", false],
    ["2.0.0", "^1.2.3", false],
    // caret, major = 0
    ["0.4.5", "^0.4.2", true],
    ["0.5.0", "^0.4.2", false],
    ["0.4.1", "^0.4.2", false],
    // caret, 0.0.x pins the patch
    ["0.0.3", "^0.0.3", true],
    ["0.0.4", "^0.0.3", false],
    // tilde
    ["1.2.3", "~1.2.3", true],
    ["1.2.9", "~1.2.3", true],
    ["1.3.0", "~1.2.3", false],
    ["1.2.2", "~1.2.3", false],
    // gte
    ["1.2.3", ">=1.2.3", true],
    ["9.0.0", ">=1.2.3", true],
    ["1.2.2", ">=1.2.3", false],
  ])("satisfies(%s, %j) === %s", (version, range, expected) => {
    expect(satisfies(version, range)).toBe(expected);
  });

  it("throws SemverError on invalid inputs", () => {
    expect(() => satisfies("nope", "^1.0.0")).toThrow(SemverError);
    expect(() => satisfies("1.0.0", "nope!")).toThrow(SemverError);
  });
});
