import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  cleanupOwnedFactoryWorkspace,
  ensureFactoryWorkspaceOwnership,
  loadFactoryWorkspaceOwnership,
  recordFactoryExecutorStarted,
  recordFactoryExecutorTerminated,
  recordFactoryPublication,
  transferFactoryPublicationWorkspace,
  type FactoryWorkspaceOwner,
} from "../factoryWorkspaceOwnership.js";

const execFileAsync = promisify(execFile);
const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("Factory workspace ownership", () => {
  it("preserves a workspace when the complete ownership tuple does not match", async () => {
    const fixture = await createFixture();
    await ensureFactoryWorkspaceOwnership({ owner: fixture.owner, allowCreate: true });

    await expect(ensureFactoryWorkspaceOwnership({
      owner: { ...fixture.owner, leaseId: "lease-other" },
      allowCreate: false,
    })).rejects.toThrow(/ownership tuple mismatch/);
    await expect(access(fixture.worktree)).resolves.toBeUndefined();
  });

  it("preserves dirty and running workspaces instead of forcing cleanup", async () => {
    const fixture = await createFixture();
    await ensureFactoryWorkspaceOwnership({ owner: fixture.owner, allowCreate: true });
    await recordFactoryExecutorStarted(fixture.owner, 12345);
    await recordFactoryPublication(fixture.owner, {
      headSha: fixture.headSha,
      pullRequestUrl: "https://github.com/sellerfi/runtime-fixture/pull/1",
    });
    const running = await cleanupOwnedFactoryWorkspace({
      owner: fixture.owner,
      expectedHeadSha: fixture.headSha,
      expectedPullRequestUrl: "https://github.com/sellerfi/runtime-fixture/pull/1",
    });
    expect(running).toEqual({ outcome: "PRESERVED", reason: "executor-process-not-proven-terminated" });

    await recordFactoryExecutorTerminated(fixture.owner, { pid: 12345, exitCode: 0 });
    await writeFile(path.join(fixture.worktree, "operator-inspection.txt"), "preserve me\n");
    const dirty = await cleanupOwnedFactoryWorkspace({
      owner: fixture.owner,
      expectedHeadSha: fixture.headSha,
      expectedPullRequestUrl: "https://github.com/sellerfi/runtime-fixture/pull/1",
    });
    expect(dirty).toMatchObject({ outcome: "PRESERVED", reason: "git-worktree-ownership-proof-mismatch-or-dirty" });
    await expect(access(path.join(fixture.worktree, "operator-inspection.txt"))).resolves.toBeUndefined();
  });

  it("removes only an exact, clean, published, terminated worktree", async () => {
    const fixture = await createFixture();
    await ensureFactoryWorkspaceOwnership({ owner: fixture.owner, allowCreate: true });
    await recordFactoryExecutorStarted(fixture.owner, 23456);
    await recordFactoryExecutorTerminated(fixture.owner, { pid: 23456, exitCode: 0 });
    await recordFactoryPublication(fixture.owner, {
      headSha: fixture.headSha,
      pullRequestUrl: "https://github.com/sellerfi/runtime-fixture/pull/2",
    });

    expect(await cleanupOwnedFactoryWorkspace({
      owner: fixture.owner,
      expectedHeadSha: fixture.headSha,
      expectedPullRequestUrl: "https://github.com/sellerfi/runtime-fixture/pull/2",
    })).toEqual({ outcome: "COMPLETED", reason: "exact-owned-clean-published-worktree-removed" });
    await expect(access(fixture.worktree)).rejects.toThrow();
    expect(await loadFactoryWorkspaceOwnership(fixture.owner)).toMatchObject({ cleanup: { status: "COMPLETED" } });
  });

  it("transfers only a clean terminated publication checkpoint to a new worker session", async () => {
    const fixture = await createFixture();
    await ensureFactoryWorkspaceOwnership({ owner: fixture.owner, allowCreate: true });
    await recordFactoryExecutorStarted(fixture.owner, 34567);
    await recordFactoryExecutorTerminated(fixture.owner, { pid: 34567, exitCode: 0 });
    const nextOwner = {
      ...fixture.owner,
      workerSessionId: "session-2",
      workerGeneration: 2,
      leaseId: "lease-2",
    };
    expect(await transferFactoryPublicationWorkspace({
      previousOwner: fixture.owner,
      nextOwner,
      checkpointCandidateSha: fixture.headSha,
    })).toMatchObject({ workerSessionId: "session-2", workerGeneration: 2, leaseId: "lease-2" });
  });
});

async function createFixture() {
  const checkoutRoot = await mkdtemp(path.join(tmpdir(), "mc-workspace-owner-test-"));
  cleanup.push(checkoutRoot);
  await git(checkoutRoot, ["init", "-b", "main"]);
  await git(checkoutRoot, ["config", "user.name", "Mission Control Test"]);
  await git(checkoutRoot, ["config", "user.email", "factory@example.test"]);
  await git(checkoutRoot, ["remote", "add", "origin", "https://github.com/sellerfi/runtime-fixture.git"]);
  await mkdir(path.join(checkoutRoot, "src"), { recursive: true });
  await writeFile(path.join(checkoutRoot, "src", "index.ts"), "export const runtime = true;\n");
  await git(checkoutRoot, ["add", "."]);
  await git(checkoutRoot, ["commit", "-m", "Initial"]);
  const headSha = await git(checkoutRoot, ["rev-parse", "HEAD"]);
  const worktree = path.join(checkoutRoot, ".mission-control", "worktrees", "attempt-1");
  await git(checkoutRoot, ["worktree", "add", "-b", "mc/attempt-1", worktree, headSha]);
  const owner: FactoryWorkspaceOwner = {
    repositoryIdentity: "sellerfi/runtime-fixture",
    workflowRunId: "workflow-run-1",
    workerId: "worker-1",
    workerSessionId: "session-1",
    workerGeneration: 1,
    leaseId: "lease-1",
    branch: "mc/attempt-1",
    worktree,
    checkoutRoot,
    executionManifestDigest: `sha256:${"f".repeat(64)}`,
    baseSha: headSha,
  };
  return { checkoutRoot, worktree, headSha, owner };
}

async function git(cwd: string, args: string[]) {
  const result = await execFileAsync("git", args, { cwd });
  return result.stdout.trim();
}
