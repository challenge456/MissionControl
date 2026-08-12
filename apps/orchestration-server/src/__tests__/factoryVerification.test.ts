import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { executeIndependentVerification } from "../factoryVerification.js";

const cleanup: string[] = [];
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function specification(commandClass = "TEST", args = ["-e", "console.log('ok')"]) {
  return {
    riskLevel: "MEDIUM",
    riskReasons: ["bounded test"],
    requiredApprovals: [],
    acceptanceCriteria: [{ id: "ac-1", title: "Independent check passes", requiredEvidence: [{ category: "TEST_RESULT", minimumCount: 1, independent: true }] }],
    negativeConstraints: [],
    changeBudget: {
      maxFilesChanged: 2, maxLinesChanged: 20, allowedPaths: ["src/**"], deniedPaths: [],
      allowedCommandClasses: ["TEST"], prohibitedCommandClasses: ["DESTRUCTIVE", "PUBLISH"],
      allowDependencyChanges: false, allowSchemaChanges: false, allowMigrations: false, allowInfrastructureChanges: false,
    },
    verificationContract: { schemaVersion: 1, enforcementMode: "ENFORCED", requireHumanReview: false, checks: [{
      id: "command", name: "Independent command", category: "UNIT_TEST", verifierId: "factory-command/v1", mandatory: true,
      acceptanceCriterionIds: ["ac-1"], evidenceCategory: "TEST_RESULT",
      command: { executable: "node", args, commandClass, timeoutMs: 5_000 },
    }] },
  };
}

async function execute(spec: any) {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "mc-factory-verification-"));
  cleanup.push(repositoryRoot);
  return await executeIndependentVerification({
    workflowRunId: "run-1", workOrderId: "wo-1", workOrderRevisionNumber: 1,
    title: "Verify", specification: spec, repositoryRoot,
    candidate: { sourceRevision: "base", candidateRevision: "head", changedFiles: ["src/a.ts"], deletedFiles: [], linesAdded: 2, linesDeleted: 1, diff: "+export const a = 1;" },
  });
}

describe("Factory independent command verification", () => {
  it("produces independent evidence for an allowlisted command", async () => {
    const result = await execute(specification());
    expect(result.verdict).toBe("VERIFIED");
    expect(result.checks.find((check) => check.checkId === "command")).toMatchObject({ status: "PASS", metadata: { policyDecision: "APPROVED" } });
  });

  it("fails closed for prohibited command authority", async () => {
    const result = await execute(specification("PUBLISH"));
    expect(result.verdict).toBe("NOT_VERIFIED");
    expect(result.checks.find((check) => check.checkId === "command")).toMatchObject({ status: "FAIL", metadata: { commandDenied: true } });
  });
});
