import { verificationDigest } from "./verificationIdentity.js";

export type FactoryPurpose = "SOFTWARE" | "VERIFICATION" | "INTELLIGENT_AUTOMATION";
export type WorkOrderKind = "SOFTWARE_CHANGE" | "VERIFICATION" | "AUTOMATION";
export type AttemptPurpose = "IMPLEMENTATION" | "VERIFICATION" | "AUTOMATION";

export const normalizeFactoryPurpose = (purpose?: FactoryPurpose): FactoryPurpose => purpose ?? "SOFTWARE";
export const normalizeWorkOrderKind = (kind?: WorkOrderKind): WorkOrderKind => kind ?? "SOFTWARE_CHANGE";
export const normalizeAttemptPurpose = (purpose?: AttemptPurpose): AttemptPurpose => purpose ?? "IMPLEMENTATION";

type SubjectIdentity = {
  version: 1;
  subjectId: string;
  workOrderId: string;
  workOrderRevisionNumber: number;
  verificationContractDigest: string;
  sourceAttemptId: string;
  digest: string;
};

export type GitVerificationSubject = SubjectIdentity & {
  kind: "GIT_CANDIDATE";
  repositoryId: string;
  provider: "GITHUB";
  providerRepositoryId: string;
  candidateSha: string;
  treeSha: string;
  pullRequest: {
    providerPullRequestId: string;
    number: number;
    url: string;
    baseRef: string;
    headRef: string;
    headSha: string;
    draftAtPublication: true;
  };
};

export type AutomationVerificationSubject = SubjectIdentity & {
  kind: "AUTOMATION_RUN";
  automationWorkflowRunId: string;
  automationDefinitionId: string;
  automationDefinitionVersion: number;
  adapterIdentity: {
    adapterType: string;
    runtime?: string;
    executionBindingDigest: string;
    outputContractDigest: string;
  };
  outputSnapshotArtifactId: string;
  outputSnapshotContentHash: string;
  outputArtifactIds: string[];
  outputArtifactContentHashes: string[];
};

export type VerificationSubject = GitVerificationSubject | AutomationVerificationSubject;

type GitSubjectInput = Omit<GitVerificationSubject, "subjectId" | "digest">;
type AutomationSubjectInput = Omit<AutomationVerificationSubject, "subjectId" | "digest">;

const SHA = /^[0-9a-f]{40,64}$/;
const CONTENT_HASH = /^sha256:[0-9a-f]{64}$/;

export function createGitVerificationSubject(input: GitSubjectInput): GitVerificationSubject {
  assertCommonIdentity(input);
  if (!input.repositoryId || !input.providerRepositoryId || !input.pullRequest.providerPullRequestId) {
    throw new Error("Git verification subject requires internal repository, provider repository, and provider pull-request identity.");
  }
  if (!SHA.test(input.candidateSha) || !SHA.test(input.treeSha) || input.pullRequest.headSha !== input.candidateSha) {
    throw new Error("Git verification subject requires exact lowercase commit/tree SHA lineage and a matching pull-request head.");
  }
  if (!Number.isSafeInteger(input.pullRequest.number) || input.pullRequest.number < 1 || input.pullRequest.draftAtPublication !== true) {
    throw new Error("Git verification subject requires an exact draft pull request.");
  }
  const digest = verificationDigest("verification-subject/git/v1", {
    version: input.version,
    kind: input.kind,
    workOrderId: input.workOrderId,
    workOrderRevisionNumber: input.workOrderRevisionNumber,
    verificationContractDigest: input.verificationContractDigest,
    sourceAttemptId: input.sourceAttemptId,
    repositoryId: input.repositoryId,
    provider: input.provider,
    providerRepositoryId: input.providerRepositoryId,
    providerPullRequestId: input.pullRequest.providerPullRequestId,
    candidateSha: input.candidateSha,
    treeSha: input.treeSha,
  });
  return { ...input, subjectId: `verification-subject:${digest.slice("sha256:".length)}`, digest };
}

export function createAutomationVerificationSubject(input: AutomationSubjectInput): AutomationVerificationSubject {
  assertCommonIdentity(input);
  if (input.automationWorkflowRunId !== input.sourceAttemptId) {
    throw new Error("Automation workflow run must be the source Attempt.");
  }
  if (!input.automationDefinitionId || !Number.isSafeInteger(input.automationDefinitionVersion) || input.automationDefinitionVersion < 1) {
    throw new Error("Automation verification subject requires immutable definition identity.");
  }
  if (!input.adapterIdentity.adapterType || !CONTENT_HASH.test(input.adapterIdentity.executionBindingDigest)
    || !CONTENT_HASH.test(input.adapterIdentity.outputContractDigest)) {
    throw new Error("Automation verification subject requires adapter, execution-binding, and output-contract identity.");
  }
  if (!input.outputSnapshotArtifactId || !CONTENT_HASH.test(input.outputSnapshotContentHash)) {
    throw new Error("Automation verification subject requires an immutable output snapshot.");
  }
  if (input.outputArtifactIds.length !== input.outputArtifactContentHashes.length
    || input.outputArtifactContentHashes.some((hash) => !CONTENT_HASH.test(hash))) {
    throw new Error("Automation verification subject requires an ordered content hash for every output artifact.");
  }
  const digest = verificationDigest("verification-subject/automation/v1", {
    version: input.version,
    kind: input.kind,
    workOrderId: input.workOrderId,
    workOrderRevisionNumber: input.workOrderRevisionNumber,
    verificationContractDigest: input.verificationContractDigest,
    sourceAttemptId: input.sourceAttemptId,
    automationDefinitionId: input.automationDefinitionId,
    automationDefinitionVersion: input.automationDefinitionVersion,
    adapterIdentity: input.adapterIdentity,
    outputSnapshotArtifactId: input.outputSnapshotArtifactId,
    outputSnapshotContentHash: input.outputSnapshotContentHash,
    outputArtifactIds: input.outputArtifactIds,
    outputArtifactContentHashes: input.outputArtifactContentHashes,
  });
  return { ...input, subjectId: `verification-subject:${digest.slice("sha256:".length)}`, digest };
}

function assertCommonIdentity(input: GitSubjectInput | AutomationSubjectInput) {
  if (input.version !== 1 || !input.workOrderId || !input.sourceAttemptId || input.workOrderRevisionNumber < 1) {
    throw new Error("Verification subject requires a versioned WorkOrder revision and source Attempt.");
  }
  if (!CONTENT_HASH.test(input.verificationContractDigest)) {
    throw new Error("Verification subject requires a canonical verification contract digest.");
  }
}
