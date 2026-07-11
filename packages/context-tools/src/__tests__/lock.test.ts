import { describe, expect, it } from "vitest";
import { LockError, parseLock, serializeLock } from "../lock.js";

const HASH = `sha256:${"a".repeat(64)}`;

function lockJson(overrides: Record<string, unknown> = {}, entryOverrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: "1.0",
    resolved: {
      "software-factory/pr-delivery": {
        version: "1.3.2",
        contentHash: HASH,
        sourceCommitSha: "deadbeefcafe",
        ...entryOverrides,
      },
    },
    ...overrides,
  });
}

describe("parseLock", () => {
  it("parses a valid lock", () => {
    const lock = parseLock(lockJson());
    expect(lock.schemaVersion).toBe("1.0");
    expect(lock.resolved["software-factory/pr-delivery"]).toEqual({
      version: "1.3.2",
      contentHash: HASH,
      sourceCommitSha: "deadbeefcafe",
    });
  });

  it("accepts an empty resolved record", () => {
    expect(parseLock(JSON.stringify({ schemaVersion: "1.0", resolved: {} })).resolved).toEqual({});
  });

  it("rejects malformed JSON and non-object roots", () => {
    expect(() => parseLock("nope")).toThrow(LockError);
    expect(() => parseLock("[1]")).toThrow(LockError);
  });

  it("rejects unknown top-level keys", () => {
    expect(() => parseLock(lockJson({ extra: true }))).toThrow(/unknown top-level key "extra"/);
  });

  it("rejects wrong schemaVersion", () => {
    expect(() => parseLock(lockJson({ schemaVersion: "0.9" }))).toThrow(/"schemaVersion" must be "1\.0"/);
  });

  it("rejects non-object resolved", () => {
    expect(() => parseLock(JSON.stringify({ schemaVersion: "1.0", resolved: "x" }))).toThrow(
      /"resolved" must be an object/,
    );
  });

  it("rejects invalid slugs in resolved", () => {
    const json = JSON.stringify({
      schemaVersion: "1.0",
      resolved: { BadSlug: { version: "1.0.0", contentHash: HASH, sourceCommitSha: "abc" } },
    });
    expect(() => parseLock(json)).toThrow(/resolved\.BadSlug.*invalid package slug/);
  });

  it("rejects unknown entry keys", () => {
    expect(() => parseLock(lockJson({}, { extra: 1 }))).toThrow(/unknown key "extra"/);
  });

  it("rejects invalid versions with the path in the message", () => {
    expect(() => parseLock(lockJson({}, { version: "1.3" }))).toThrow(
      /resolved\.software-factory\/pr-delivery\.version/,
    );
    expect(() => parseLock(lockJson({}, { version: 7 }))).toThrow(LockError);
  });

  it.each([
    ["missing prefix", "a".repeat(64)],
    ["short digest", `sha256:${"a".repeat(63)}`],
    ["long digest", `sha256:${"a".repeat(65)}`],
    ["uppercase hex", `sha256:${"A".repeat(64)}`],
    ["non-hex", `sha256:${"g".repeat(64)}`],
    ["wrong algo", `sha512:${"a".repeat(64)}`],
  ])("rejects contentHash: %s", (_label, contentHash) => {
    expect(() => parseLock(lockJson({}, { contentHash }))).toThrow(/contentHash/);
  });

  it("rejects empty or non-string sourceCommitSha", () => {
    expect(() => parseLock(lockJson({}, { sourceCommitSha: "" }))).toThrow(/sourceCommitSha/);
    expect(() => parseLock(lockJson({}, { sourceCommitSha: 12 }))).toThrow(LockError);
  });
});

describe("serializeLock", () => {
  it("round-trips with stable sorted slugs and 2-space indent", () => {
    const lock = parseLock(
      JSON.stringify({
        schemaVersion: "1.0",
        resolved: {
          "z/z": { version: "2.0.0", contentHash: HASH, sourceCommitSha: "zzz" },
          "a/a": { version: "1.0.0", contentHash: HASH, sourceCommitSha: "aaa" },
        },
      }),
    );
    const out = serializeLock(lock);
    expect(parseLock(out)).toEqual(lock);
    expect(out.indexOf('"a/a"')).toBeLessThan(out.indexOf('"z/z"'));
    expect(out).toMatch(/\n {2}"resolved"/);
    expect(out.endsWith("\n")).toBe(true);
  });
});
