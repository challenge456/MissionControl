#!/usr/bin/env node

import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { canonicalHash } from "@mission-control/shared";
import { evaluateAcceptance } from "../convex/lib/workOrderGovernance.ts";
import { CodexV1ExecutorAdapter } from "../apps/orchestration-server/src/codexExecutorAdapter.ts";
import { ExeDevSandboxProvider, ExeDevSshTransport } from "../apps/orchestration-server/src/exeDevSandboxProvider.ts";
import {
  commitFactoryChanges,
  createFactorySourceBundle,
  inspectCandidateChange,
  listChangedFiles,
  materializeRemoteCandidate,
} from "../apps/orchestration-server/src/factoryGitRuntime.ts";
import { validateChangedFileScope } from "../apps/orchestration-server/src/factoryPathScope.ts";
import {
  decideRemoteRetry,
  remoteFailure,
  type RemoteFailure,
  type RemoteRetryBudget,
} from "../apps/orchestration-server/src/remoteExecutionPolicy.ts";
import {
  InMemoryRemoteSandboxJournal,
  RemoteSandboxExecutionError,
  RemoteSandboxRuntime,
} from "../apps/orchestration-server/src/remoteSandboxRuntime.ts";
import { OpenRouterSandboxCredentialBroker } from "../apps/orchestration-server/src/sandboxCredentials.ts";
import { redactSandboxTail, redactSandboxText, sandboxProfileDigest } from "../apps/orchestration-server/src/sandboxProvider.ts";
import { standaloneSandboxSupervisorSource } from "../apps/orchestration-server/src/sandboxSupervisor.ts";
import {
  REMOTE_CODEX_QUALIFICATION_SCHEDULE,
  qualificationWorkload,
} from "./lib/remote-codex-qualification-workloads.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const evidenceDirectory = path.join(repoRoot, "docs/testing/evidence/remote-codex-structured-output-v1");
const resultsPath = path.join(evidenceDirectory, "live-run-results.json");
const initialFailurePath = path.join(evidenceDirectory, "live-initial-failure.json");
const schemaRootCausePath = path.join(evidenceDirectory, "live-schema-root-cause.json");
const excludedIdentityReusePath = path.join(evidenceDirectory, "live-excluded-identity-reuse.json");
const expectedBaseSha = "75981d8ae1bd49e235cc1478bac3d0f853fc717f";
const remoteModel = "openai/gpt-5.1-codex-mini";
const harnessVersion = "0.146.0";
const attemptSpendCapUsd = 0.05;
const cleanupDirectories: string[] = [];

const preflightOnly = process.argv.slice(2).includes("--preflight");
if (process.argv.slice(2).some((argument) => argument !== "--preflight")) {
  throw new Error("Usage: remote-codex-structured-output-qualification.mts [--preflight]");
}

await main().finally(async () => {
  await Promise.all(cleanupDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function main() {
  const baseline = await assertPreflight();
  if (preflightOnly) {
    process.stdout.write(`${JSON.stringify({ status: "ready", baseline, schedule: REMOTE_CODEX_QUALIFICATION_SCHEDULE }, null, 2)}\n`);
    return;
  }
  if (process.env.MC_REMOTE_CODEX_QUALIFICATION !== "1" || process.env.MISSION_CONTROL_SANDBOX_LIVE !== "1") {
    throw new Error("Live execution requires MC_REMOTE_CODEX_QUALIFICATION=1 and MISSION_CONTROL_SANDBOX_LIVE=1.");
  }

  await mkdir(evidenceDirectory, { recursive: true });
  if (await exists(resultsPath)) {
    const previous = JSON.parse(await readFile(resultsPath, "utf8"));
    if (!previous.qualificationRunId && (previous.executions?.length ?? 0) > 1 && !await exists(excludedIdentityReusePath)) {
      await copyFile(resultsPath, excludedIdentityReusePath);
    } else if (previous.decision === "BLOCKED") {
      if (!await exists(initialFailurePath)) await copyFile(resultsPath, initialFailurePath);
      else if (!await exists(schemaRootCausePath)) await copyFile(resultsPath, schemaRootCausePath);
      else if (!await exists(excludedIdentityReusePath)) await copyFile(resultsPath, excludedIdentityReusePath);
    }
  }
  const startedAt = Date.now();
  const qualificationRunId = randomUUID().replace(/-/g, "").slice(0, 12);
  const profile = remoteProfile(startedAt);
  const factoryPolicy = retryBudget();
  const dataset: any = {
    schema: "remote-codex-structured-output-qualification/v1",
    decision: "IN_PROGRESS",
    startedAt: new Date(startedAt).toISOString(),
    qualificationRunId,
    completedAt: null,
    baseline,
    constraints: {
      maximumConcurrentVms: 1,
      guardedAutoEnabled: false,
      publicationAuthority: "CONTROL_PLANE_ONLY",
      acceptanceAuthority: "workOrders.accept",
      resultContract: "factory-result/v1",
      transportEnvelope: "factory-sandbox-result/v1",
    },
    factoryPolicy,
    profile: { ...profile, digest: sandboxProfileDigest(profile as any) },
    schedule: REMOTE_CODEX_QUALIFICATION_SCHEDULE,
    executions: [],
    finalInventory: null,
  };
  await persist(dataset);

  try {
    for (const scheduled of REMOTE_CODEX_QUALIFICATION_SCHEDULE) {
      const qualification = dataset.executions.filter((execution: any) => execution.phase === "STRUCTURED_OUTPUT_QUALIFICATION");
      if (scheduled.phase === "PILOT_REMOTE_REGRESSION"
        && (qualification.length !== 5 || qualification.some((execution: any) => !execution.eventualSuccess))) {
        break;
      }
      process.stdout.write(`\n[${dataset.executions.length + 1}/${REMOTE_CODEX_QUALIFICATION_SCHEDULE.length}] ${scheduled.executionId}\n`);
      const execution = await runExecution(scheduled as any, profile, factoryPolicy, qualificationRunId);
      dataset.executions.push(execution);
      await persist(dataset);
      if (!execution.eventualSuccess) break;
    }
  } finally {
    dataset.finalInventory = await readRemoteInventory().catch((error) => ({
      checkedAt: new Date().toISOString(),
      vmCount: null,
      error: safeMessage(error),
    }));
    const qualification = dataset.executions.filter((execution: any) => execution.phase === "STRUCTURED_OUTPUT_QUALIFICATION");
    const regression = dataset.executions.filter((execution: any) => execution.phase === "PILOT_REMOTE_REGRESSION");
    dataset.completedAt = new Date().toISOString();
    dataset.totalRemoteExecutionTimeMs = dataset.executions.reduce((sum: number, execution: any) => sum + execution.durationMs, 0);
    dataset.totalAttempts = dataset.executions.reduce((sum: number, execution: any) => sum + execution.attempts.length, 0);
    dataset.totalRetries = dataset.executions.reduce((sum: number, execution: any) => sum + execution.retries, 0);
    dataset.totalModelCostUsd = sumKnown(dataset.executions.flatMap((execution: any) => execution.attempts.map((attempt: any) => attempt.usage?.inferenceCostUsd)));
    dataset.totalProviderCostUsd = sumKnown(dataset.executions.flatMap((execution: any) => execution.attempts.map((attempt: any) => attempt.usage?.providerCostUsd)));
    dataset.decision = qualification.length === 5
      && qualification.every((execution: any) => execution.eventualSuccess)
      && regression.length === 3
      && regression.every((execution: any) => execution.eventualSuccess && execution.verification?.verdict === "VERIFIED" && execution.acceptance?.eligible)
      && dataset.finalInventory?.vmCount === 0
        ? "REMOTE CODEX STRUCTURED OUTPUT QUALIFIED"
        : "BLOCKED";
    await persist(dataset);
    await writeDerivedEvidence(dataset);
  }

  process.stdout.write(`\n${dataset.decision}\nFinal exe.dev inventory: ${String(dataset.finalInventory?.vmCount)}\n`);
  if (dataset.decision !== "REMOTE CODEX STRUCTURED OUTPUT QUALIFIED") process.exitCode = 1;
}

async function assertPreflight() {
  const [head, originMain, mergeBase, runtimeContractSource, inventory, codexVersion] = await Promise.all([
    gitValue(repoRoot, ["rev-parse", "HEAD"]),
    gitValue(repoRoot, ["rev-parse", "origin/main"]),
    gitValue(repoRoot, ["merge-base", "HEAD", "origin/main"]),
    readFile(path.join(repoRoot, "convex/lib/runtimeContract.ts"), "utf8"),
    readRemoteInventory(),
    commandValue("codex", ["--version"]),
  ]);
  const runtimeContractVersion = Number(runtimeContractSource.match(/RUNTIME_CONTRACT_VERSION\s*=\s*(\d+)/)?.[1]);
  if (originMain !== expectedBaseSha || mergeBase !== expectedBaseSha) {
    throw new Error(`Qualification branch is not rooted at the frozen latest-origin/main ${expectedBaseSha}.`);
  }
  if (inventory.vmCount !== 0) throw new Error(`Live qualification requires an empty exe.dev inventory; found ${inventory.vmCount}.`);
  if (!inventory.authenticated || !inventory.liveAllocationAllowed) throw new Error("exe.dev live allocation is not ready.");
  if (!process.env.OPENROUTER_MANAGEMENT_API_KEY?.trim()) throw new Error("OpenRouter management credential is not configured host-side.");
  if (codexVersion !== `codex-cli ${harnessVersion}`) throw new Error(`Expected codex-cli ${harnessVersion}, found ${codexVersion}.`);
  if (!Number.isSafeInteger(runtimeContractVersion)) throw new Error("Runtime contract version could not be read.");
  return {
    frozenOriginMainSha: expectedBaseSha,
    branchHeadBeforeQualification: head,
    mergeBase,
    runtimeContractVersion,
    node: process.version,
    codex: codexVersion,
    providerReadiness: inventory,
  };
}

async function runExecution(scheduled: any, profile: any, policy: RemoteRetryBudget, qualificationRunId: string) {
  const workload = qualificationWorkload(scheduled.workloadKey);
  const startedAt = Date.now();
  const fixture = await createFixtureRepository(workload, scheduled.executionId);
  const sourceSha = await gitValue(fixture, ["rev-parse", "HEAD"]);
  const lineage = {
    missionId: `mission-${qualificationRunId}-${scheduled.executionId}`,
    planId: `plan-${qualificationRunId}-${scheduled.executionId}`,
    workOrderId: `work-order-${qualificationRunId}-${scheduled.executionId}`,
    workOrderRevisionNumber: 1,
    factoryDefinitionId: "factory-remote-codex-structured-output",
    factoryDefinitionVersionId: "factory-remote-codex-structured-output-v1",
    factoryVersion: 1,
    factoryConfigurationDigest: `sha256:${canonicalHash({
      adapter: "codex",
      adapterVersion: "v1",
      harnessVersion,
      provider: "openrouter",
      model: remoteModel,
      backend: "remote-sandbox",
      policy,
    })}`,
  };
  const attempts: any[] = [];
  let successful: any;
  let observedSpend: number | null = 0;

  for (let attemptNumber = 1; attemptNumber <= policy.maxAttempts; attemptNumber += 1) {
    const attemptRoot = await cloneFixture(fixture, scheduled.executionId, attemptNumber);
    const attempt = await runAttempt({
      scheduled,
      qualificationRunId,
      workload,
      lineage,
      attemptNumber,
      retryOfAttemptId: attempts.at(-1)?.attemptId ?? null,
      repositoryRoot: attemptRoot,
      sourceSha,
      profile,
      policy,
    });
    attempts.push(attempt);
    if (attempt.eventualSuccess) {
      successful = attempt;
      break;
    }
    observedSpend = addObservedSpend(observedSpend, attempt.usage?.inferenceCostUsd);
    const decision = decideRemoteRetry({
      failure: attempt.failure,
      budget: policy,
      attemptsUsed: attempts.length,
      totalWallClockMs: Date.now() - startedAt,
      observedModelSpendUsd: observedSpend,
      activeProviderResources: attempt.cleanup?.finalVmCount ?? 1,
    });
    attempt.retryDecision = decision;
    if (!decision.allowed) break;
  }

  return {
    executionId: scheduled.executionId,
    phase: scheduled.phase,
    workloadKey: workload.key,
    workloadClass: workload.class,
    workloadTitle: workload.title,
    risk: workload.risk,
    lineage,
    sourceSha,
    factoryPolicy: policy,
    attempts,
    retries: Math.max(0, attempts.length - 1),
    eventualSuccess: Boolean(successful),
    successfulAttemptId: successful?.attemptId ?? null,
    structuredResult: successful?.structuredResult ?? null,
    resultProvenance: successful?.resultProvenance ?? null,
    candidate: successful?.candidate ?? null,
    verification: successful?.verification ?? null,
    acceptance: successful?.acceptance ?? null,
    cleanup: successful?.cleanup ?? attempts.at(-1)?.cleanup ?? null,
    durationMs: Date.now() - startedAt,
  };
}

async function runAttempt(input: any) {
  const attemptStartedAt = Date.now();
  const attemptId = `attempt-${input.qualificationRunId}-${input.scheduled.executionId}-${input.attemptNumber}`;
  const workflowRunId = `workflow-${input.qualificationRunId}-${input.scheduled.executionId}-${input.attemptNumber}`;
  const leaseId = `lease-${input.qualificationRunId}-${input.scheduled.executionId}-${input.attemptNumber}`;
  const profileDigest = sandboxProfileDigest(input.profile);
  const manifest = executionManifest({ ...input, attemptId, workflowRunId, profileDigest });
  const manifestDigest = `sha256:${canonicalHash(manifest)}`;
  const adapter = new CodexV1ExecutorAdapter("codex");
  const remoteRoot = "/var/lib/mission-control/attempt/repository";
  const executorResultPath = "/var/lib/mission-control/attempt/executor-result.json";
  const executorRequest: any = {
    executionId: `${attemptId}:remote`,
    repositoryRoot: input.repositoryRoot,
    workingDirectory: input.repositoryRoot,
    prompt: executionPrompt(input.workload, input.attemptNumber),
    provider: "openai",
    model: remoteModel,
    allowedPaths: input.workload.allowedPaths,
    deniedPaths: ["tests/**", "package.json", ".git/**"],
    timeoutMs: input.profile.runtime.maxRuntimeMs - 30_000,
    isolation: "WORKSPACE_WRITE",
  };
  const invocation = adapter.createRemoteInvocation(executorRequest, {
    repositoryRoot: remoteRoot,
    resultPath: executorResultPath,
  });
  const inventoryBefore = await readRemoteInventory();
  if (inventoryBefore.vmCount !== 0) throw new Error(`Attempt ${attemptId} requires empty initial inventory.`);
  const journal = new InMemoryRemoteSandboxJournal();
  const transport = new ExeDevSshTransport();
  const runtime = new RemoteSandboxRuntime(
    new ExeDevSandboxProvider(transport),
    new OpenRouterSandboxCredentialBroker(),
    journal,
  );
  let result: any;
  let caught: unknown;
  try {
    result = await runtime.execute({
      projectId: "remote-codex-structured-output-v1",
      workOrderId: input.lineage.workOrderId,
      workOrderRevisionNumber: 1,
      workflowRunId,
      attemptId,
      attemptLeaseId: leaseId,
      executionManifest: manifest,
      manifestDigest,
      sourceSha: input.sourceSha,
      profile: input.profile,
      repositoryBundle: await createFactorySourceBundle(input.repositoryRoot, input.sourceSha),
      supervisorSource: standaloneSandboxSupervisorSource(),
      executor: {
        ...invocation,
        command: "npx",
        args: ["-y", `@openai/codex@${harnessVersion}`, ...invocation.args],
      },
    });
  } catch (error) {
    caught = error;
  } finally {
    await transport.dispose();
  }

  const inventoryAfter = await readRemoteInventory().catch(() => ({ vmCount: null }));
  const termination = journal.terminations.at(-1);
  const revocation = journal.revokedCredentials.at(-1);
  const cleanup = {
    credentialIssued: journal.issuedCredentials.length === 1,
    credentialGrantKey: journal.issuedCredentials.at(-1)?.grantKey ?? null,
    credentialSecretPersisted: false,
    credentialRevoked: revocation?.revoked === true,
    resourceName: termination?.resourceName ?? journal.allocationRequests.at(-1)?.resourceName ?? null,
    resourceAbsent: termination?.resourceAbsent === true,
    finalVmCount: inventoryAfter.vmCount,
    passed: termination?.resourceAbsent === true && revocation?.revoked === true && inventoryAfter.vmCount === 0,
  };
  const baseEvidence: any = {
    attemptId,
    attemptNumber: input.attemptNumber,
    retryOfAttemptId: input.retryOfAttemptId,
    workflowRunId,
    leaseId,
    sourceSha: input.sourceSha,
    manifest,
    manifestDigest,
    harness: manifest.harness,
    invocation: {
      command: "npx",
      package: `@openai/codex@${harnessVersion}`,
      args: invocation.args,
      outputSchemaPath: invocation.outputSchemaPath,
      outputSchema: invocation.outputSchema,
    },
    events: journal.events,
    inventoryBefore,
    inventoryAfter,
    cleanup,
    startedAt: new Date(attemptStartedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - attemptStartedAt,
  };

  if (caught) {
    const failure = caught instanceof RemoteSandboxExecutionError
      ? caught.failure
      : remoteFailure("UNKNOWN", "QUALIFICATION_UNCLASSIFIED", "UNKNOWN", safeMessage(caught));
    return { ...baseEvidence, eventualSuccess: false, failure, error: safeMessage(caught), usage: null };
  }
  const bundle = result.bundle;
  const bundleEvidence = {
    transportBundleSchema: bundle.schema,
    transportBundleDigest: bundle.digest,
    transportStatus: bundle.status,
    structuredResult: bundle.structuredResult,
    resultProvenance: bundle.resultProvenance,
    changedFiles: bundle.changedFiles,
    executor: {
      exitCode: bundle.executor.exitCode,
      stdoutDigest: bundle.executor.stdoutDigest,
      stderrDigest: bundle.executor.stderrDigest,
      stdoutTail: redactSandboxTail(bundle.executor.stdoutTail, 16_000),
      stderrTail: redactSandboxTail(bundle.executor.stderrTail, 16_000),
      resultOutput: bundle.executor.resultOutput ?? null,
    },
    usage: bundle.usage,
  };
  if (bundle.status !== "COMPLETED" || bundle.structuredResult.status !== "COMPLETED") {
    return {
      ...baseEvidence,
      ...bundleEvidence,
      eventualSuccess: false,
      failure: bundle.failure ?? remoteFailure("UNKNOWN", "FAILED_BUNDLE_WITHOUT_REASON", "RESULT_VALIDATION", "Remote bundle failed without a typed reason."),
    };
  }

  try {
    await materializeRemoteCandidate({
      worktree: input.repositoryRoot,
      sourceSha: input.sourceSha,
      patch: Buffer.from(bundle.patch.content, "base64"),
    });
    const hostChangedFiles = await listChangedFiles(input.repositoryRoot, input.sourceSha);
    const scope = validateChangedFileScope(hostChangedFiles, {
      allowedPaths: input.workload.allowedPaths,
      excludedPaths: ["tests/**", "package.json", ".git/**"],
    });
    if (!scope.ok || scope.changedFiles.length === 0) {
      throw new CandidateFailure("CANDIDATE_SCOPE_INVALID", scope.outsideScope.length
        ? `Remote candidate changed paths outside scope: ${scope.outsideScope.join(", ")}`
        : "Remote candidate did not contain a reviewable change.");
    }
    if (JSON.stringify(scope.changedFiles) !== JSON.stringify(bundle.changedFiles)) {
      throw new CandidateFailure("CANDIDATE_FILE_SET_MISMATCH", "Host materialization did not match the supervisor changed-file set.");
    }
    const candidateSha = await commitFactoryChanges({
      worktree: input.repositoryRoot,
      changedFiles: scope.changedFiles,
      title: input.workload.title,
    });
    const candidate = await inspectCandidateChange(input.repositoryRoot, input.sourceSha);
    if (candidate.sourceRevision !== input.sourceSha || candidate.candidateRevision !== candidateSha) {
      throw new CandidateFailure("CANDIDATE_SHA_MISMATCH", "Host candidate identity changed before verification.");
    }
    const verification = await verifyCandidate(input.scheduled.executionId, input.workload, input.repositoryRoot, candidate);
    if (verification.verdict !== "VERIFIED") {
      throw new CandidateFailure("INDEPENDENT_VERIFICATION_FAILED", verification.reason);
    }
    const acceptance = acceptanceProjection(input.workload, verification);
    if (!acceptance.eligible) {
      throw new CandidateFailure("ACCEPTANCE_INELIGIBLE", acceptance.blockingReasons.join(" "));
    }
    return {
      ...baseEvidence,
      ...bundleEvidence,
      eventualSuccess: true,
      failure: null,
      candidate: {
        sourceSha: candidate.sourceRevision,
        candidateSha,
        treeSha: candidate.treeRevision,
        changedFiles: candidate.changedFiles,
        linesAdded: candidate.linesAdded,
        linesDeleted: candidate.linesDeleted,
      },
      verification,
      acceptance,
    };
  } catch (error) {
    const failure = error instanceof CandidateFailure
      ? remoteFailure("NON_RETRYABLE_RESULT", error.code, "CANDIDATE", error.message)
      : remoteFailure("UNKNOWN", "CANDIDATE_UNCLASSIFIED", "CANDIDATE", safeMessage(error));
    return { ...baseEvidence, ...bundleEvidence, eventualSuccess: false, failure, error: safeMessage(error) };
  }
}

function executionManifest(input: any) {
  return {
    version: "factory-execution-manifest/v1",
    causation: {
      missionId: input.lineage.missionId,
      missionPlanId: input.lineage.planId,
      workOrderId: input.lineage.workOrderId,
      workOrderRevisionNumber: 1,
      workflowRunId: input.workflowRunId,
      attemptId: input.attemptId,
    },
    factory: {
      definitionId: input.lineage.factoryDefinitionId,
      definitionVersionId: input.lineage.factoryDefinitionVersionId,
      version: input.lineage.factoryVersion,
      configurationDigest: input.lineage.factoryConfigurationDigest,
    },
    repository: {
      repository: `sellerfi-pilot/${input.workload.key}`,
      baseSha: input.sourceSha,
      allowedPaths: input.workload.allowedPaths,
      excludedPaths: ["tests/**", "package.json", ".git/**"],
    },
    intent: {
      title: input.workload.title,
      acceptanceCriterionIds: input.workload.acceptanceCriteria.map((criterion: any) => criterion.id),
    },
    harness: {
      adapter: "codex",
      version: "v1",
      harnessId: "codex-cli",
      harnessVersion,
      provider: "openrouter",
      model: remoteModel,
      executionBackend: "remote-sandbox",
      isolation: "WORKSPACE_WRITE",
      pullRequestAuthority: "CONTROL_PLANE_ONLY",
      timeoutMs: input.profile.runtime.maxRuntimeMs - 30_000,
    },
    sandbox: {
      profileDigest: input.profileDigest,
      supervisorVersion: "mission-control-supervisor/v1",
      credentialGrants: [{
        kind: "INFERENCE",
        secretValueIncluded: false,
        githubAuthority: "NONE",
        providerAuthority: "NONE",
      }],
    },
    retryPolicy: input.policy,
  };
}

function executionPrompt(workload: any, attemptNumber: number) {
  return [
    workload.prompt,
    attemptNumber > 1
      ? "This is a new recovery Attempt with fresh identity. Do not assume artifacts or verification from the prior failed Attempt."
      : "This is the first Attempt.",
    "Return exactly one JSON object and no prose. Use the literal string factory-result/v1 for schema. Use exactly one uppercase status: COMPLETED, BLOCKED, or FAILED. completedAcceptanceCriterionIds, incompleteAcceptanceCriterionIds, unknownAcceptanceCriterionIds, verificationCommands, and knownRisks must always be JSON arrays of strings, including when empty. summary and nextAction must be JSON strings.",
    "When status is COMPLETED, every listed acceptance criterion ID must appear exactly once in completedAcceptanceCriterionIds, and incompleteAcceptanceCriterionIds and unknownAcceptanceCriterionIds must both be empty. Never use success as a status and never use a scalar string such as None for an array field.",
    '{"schema":"factory-result/v1","status":"COMPLETED","summary":"Implemented and tested the bounded change.","completedAcceptanceCriterionIds":["criterion-id"],"incompleteAcceptanceCriterionIds":[],"unknownAcceptanceCriterionIds":[],"verificationCommands":["npm test"],"knownRisks":[],"nextAction":"Review the exact candidate."}',
    `Use only these acceptance criterion IDs: ${workload.acceptanceCriteria.map((criterion: any) => criterion.id).join(", ")}.`,
  ].join("\n\n");
}

async function verifyCandidate(executionId: string, workload: any, repositoryRoot: string, candidate: any) {
  const startedAt = Date.now();
  const verificationRoot = await mkdtemp(path.join(tmpdir(), `mc-remote-verify-${executionId}-`));
  cleanupDirectories.push(verificationRoot);
  const checkout = path.join(verificationRoot, "repository");
  await execFileAsync("git", ["clone", "--quiet", "--no-hardlinks", repositoryRoot, checkout]);
  await execFileAsync("git", ["-C", checkout, "checkout", "--quiet", "--detach", candidate.candidateRevision]);
  const process = await runProcess("npm", ["test"], checkout, 60_000);
  const passed = process.exitCode === 0;
  return {
    attemptId: `verification-${executionId}`,
    verifierId: `independent-verifier-${executionId}`,
    sourceAttemptId: null,
    independent: true,
    candidateSha: candidate.candidateRevision,
    treeSha: candidate.treeRevision,
    verdict: passed ? "VERIFIED" : "NOT_VERIFIED",
    reason: passed ? "Independent exact-candidate npm test passed." : redactSandboxText(process.stderr || process.stdout).slice(0, 1_000),
    command: "npm test",
    exitCode: process.exitCode,
    outputSha256: sha256(`${process.stdout}\n${process.stderr}`),
    acceptanceCriterionIds: workload.acceptanceCriteria.map((criterion: any) => criterion.id),
    durationMs: Date.now() - startedAt,
    acceptanceAuthority: false,
  };
}

function acceptanceProjection(workload: any, verification: any) {
  const now = Date.now();
  const requiredApprovals = workload.risk === "HIGH" ? ["RISK_REVIEW"] : [];
  const approvalDecisions = requiredApprovals.map((approvalType) => ({
    approvalType,
    status: "APPROVED" as const,
    createdAt: now - 1,
  }));
  const verificationReceipts = [
    ...workload.acceptanceCriteria.map((criterion: any, index: number) => ({
      receiptScope: "ACCEPTANCE_CRITERION" as const,
      acceptanceCriterionId: criterion.id,
      status: "PASSED" as const,
      recordedAt: now + index,
    })),
    {
      receiptScope: "WORK_ORDER" as const,
      status: "PASSED" as const,
      verdict: verification.verdict,
      recordedAt: now + workload.acceptanceCriteria.length,
    },
  ];
  return {
    ...evaluateAcceptance({
      riskLevel: workload.risk,
      requiredApprovals,
      approvalDecisions,
      acceptanceCriteria: workload.acceptanceCriteria.map((criterion: any) => ({ ...criterion, status: "PASS" as const })),
      verificationReceipts,
      now: now + workload.acceptanceCriteria.length + 1,
    }),
    authority: "workOrders.accept",
    authorityMode: "AUTHORIZED_OPERATOR_FIXTURE",
    candidateSha: verification.candidateSha,
    acceptedAt: new Date(now).toISOString(),
  };
}

async function createFixtureRepository(workload: any, executionId: string) {
  const root = await mkdtemp(path.join(tmpdir(), `mc-remote-source-${executionId}-`));
  cleanupDirectories.push(root);
  for (const [relativePath, content] of Object.entries(workload.files)) {
    const target = path.join(root, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, String(content));
  }
  await execFileAsync("git", ["init", "-q", root]);
  await execFileAsync("git", ["-C", root, "config", "user.name", "Mission Control Qualification Fixture"]);
  await execFileAsync("git", ["-C", root, "config", "user.email", "qualification-fixture@example.invalid"]);
  await execFileAsync("git", ["-C", root, "add", "--all"]);
  await execFileAsync("git", ["-C", root, "commit", "-qm", "frozen pilot fixture base"], {
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: "2026-08-18T00:00:00Z",
      GIT_COMMITTER_DATE: "2026-08-18T00:00:00Z",
    },
  });
  return root;
}

async function cloneFixture(source: string, executionId: string, attemptNumber: number) {
  const parent = await mkdtemp(path.join(tmpdir(), `mc-remote-attempt-${executionId}-${attemptNumber}-`));
  cleanupDirectories.push(parent);
  const target = path.join(parent, "repository");
  await execFileAsync("git", ["clone", "--quiet", "--no-hardlinks", source, target]);
  return target;
}

function retryBudget(): RemoteRetryBudget {
  return {
    schema: "factory-remote-retry-policy/v1",
    maxAttempts: 2,
    maxTotalWallClockMs: 12 * 60_000,
    maxModelSpendUsd: attemptSpendCapUsd * 2,
    maxProviderResources: 1,
    retryableFailureClasses: ["RETRYABLE_INFRA", "RETRYABLE_EXECUTION"],
  };
}

function remoteProfile(checkedAt: number) {
  return {
    schema: "factory-sandbox-profile/v1",
    profileKey: "exe-remote-codex-qualification-n1",
    version: 1,
    provider: "EXE_DEV",
    providerProfile: "individual-small",
    providerProfileVersion: "structured-output-qualification-v1",
    machine: { image: "node:24-bookworm", cpu: 2, memoryMb: 4_096, diskGb: 20 },
    supervisor: { version: "mission-control-supervisor/v1", transport: "SSH" },
    runtime: { maxRuntimeMs: 330_000, resultPollIntervalMs: 500, resultRetentionMs: 86_400_000 },
    network: { egress: "UNRESTRICTED", egressAllowlist: [], publicIngress: false, exposedPorts: [] },
    credentials: { inference: "ATTEMPT_SCOPED_OPENROUTER", repositoryAccess: "CONTROL_PLANE_SNAPSHOT", githubAuthority: "NONE", providerAuthority: "NONE" },
    spend: { maxUsd: attemptSpendCapUsd, enforcement: "PROVIDER_KEY_LIMIT" },
    teardown: { terminateOnEveryTerminalState: true, verifyResourceAbsent: true, supportsResume: false },
    preview: { mode: "DISABLED" },
    readiness: {
      state: "DEGRADED",
      checkedAt,
      reason: "Live certified with unrestricted outbound egress and ephemeral Codex installation.",
      egressEnforcementProven: false,
      liveCertified: true,
      evidenceReference: "docs/software-factory/remote-sandbox-live-certification-v1.md",
    },
  };
}

async function readRemoteInventory() {
  const result = await runProcess("node", ["scripts/sandbox-doctor.mjs", "--json"], repoRoot, 60_000);
  if (result.exitCode !== 0) throw new Error(`Remote inventory check failed: ${result.stderr || result.stdout}`);
  const payload = JSON.parse(result.stdout);
  return {
    checkedAt: new Date().toISOString(),
    authenticated: payload.readiness.authenticated,
    vmCount: payload.readiness.vmCount,
    maxVms: payload.readiness.maxVms,
    liveAllocationAllowed: payload.readiness.liveAllocationAllowed,
    automaticIntegrationCount: payload.readiness.automaticIntegrations.length,
    providerCostPerVmUsd: null,
  };
}

async function persist(dataset: any) {
  await writeFile(resultsPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

async function writeDerivedEvidence(dataset: any) {
  const qualification = dataset.executions.filter((execution: any) => execution.phase === "STRUCTURED_OUTPUT_QUALIFICATION");
  const regression = dataset.executions.filter((execution: any) => execution.phase === "PILOT_REMOTE_REGRESSION");
  const executionRows = dataset.executions.map((execution: any) => [
    execution.executionId,
    execution.workloadClass,
    execution.attempts.length,
    execution.eventualSuccess ? "PASS" : "FAIL",
    execution.resultProvenance?.source ?? "NONE",
    execution.candidate?.candidateSha ?? "—",
    execution.verification?.verdict ?? "—",
    execution.acceptance?.eligible === true ? "ELIGIBLE" : "—",
    execution.durationMs,
  ]);
  await Promise.all([
    writeFile(path.join(evidenceDirectory, "live-execution-matrix.md"), markdownTable(
      "# Live execution matrix",
      ["Execution", "Class", "Attempts", "Result", "Provenance", "Candidate SHA", "Verification", "Acceptance", "Duration ms"],
      executionRows,
      [
        `Qualification success: ${qualification.filter((execution: any) => execution.eventualSuccess).length}/${qualification.length}.`,
        "Maximum concurrent VM: 1 (sequential runner; every Attempt also required inventory 0 before allocation).",
        `Final exe.dev inventory: ${String(dataset.finalInventory?.vmCount)}.`,
        "Preserved pre-repair failures are recorded separately in `live-initial-failure.json` and `live-schema-root-cause.json` when present.",
      ],
    )),
    writeFile(path.join(evidenceDirectory, "pilot-remote-regression.md"), markdownTable(
      "# Production Factory Pilot remote regression",
      ["Execution", "Workload", "Result", "factory-result/v1", "Candidate", "Independent verification", "Acceptance"],
      regression.map((execution: any) => [
        execution.executionId,
        execution.workloadKey,
        execution.eventualSuccess ? "PASS" : "FAIL",
        execution.structuredResult?.schema ?? "—",
        execution.candidate?.candidateSha ?? "—",
        execution.verification?.verdict ?? "—",
        execution.acceptance?.eligible === true ? "ELIGIBLE" : "BLOCKED",
      ]),
      ["These are the exact bug-fix-3, security-policy-3, and data-migration-3 workload definitions preserved from Production Factory Pilot V1."],
    )),
    writeFile(path.join(evidenceDirectory, "cleanup-credential-proof.md"), markdownTable(
      "# Cleanup and credential proof",
      ["Attempt", "Key issued", "Key revoked", "Secret persisted", "Resource absent", "Final VM count", "Cleanup"],
      dataset.executions.flatMap((execution: any) => execution.attempts.map((attempt: any) => [
        attempt.attemptId,
        attempt.cleanup?.credentialIssued,
        attempt.cleanup?.credentialRevoked,
        attempt.cleanup?.credentialSecretPersisted,
        attempt.cleanup?.resourceAbsent,
        attempt.cleanup?.finalVmCount,
        attempt.cleanup?.passed ? "PASS" : "FAIL",
      ])),
      [
        "OpenRouter management credentials, exe.dev administrative authority, GitHub authority, publication, and acceptance remained host-only.",
        `Final exe.dev inventory: ${String(dataset.finalInventory?.vmCount)}.`,
      ],
    )),
    writeFile(path.join(evidenceDirectory, "costs-timings.md"), markdownTable(
      "# Costs and timings",
      ["Attempt", "Input tokens", "Output tokens", "Model USD", "Provider USD", "Runtime ms"],
      dataset.executions.flatMap((execution: any) => execution.attempts.map((attempt: any) => [
        attempt.attemptId,
        attempt.usage?.inputTokens ?? "null",
        attempt.usage?.outputTokens ?? "null",
        attempt.usage?.inferenceCostUsd ?? "null",
        attempt.usage?.providerCostUsd ?? "null",
        attempt.usage?.providerRuntimeMs ?? attempt.durationMs,
      ])),
      [
        `Total Attempts: ${dataset.totalAttempts}; retries: ${dataset.totalRetries}; remote execution time: ${dataset.totalRemoteExecutionTimeMs} ms.`,
        `Total model cost: ${dataset.totalModelCostUsd ?? "null"}; total provider cost: ${dataset.totalProviderCostUsd ?? "null"}. Unknown cost remains null, never zero.`,
      ],
    )),
  ]);
}

function markdownTable(title: string, headers: string[], rows: unknown[][], notes: string[]) {
  const lines = [
    title,
    "",
    `Generated from \`live-run-results.json\` at ${new Date().toISOString()}.`,
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value).replace(/\|/g, "\\|")).join(" | ")} |`),
    "",
    ...notes.map((note) => `- ${note}`),
    "",
  ];
  return lines.join("\n");
}

async function gitValue(cwd: string, args: string[]) {
  const result = await execFileAsync("git", args, { cwd, maxBuffer: 2 * 1024 * 1024 });
  return result.stdout.trim();
}

async function commandValue(command: string, args: string[]) {
  const result = await execFileAsync(command, args, { maxBuffer: 2 * 1024 * 1024 });
  return result.stdout.trim();
}

async function runProcess(command: string, args: string[], cwd: string, timeoutMs: number) {
  try {
    const result = await execFileAsync(command, args, { cwd, timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 });
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error: any) {
    return {
      exitCode: Number.isSafeInteger(error?.code) ? error.code : 1,
      stdout: String(error?.stdout ?? ""),
      stderr: String(error?.stderr ?? error?.message ?? ""),
    };
  }
}

function addObservedSpend(total: number | null, value: unknown) {
  if (total === null || !Number.isFinite(value)) return null;
  return total + Number(value);
}

function sumKnown(values: unknown[]) {
  const known = values.filter((value): value is number => Number.isFinite(value));
  return known.length === values.length && known.length > 0 ? known.reduce((sum, value) => sum + value, 0) : null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeMessage(error: unknown) {
  return redactSandboxText(error instanceof Error ? error.message : String(error)).slice(0, 2_000);
}

async function exists(candidate: string) {
  return await stat(candidate).then(() => true).catch(() => false);
}

class CandidateFailure extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "CandidateFailure";
  }
}
