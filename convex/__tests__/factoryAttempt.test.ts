import { describe, expect, it } from "vitest";
import {
  activeLeaseMatches,
  classifyFactoryAttemptReconciliation,
  deriveFactoryPublicationLineage,
  evaluateAttemptClaim,
  expiredFactoryLeaseIdIsReplay,
  factoryAttemptMutationIsAuthorized,
  factoryAttemptRequiresReplacementOnClaim,
  factoryLeaseMatchesCurrentRegistration,
  renewAttemptLease,
  validateFactoryPullRequestLineage,
} from "../lib/factoryAttempt";

const workerA = { workerId: "worker-a", sessionId: "session-a", generation: 1 };
const workerB = { workerId: "worker-b", sessionId: "session-b", generation: 3 };

describe("Factory attempt leases", () => {
  it("claims a pending attempt with a bounded durable lease", () => {
    const result = evaluateAttemptClaim({
      status: "PENDING",
      leaseId: "lease-1",
      ownerId: "orchestration-1",
      leaseDurationMs: 60_000,
      now: 1_000,
    });
    expect(result).toMatchObject({ ok: true, reclaimed: false });
    expect(result.ok && result.lease.expiresAt).toBe(61_000);
  });

  it("rejects an active lease and reclaims only after expiry", () => {
    const lease = { leaseId: "old", ownerId: "worker-a", claimedAt: 1, heartbeatAt: 10, expiresAt: 100 };
    expect(evaluateAttemptClaim({ status: "RUNNING", lease, leaseId: "new", ownerId: "worker-b", leaseDurationMs: 60_000, now: 99 })).toMatchObject({ ok: false, reason: "attempt-already-leased" });
    expect(evaluateAttemptClaim({ status: "RUNNING", lease, leaseId: "new", ownerId: "worker-b", leaseDurationMs: 60_000, now: 100 })).toMatchObject({ ok: true, reclaimed: true });
  });

  it("renews only a matching unexpired lease", () => {
    const lease = { leaseId: "lease-1", ownerId: "worker-a", claimedAt: 1, heartbeatAt: 10, expiresAt: 100 };
    expect(renewAttemptLease({ lease, leaseId: "lease-1", ownerId: "worker-b", leaseDurationMs: 60_000, now: 20 })).toMatchObject({ ok: false, reason: "lease-mismatch" });
    const result = renewAttemptLease({ lease, leaseId: "lease-1", ownerId: "worker-a", leaseDurationMs: 60_000, now: 20 });
    expect(result.ok && activeLeaseMatches({ lease: result.lease, leaseId: "lease-1", ownerId: "worker-a", now: 21 })).toBe(true);
  });

  it("fences renewal and late writes by worker session as well as lease identity", () => {
    const claimed = evaluateAttemptClaim({
      status: "PENDING",
      leaseId: "lease-1",
      ownerId: "factory-service",
      worker: workerA,
      leaseDurationMs: 60_000,
      now: 1_000,
    });
    expect(claimed.ok).toBe(true);
    if (!claimed.ok) return;

    expect(renewAttemptLease({
      lease: claimed.lease,
      leaseId: "lease-1",
      ownerId: "factory-service",
      worker: workerB,
      leaseDurationMs: 60_000,
      now: 2_000,
    })).toMatchObject({ ok: false, reason: "lease-mismatch" });
    expect(activeLeaseMatches({
      lease: claimed.lease,
      leaseId: "lease-1",
      ownerId: "factory-service",
      worker: workerA,
      now: 2_000,
    })).toBe(true);
  });

  it("revokes a hardened lease when the current registration session or generation changes", () => {
    const lease = {
      leaseId: "lease-1", ownerId: "factory-service", workerId: "worker-a",
      workerSessionId: "session-a", workerGeneration: 2,
      claimedAt: 1, heartbeatAt: 2, expiresAt: 100,
    };
    expect(factoryLeaseMatchesCurrentRegistration(lease, {
      hostId: "worker-a", workerRuntime: { sessionId: "session-a", generation: 2 },
    })).toBe(true);
    expect(factoryLeaseMatchesCurrentRegistration(lease, {
      hostId: "worker-a", workerRuntime: { sessionId: "session-b", generation: 3 },
    })).toBe(false);
    expect(factoryLeaseMatchesCurrentRegistration(lease, {
      hostId: "worker-a", workerRuntime: { sessionId: "session-a", generation: 3 },
    })).toBe(false);
  });

  it("keeps active legacy leases compatible but never reclaims lost execution ownership", () => {
    const legacyLease = { leaseId: "legacy", ownerId: "factory-service", claimedAt: 1, heartbeatAt: 2, expiresAt: 100 };
    expect(factoryLeaseMatchesCurrentRegistration(legacyLease, undefined)).toBe(true);
    expect(factoryAttemptRequiresReplacementOnClaim({
      status: "RUNNING", lease: legacyLease, now: 99,
    })).toBe(false);
    expect(factoryAttemptRequiresReplacementOnClaim({
      status: "RUNNING", lease: legacyLease, now: 100,
    })).toBe(true);
    expect(factoryAttemptRequiresReplacementOnClaim({
      status: "RUNNING", now: 100,
    })).toBe(true);
    expect(factoryAttemptRequiresReplacementOnClaim({
      status: "RUNNING", lease: legacyLease, continuationStatus: "READY_TO_PUBLISH", now: 100,
    })).toBe(false);
    expect(factoryAttemptRequiresReplacementOnClaim({
      status: "RUNNING", lease: legacyLease, continuationStatus: "AWAITING_HUMAN_REVIEW", now: 100,
    })).toBe(false);
  });

  it("rejects replay of an expired lease identity during publication recovery", () => {
    const lease = { leaseId: "lease-old", ownerId: "factory-service", claimedAt: 1, heartbeatAt: 2, expiresAt: 100 };
    expect(expiredFactoryLeaseIdIsReplay({ lease, leaseId: "lease-old", now: 100 })).toBe(true);
    expect(expiredFactoryLeaseIdIsReplay({ lease, leaseId: "lease-new", now: 100 })).toBe(false);
  });

  it("classifies worker and process loss without rewriting the interrupted Attempt", () => {
    const lease = {
      leaseId: "lease-a",
      ownerId: "factory-service",
      workerId: workerA.workerId,
      workerSessionId: workerA.sessionId,
      workerGeneration: workerA.generation,
      claimedAt: 1,
      heartbeatAt: 10,
      expiresAt: 100,
    };
    expect(classifyFactoryAttemptReconciliation({
      status: "RUNNING",
      lease,
      currentWorkerSessionId: workerB.sessionId,
      processState: "UNKNOWN",
      hasPublicationCheckpoint: false,
      now: 100,
    })).toEqual({ disposition: "LOST", action: "CREATE_REPLACEMENT_ATTEMPT" });
    expect(classifyFactoryAttemptReconciliation({
      status: "RUNNING",
      lease,
      currentWorkerSessionId: workerB.sessionId,
      processState: "UNKNOWN",
      hasPublicationCheckpoint: true,
      now: 100,
    })).toEqual({ disposition: "RECOVERABLE", action: "RESUME_PUBLICATION" });
  });

  it("keeps cancellation independent from lease possession", () => {
    expect(classifyFactoryAttemptReconciliation({
      status: "RUNNING",
      cancellationRequestedAt: 50,
      processState: "RUNNING",
      hasPublicationCheckpoint: false,
      now: 60,
    })).toEqual({ disposition: "CANCELLED", action: "FINALIZE_CANCELLED" });
  });

  it("revokes report and publication authority as soon as cancellation is requested", () => {
    expect(factoryAttemptMutationIsAuthorized({ status: "RUNNING" })).toBe(true);
    expect(factoryAttemptMutationIsAuthorized({ status: "RUNNING", cancellationRequestedAt: 100 })).toBe(false);
    expect(factoryAttemptMutationIsAuthorized({ status: "CANCELED", cancellationRequestedAt: 100 })).toBe(false);
  });

  it("derives durable Attempt, pull-request, and file lineage from exact-run artifacts", () => {
    const lineage = deriveFactoryPublicationLineage({
      pullRequestArtifact: {
        artifactType: "PULL_REQUEST",
        externalLocation: "https://github.com/acme/repo/pull/42",
        metadata: {
          sourceRevision: "a".repeat(40),
          headSha: "b".repeat(40),
          pullRequestNumber: 42,
          changedFiles: ["src/fallback.ts"],
        },
      },
      codeDiffArtifact: {
        artifactType: "CODE_DIFF",
        metadata: {
          sourceRevision: "a".repeat(40),
          headSha: "b".repeat(40),
          changedFiles: ["src/feature.ts", "src/feature.ts", "src/test.ts"],
        },
      },
      completedAt: 123,
      expectedRepositoryIdentity: "acme/repo",
    });

    expect(lineage).toEqual({
      changedFiles: ["src/feature.ts", "src/test.ts"],
      patch: {
        executionBaseSha: "a".repeat(40),
        headSha: "b".repeat(40),
        pullRequestNumber: 42,
        pullRequestUrl: "https://github.com/acme/repo/pull/42",
        publishedAt: 123,
      },
    });
  });

  it("fails closed on unsafe or incomplete pull-request lineage", () => {
    const lineage = deriveFactoryPublicationLineage({
      pullRequestArtifact: {
        artifactType: "PULL_REQUEST",
        externalLocation: "javascript:alert(1)",
        metadata: { headSha: "not-a-git-sha", changedFiles: ["", 12] },
      },
      verifiedSourceRevision: "a".repeat(40),
    });

    expect(lineage).toEqual({ changedFiles: [], patch: {} });

    const insecure = deriveFactoryPublicationLineage({
      pullRequestArtifact: {
        artifactType: "PULL_REQUEST",
        externalLocation: "http://github.com/acme/repo/pull/42",
        metadata: { headSha: "b".repeat(40) },
      },
    });
    expect(insecure.patch).toEqual({});

    const wrongRepository = deriveFactoryPublicationLineage({
      pullRequestArtifact: {
        artifactType: "PULL_REQUEST",
        externalLocation: "https://github.com/other/repo/pull/42",
        metadata: { headSha: "b".repeat(40), pullRequestNumber: 42 },
      },
      expectedRepositoryIdentity: "acme/repo",
    });
    expect(wrongRepository.patch).toEqual({});
  });

  it("requires exact GitHub App pull-request lineage", () => {
    const expected = {
      repositoryId: "repository-1",
      repositoryIdentity: "acme/repo",
      installationId: "123",
      branch: "mc/attempt-1",
      sourceRevision: "a".repeat(40),
      headSha: "b".repeat(40),
      executionManifestDigest: `sha256:${"c".repeat(64)}`,
      publicationPermitId: "permit-1",
    };
    const artifact = {
      artifactType: "PULL_REQUEST",
      externalLocation: "https://github.com/acme/repo/pull/42",
      metadata: {
        repositoryId: "repository-1", repository: "acme/repo", installationId: "123",
        branch: "mc/attempt-1", sourceRevision: "a".repeat(40), headSha: "b".repeat(40),
        pullRequestNumber: 42, executionManifestDigest: `sha256:${"c".repeat(64)}`,
        publicationPermitId: "permit-1",
      },
    };
    expect(validateFactoryPullRequestLineage({ artifact, expected })).toMatchObject({ ok: true, pullRequestNumber: 42 });
    expect(validateFactoryPullRequestLineage({
      artifact: { ...artifact, externalLocation: "https://evil.example/acme/repo/pull/42" },
      expected,
    })).toEqual({ ok: false, reason: "pull-request-url-mismatch" });
    expect(validateFactoryPullRequestLineage({
      artifact: { ...artifact, metadata: { ...artifact.metadata, publicationPermitId: "permit-stale" } },
      expected,
    })).toEqual({ ok: false, reason: "pull-request-permit-mismatch" });
  });
});
