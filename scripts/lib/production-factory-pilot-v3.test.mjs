import { describe, expect, it } from "vitest";
import {
  PILOT_SCHEMA,
  PILOT_BASELINE_SHA,
  SECURITY_CONFIGURATION_D_CONTEXT,
  buildPilotSchedule,
  buildPilotExecutionPrompt,
  buildReliabilityScorecard,
  qualifiedWorkloadConfiguration,
  validatePilotDataset,
} from "./production-factory-pilot-v3.mjs";

describe("Production Factory Pilot V3 evidence contract", () => {
  it("schedules five comparable workload classes three times with the exact bounded remote subset", () => {
    const schedule = buildPilotSchedule();
    expect(schedule).toHaveLength(15);
    expect(new Set(schedule.map((item) => item.workload.class))).toHaveLength(5);
    expect(schedule.filter((item) => item.backend === "remote-sandbox").map((item) => item.workload.key)).toEqual([
      "bug-fix",
      "security-policy",
      "data-migration",
    ]);
  });

  it("keeps qualified workload configuration explicit and workload-specific", () => {
    const security = qualifiedWorkloadConfiguration("security-policy");
    const migration = qualifiedWorkloadConfiguration("data-migration");
    const bug = qualifiedWorkloadConfiguration("bug-fix");
    expect(security.securityContextVariant).toBe("D");
    expect(security.additionalAuthorizedContext).toBe(SECURITY_CONFIGURATION_D_CONTEXT);
    expect(migration.runtimeMs).toBe(420_000);
    expect(migration.executorTimeoutMs).toBe(390_000);
    expect(bug.runtimeMs).toBe(300_000);
    expect([security, migration, bug].every((item) => item.modelMetadataConfig === "supported" && item.globalDefault === false)).toBe(true);
  });

  it("freezes canonical structured output, criterion mapping, Configuration D, and fresh recovery identity", () => {
    const prompt = buildPilotExecutionPrompt("Implement the fixture.", [
      { id: "A-1", title: "First criterion" },
      { id: "A-2", title: "Second criterion" },
    ], 2, SECURITY_CONFIGURATION_D_CONTEXT);
    expect(prompt).toContain('"schema":"factory-result/v1"');
    expect(prompt).toContain("COMPLETED, BLOCKED, or FAILED");
    expect(prompt).toContain("every listed acceptance criterion ID must appear exactly once");
    expect(prompt).toContain("A-1, A-2");
    expect(prompt).toContain("[A-2] Second criterion");
    expect(prompt).toContain("new recovery Attempt with fresh identity");
    expect(prompt).toContain(SECURITY_CONFIGURATION_D_CONTEXT);
  });

  it("keeps missing cleanup and cost telemetry from improving scorecard dimensions", () => {
    const scorecard = buildReliabilityScorecard([{
      eventualSuccess: true,
      firstPassSuccess: true,
      retries: 0,
      verification: { verdict: "VERIFIED" },
      cleanup: { observed: false, passed: null },
      context: { sufficient: true },
      evidenceCompleteness: 1,
      review: { correctionRequired: false },
      cost: { totalUsd: null },
      metrics: { totalCycleMs: 100 },
    }]);
    expect(scorecard.dimensions.cleanupReliability.observedValue).toBeNull();
    expect(scorecard.dimensions.cleanupReliability.coverage).toBe(0);
    expect(scorecard.dimensions.costEfficiency.observedValue).toBeNull();
    expect(scorecard.dimensions.costEfficiency.coverage).toBe(0);
  });

  it("accepts only the complete strict V3 readiness population", () => {
    const workloadClasses = ["BUG_FIX", "FEATURE", "REFACTOR", "SECURITY_POLICY", "DATA_SCHEMA_MIGRATION"];
    const workloadKeys = ["bug-fix", "feature", "refactor", "security-policy", "data-migration"];
    const executions = Array.from({ length: 15 }, (_value, index) => {
      const workloadIndex = Math.floor(index / 3);
      const remote = index % 3 === 2 && [0, 3, 4].includes(workloadIndex);
      return {
        workloadClass: workloadClasses[workloadIndex],
        workloadKey: workloadKeys[workloadIndex],
        backend: remote ? "remote-sandbox" : "persistent-worker",
        eventualSuccess: true,
        firstPassSuccess: true,
        firstPassStructuredResultSuccess: true,
        firstPassVerificationSuccess: true,
        terminalStructuredResult: true,
        acceptance: { accepted: true },
        cleanup: remote ? { credentialRevoked: true, resourceAbsent: true, finalVmCount: 0 } : { observed: true, passed: true },
        attempts: remote ? [{ cleanup: { credentialRevoked: true, resourceAbsent: true, finalVmCount: 0 } }] : [{}],
        lineage: { workOrderId: `wo-${index}`, specDigest: "sha256:x" },
        cost: { observed: false, totalUsd: null },
        review: {
          residualAiEnabled: false,
          reviewPackage: {
            acceptanceAuthority: false,
            traversal: ["INTENT", "CRITERION", "EVIDENCE", "VERIFICATION", "IMPLEMENTATION_DECISION", "RAW_DIFF"],
            rawDiffDigest: "sha256:diff",
          },
          implementationDecisions: [{ decision: "bounded" }],
          criterionTrace: [{ specRequirements: [{}], verificationChecks: [{}], evidence: [{}] }],
        },
      };
    });
    expect(validatePilotDataset({
      schemaVersion: PILOT_SCHEMA,
      baseline: { sha: PILOT_BASELINE_SHA, runtimeContract: 30 },
      executions,
      routingShadow: { guardedAutoEnabled: false },
      authority: { canonicalAcceptance: "workOrders.accept" },
      remoteSandboxInventory: { vmCount: 0 },
      failureInjections: Array.from({ length: 12 }, () => ({ failClosed: true, recoveryProven: true })),
      humanInterventions: { avoidableOperationalToilCount: 0 },
      unresolvedDefects: [],
      authorityViolations: [],
      priorEvidenceIntegrity: { unchanged: true },
    })).toEqual([]);
  });

  it("rejects incomplete success, remote, authority, cleanup, toil, and evidence invariants", () => {
    const errors = validatePilotDataset({
      schemaVersion: PILOT_SCHEMA,
      baseline: { sha: PILOT_BASELINE_SHA, runtimeContract: 30 },
      executions: [{
        workloadClass: "BUG_FIX",
        workloadKey: "bug-fix",
        backend: "remote-sandbox",
        eventualSuccess: false,
        firstPassSuccess: false,
        firstPassStructuredResultSuccess: false,
        firstPassVerificationSuccess: false,
        terminalStructuredResult: false,
        acceptance: { accepted: false },
        cleanup: { credentialRevoked: false, resourceAbsent: false, finalVmCount: 1 },
        attempts: [{ cleanup: { credentialRevoked: false, resourceAbsent: false, finalVmCount: 1 } }],
        lineage: { workOrderId: "wo-1", specDigest: "sha256:x" },
        cost: { observed: false, totalUsd: 0 },
      }],
      routingShadow: { guardedAutoEnabled: true },
      authority: { canonicalAcceptance: "other" },
      remoteSandboxInventory: { vmCount: 1 },
      failureInjections: [],
      humanInterventions: { avoidableOperationalToilCount: 1 },
      unresolvedDefects: [{ priority: "P1", status: "OPEN" }],
      authorityViolations: [{ code: "ACCEPTANCE_AUTHORITY" }],
      priorEvidenceIntegrity: { unchanged: false },
    });
    expect(errors).toEqual(expect.arrayContaining([
      "At least 15 governed executions are required.",
      "Every workload class requires at least three governed executions.",
      "Unknown cost cannot be represented as zero.",
      "Guarded Auto must remain disabled.",
      "Canonical acceptance authority is incorrect.",
      "Every execution requires a valid terminal structured result.",
      "Every intended workload must reach verified exact-current eligibility and human acceptance.",
      "The remote bug/security/migration gate requires 3/3 first-pass success.",
      "Every remote Attempt requires exact revocation and resource-absence proof.",
      "Hidden manual repair or avoidable operator toil was required.",
      "An unresolved P0/P1 reliability defect remains.",
      "Prior evidence immutability is unproven.",
      "An acceptance, verification, or publication authority violation occurred.",
    ]));
  });
});
