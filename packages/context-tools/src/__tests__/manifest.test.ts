import { describe, expect, it } from "vitest";
import { ManifestError, isValidPackageSlug, parseManifest, serializeManifest } from "../manifest.js";

const VALID = JSON.stringify({
  schemaVersion: "1.0",
  repository: "owner/repo",
  contextPackages: { "software-factory/pr-delivery": "^1.3.0" },
});

describe("isValidPackageSlug", () => {
  it.each([
    ["software-factory/pr-delivery", true],
    ["a/b", true],
    ["a1/b2-c3", true],
    ["noslash", false],
    ["too/many/parts", false],
    ["Upper/case", false],
    ["under_score/name", false],
    ["-leading/dash", false],
    ["trailing-/dash", false],
    ["scope/", false],
    ["/name", false],
    ["scope/na me", false],
  ])("isValidPackageSlug(%j) === %s", (slug, expected) => {
    expect(isValidPackageSlug(slug)).toBe(expected);
  });
});

describe("parseManifest", () => {
  it("parses a valid manifest", () => {
    const m = parseManifest(VALID);
    expect(m.schemaVersion).toBe("1.0");
    expect(m.repository).toBe("owner/repo");
    expect(m.contextPackages["software-factory/pr-delivery"]).toBe("^1.3.0");
  });

  it("accepts an empty contextPackages record", () => {
    const m = parseManifest(
      JSON.stringify({ schemaVersion: "1.0", repository: "o/r", contextPackages: {} }),
    );
    expect(m.contextPackages).toEqual({});
  });

  it("rejects malformed JSON", () => {
    expect(() => parseManifest("{not json")).toThrow(ManifestError);
    expect(() => parseManifest("{not json")).toThrow(/not valid JSON/);
  });

  it("rejects non-object roots", () => {
    expect(() => parseManifest("[]")).toThrow(ManifestError);
    expect(() => parseManifest('"hi"')).toThrow(ManifestError);
    expect(() => parseManifest("null")).toThrow(ManifestError);
  });

  it("rejects unknown top-level keys, naming the key", () => {
    const json = JSON.stringify({
      schemaVersion: "1.0",
      repository: "o/r",
      contextPackages: {},
      extra: 1,
    });
    expect(() => parseManifest(json)).toThrow(/unknown top-level key "extra"/);
  });

  it("rejects wrong schemaVersion, naming the field", () => {
    const json = JSON.stringify({ schemaVersion: "2.0", repository: "o/r", contextPackages: {} });
    expect(() => parseManifest(json)).toThrow(/"schemaVersion" must be "1\.0"/);
  });

  it("rejects missing schemaVersion", () => {
    const json = JSON.stringify({ repository: "o/r", contextPackages: {} });
    expect(() => parseManifest(json)).toThrow(ManifestError);
  });

  it("rejects empty or non-string repository", () => {
    expect(() =>
      parseManifest(JSON.stringify({ schemaVersion: "1.0", repository: "", contextPackages: {} })),
    ).toThrow(/"repository" must be a non-empty string/);
    expect(() =>
      parseManifest(JSON.stringify({ schemaVersion: "1.0", repository: 42, contextPackages: {} })),
    ).toThrow(ManifestError);
  });

  it("rejects missing contextPackages", () => {
    const json = JSON.stringify({ schemaVersion: "1.0", repository: "o/r" });
    expect(() => parseManifest(json)).toThrow(/missing required key "contextPackages"/);
  });

  it("rejects non-object contextPackages", () => {
    const json = JSON.stringify({ schemaVersion: "1.0", repository: "o/r", contextPackages: [] });
    expect(() => parseManifest(json)).toThrow(/"contextPackages" must be an object/);
  });

  it("rejects invalid slugs with the slug in the message", () => {
    const json = JSON.stringify({
      schemaVersion: "1.0",
      repository: "o/r",
      contextPackages: { "Bad_Slug": "^1.0.0" },
    });
    expect(() => parseManifest(json)).toThrow(/contextPackages\.Bad_Slug/);
  });

  it("rejects non-string and invalid ranges with the path in the message", () => {
    const nonString = JSON.stringify({
      schemaVersion: "1.0",
      repository: "o/r",
      contextPackages: { "scope/name": 7 },
    });
    expect(() => parseManifest(nonString)).toThrow(/"contextPackages\.scope\/name" must be a version range string/);

    const badRange = JSON.stringify({
      schemaVersion: "1.0",
      repository: "o/r",
      contextPackages: { "scope/name": "1.x" },
    });
    expect(() => parseManifest(badRange)).toThrow(/invalid version range "1\.x"/);
  });
});

describe("serializeManifest", () => {
  it("round-trips and uses stable sorted key order with 2-space indent", () => {
    const m = parseManifest(
      JSON.stringify({
        schemaVersion: "1.0",
        repository: "owner/repo",
        contextPackages: { "z-scope/z": "~2.0.0", "a-scope/a": "^1.0.0" },
      }),
    );
    const out = serializeManifest(m);
    expect(parseManifest(out)).toEqual(m);
    expect(out.indexOf('"schemaVersion"')).toBeLessThan(out.indexOf('"repository"'));
    expect(out.indexOf('"repository"')).toBeLessThan(out.indexOf('"contextPackages"'));
    expect(out.indexOf('"a-scope/a"')).toBeLessThan(out.indexOf('"z-scope/z"'));
    expect(out).toMatch(/\n {2}"schemaVersion"/);
    expect(out.endsWith("\n")).toBe(true);
  });

  it("is deterministic regardless of insertion order", () => {
    const a = serializeManifest({
      schemaVersion: "1.0",
      repository: "o/r",
      contextPackages: { "b/b": "1.0.0", "a/a": "2.0.0" },
    });
    const b = serializeManifest({
      schemaVersion: "1.0",
      repository: "o/r",
      contextPackages: { "a/a": "2.0.0", "b/b": "1.0.0" },
    });
    expect(a).toBe(b);
  });
});
