import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  OpenRouterSandboxCredentialBroker,
  type SandboxCredentialGrant,
  type SandboxCredentialRevocationReceipt,
} from "../apps/orchestration-server/src/sandboxCredentials.js";

const outputPath = path.resolve(process.argv[2] ?? "docs/testing/evidence/remote-sandbox-final-blocker-qualification-v1/openrouter-revocation-timing.json");
const offsetsMs = [0, 1_000, 5_000, 15_000, 30_000, 60_000];
const broker = new OpenRouterSandboxCredentialBroker();
let grant: SandboxCredentialGrant | undefined;
let deletionReceipt: SandboxCredentialRevocationReceipt | undefined;

const evidence: Record<string, unknown> = {
  schema: "mission-control-openrouter-revocation-timing/v1",
  startedAt: new Date().toISOString(),
  endpoint: "GET https://openrouter.ai/api/v1/key",
  offsetsMs,
  probeSemantics: "200 means the deleted Attempt key still authenticates; 401/403 proves rejection; any other status is inconclusive.",
  managementCredentialExposedToWorkload: false,
  probes: [],
};

try {
  const now = Date.now();
  grant = await broker.mint({
    projectId: "remote-sandbox-final-blocker-qualification-v1",
    workflowRunId: `revocation-timing-${now}`,
    attemptId: `controlled-attempt-${now}`,
    attemptLeaseId: `controlled-lease-${now}`,
    maxCostUsd: 0.01,
    expiresAt: now + 5 * 60_000,
  });
  const { secret: _secret, ...persistableGrant } = grant;
  evidence.issuedCredential = persistableGrant;
  evidence.preDeleteProbe = await probe(grant.secret, -1);
  await persist();

  deletionReceipt = await broker.revoke(grant);
  evidence.deletionReceipt = deletionReceipt;
  await persist();

  const deletedAt = Date.now();
  for (const offsetMs of offsetsMs) {
    const remainingMs = deletedAt + offsetMs - Date.now();
    if (remainingMs > 0) await new Promise((resolve) => setTimeout(resolve, remainingMs));
    const result = await probe(grant.secret, Date.now() - deletedAt);
    (evidence.probes as unknown[]).push(result);
    await persist();
    if (result.rejected === true) break;
  }

  const probes = evidence.probes as Array<{ rejected: boolean }>;
  evidence.rejectedWithinBound = probes.some((entry) => entry.rejected);
  evidence.completedAt = new Date().toISOString();
  await persist();
  if (!evidence.rejectedWithinBound) throw new Error("OpenRouter did not reject the deleted Attempt key within the 60-second qualification bound.");
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  if (grant && !deletionReceipt) {
    deletionReceipt = await broker.revoke(grant).catch(() => undefined);
    evidence.emergencyDeletionReceipt = deletionReceipt ?? null;
    await persist().catch(() => undefined);
  }
}

async function probe(secret: string, elapsedMs: number) {
  const requestedAt = new Date().toISOString();
  try {
    const response = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(15_000),
    });
    await response.body?.cancel().catch(() => undefined);
    return {
      requestedAt,
      elapsedMs,
      status: response.status,
      authenticated: response.status === 200,
      rejected: response.status === 401 || response.status === 403,
      conclusive: response.status === 200 || response.status === 401 || response.status === 403,
    };
  } catch (error) {
    return {
      requestedAt,
      elapsedMs,
      status: null,
      authenticated: false,
      rejected: false,
      conclusive: false,
      error: error instanceof Error ? error.name : "UnknownError",
    };
  }
}

async function persist() {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
  await rename(temporaryPath, outputPath);
}
