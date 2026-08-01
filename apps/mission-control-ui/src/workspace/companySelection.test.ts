import { describe, expect, it } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import { selectAccessibleCompany } from "./companySelection";

const company = (tenantId: string) => ({ tenantId: tenantId as Id<"tenants"> });

describe("selectAccessibleCompany", () => {
  it("uses an accessible requested company", () => {
    expect(
      selectAccessibleCompany({
        requestedCompany: "sellerfi",
        persistedCompany: "mission-control",
        companies: [company("mission-control"), company("sellerfi")],
      })
    ).toEqual({ tenantId: "sellerfi", requestedUnavailable: false });
  });

  it("recovers to an accessible persisted company", () => {
    expect(
      selectAccessibleCompany({
        requestedCompany: "unavailable",
        persistedCompany: "sellerfi",
        companies: [company("mission-control"), company("sellerfi")],
      })
    ).toEqual({ tenantId: "sellerfi", requestedUnavailable: true });
  });

  it("falls back to the first accessible company", () => {
    expect(
      selectAccessibleCompany({
        requestedCompany: null,
        persistedCompany: "unavailable",
        companies: [company("mission-control"), company("sellerfi")],
      })
    ).toEqual({ tenantId: "mission-control", requestedUnavailable: false });
  });

  it("returns no company when membership is empty", () => {
    expect(
      selectAccessibleCompany({
        requestedCompany: "sellerfi",
        persistedCompany: null,
        companies: [],
      })
    ).toEqual({ tenantId: null, requestedUnavailable: true });
  });
});
