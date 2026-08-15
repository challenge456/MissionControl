import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { assertFactoryCandidateUnchanged, commitFactoryChanges, ensureFactoryWorktree, inspectCandidateChange, listChangedFiles } from "../factoryGitRuntime.js";

const execFileAsync = promisify(execFile);
const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("Factory Git runtime", () => {
  it("creates and reconciles the exact worktree branch across retries", async () => {
    const repository = await mkdtemp(path.join(tmpdir(), "mc-factory-git-test-"));
    cleanup.push(repository);
    await git(repository, ["init", "-b", "main"]);
    await git(repository, ["config", "user.name", "Test"]);
    await git(repository, ["config", "user.email", "test@example.com"]);
    await mkdir(path.join(repository, "apps", "ui"), { recursive: true });
    await writeFile(path.join(repository, "apps", "ui", "App.tsx"), "export const value = 1;\n");
    await git(repository, ["add", "."]);
    await git(repository, ["commit", "-m", "Initial"]);
    const baseSha = (await git(repository, ["rev-parse", "HEAD"])).stdout.trim();

    const worktree = path.join(repository, ".mission-control", "worktrees", "attempt-1");
    await ensureFactoryWorktree({ checkoutRoot: repository, worktree, branch: "mc/attempt-1", baseSha });
    await writeFile(path.join(worktree, "apps", "ui", "App.tsx"), "export const value = 2;\n");
    expect(await listChangedFiles(worktree, baseSha)).toEqual(["apps/ui/App.tsx"]);
    const firstHead = await commitFactoryChanges({ worktree, changedFiles: ["apps/ui/App.tsx"], title: "Update app" });
    const candidate = await inspectCandidateChange(worktree, baseSha);
    expect(candidate).toMatchObject({ sourceRevision: baseSha, candidateRevision: firstHead, changedFiles: ["apps/ui/App.tsx"], linesAdded: 1, linesDeleted: 1 });
    await expect(assertFactoryCandidateUnchanged(worktree, firstHead)).resolves.toBeUndefined();

    await writeFile(path.join(worktree, "verification-output.tmp"), "untrusted side effect\n");
    await expect(assertFactoryCandidateUnchanged(worktree, firstHead)).rejects.toThrow(/left repository changes behind/);
    await rm(path.join(worktree, "verification-output.tmp"));

    await ensureFactoryWorktree({ checkoutRoot: repository, worktree, branch: "mc/attempt-1", baseSha });
    expect(await listChangedFiles(worktree, baseSha)).toEqual(["apps/ui/App.tsx"]);
    expect(await commitFactoryChanges({ worktree, changedFiles: ["apps/ui/App.tsx"], title: "Update app" })).toBe(firstHead);
  });

  it("rejects a worktree root symlink that escapes the canonical checkout", async () => {
    const repository = await mkdtemp(path.join(tmpdir(), "mc-factory-git-symlink-"));
    const escapedRoot = await mkdtemp(path.join(tmpdir(), "mc-factory-git-escaped-"));
    cleanup.push(repository, escapedRoot);
    await git(repository, ["init", "-b", "main"]);
    await git(repository, ["config", "user.name", "Test"]);
    await git(repository, ["config", "user.email", "test@example.com"]);
    await writeFile(path.join(repository, "README.md"), "safe\n");
    await git(repository, ["add", "."]);
    await git(repository, ["commit", "-m", "Initial"]);
    const baseSha = (await git(repository, ["rev-parse", "HEAD"])).stdout.trim();
    await mkdir(path.join(repository, ".mission-control"));
    await symlink(escapedRoot, path.join(repository, ".mission-control", "worktrees"));

    await expect(ensureFactoryWorktree({
      checkoutRoot: repository,
      worktree: path.join(repository, ".mission-control", "worktrees", "attempt-escape"),
      branch: "mc/attempt-escape",
      baseSha,
    })).rejects.toThrow(/symbolic link|resolve inside/);
  });
});

async function git(cwd: string, args: string[]) {
  return await execFileAsync("git", args, { cwd });
}
