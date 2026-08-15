import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertFactoryCandidateUnchanged,
  commitFactoryChanges,
  ensureFactoryWorktree,
  ensureVerificationWorktree,
  inspectCandidateChange,
  listChangedFiles,
} from "../factoryGitRuntime.js";

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

    const worktree = path.join(repository, ".mission-control", "worktrees", "attempt-1");
    await ensureFactoryWorktree({ checkoutRoot: repository, worktree, branch: "mc/attempt-1", defaultBranch: "main" });
    await writeFile(path.join(worktree, "apps", "ui", "App.tsx"), "export const value = 2;\n");
    expect(await listChangedFiles(worktree, "main")).toEqual(["apps/ui/App.tsx"]);
    const firstHead = await commitFactoryChanges({ worktree, changedFiles: ["apps/ui/App.tsx"], title: "Update app" });
    const candidate = await inspectCandidateChange(worktree, "main");
    expect(candidate).toMatchObject({ candidateRevision: firstHead, changedFiles: ["apps/ui/App.tsx"], linesAdded: 1, linesDeleted: 1 });
    await expect(assertFactoryCandidateUnchanged(worktree, firstHead)).resolves.toBeUndefined();

    await writeFile(path.join(repository, "README.md"), "moving default branch\n");
    await git(repository, ["add", "README.md"]);
    await git(repository, ["commit", "-m", "Advance main"]);
    const movingBase = await inspectCandidateChange(worktree, "main");
    expect(movingBase.sourceRevision).not.toBe(candidate.sourceRevision);
    const exactBase = await inspectCandidateChange(worktree, "main", candidate.sourceRevision);
    expect(exactBase).toMatchObject({
      sourceRevision: candidate.sourceRevision,
      candidateRevision: candidate.candidateRevision,
      treeRevision: candidate.treeRevision,
    });

    const verificationWorktree = path.join(repository, ".mission-control", "worktrees", "verification-1");
    await expect(ensureVerificationWorktree({
      checkoutRoot: repository,
      worktree: verificationWorktree,
      candidateSha: candidate.candidateRevision,
      treeSha: candidate.treeRevision,
    })).resolves.toBe(verificationWorktree);
    await writeFile(path.join(verificationWorktree, "verification-output.tmp"), "untrusted side effect\n");
    await expect(ensureVerificationWorktree({
      checkoutRoot: repository,
      worktree: verificationWorktree,
      candidateSha: candidate.candidateRevision,
      treeSha: candidate.treeRevision,
    })).rejects.toThrow(/does not match the immutable candidate commit and tree/);
    await rm(path.join(verificationWorktree, "verification-output.tmp"));

    await writeFile(path.join(worktree, "verification-output.tmp"), "untrusted side effect\n");
    await expect(assertFactoryCandidateUnchanged(worktree, firstHead)).rejects.toThrow(/left repository changes behind/);
    await rm(path.join(worktree, "verification-output.tmp"));

    await ensureFactoryWorktree({ checkoutRoot: repository, worktree, branch: "mc/attempt-1", defaultBranch: "main" });
    expect(await listChangedFiles(worktree, "main")).toEqual(["apps/ui/App.tsx"]);
    expect(await commitFactoryChanges({ worktree, changedFiles: ["apps/ui/App.tsx"], title: "Update app" })).toBe(firstHead);
  });
});

async function git(cwd: string, args: string[]) {
  await execFileAsync("git", args, { cwd });
}
