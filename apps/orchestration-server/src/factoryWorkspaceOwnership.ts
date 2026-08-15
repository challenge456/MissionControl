import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, mkdir, readFile, realpath, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { assertWorktreeBoundary } from "./factoryPathScope.js";

const execFileAsync = promisify(execFile);

export interface FactoryWorkspaceOwner {
  repositoryIdentity: string;
  workflowRunId: string;
  workerId: string;
  workerSessionId: string;
  workerGeneration: number;
  leaseId: string;
  branch: string;
  worktree: string;
  checkoutRoot: string;
  executionManifestDigest: string;
  baseSha: string;
  sandboxId?: string;
}

export interface FactoryWorkspaceOwnershipManifest extends FactoryWorkspaceOwner {
  version: "factory-workspace-ownership/v1";
  process: {
    state: "NOT_STARTED" | "RUNNING" | "TERMINATED" | "UNKNOWN";
    pid?: number;
    startedAt?: number;
    terminatedAt?: number;
    exitCode?: number;
  };
  publication?: {
    headSha: string;
    pullRequestUrl: string;
    recordedAt: number;
  };
  cleanup: {
    status: "PENDING" | "PRESERVED" | "COMPLETED";
    reason?: string;
    checkedAt?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export async function ensureFactoryWorkspaceOwnership(input: {
  owner: FactoryWorkspaceOwner;
  allowCreate: boolean;
}) {
  validateOwner(input.owner);
  const manifestPath = await ownershipManifestPath(input.owner);
  const existing = await readManifest(manifestPath);
  if (existing) {
    assertExactOwner(existing, input.owner);
    return existing;
  }
  if (!input.allowCreate) {
    throw new Error("Existing Factory workspace has no protected ownership manifest; it was preserved.");
  }
  const now = Date.now();
  const manifest: FactoryWorkspaceOwnershipManifest = {
    version: "factory-workspace-ownership/v1",
    ...input.owner,
    process: { state: "NOT_STARTED" },
    cleanup: { status: "PENDING" },
    createdAt: now,
    updatedAt: now,
  };
  await writeManifest(manifestPath, manifest);
  return manifest;
}

export async function recordFactoryExecutorStarted(owner: FactoryWorkspaceOwner, pid: number) {
  if (!Number.isSafeInteger(pid) || pid < 1) throw new Error("Executor process identity requires a positive PID.");
  return await updateOwnedManifest(owner, (manifest) => ({
    ...manifest,
    process: { state: "RUNNING", pid, startedAt: Date.now() },
  }));
}

export async function recordFactoryExecutorTerminated(owner: FactoryWorkspaceOwner, process: {
  pid: number;
  exitCode?: number;
}) {
  return await updateOwnedManifest(owner, (manifest) => {
    if (manifest.process.state !== "RUNNING" || manifest.process.pid !== process.pid) {
      throw new Error("Executor termination does not match the owned running process; workspace was preserved.");
    }
    return {
      ...manifest,
      process: {
        ...manifest.process,
        state: "TERMINATED",
        terminatedAt: Date.now(),
        exitCode: process.exitCode,
      },
    };
  });
}

export async function recordFactoryPublication(owner: FactoryWorkspaceOwner, publication: {
  headSha: string;
  pullRequestUrl: string;
}) {
  if (!gitSha(publication.headSha) || !httpsUrl(publication.pullRequestUrl)) {
    throw new Error("Workspace publication proof requires an exact head SHA and HTTPS pull-request URL.");
  }
  return await updateOwnedManifest(owner, (manifest) => ({
    ...manifest,
    publication: { ...publication, recordedAt: Date.now() },
  }));
}

/**
 * Cross-session transfer is limited to publication recovery. An interrupted
 * executor process is never adopted by a replacement worker.
 */
export async function transferFactoryPublicationWorkspace(input: {
  previousOwner: FactoryWorkspaceOwner;
  nextOwner: FactoryWorkspaceOwner;
  checkpointCandidateSha: string;
}) {
  validateOwner(input.nextOwner);
  const previousPath = await ownershipManifestPath(input.previousOwner);
  const nextPath = await ownershipManifestPath(input.nextOwner);
  if (previousPath !== nextPath) throw new Error("Workspace transfer cannot change Attempt identity or protected manifest path.");
  const manifest = await requireOwnedManifest(input.previousOwner);
  if (manifest.process.state !== "TERMINATED" || !gitSha(input.checkpointCandidateSha)) {
    throw new Error("Only a terminated workspace with an exact publication checkpoint can transfer sessions.");
  }
  assertStaticWorkspaceIdentity(input.previousOwner, input.nextOwner);
  const [branch, head, status] = await Promise.all([
    git(input.previousOwner.worktree, ["branch", "--show-current"]),
    git(input.previousOwner.worktree, ["rev-parse", "HEAD"]),
    git(input.previousOwner.worktree, ["status", "--porcelain=v1", "--untracked-files=all"]),
  ]);
  if (branch !== input.previousOwner.branch || head !== input.checkpointCandidateSha || status) {
    throw new Error("Publication workspace transfer proof does not match the clean checkpoint candidate.");
  }
  const transferred: FactoryWorkspaceOwnershipManifest = {
    ...manifest,
    workerId: input.nextOwner.workerId,
    workerSessionId: input.nextOwner.workerSessionId,
    workerGeneration: input.nextOwner.workerGeneration,
    leaseId: input.nextOwner.leaseId,
    updatedAt: Date.now(),
  };
  await writeManifest(nextPath, transferred);
  return transferred;
}

export async function cleanupOwnedFactoryWorkspace(input: {
  owner: FactoryWorkspaceOwner;
  expectedHeadSha: string;
  expectedPullRequestUrl: string;
}): Promise<{ outcome: "COMPLETED" | "PRESERVED"; reason: string }> {
  let manifest: FactoryWorkspaceOwnershipManifest;
  try {
    manifest = await requireOwnedManifest(input.owner);
  } catch (error) {
    return { outcome: "PRESERVED", reason: safeReason(error) };
  }
  const preserve = async (reason: string) => {
    await writeManifest(await ownershipManifestPath(input.owner), {
      ...manifest,
      cleanup: { status: "PRESERVED", reason, checkedAt: Date.now() },
      updatedAt: Date.now(),
    });
    return { outcome: "PRESERVED" as const, reason };
  };
  if (manifest.process.state !== "TERMINATED") return await preserve("executor-process-not-proven-terminated");
  if (manifest.publication?.headSha !== input.expectedHeadSha
    || manifest.publication.pullRequestUrl !== input.expectedPullRequestUrl) {
    return await preserve("publication-proof-mismatch");
  }

  try {
    const boundary = assertWorktreeBoundary(input.owner.checkoutRoot, input.owner.worktree);
    const [checkoutRoot, worktreeRoot, registeredWorktreeRoot, branch, head, status, remote, worktreeList, baseIsAncestor] = await Promise.all([
      realpath(boundary.checkoutRoot),
      realpath(boundary.worktree),
      realpath(boundary.worktreeRoot),
      git(boundary.worktree, ["branch", "--show-current"]),
      git(boundary.worktree, ["rev-parse", "HEAD"]),
      git(boundary.worktree, ["status", "--porcelain=v1", "--untracked-files=all"]),
      git(boundary.checkoutRoot, ["remote", "get-url", "origin"]),
      git(boundary.checkoutRoot, ["worktree", "list", "--porcelain"]),
      gitSucceeds(boundary.worktree, ["merge-base", "--is-ancestor", input.owner.baseSha, input.expectedHeadSha]),
    ]);
    const realRelativeWorktree = path.relative(registeredWorktreeRoot, worktreeRoot);
    if (checkoutRoot !== await realpath(input.owner.checkoutRoot)
      || worktreeRoot !== await realpath(input.owner.worktree)
      || !realRelativeWorktree
      || realRelativeWorktree.startsWith("..")
      || path.isAbsolute(realRelativeWorktree)
      || branch !== input.owner.branch
      || head !== input.expectedHeadSha
      || !baseIsAncestor
      || status
      || canonicalRepository(remote) !== input.owner.repositoryIdentity
      || !worktreeListHasExactOwner(worktreeList, worktreeRoot, input.owner.branch)) {
      return await preserve("git-worktree-ownership-proof-mismatch-or-dirty");
    }
  } catch (error) {
    return await preserve(`cleanup-proof-failed:${safeReason(error)}`);
  }
  const boundary = assertWorktreeBoundary(input.owner.checkoutRoot, input.owner.worktree);
  try {
    await git(boundary.checkoutRoot, ["worktree", "remove", boundary.worktree]);
  } catch (error) {
    return await preserve(`cleanup-remove-refused:${safeReason(error)}`);
  }
  await writeManifest(await ownershipManifestPath(input.owner), {
    ...manifest,
    cleanup: { status: "COMPLETED", reason: "exact-owned-clean-published-worktree-removed", checkedAt: Date.now() },
    updatedAt: Date.now(),
  });
  return { outcome: "COMPLETED", reason: "exact-owned-clean-published-worktree-removed" };
}

export async function loadFactoryWorkspaceOwnership(owner: FactoryWorkspaceOwner) {
  return await readManifest(await ownershipManifestPath(owner));
}

async function updateOwnedManifest(
  owner: FactoryWorkspaceOwner,
  update: (manifest: FactoryWorkspaceOwnershipManifest) => FactoryWorkspaceOwnershipManifest,
) {
  const manifestPath = await ownershipManifestPath(owner);
  const manifest = await requireOwnedManifest(owner);
  const next = { ...update(manifest), updatedAt: Date.now() };
  await writeManifest(manifestPath, next);
  return next;
}

async function requireOwnedManifest(owner: FactoryWorkspaceOwner) {
  validateOwner(owner);
  const manifest = await readManifest(await ownershipManifestPath(owner));
  if (!manifest) throw new Error("Protected workspace ownership manifest is missing.");
  assertExactOwner(manifest, owner);
  return manifest;
}

async function ownershipManifestPath(owner: FactoryWorkspaceOwner) {
  const boundary = assertWorktreeBoundary(owner.checkoutRoot, owner.worktree);
  const stateRoot = path.join(boundary.checkoutRoot, ".mission-control", "worker-state", "workspaces");
  await ensureProtectedDirectory(stateRoot, boundary.checkoutRoot);
  const fileName = `${createHash("sha256").update(owner.workflowRunId).digest("hex")}.json`;
  return path.join(stateRoot, fileName);
}

async function ensureProtectedDirectory(directory: string, checkoutRoot: string) {
  const relative = path.relative(path.resolve(checkoutRoot), path.resolve(directory));
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Worker state path escaped the checkout root.");
  let current = path.resolve(checkoutRoot);
  const segments = relative.split(path.sep).filter(Boolean);
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const existing = await lstat(current).catch(() => null);
    if (existing?.isSymbolicLink()) throw new Error("Worker state directory cannot traverse a symbolic link.");
    if (!existing) await mkdir(current, { mode: 0o700 });
    else if (!existing.isDirectory()) throw new Error("Worker state path must contain directories only.");
    if (existing && index >= 1 && (existing.mode & 0o077) !== 0) {
      throw new Error("Worker state directories must not be group/world accessible.");
    }
  }
}

async function readManifest(manifestPath: string): Promise<FactoryWorkspaceOwnershipManifest | undefined> {
  const file = await lstat(manifestPath).catch(() => null);
  if (!file) return undefined;
  if (file.isSymbolicLink() || !file.isFile()) throw new Error("Workspace ownership manifest must be a regular protected file.");
  const parsed = JSON.parse(await readFile(manifestPath, "utf8"));
  if (parsed?.version !== "factory-workspace-ownership/v1") throw new Error("Workspace ownership manifest version is invalid.");
  return parsed;
}

async function writeManifest(manifestPath: string, manifest: FactoryWorkspaceOwnershipManifest) {
  const temporaryPath = `${manifestPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  await rename(temporaryPath, manifestPath);
}

function validateOwner(owner: FactoryWorkspaceOwner) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(owner.repositoryIdentity)
    || !owner.workflowRunId.trim()
    || !owner.workerId.trim()
    || !owner.workerSessionId.trim()
    || !Number.isSafeInteger(owner.workerGeneration)
    || owner.workerGeneration < 1
    || !owner.leaseId.trim()
    || !/^mc\/[A-Za-z0-9._/-]+$/.test(owner.branch)
    || !owner.executionManifestDigest.startsWith("sha256:")
    || !gitSha(owner.baseSha)) {
    throw new Error("Factory workspace ownership tuple is invalid.");
  }
  assertWorktreeBoundary(owner.checkoutRoot, owner.worktree);
}

function assertExactOwner(manifest: FactoryWorkspaceOwnershipManifest, owner: FactoryWorkspaceOwner) {
  const fields: Array<keyof FactoryWorkspaceOwner> = [
    "repositoryIdentity", "workflowRunId", "workerId", "workerSessionId", "workerGeneration",
    "leaseId", "branch", "worktree", "checkoutRoot", "executionManifestDigest", "baseSha", "sandboxId",
  ];
  if (fields.some((field) => manifest[field] !== owner[field])) {
    throw new Error("Workspace ownership tuple mismatch; workspace was preserved.");
  }
}

function assertStaticWorkspaceIdentity(previous: FactoryWorkspaceOwner, next: FactoryWorkspaceOwner) {
  const staticFields: Array<keyof FactoryWorkspaceOwner> = [
    "repositoryIdentity", "workflowRunId", "branch", "worktree", "checkoutRoot",
    "executionManifestDigest", "baseSha", "sandboxId",
  ];
  if (staticFields.some((field) => previous[field] !== next[field])) {
    throw new Error("Workspace transfer cannot change immutable Attempt ownership.");
  }
}

function worktreeListHasExactOwner(output: string, worktree: string, branch: string) {
  return output.split("\n\n").some((block) => {
    const lines = block.split("\n");
    return lines.includes(`worktree ${worktree}`) && lines.includes(`branch refs/heads/${branch}`);
  });
}

function canonicalRepository(remote: string) {
  const value = remote.trim().replace(/\.git$/, "");
  const scp = value.match(/^[^@]+@[^:]+:(.+)$/)?.[1];
  const remotePath = scp ?? (() => {
    try { return new URL(value).pathname; } catch { return value; }
  })();
  return remotePath.replace(/^\/+/, "").replace(/\.git$/, "");
}

async function git(cwd: string, args: string[]) {
  const result = await execFileAsync("git", args, { cwd, env: process.env, maxBuffer: 20 * 1024 * 1024 });
  return result.stdout.trim();
}

async function gitSucceeds(cwd: string, args: string[]) {
  try {
    await execFileAsync("git", args, { cwd, env: process.env, maxBuffer: 2 * 1024 * 1024 });
    return true;
  } catch {
    return false;
  }
}

function gitSha(value: string) {
  return /^[a-f0-9]{40,64}$/i.test(value);
}

function httpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function safeReason(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 500);
}
