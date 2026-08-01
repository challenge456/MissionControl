import { describe, expect, it } from "vitest";
import {
  validateMembershipInput,
  wouldRemoveLastOwner,
} from "../lib/companyMemberPolicy";

describe("company member policy", () => {
  it("requires an exact Clerk user ID", () => {
    expect(
      validateMembershipInput({
        name: "Dev Owner",
        email: "dev@example.com",
        authId: "email:dev@example.com",
        roleCount: 1,
      })
    ).toContain("Clerk user ID");
  });

  it("accepts a bounded exact-subject membership", () => {
    expect(
      validateMembershipInput({
        name: "Dev Owner",
        email: "dev@example.com",
        authId: "user_2abc123",
        roleCount: 1,
      })
    ).toBeNull();
  });

  it("blocks removal of the final active owner", () => {
    expect(
      wouldRemoveLastOwner({
        memberActive: true,
        memberIsOwner: true,
        memberWillRemainOwner: false,
        activeOwnerCount: 1,
      })
    ).toBe(true);
  });

  it("allows owner removal after another owner is active", () => {
    expect(
      wouldRemoveLastOwner({
        memberActive: true,
        memberIsOwner: true,
        memberWillRemainOwner: false,
        activeOwnerCount: 2,
      })
    ).toBe(false);
  });
});
