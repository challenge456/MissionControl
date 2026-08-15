import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(new URL("../schema.ts", import.meta.url), "utf8");
const workflowRunSource = readFileSync(new URL("../workflowRuns.ts", import.meta.url), "utf8");

describe("run event schema contract", () => {
  it("keeps every current recovery and publication writer event in the schema", () => {
    for (const eventType of [
      "CANCELLATION_REQUESTED",
      "PULL_REQUEST_CREATED",
      "RUN_QUARANTINED",
      "STALE_RUN_RECOVERED",
    ]) {
      expect(workflowRunSource).toContain(`v.literal("${eventType}")`);
      expect(schemaSource).toContain(`v.literal("${eventType}")`);
    }
  });
});
