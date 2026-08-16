import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { MISSION_SPEC_AUTHORITY_PROFILE } from "../lib/missionSpec";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Mission Spec negative authority contract", () => {
  it("declares no execution, verification, publication, routing, or acceptance authority", () => {
    expect(MISSION_SPEC_AUTHORITY_PROFILE).toEqual({
      releaseWorkOrders: false,
      dispatchAttempts: false,
      establishVerification: false,
      createAuthoritativeEvidence: false,
      publish: false,
      merge: false,
      accept: false,
      mutateWorkerLeases: false,
      mutateRouting: false,
      alterFactoryVersions: false,
    });
  });

  it("keeps every Spec API out of canonical execution and acceptance stores", () => {
    const implementation = source("convex/missionSpecs.ts");
    for (const forbidden of [
      'insert("workOrders"',
      'insert("workflowRuns"',
      'insert("verificationReceipts"',
      'insert("verificationEvidence"',
      'insert("publicationRecords"',
      'insert("modelRoutingDecisions"',
      'insert("workerLeases"',
      'insert("factoryDefinitionVersions"',
      'patch("workOrders"',
      "createWorkOrderRecord",
      "dispatchAttempt",
      "publishCandidate",
    ]) {
      expect(implementation, `Spec API contains forbidden authority symbol ${forbidden}`).not.toContain(forbidden);
    }
  });

  it("keeps the generic harness and Attempt adapters unable to invoke Spec writes", () => {
    const harnessSources = [
      "packages/workflow-engine/src/executorAdapter.ts",
      "convex/factory/attempts.ts",
      "convex/factory/configuration.ts",
      "convex/lib/executionManifest.ts",
    ].map(source).join("\n");
    for (const forbidden of [
      "missionSpecs.saveMissionSpecRevision",
      "missionSpecs.evaluateMissionSpecRevision",
      "missionSpecs.finalizeMissionSpecRevision",
      "missionSpecs.createConstitutionRevision",
      "missionSpecs.activateConstitutionRevision",
    ]) {
      expect(harnessSources).not.toContain(forbidden);
    }
  });
});
