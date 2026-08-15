import { describe, expect, it } from "vitest";
import { canonicalDigest, canonicalHash, canonicalJson, sha256Hex } from "../canonicalDigest.js";

describe("canonical digest", () => {
  it("preserves the persisted mainline canonical byte representation", () => {
    expect(canonicalJson({ z: 1, omitted: undefined, a: { y: 2, x: 3 } }))
      .toBe('{"a":{"x":3,"y":2},"omitted":undefined,"z":1}');
    expect(canonicalJson([1, undefined, 3])).toBe("[1,,3]");
    expect(canonicalHash({ z: 1, omitted: undefined, a: { y: 2, x: 3 } }))
      .toBe("ffaa6e91dd12a61601d6688462be1f96e5da5fb00e13e0e639d7b5c68692da77");
  });

  it("uses standards-compatible SHA-256 and namespace separation", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(canonicalHash({ b: 2, a: 1 })).toBe(canonicalHash({ a: 1, b: 2 }));
    expect(canonicalDigest("one", { a: 1 })).not.toBe(canonicalDigest("two", { a: 1 }));
  });
});
