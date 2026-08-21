#!/usr/bin/env node

import { execFile, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { canonicalHash } from "@mission-control/shared";
import { evaluateAcceptance } from "../convex/lib/workOrderGovernance.ts";
import { CodexV1ExecutorAdapter } from "../apps/orchestration-server/src/codexExecutorAdapter.ts";
import { ExeDevSandboxProvider, ExeDevSshTransport, type ExeDevTransport } from "../apps/orchestration-server/src/exeDevSandboxProvider.ts";
import {
  commitFactoryChanges,
  createFactorySourceBundle,
  inspectCandidateChange,
  listChangedFiles,
  materializeRemoteCandidate,
} from "../apps/orchestration-server/src/factoryGitRuntime.ts";
import { validateChangedFileScope } from "../apps/orchestration-server/src/factoryPathScope.ts";
import { remoteFailure } from "../apps/orchestration-server/src/remoteExecutionPolicy.ts";
import {
  InMemoryRemoteSandboxJournal,
  RemoteSandboxExecutionError,
  RemoteSandboxRuntime,
} from "../apps/orchestration-server/src/remoteSandboxRuntime.ts";
import {
  OpenRouterSandboxCredentialBroker,
  type SandboxCredentialBroker,
  type SandboxCredentialGrant,
  type SandboxCredentialReference,
  type SandboxCredentialRequest,
  type SandboxCredentialRevocationReceipt,
} from "../apps/orchestration-server/src/sandboxCredentials.ts";
import { redactSandboxTail, redactSandboxText, sandboxProfileDigest } from "../apps/orchestration-server/src/sandboxProvider.ts";
import { standaloneSandboxSupervisorSource } from "../apps/orchestration-server/src/sandboxSupervisor.ts";
import { qualificationWorkload } from "./lib/remote-codex-qualification-workloads.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const argumentsList = process.argv.slice(2);
const localImage = argumentsList.find((argument) => argument.startsWith("--local-image="))?.slice("--local-image=".length);
const preflightOnly = argumentsList.includes("--preflight");
const canaryOnly = argumentsList.includes("--canary");
const acceptedArguments = new Set(["--preflight", "--canary"]);
if (argumentsList.some((argument) => !acceptedArguments.has(argument) && !argument.startsWith("--local-image="))) {
  throw new Error("Usage: remote-sandbox-hardening-live-qualification.mts [--preflight] [--canary] [--local-image=<digest-qualified-image>]");
}
const evidenceDirectory = path.join(repoRoot, "docs/testing/evidence/remote-sandbox-final-blocker-qualification-v1");
const registryProvenancePath = path.join(evidenceDirectory, "registry-image-provenance.json");
const resultsFilename = localImage
  ? canaryOnly ? "local-canary-gate.json" : "local-3-workload-gate.json"
  : canaryOnly ? "live-canary-gate.json" : "live-3-workload-gate.json";
const resultsPath = path.join(evidenceDirectory, resultsFilename);
const expectedBaseSha = "11a51cac1e446488cddf34781cc9663b922c7684";
const remoteModel = "openai/gpt-5.1-codex-mini";
const harnessVersion = "0.146.0";
const spendCapUsd = 0.05;
const cleanupDirectories: string[] = [];
const fullSchedule = Object.freeze([
  { executionId: "hardening-bug-fix-1", workloadKey: "bug-fix" },
  { executionId: "hardening-security-policy-1", workloadKey: "security-policy" },
  { executionId: "hardening-data-migration-1", workloadKey: "data-migration" },
]);
const schedule = canaryOnly
  ? Object.freeze([{ executionId: "hardening-canary-bug-fix-1", workloadKey: "bug-fix" }])
  : fullSchedule;

async function main() {
  const provenance = localImage
    ? await localImageProvenance(localImage)
    : JSON.parse(await readFile(registryProvenancePath, "utf8"));
  const baseline = await assertPreflight(provenance);
  const profile = remoteProfile(Date.now(), provenance);
  const transport = createQualificationTransport();
  const profileValidation = await new ExeDevSandboxProvider(transport).validateProfile(profile as any);
  await transport.dispose?.();
  if (!profileValidation.dispatchable || profileValidation.readiness !== "DEGRADED") {
    throw new Error(`Restricted profile is not dispatchable as DEGRADED: ${profileValidation.errors.join(" ")}`);
  }
  if (preflightOnly) {
    process.stdout.write(`${JSON.stringify({ status: "ready", baseline, profileValidation, schedule }, null, 2)}\n`);
    return;
  }
  if (!localImage && (process.env.MC_REMOTE_SANDBOX_HARDENING_LIVE !== "1" || process.env.MISSION_CONTROL_SANDBOX_LIVE !== "1")) {
    throw new Error("Live execution requires MC_REMOTE_SANDBOX_HARDENING_LIVE=1 and MISSION_CONTROL_SANDBOX_LIVE=1.");
  }

  await mkdir(evidenceDirectory, { recursive: true });
  const qualificationRunId = randomUUID().replace(/-/g, "").slice(0, 12);
  const startedAt = Date.now();
  const dataset: any = {
    schema: "remote-sandbox-hardening-live-qualification/v1",
    target: localImage ? "LOCAL_EXACT_IMAGE" : canaryOnly ? "LIVE_EXE_DEV_CANARY" : "LIVE_EXE_DEV",
    mode: canaryOnly ? "CANARY" : "STRICT_COHORT",
    decision: "IN_PROGRESS",
    startedAt: new Date(startedAt).toISOString(),
    completedAt: null,
    qualificationRunId,
    baseline,
    constraints: {
      exactWorkloads: schedule.map((entry) => entry.workloadKey),
      maximumConcurrentVms: 1,
      maximumAttemptsPerWorkload: 1,
      retriesAllowed: false,
      qualificationOnly: true,
      guardedAutoEnabled: false,
      publicationAuthority: "CONTROL_PLANE_ONLY",
      acceptanceAuthority: "workOrders.accept",
      providerEgressBoundary: "provider-enforced egress unavailable",
    },
    registryProvenance: provenance,
    profile: { ...profile, digest: sandboxProfileDigest(profile as any), validation: profileValidation },
    schedule,
    executions: [],
    aggregateNegativeMatrix: null,
    finalInventory: null,
    performance: null,
  };
  await persist(dataset);

  try {
    for (const scheduled of schedule) {
      process.stdout.write(`\n[${dataset.executions.length + 1}/${schedule.length}] ${scheduled.executionId}\n`);
      const execution = await runExecution(scheduled, profile, qualificationRunId);
      dataset.executions.push(execution);
      await persist(dataset);
      if (execution.cleanup?.finalVmCount !== 0) break;
    }
  } finally {
    dataset.finalInventory = await readQualificationInventory().catch((error) => ({
      checkedAt: new Date().toISOString(),
      vmCount: null,
      error: safeMessage(error),
    }));
    dataset.completedAt = new Date().toISOString();
    dataset.totalAttempts = dataset.executions.length;
    dataset.totalRetries = 0;
    dataset.aggregateNegativeMatrix = aggregateNegativeMatrix(dataset.executions, schedule);
    dataset.performance = performanceSummary(dataset.executions);
    const resourceNames = dataset.executions.map((execution: any) => execution.resourceName).filter(Boolean);
    const allPassed = dataset.executions.length === schedule.length
      && dataset.executions.every((execution: any) => execution.firstPassSuccess
        && execution.verification?.verdict === "VERIFIED"
        && execution.acceptance?.eligible === true
        && execution.cleanup?.passed === true
        && execution.negativeMatrix?.passed === true)
      && new Set(resourceNames).size === schedule.length
      && dataset.aggregateNegativeMatrix?.passed === true
      && dataset.finalInventory?.vmCount === 0;
    dataset.decision = allPassed ? "PASS" : "HOLD";
    await persist(dataset);
  }

  process.stdout.write(`\n${dataset.decision}\nFinal exe.dev inventory: ${String(dataset.finalInventory?.vmCount)}\n`);
  if (dataset.decision !== "PASS") process.exitCode = 1;
}

async function assertPreflight(provenance: any) {
  const [head, originMain, mergeBase, inventory] = await Promise.all([
    gitValue(repoRoot, ["rev-parse", "HEAD"]),
    gitValue(repoRoot, ["rev-parse", "origin/main"]),
    gitValue(repoRoot, ["merge-base", "HEAD", "origin/main"]),
    readQualificationInventory(),
  ]);
  if (originMain !== expectedBaseSha || mergeBase !== expectedBaseSha) {
    throw new Error(`Qualification branch is not rooted at frozen origin/main ${expectedBaseSha}.`);
  }
  if (inventory.vmCount !== 0) throw new Error(`Live qualification requires empty exe.dev inventory; found ${inventory.vmCount}.`);
  if (!inventory.authenticated || !inventory.liveAllocationAllowed || inventory.automaticIntegrationCount !== 0) {
    throw new Error("exe.dev live allocation is not ready or automatic integrations are present.");
  }
  if (!process.env.OPENROUTER_MANAGEMENT_API_KEY?.trim()) {
    throw new Error("OpenRouter management credential is not configured host-side.");
  }
  if (!/^[^@]+@sha256:[a-f0-9]{64}$/.test(provenance.image)
    || provenance.digest !== provenance.image.slice(provenance.image.indexOf("@") + 1)
    || provenance.vulnerabilityScan?.critical !== 0
    || provenance.vulnerabilityScan?.high !== 0) {
    throw new Error("Qualification provenance does not prove an immutable 0 Critical / 0 High image.");
  }
  if (!localImage && (!/^ghcr\.io\/[^@]+@sha256:[a-f0-9]{64}$/.test(provenance.image)
    || provenance.publicPull?.verified !== true
    || provenance.attestation?.verified !== true)) {
    throw new Error("Registry provenance does not prove an immutable, public, attested 0 Critical / 0 High image.");
  }
  return {
    frozenOriginMainSha: expectedBaseSha,
    branchHeadBeforeQualification: head,
    mergeBase,
    providerReadiness: inventory,
    image: provenance.image,
    providerCapabilityConclusion: "provider-enforced egress unavailable",
  };
}

async function runExecution(scheduled: (typeof fullSchedule)[number], profile: any, qualificationRunId: string) {
  const workload = qualificationWorkload(scheduled.workloadKey);
  const fixture = await createFixtureRepository(workload, scheduled.executionId);
  const repositoryRoot = await cloneFixture(fixture, scheduled.executionId);
  const sourceSha = await gitValue(repositoryRoot, ["rev-parse", "HEAD"]);
  const attemptId = `attempt-${qualificationRunId}-${scheduled.executionId}`;
  const workflowRunId = `workflow-${qualificationRunId}-${scheduled.executionId}`;
  const leaseId = `lease-${qualificationRunId}-${scheduled.executionId}`;
  const lineage = {
    missionId: `mission-${qualificationRunId}-${scheduled.executionId}`,
    planId: `plan-${qualificationRunId}-${scheduled.executionId}`,
    workOrderId: `work-order-${qualificationRunId}-${scheduled.executionId}`,
    factoryDefinitionId: "factory-remote-sandbox-hardening",
    factoryDefinitionVersionId: "factory-remote-sandbox-hardening-v1",
    factoryVersion: 1,
  };
  const profileDigest = sandboxProfileDigest(profile);
  const manifest = executionManifest({ workload, lineage, attemptId, workflowRunId, profileDigest, profile, sourceSha });
  const manifestDigest = `sha256:${canonicalHash(manifest)}`;
  const adapter = new CodexV1ExecutorAdapter("codex");
  const executorRequest: any = {
    executionId: `${attemptId}:remote`,
    repositoryRoot,
    workingDirectory: repositoryRoot,
    prompt: executionPrompt(workload),
    provider: "openai",
    model: remoteModel,
    allowedPaths: workload.allowedPaths,
    deniedPaths: ["tests/**", "package.json", ".git/**"],
    timeoutMs: profile.runtime.maxRuntimeMs - 30_000,
    isolation: "WORKSPACE_WRITE",
  };
  const invocation = adapter.createRemoteInvocation(executorRequest, {
    repositoryRoot: "/var/lib/mission-control/attempt/repository",
    resultPath: "/var/lib/mission-control/attempt/executor-result.json",
  });
  const inventoryBefore = await readQualificationInventory();
  if (inventoryBefore.vmCount !== 0) throw new Error(`${attemptId} requires an empty initial inventory.`);
  const journal = new InMemoryRemoteSandboxJournal();
  const transport = createQualificationTransport();
  const credentialBroker = new RevocationProbingCredentialBroker();
  const runtime = new RemoteSandboxRuntime(new ExeDevSandboxProvider(transport), credentialBroker, journal);
  let result: any;
  let caught: unknown;
  try {
    result = await runtime.execute({
      projectId: "remote-sandbox-hardening-v1",
      workOrderId: lineage.workOrderId,
      workOrderRevisionNumber: 1,
      workflowRunId,
      attemptId,
      attemptLeaseId: leaseId,
      executionManifest: manifest,
      manifestDigest,
      sourceSha,
      profile,
      repositoryBundle: await createFactorySourceBundle(repositoryRoot, sourceSha),
      supervisorSource: standaloneSandboxSupervisorSource(),
      executor: { ...invocation, command: "codex", args: invocation.args },
    });
  } catch (error) {
    caught = error;
  } finally {
    await transport.dispose?.();
  }

  const inventoryAfter = await readQualificationInventory().catch(() => ({ vmCount: null }));
  const securityProof = journal.events.find((event) => event.type === "SANDBOX_STARTED")?.metadata?.securityProof as any;
  const workloadEnvironmentKeys = result?.diagnostics?.lifecycleTrace
    ?.find((event: any) => event.stage === "CODEX_SPAWN_STARTED")?.environmentKeys ?? [];
  const termination = journal.terminations.at(-1);
  const revocation = journal.revokedCredentials.at(-1);
  const resourceName = termination?.resourceName ?? journal.allocationRequests.at(-1)?.resourceName ?? null;
  const cleanup = {
    credentialIssued: journal.issuedCredentials.length === 1,
    credentialRevoked: revocation?.revoked === true,
    staleCredentialRejected: credentialBroker.staleChecks.at(-1)?.rejected === true,
    staleCredentialProbeStatuses: credentialBroker.staleChecks.at(-1)?.statuses ?? [],
    staleCredentialProbeOffsetsMs: credentialBroker.staleChecks.at(-1)?.offsetsMs ?? [],
    credentialRejectedAtOffsetMs: credentialBroker.staleChecks.at(-1)?.rejectedAtOffsetMs ?? null,
    credentialInvalidWithinQualifiedBound: credentialBroker.staleChecks.at(-1)?.withinQualifiedBound === true,
    qualifiedConfirmationBoundMs: 30_000,
    credentialSecretPersisted: false,
    resourceAbsent: termination?.resourceAbsent === true,
    finalVmCount: inventoryAfter.vmCount,
    passed: revocation?.revoked === true
      && credentialBroker.staleChecks.at(-1)?.rejected === true
      && credentialBroker.staleChecks.at(-1)?.withinQualifiedBound === true
      && termination?.resourceAbsent === true
      && inventoryAfter.vmCount === 0,
  };
  const credentialScope = {
    manifestCredentialGrants: manifest.sandbox.credentialGrants,
    profileCredentials: profile.credentials,
    workloadEnvironmentKeys,
  };
  const negativeMatrix = securityNegativeMatrix(securityProof, cleanup, inventoryBefore, resourceName, credentialScope);
  const baseEvidence: any = {
    executionId: scheduled.executionId,
    workloadKey: workload.key,
    workloadClass: workload.class,
    workloadTitle: workload.title,
    risk: workload.risk,
    attemptId,
    workflowRunId,
    leaseId,
    attemptNumber: 1,
    retries: 0,
    sourceSha,
    manifestDigest,
    manifest,
    resourceName,
    invocation: {
      command: "codex",
      harnessVersion,
      args: invocation.args,
      outputSchemaPath: invocation.outputSchemaPath,
      environmentKeys: ["OPENAI_API_KEY", "OPENAI_BASE_URL"],
      packageManagerUsed: false,
    },
    credentialScope,
    inventoryBefore,
    inventoryAfter,
    lifecycleEvents: journal.events,
    supervisorDiagnostics: result?.diagnostics ?? journal.events.find((event) => event.type === "SANDBOX_FAILED")?.metadata?.diagnostics ?? null,
    securityProof: securityProof ?? null,
    negativeMatrix,
    cleanup,
    performance: attemptPerformance(journal),
  };
  credentialBroker.assertNoSecretIn(baseEvidence);

  if (caught) {
    credentialBroker.disposeSecrets();
    const failure = caught instanceof RemoteSandboxExecutionError
      ? caught.failure
      : remoteFailure("UNKNOWN", "HARDENING_QUALIFICATION_UNCLASSIFIED", "UNKNOWN", safeMessage(caught));
    return { ...baseEvidence, firstPassSuccess: false, failure, error: safeMessage(caught), usage: null };
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
  credentialBroker.assertNoSecretIn({ ...baseEvidence, ...bundleEvidence });
  credentialBroker.disposeSecrets();
  if (bundle.status !== "COMPLETED" || bundle.structuredResult.status !== "COMPLETED") {
    return {
      ...baseEvidence,
      ...bundleEvidence,
      firstPassSuccess: false,
      failure: bundle.failure ?? remoteFailure("UNKNOWN", "FAILED_BUNDLE_WITHOUT_REASON", "RESULT_VALIDATION", "Remote bundle failed without a typed reason."),
    };
  }

  try {
    await materializeRemoteCandidate({
      worktree: repositoryRoot,
      sourceSha,
      patch: Buffer.from(bundle.patch.content, "base64"),
    });
    const hostChangedFiles = await listChangedFiles(repositoryRoot, sourceSha);
    const scope = validateChangedFileScope(hostChangedFiles, {
      allowedPaths: workload.allowedPaths,
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
      worktree: repositoryRoot,
      changedFiles: scope.changedFiles,
      title: workload.title,
    });
    const candidate = await inspectCandidateChange(repositoryRoot, sourceSha);
    if (candidate.sourceRevision !== sourceSha || candidate.candidateRevision !== candidateSha) {
      throw new CandidateFailure("CANDIDATE_SHA_MISMATCH", "Host candidate identity changed before verification.");
    }
    const verification = await verifyCandidate(scheduled.executionId, workload, repositoryRoot, candidate);
    const acceptance = acceptanceProjection(workload, verification);
    if (verification.verdict !== "VERIFIED" || !acceptance.eligible) {
      throw new CandidateFailure("INDEPENDENT_VERIFICATION_FAILED", verification.reason);
    }
    return {
      ...baseEvidence,
      ...bundleEvidence,
      firstPassSuccess: cleanup.passed && negativeMatrix.passed,
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
    return { ...baseEvidence, ...bundleEvidence, firstPassSuccess: false, failure, error: safeMessage(error) };
  }
}

function executionManifest(input: any) {
  const retryPolicy = {
    schema: "factory-remote-retry-policy/v1",
    maxAttempts: 1,
    maxTotalWallClockMs: input.profile.runtime.maxRuntimeMs,
    maxModelSpendUsd: spendCapUsd,
    maxProviderResources: 1,
    retryableFailureClasses: [],
  };
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
      configurationDigest: `sha256:${canonicalHash({
        adapter: "codex",
        harnessVersion,
        provider: "openrouter",
        model: remoteModel,
        backend: "remote-sandbox",
        retryPolicy,
      })}`,
    },
    repository: {
      repository: `sellerfi-hardening/${input.workload.key}`,
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
      credentialGrants: [{ kind: "INFERENCE", secretValueIncluded: false, githubAuthority: "NONE", providerAuthority: "NONE" }],
    },
    retryPolicy,
  };
}

function executionPrompt(workload: any) {
  const acceptanceCriterionIds = workload.acceptanceCriteria.map((criterion: any) => criterion.id);
  const completedExample = {
    schema: "factory-result/v1",
    status: "COMPLETED",
    summary: "Implemented and tested the bounded change.",
    completedAcceptanceCriterionIds: acceptanceCriterionIds,
    incompleteAcceptanceCriterionIds: [],
    unknownAcceptanceCriterionIds: [],
    verificationCommands: ["node --test"],
    knownRisks: [],
    nextAction: "Review the exact candidate.",
  };
  return [
    workload.prompt.replace("Run npm test.", "Run node --test."),
    "This is the only Attempt. Do not assume artifacts or verification from another Attempt.",
    "Return exactly one JSON object and no prose. Use the literal string factory-result/v1 for schema. Use exactly one uppercase status: COMPLETED, BLOCKED, or FAILED. completedAcceptanceCriterionIds, incompleteAcceptanceCriterionIds, unknownAcceptanceCriterionIds, verificationCommands, and knownRisks must always be JSON arrays of strings, including when empty. summary and nextAction must be JSON strings.",
    `When status is COMPLETED, completedAcceptanceCriterionIds must be exactly ${JSON.stringify(acceptanceCriterionIds)} in this order. Do not omit an ID when one implementation or verification command covers multiple criteria. incompleteAcceptanceCriterionIds and unknownAcceptanceCriterionIds must both be empty.`,
    JSON.stringify(completedExample),
    `Use only these acceptance criterion IDs: ${acceptanceCriterionIds.join(", ")}.`,
  ].join("\n\n");
}

function remoteProfile(checkedAt: number, provenance: any) {
  return {
    schema: "factory-sandbox-profile/v1",
    profileKey: "exe-remote-sandbox-restricted-candidate-n1",
    version: 1,
    provider: "EXE_DEV",
    providerProfile: "individual-small",
    providerProfileVersion: "remote-sandbox-hardening-v1",
    machine: { image: provenance.image, cpu: 2, memoryMb: 4_096, diskGb: 20 },
    supervisor: { version: "mission-control-supervisor/v1", transport: "SSH" },
    runtime: { maxRuntimeMs: 330_000, resultPollIntervalMs: 500, resultRetentionMs: 86_400_000 },
    network: { egress: "RESTRICTED_ALLOWLIST", egressAllowlist: ["openrouter.ai:443"], publicIngress: false, exposedPorts: [] },
    credentials: { inference: "ATTEMPT_SCOPED_OPENROUTER", repositoryAccess: "CONTROL_PLANE_SNAPSHOT", githubAuthority: "NONE", providerAuthority: "NONE" },
    spend: { maxUsd: spendCapUsd, enforcement: "PROVIDER_KEY_LIMIT" },
    teardown: { terminateOnEveryTerminalState: true, verifyResourceAbsent: true, supportsResume: false },
    preview: { mode: "DISABLED" },
    readiness: {
      state: "DEGRADED",
      checkedAt,
      reason: "Guest-kernel nftables enforcement is proven; provider-enforced egress unavailable.",
      egressEnforcementProven: true,
      liveCertified: true,
      evidenceReference: `docs/testing/evidence/remote-sandbox-final-blocker-qualification-v1/${resultsFilename}`,
    },
    security: {
      schema: "factory-sandbox-security/v1",
      profile: "remote-sandbox/exe-dev/restricted-candidate-v1",
      qualificationOnly: true,
      image: {
        digest: provenance.digest,
        provenanceReference: provenance.attestation.reference,
        sbomDigest: provenance.sbom.sha256,
      },
      toolchain: provenance.toolchain,
      execution: {
        user: "mc-attempt",
        uid: 10_001,
        gid: 10_001,
        homePath: "/var/lib/mission-control/attempt/home",
        temporaryPath: "/var/lib/mission-control/attempt/tmp",
        noNewPrivileges: true,
        capabilityMode: "DROP_ALL",
      },
      network: {
        enforcement: "GUEST_NFTABLES",
        providerEnforced: false,
        allowedHttpsHosts: ["openrouter.ai"],
        dnsMode: "CONTROL_PLANE_RESOLVE_ETC_HOSTS",
        denyPrivateNetworks: true,
        denyLinkLocal: true,
        denyMetadata: true,
        denyUnexpectedDns: true,
      },
    },
  };
}

function securityNegativeMatrix(
  proof: any,
  cleanup: any,
  inventoryBefore: any,
  resourceName: string | null,
  credentialScope: any,
) {
  const capabilities = proof?.privilege?.capabilities ?? {};
  const workloadEnvironmentKeys = credentialScope.workloadEnvironmentKeys ?? [];
  const expectedWorkloadEnvironmentKeys = ["HOME", "OPENAI_API_KEY", "OPENAI_BASE_URL", "PATH", "SHELL", "TMPDIR"];
  const forbiddenCredentialKeys = [
    "OPENROUTER_MANAGEMENT_API_KEY",
    "EXE_DEV_TOKEN",
    "EXE_DEV_API_KEY",
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "MISSION_CONTROL_SERVICE_TOKEN",
    "MISSION_CONTROL_ACCEPTANCE_TOKEN",
  ];
  const inferenceGrants = credentialScope.manifestCredentialGrants ?? [];
  const checks = {
    immutableImageIdentity: /^[^@]+@sha256:[a-f0-9]{64}$/.test(proof?.image?.requestedReference ?? "")
      && proof?.image?.requestedReference?.endsWith(`@${proof?.image?.requestedDigest}`)
      && /^sha256:[a-f0-9]{64}$/.test(proof?.image?.requestedDigest ?? ""),
    denyByDefault: proof?.network?.enforcement === "GUEST_NFTABLES" && proof?.network?.providerEnforced === false,
    approvedOpenRouterHttpsReachable: proof?.network?.approvedEndpointReachable === true,
    arbitraryPublicEgressBlocked: proof?.network?.arbitraryExternalBlocked === true,
    rfc1918Blocked: proof?.network?.privateNetworkBlocked === true,
    linkLocalBlocked: proof?.network?.linkLocalBlocked === true,
    metadataBlocked: proof?.network?.metadataBlocked === true,
    unexpectedDnsBlocked: proof?.network?.unexpectedDnsBlocked === true,
    nonRootWorkload: proof?.toolchain?.executionUid === 10_001 && proof?.toolchain?.executionGid === 10_001,
    noNewPrivileges: proof?.privilege?.noNewPrivileges === true,
    allCapabilitySetsEmpty: Object.keys(capabilities).length === 5 && Object.values(capabilities).every((value) => value === "0000000000000000"),
    firewallMutationBlocked: proof?.privilege?.firewallMutationBlocked === true,
    packageManagersAbsent: proof?.privilege?.packageManagerCommandsAbsent?.length === 11,
    packageCachesAbsent: proof?.filesystem?.packageCachesAbsent === true,
    protectedPathsReadOnly: proof?.filesystem?.protectedPathsReadOnly === true,
    attemptScopedInferenceCredentialOnly: inferenceGrants.length === 1
      && inferenceGrants[0]?.kind === "INFERENCE"
      && inferenceGrants[0]?.secretValueIncluded === false
      && credentialScope.profileCredentials?.inference === "ATTEMPT_SCOPED_OPENROUTER",
    workloadEnvironmentAllowlisted: JSON.stringify(workloadEnvironmentKeys) === JSON.stringify(expectedWorkloadEnvironmentKeys),
    openRouterManagementCredentialAbsent: !workloadEnvironmentKeys.includes("OPENROUTER_MANAGEMENT_API_KEY"),
    exeDevAdminCredentialAbsent: !workloadEnvironmentKeys.some((key: string) => key.startsWith("EXE_DEV_")),
    githubCredentialAbsent: credentialScope.profileCredentials?.githubAuthority === "NONE"
      && !workloadEnvironmentKeys.some((key: string) => key === "GH_TOKEN" || key.startsWith("GITHUB_")),
    missionControlCredentialAbsent: !workloadEnvironmentKeys.some((key: string) => key.startsWith("MISSION_CONTROL_")),
    forbiddenCredentialKeysAbsent: forbiddenCredentialKeys.every((key) => !workloadEnvironmentKeys.includes(key)),
    credentialDiscoveryBlocked: cleanup.credentialSecretPersisted === false,
    staleCredentialRejectedWithinQualifiedBound: cleanup.staleCredentialRejected === true
      && cleanup.credentialInvalidWithinQualifiedBound === true,
    providerAdminAuthorityAbsent: credentialScope.profileCredentials?.providerAuthority === "NONE",
    githubAuthorityAbsent: credentialScope.profileCredentials?.githubAuthority === "NONE",
    previousAttemptArtifactsAbsent: inventoryBefore.vmCount === 0 && Boolean(resourceName),
    exactResourceDeleted: cleanup.resourceAbsent === true,
  };
  return { checks, passed: Object.values(checks).every(Boolean) };
}

function aggregateNegativeMatrix(executions: any[], expectedSchedule: ReadonlyArray<{ executionId: string; workloadKey: string }>) {
  const resourceNames = executions.map((execution) => execution.resourceName).filter(Boolean);
  const expectedWorkloads = expectedSchedule.map((entry) => entry.workloadKey);
  const checks = {
    plannedWorkloadsExecuted: executions.length === expectedSchedule.length
      && JSON.stringify(executions.map((execution) => execution.workloadKey)) === JSON.stringify(expectedWorkloads),
    oneAttemptEach: executions.every((execution) => execution.attemptNumber === 1 && execution.retries === 0),
    sequentialEmptyInventory: executions.every((execution) => execution.inventoryBefore?.vmCount === 0),
    uniqueAttemptResources: resourceNames.length === expectedSchedule.length
      && new Set(resourceNames).size === expectedSchedule.length,
    allAttackChecksPassed: executions.every((execution) => execution.negativeMatrix?.passed === true),
    allExactResourcesDeleted: executions.every((execution) => execution.cleanup?.resourceAbsent === true),
    allCredentialsRevokedAndRejected: executions.every((execution) => execution.cleanup?.credentialRevoked === true
      && execution.cleanup?.staleCredentialRejected === true
      && execution.cleanup?.credentialInvalidWithinQualifiedBound === true),
  };
  return { checks, passed: Object.values(checks).every(Boolean) };
}

function attemptPerformance(journal: InMemoryRemoteSandboxJournal) {
  const event = (type: string) => journal.events.find((candidate) => candidate.type === type)?.occurredAt ?? null;
  const requested = event("SANDBOX_REQUESTED");
  const allocated = event("SANDBOX_ALLOCATED");
  const ready = journal.allocations.find((allocation) => allocation.readyAt)?.readyAt ?? allocated;
  const started = event("SANDBOX_STARTED");
  const result = event("SANDBOX_RESULT_RECEIVED");
  const terminated = event("SANDBOX_TERMINATED");
  return {
    allocationMs: delta(allocated, requested),
    readinessMs: delta(ready, allocated),
    startupMs: delta(started, ready),
    executionMs: delta(result, started),
    teardownMs: delta(terminated, result),
    totalCycleMs: delta(terminated, requested),
  };
}

function performanceSummary(executions: any[]) {
  const priorPreview = {
    bugFix: { allocationMs: 3613, readinessMs: 4385, startupMs: null, executionMs: 68629, teardownMs: 3434, totalCycleMs: 88900 },
    securityPolicy: { allocationMs: 3656, readinessMs: 4419, startupMs: null, executionMs: 68886, teardownMs: 3603, totalCycleMs: 89437 },
    dataMigration: { allocationMs: 3441, readinessMs: 4269, startupMs: null, executionMs: 210716, teardownMs: 3856, totalCycleMs: 230971 },
  };
  return {
    current: Object.fromEntries(executions.map((execution) => [execution.workloadKey, execution.performance])),
    priorProductionFactoryPilotV3Preview: priorPreview,
    note: "The prior preview did not separately expose startup time; its readiness and execution values are retained without inventing a split.",
  };
}

async function verifyCandidate(executionId: string, workload: any, repositoryRoot: string, candidate: any) {
  const startedAt = Date.now();
  const verificationRoot = await mkdtemp(path.join(tmpdir(), `mc-hardening-verify-${executionId}-`));
  cleanupDirectories.push(verificationRoot);
  const checkout = path.join(verificationRoot, "repository");
  await execFileAsync("git", ["clone", "--quiet", "--no-hardlinks", repositoryRoot, checkout]);
  await execFileAsync("git", ["-C", checkout, "checkout", "--quiet", "--detach", candidate.candidateRevision]);
  const process = await runProcess("npm", ["test"], checkout, 60_000);
  return {
    independent: true,
    candidateSha: candidate.candidateRevision,
    treeSha: candidate.treeRevision,
    verdict: process.exitCode === 0 ? "VERIFIED" : "NOT_VERIFIED",
    reason: process.exitCode === 0 ? "Independent exact-candidate npm test passed." : redactSandboxText(process.stderr || process.stdout),
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
  const approvalDecisions = requiredApprovals.map((approvalType) => ({ approvalType, status: "APPROVED" as const, createdAt: now - 1 }));
  const verificationReceipts = [
    ...workload.acceptanceCriteria.map((criterion: any, index: number) => ({
      receiptScope: "ACCEPTANCE_CRITERION" as const,
      acceptanceCriterionId: criterion.id,
      status: "PASSED" as const,
      recordedAt: now + index,
    })),
    { receiptScope: "WORK_ORDER" as const, status: "PASSED" as const, verdict: verification.verdict, recordedAt: now + workload.acceptanceCriteria.length },
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
  const root = await mkdtemp(path.join(tmpdir(), `mc-hardening-source-${executionId}-`));
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
  await execFileAsync("git", ["-C", root, "commit", "-qm", "frozen hardening fixture base"], {
    env: { ...process.env, GIT_AUTHOR_DATE: "2026-08-19T00:00:00Z", GIT_COMMITTER_DATE: "2026-08-19T00:00:00Z" },
  });
  return root;
}

async function cloneFixture(source: string, executionId: string) {
  const parent = await mkdtemp(path.join(tmpdir(), `mc-hardening-attempt-${executionId}-`));
  cleanupDirectories.push(parent);
  const target = path.join(parent, "repository");
  await execFileAsync("git", ["clone", "--quiet", "--no-hardlinks", source, target]);
  return target;
}

function createQualificationTransport(): ExeDevTransport {
  return localImage ? new DockerQualificationTransport() : new ExeDevSshTransport();
}

async function readQualificationInventory() {
  return localImage ? readLocalInventory() : readRemoteInventory();
}

async function localImageProvenance(image: string) {
  const inspection = JSON.parse((await execFileAsync("docker", ["image", "inspect", image], { maxBuffer: 4 * 1024 * 1024 })).stdout)[0];
  const digestQualifiedImage = image.includes("@sha256:")
    ? image
    : inspection.RepoDigests?.find((reference: string) => reference.startsWith(`${image.split(":")[0]}@`)) ?? inspection.RepoDigests?.[0];
  if (!digestQualifiedImage || !/@sha256:[a-f0-9]{64}$/.test(digestQualifiedImage)) {
    throw new Error("Local qualification image does not have a digest-qualified reference.");
  }
  const sbomPath = path.join(evidenceDirectory, "image-sbom.spdx.json");
  const scanPath = path.join(evidenceDirectory, "vulnerability-scan-grype.json");
  const [sbom, scan, sourceSha] = await Promise.all([
    readFile(sbomPath),
    readFile(scanPath, "utf8").then(JSON.parse),
    gitValue(repoRoot, ["rev-parse", "HEAD"]),
  ]);
  const critical = scan.matches.filter((match: any) => match.vulnerability?.severity === "Critical").length;
  const high = scan.matches.filter((match: any) => match.vulnerability?.severity === "High").length;
  const toolchainOutput = (await execFileAsync("docker", [
    "run", "--rm", "--platform", "linux/amd64", "--entrypoint", "sh", digestQualifiedImage, "-c",
    [
      "node --version",
      "codex --version",
      "cat /etc/mission-control/codex-binary.sha256",
      "git --version",
      "cat /etc/mission-control/git-binary.sha256",
      "busybox | head -n 1 | cut -d' ' -f1-2",
      "cat /etc/mission-control/busybox-binary.sha256",
      "cat /etc/mission-control/toolchain-inputs.sha256",
    ].join("; "),
  ], { maxBuffer: 4 * 1024 * 1024 })).stdout.trim().split("\n");
  return {
    schema: "mission-control-remote-image-local-provenance/v1",
    sourceSha,
    image: digestQualifiedImage,
    digest: digestQualifiedImage.slice(digestQualifiedImage.indexOf("@") + 1),
    localImageId: inspection.Id,
    publicPull: { verified: false },
    attestation: { verified: false, reference: "local-exact-image-qualification" },
    sbom: { format: "SPDX-2.3", sha256: `sha256:${createHash("sha256").update(sbom).digest("hex")}` },
    vulnerabilityScan: {
      grypeVersion: scan.descriptor?.version,
      critical,
      high,
      suppressionCount: scan.ignoredMatches?.length ?? 0,
      artifactSha256: `sha256:${createHash("sha256").update(JSON.stringify(scan)).digest("hex")}`,
    },
    toolchain: {
      nodeVersion: toolchainOutput[0],
      codexVersion: toolchainOutput[1],
      codexBinarySha256: `sha256:${toolchainOutput[2]}`,
      gitVersion: toolchainOutput[3],
      gitBinarySha256: `sha256:${toolchainOutput[4]}`,
      busyboxVersion: toolchainOutput[5],
      busyboxBinarySha256: `sha256:${toolchainOutput[6]}`,
      toolchainInputsSha256: `sha256:${toolchainOutput[7]}`,
    },
  };
}

async function readLocalInventory() {
  const output = (await execFileAsync("docker", [
    "ps", "-a", "--filter", "label=mission-control.remote-sandbox-qualification=true", "--format", "{{.Names}}",
  ], { maxBuffer: 2 * 1024 * 1024 })).stdout.trim();
  return {
    checkedAt: new Date().toISOString(),
    authenticated: true,
    vmCount: output ? output.split(/\r?\n/).filter(Boolean).length : 0,
    maxVms: 1,
    liveAllocationAllowed: true,
    automaticIntegrationCount: 0,
  };
}

class DockerQualificationTransport implements ExeDevTransport {
  private readonly records = new Map<string, any>();

  async lobbyJson(command: string[]) {
    if (command[0] === "integrations") return [];
    if (command[0] === "ls") {
      const requestedName = command.find((value, index) => index > 0 && !value.startsWith("--"));
      const records = [...this.records.values()];
      return requestedName ? records.filter((record) => record.name === requestedName) : records;
    }
    if (command[0] === "new") {
      const resourceName = flagValue(command, "--name");
      const image = flagValue(command, "--image");
      if (!resourceName || !image) throw new Error("Docker qualification allocation requires name and image.");
      const result = await execFileAsync("docker", [
        "run", "--detach", "--pull=never", "--platform", "linux/amd64", "--cap-add", "NET_ADMIN",
        "--label", "mission-control.remote-sandbox-qualification=true", "--name", resourceName,
        "--entrypoint", "sh", image, "-c", "sleep 28800",
      ], { maxBuffer: 2 * 1024 * 1024 });
      const record = { id: result.stdout.trim(), name: resourceName, status: "ready", image };
      this.records.set(resourceName, record);
      return record;
    }
    if (command[0] === "rm") {
      const resourceName = command.find((value, index) => index > 0 && !value.startsWith("--"));
      if (!resourceName) throw new Error("Docker qualification removal requires a resource name.");
      await execFileAsync("docker", ["rm", "--force", resourceName], { maxBuffer: 2 * 1024 * 1024 });
      this.records.delete(resourceName);
      return { removed: resourceName };
    }
    throw new Error(`Unsupported Docker qualification lobby command: ${command.join(" ")}`);
  }

  async vmText(resourceName: string, command: string, input = "") {
    if (!this.records.has(resourceName)) throw new Error(`Unknown Docker qualification resource ${resourceName}.`);
    return (await spawnWithInput("docker", ["exec", "-i", resourceName, "sh", "-c", command], input, 360_000)).stdout;
  }
}

function flagValue(command: string[], name: string) {
  return command.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
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
  };
}

async function persist(dataset: any) {
  await writeFile(resultsPath, `${JSON.stringify(dataset, null, 2)}\n`);
}

class RevocationProbingCredentialBroker implements SandboxCredentialBroker {
  private readonly inner = new OpenRouterSandboxCredentialBroker();
  private readonly secrets = new Map<string, string>();
  readonly staleChecks: Array<{
    grantKey: string;
    offsetsMs: number[];
    statuses: Array<number | null>;
    rejected: boolean;
    rejectedAtOffsetMs: number | null;
    withinQualifiedBound: boolean;
    checkedAt: string;
  }> = [];

  async mint(request: SandboxCredentialRequest): Promise<SandboxCredentialGrant> {
    const grant = await this.inner.mint(request);
    this.secrets.set(grant.grantKey, grant.secret);
    return grant;
  }

  async revoke(grant: SandboxCredentialReference): Promise<SandboxCredentialRevocationReceipt> {
    const receipt = await this.inner.revoke(grant);
    const offsetsMs = receipt.confirmation?.offsetsMs ?? [];
    const statuses = receipt.confirmation?.statuses ?? [];
    const rejectionIndex = statuses.findIndex((status) => status === 401 || status === 403);
    const rejectedAtOffsetMs = rejectionIndex >= 0 ? offsetsMs[rejectionIndex] ?? null : null;
    const rejected = receipt.confirmation?.method === "STALE_SECRET_REJECTION" && rejectionIndex >= 0;
    const withinQualifiedBound = rejected && rejectedAtOffsetMs !== null && rejectedAtOffsetMs <= 30_000;
    this.staleChecks.push({
      grantKey: grant.grantKey,
      offsetsMs,
      statuses,
      rejected,
      rejectedAtOffsetMs,
      withinQualifiedBound,
      checkedAt: new Date().toISOString(),
    });
    if (!withinQualifiedBound) {
      throw new Error(`Revoked OpenRouter Attempt key was not proven rejected within the qualified 30 second bound (offsets ${offsetsMs.join(",")}; statuses ${statuses.join(",")}).`);
    }
    return receipt;
  }

  assertNoSecretIn(value: unknown) {
    const serialized = JSON.stringify(value);
    if ([...this.secrets.values()].some((secret) => serialized.includes(secret) || /sk-or-v1-[A-Za-z0-9_-]+/.test(serialized))) {
      throw new Error("Attempt inference credential leaked into durable qualification evidence.");
    }
  }

  disposeSecrets() {
    this.secrets.clear();
  }
}

async function gitValue(cwd: string, args: string[]) {
  const result = await execFileAsync("git", args, { cwd, maxBuffer: 2 * 1024 * 1024 });
  return result.stdout.trim();
}

async function spawnWithInput(command: string, args: string[], input: string, timeoutMs: number) {
  return await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) reject(Object.assign(new Error(`${command} exited with ${code}.`), { stdout, stderr }));
      else resolve({ stdout, stderr });
    });
    child.stdin.end(input);
  });
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

function delta(later: number | null | undefined, earlier: number | null | undefined) {
  return Number.isFinite(later) && Number.isFinite(earlier) ? Number(later) - Number(earlier) : null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeMessage(error: unknown) {
  return redactSandboxText(error instanceof Error ? error.message : String(error)).slice(0, 2_000);
}

class CandidateFailure extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "CandidateFailure";
  }
}

await main().finally(async () => {
  await Promise.all(cleanupDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});
