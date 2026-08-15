import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(new URL("../schema.ts", import.meta.url), "utf8");
const currentVerificationSource = readFileSync(
  new URL("../lib/currentVerification.ts", import.meta.url),
  "utf8",
);
const workOrdersSource = readFileSync(new URL("../workOrders.ts", import.meta.url), "utf8");

describe("policy-v2 acceptance persistence contract", () => {
  it("permits evidence to persist exact WorkOrder revision lineage", () => {
    const evidenceSchema = schemaSource.match(
      /evidenceEnvelopes: defineTable\(\{([\s\S]*?)\n  \}\)\n    \.index\("by_verification_run"/,
    )?.[1];

    expect(evidenceSchema).toContain("workOrderRevisionNumber: v.optional(v.number())");
  });

  it("keeps acceptance and Quality Gate idempotency scoped to one WorkOrder", () => {
    expect(currentVerificationSource).toContain("existing.workOrderId !== workOrder._id");
    expect(workOrdersSource).toContain("existingEvent.workOrderId !== workOrder._id");
    expect(workOrdersSource).toContain("idempotent-verification-rejection");
  });
});
