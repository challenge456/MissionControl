import { deriveFactoryPublicationLineage, factoryExecutorIdentity } from "./factoryAttempt";
import { buildReviewPackage } from "./reviewPackage";
import { buildFileChanges, orderRunEvents } from "./runInspector";

export function buildFactoryAttemptReviewReadModel(input: {
  now: number;
  run: any;
  workOrder: any;
  events: any[];
  artifacts: any[];
  receipts: any[];
  evidenceEnvelopes?: any[];
  prChecks: any[];
  missionPlan?: any;
  repository?: any;
}) {
  const orderedEvents = orderRunEvents(input.events);
  const claimEvent = orderedEvents.find((event) => event.eventType === "CHECKPOINT_CREATED"
    && event.status === "RUNNING"
    && event.commandSummary === "Factory attempt lease claimed"
    && typeof event.actor === "string"
    && event.actor.startsWith("service:")
    && event.metadata?.executionManifestDigest === input.run.executionManifestDigest);
  const recoveredExecutorIdentity = !input.run.executionClaimedBy
    && input.run.executionManifestDigest
    && input.run.executorAdapter
    && input.run.executorVersion
    && input.run.executorHostId
    && claimEvent
      ? factoryExecutorIdentity({
          ownerId: claimEvent.actor,
          executorAdapter: input.run.executorAdapter,
          executorVersion: input.run.executorVersion,
          executorHostId: input.run.executorHostId,
        })
      : undefined;
  const eventFileChanges = buildFileChanges(orderedEvents);
  const pullRequestArtifact = input.artifacts.find((artifact) => artifact.artifactType === "PULL_REQUEST");
  const codeDiffArtifact = input.artifacts.find((artifact) => artifact.artifactType === "CODE_DIFF");
  const exactGateReceipt = input.receipts
    .filter((receipt) => receipt.receiptScope === "WORK_ORDER" && receipt.workflowRunId === input.run._id)
    .sort((left, right) => right.recordedAt - left.recordedAt)[0];
  const publicationLineage = deriveFactoryPublicationLineage({
    pullRequestArtifact,
    codeDiffArtifact,
    verifiedSourceRevision: exactGateReceipt?.sourceRevision,
    completedAt: input.run.completedAt,
  });
  const projectedRun = {
    ...input.run,
    ...publicationLineage.patch,
    executionClaimedBy: input.run.executionClaimedBy ?? recoveredExecutorIdentity,
  };
  const eventPaths = new Set(eventFileChanges
    .map((change) => change.repositoryPath)
    .filter((path): path is string => Boolean(path)));
  const fileChanges = [
    ...eventFileChanges,
    ...publicationLineage.changedFiles
      .filter((path) => !eventPaths.has(path))
      .map((repositoryPath) => ({
        sequenceNumber: 0,
        workflowStep: input.run.steps?.[input.run.currentStepIndex]?.stepId,
        repositoryPath,
        changeType: "modified",
        diffLocation: null,
        pullRequestUrl: publicationLineage.patch.pullRequestUrl ?? null,
        commandSummary: "Changed file recorded in the exact Attempt code-diff artifact.",
      })),
  ];
  const expectedRepository = input.repository?.repository ?? input.workOrder?.repository ?? null;
  const rollbackApproach = input.missionPlan?.rollbackApproach
    ?? (typeof input.workOrder?.metadata?.rollbackApproach === "string"
      ? input.workOrder.metadata.rollbackApproach
      : null);
  const reviewPackage = buildReviewPackage({
    now: input.now,
    run: projectedRun,
    workOrder: input.workOrder,
    receipts: input.receipts,
    evidenceEnvelopes: input.evidenceEnvelopes,
    prChecks: input.prChecks,
    events: orderedEvents,
    fileChanges,
    rollbackApproach,
    expectedRepository,
    githubAppInstallationId: typeof pullRequestArtifact?.metadata?.installationId === "string"
      ? pullRequestArtifact.metadata.installationId
      : null,
  });
  return {
    run: projectedRun,
    events: orderedEvents,
    fileChanges,
    reviewPackage,
    exactGateReceipt: exactGateReceipt ?? null,
  };
}

export async function loadFactoryAttemptReviewReadModel(ctx: any, input: {
  run: any;
  workOrder: any;
  now?: number;
}) {
  const [events, artifacts, receipts, evidenceEnvelopes, prChecks, missionPlan, repository] = await Promise.all([
    ctx.db.query("runEvents").withIndex("by_run_sequence", (q: any) => q.eq("workflowRunId", input.run._id)).collect(),
    ctx.db.query("runArtifacts").withIndex("by_run", (q: any) => q.eq("workflowRunId", input.run._id)).collect(),
    ctx.db.query("verificationReceipts").withIndex("by_run", (q: any) => q.eq("workflowRunId", input.run._id)).collect(),
    ctx.db.query("evidenceEnvelopes").withIndex("by_run", (q: any) => q.eq("workflowRunId", input.run._id)).collect(),
    ctx.db.query("harnessPrChecks").withIndex("by_work_order", (q: any) => q.eq("workOrderId", input.workOrder._id)).collect(),
    input.workOrder.missionPlanId ? ctx.db.get(input.workOrder.missionPlanId) : null,
    input.run.repositoryId
      ? ctx.db.get(input.run.repositoryId)
      : input.workOrder.repositoryId
        ? ctx.db.get(input.workOrder.repositoryId)
        : null,
  ]);
  return buildFactoryAttemptReviewReadModel({
    now: input.now ?? Date.now(),
    run: input.run,
    workOrder: input.workOrder,
    events,
    artifacts,
    receipts,
    evidenceEnvelopes,
    prChecks,
    missionPlan,
    repository,
  });
}

export function factoryAttemptRequiresReviewPackage(run: any) {
  return Boolean(
    run?.factoryDefinitionVersionId
    || run?.executionManifestDigest
    || run?.executorAdapter === "codex",
  );
}

export function workOrderRequiresFactoryReviewPackage(workOrder: any, run: any) {
  return Boolean(
    workOrder?.metadata?.implementationPolicy
    || factoryAttemptRequiresReviewPackage(run),
  );
}

export function buildAcceptanceEligibility(input: {
  governanceAcceptance: { eligible: boolean; blockingReasons: string[] };
  latestRun: any;
  factoryRequired?: boolean;
  reviewPackage?: { status: "READY" | "BLOCKED" | "INCOMPLETE"; blockers: string[] } | null;
}) {
  const requiresReviewPackage = input.factoryRequired === true
    || factoryAttemptRequiresReviewPackage(input.latestRun);
  const reviewBlockers = requiresReviewPackage
    ? input.reviewPackage?.status === "READY"
      ? []
      : input.reviewPackage?.blockers ?? ["Factory review package is unavailable."]
    : [];
  const blockingReasons = [...new Set([
    ...input.governanceAcceptance.blockingReasons,
    ...reviewBlockers,
  ])];
  return {
    eligible: input.governanceAcceptance.eligible && reviewBlockers.length === 0,
    requiresReviewPackage,
    reviewPackageStatus: requiresReviewPackage ? input.reviewPackage?.status ?? "INCOMPLETE" : "NOT_REQUIRED",
    blockingReasons,
  } as const;
}
