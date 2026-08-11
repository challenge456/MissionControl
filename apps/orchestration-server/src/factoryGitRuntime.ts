import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { assertWorktreeBoundary } from "./factoryPathScope.js";

const execFileAsync = promisify(execFile);

export async function ensureFactoryWorktree(input: {
  checkoutRoot: string;
  worktree: string;
  branch: string;
  defaultBranch: string;
}) {
  const boundary = assertWorktreeBoundary(input.checkoutRoot, input.worktree);
  assertFactoryBranch(input.branch);
  const repositoryRoot = path.resolve((await runGit(boundary.checkoutRoot, ["rev-parse", "--show-toplevel"])).stdout.trim());
  if (await realpath(repositoryRoot) !== await realpath(boundary.checkoutRoot)) throw new Error("Factory host checkout root does not match the Git repository root.");
  await mkdir(boundary.worktreeRoot, { recursive: true });

  if (await exists(boundary.worktree)) {
    const existingRoot = path.resolve((await runGit(boundary.worktree, ["rev-parse", "--show-toplevel"])).stdout.trim());
    const existingBranch = (await runGit(boundary.worktree, ["branch", "--show-current"])).stdout.trim();
    if (await realpath(existingRoot) !== await realpath(boundary.worktree) || existingBranch !== input.branch) {
      throw new Error("Existing Factory worktree does not match the frozen attempt branch.");
    }
    return boundary.worktree;
  }

  const localBranchExists = await gitSucceeds(boundary.checkoutRoot, ["show-ref", "--verify", "--quiet", `refs/heads/${input.branch}`]);
  if (localBranchExists) {
    await runGit(boundary.checkoutRoot, ["worktree", "add", boundary.worktree, input.branch]);
    return boundary.worktree;
  }
  const remoteBase = `refs/remotes/origin/${input.defaultBranch}`;
  const base = await gitSucceeds(boundary.checkoutRoot, ["show-ref", "--verify", "--quiet", remoteBase])
    ? `origin/${input.defaultBranch}`
    : input.defaultBranch;
  await runGit(boundary.checkoutRoot, ["worktree", "add", "-b", input.branch, boundary.worktree, base]);
  return boundary.worktree;
}

export async function listChangedFiles(worktree: string, defaultBranch?: string) {
  const [tracked, untracked, committed] = await Promise.all([
    runGit(worktree, ["diff", "--name-only", "-z", "HEAD"]),
    runGit(worktree, ["ls-files", "--others", "-z", "--exclude-standard"]),
    defaultBranch
      ? runGit(worktree, ["diff", "--name-only", "-z", `${await resolveBaseReference(worktree, defaultBranch)}...HEAD`])
      : Promise.resolve({ stdout: "", stderr: "" }),
  ]);
  return Array.from(new Set([...splitNull(tracked.stdout), ...splitNull(untracked.stdout), ...splitNull(committed.stdout)])).sort();
}

export async function commitFactoryChanges(input: {
  worktree: string;
  changedFiles: string[];
  title: string;
}) {
  if (input.changedFiles.length === 0) throw new Error("Factory attempt produced no changed files.");
  const dirty = (await runGit(input.worktree, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])).stdout.length > 0;
  if (!dirty) return await currentHead(input.worktree);
  await runGit(input.worktree, ["add", "--all", "--", ...input.changedFiles]);
  if (await gitSucceeds(input.worktree, ["diff", "--cached", "--quiet"])) {
    throw new Error("Factory attempt produced no committable changes.");
  }
  await runGit(input.worktree, ["commit", "-m", input.title.slice(0, 200)], {
    GIT_AUTHOR_NAME: "Mission Control Factory",
    GIT_AUTHOR_EMAIL: "factory@mission-control.local",
    GIT_COMMITTER_NAME: "Mission Control Factory",
    GIT_COMMITTER_EMAIL: "factory@mission-control.local",
  });
  return (await runGit(input.worktree, ["rev-parse", "HEAD"])).stdout.trim();
}

export async function pushFactoryBranch(input: {
  worktree: string;
  repository: string;
  branch: string;
  installationToken: string;
}) {
  assertFactoryBranch(input.branch);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input.repository)) throw new Error("GitHub repository identity is invalid.");
  const helperDirectory = await mkdtemp(path.join(tmpdir(), "mc-git-askpass-"));
  const helperPath = path.join(helperDirectory, "askpass.sh");
  try {
    await writeFile(helperPath, [
      "#!/bin/sh",
      "case \"$1\" in",
      "  *Username*) printf '%s\\n' 'x-access-token' ;;",
      "  *) printf '%s\\n' \"$MC_GITHUB_INSTALLATION_TOKEN\" ;;",
      "esac",
      "",
    ].join("\n"), { encoding: "utf8", mode: 0o700 });
    await chmod(helperPath, 0o700);
    await runGit(input.worktree, [
      "push",
      `https://github.com/${input.repository}.git`,
      `HEAD:refs/heads/${input.branch}`,
    ], {
      GIT_ASKPASS: helperPath,
      GIT_TERMINAL_PROMPT: "0",
      MC_GITHUB_INSTALLATION_TOKEN: input.installationToken,
    });
  } finally {
    await rm(helperDirectory, { recursive: true, force: true });
  }
}

export async function currentHead(worktree: string) {
  return (await runGit(worktree, ["rev-parse", "HEAD"])).stdout.trim();
}

function assertFactoryBranch(branch: string) {
  if (!/^mc\/[A-Za-z0-9._/-]+$/.test(branch) || branch.includes("..") || branch.endsWith("/")) {
    throw new Error("Factory branch must use a safe server-owned mc/ namespace.");
  }
}

async function runGit(cwd: string, args: string[], additionalEnv?: Record<string, string>) {
  try {
    return await execFileAsync("git", args, {
      cwd,
      env: { ...process.env, ...additionalEnv },
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (cause: any) {
    const detail = String(cause?.stderr ?? cause?.message ?? "Git command failed")
      .replace(/(authorization|token|password)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
      .slice(0, 1_000);
    throw new Error(`Git operation failed: ${detail}`);
  }
}

async function gitSucceeds(cwd: string, args: string[]) {
  try {
    await execFileAsync("git", args, { cwd, env: process.env, maxBuffer: 2 * 1024 * 1024 });
    return true;
  } catch {
    return false;
  }
}

async function exists(candidate: string) {
  return await stat(candidate).then(() => true).catch(() => false);
}

function splitNull(value: string) {
  return value.split("\0").map((item) => item.trim()).filter(Boolean);
}

async function resolveBaseReference(worktree: string, defaultBranch: string) {
  return await gitSucceeds(worktree, ["show-ref", "--verify", "--quiet", `refs/remotes/origin/${defaultBranch}`])
    ? `origin/${defaultBranch}`
    : defaultBranch;
}
