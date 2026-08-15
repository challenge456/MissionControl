import { execFile } from "node:child_process";
import { chmod, mkdtemp, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { assertCanonicalWorktreeBoundary, assertWorktreeBoundary } from "./factoryPathScope.js";
import { ensureFactoryWorkspaceOwnership, type FactoryWorkspaceOwner } from "./factoryWorkspaceOwnership.js";

const execFileAsync = promisify(execFile);

export async function ensureFactoryWorktree(input: {
  checkoutRoot: string;
  worktree: string;
  branch: string;
  baseSha: string;
  ownership?: FactoryWorkspaceOwner;
}) {
  const lexicalBoundary = assertWorktreeBoundary(input.checkoutRoot, input.worktree);
  assertFactoryBranch(input.branch);
  const repositoryRoot = path.resolve((await runGit(lexicalBoundary.checkoutRoot, ["rev-parse", "--show-toplevel"])).stdout.trim());
  if (await realpath(repositoryRoot) !== await realpath(lexicalBoundary.checkoutRoot)) throw new Error("Factory host checkout root does not match the Git repository root.");
  const boundary = await assertCanonicalWorktreeBoundary(input.checkoutRoot, input.worktree, { createRoot: true });
  if (!/^[a-f0-9]{40,64}$/i.test(input.baseSha)
    || !await gitSucceeds(boundary.checkoutRoot, ["cat-file", "-e", `${input.baseSha}^{commit}`])) {
    throw new Error("Factory worktree requires the exact frozen base commit to exist locally.");
  }
  const worktreeExists = await exists(boundary.worktree);
  if (input.ownership) {
    await ensureFactoryWorkspaceOwnership({ owner: input.ownership, allowCreate: !worktreeExists });
  }

  if (worktreeExists) {
    const existingRoot = path.resolve((await runGit(boundary.worktree, ["rev-parse", "--show-toplevel"])).stdout.trim());
    const existingBranch = (await runGit(boundary.worktree, ["branch", "--show-current"])).stdout.trim();
    if (await realpath(existingRoot) !== await realpath(boundary.worktree) || existingBranch !== input.branch) {
      throw new Error("Existing Factory worktree does not match the frozen attempt branch.");
    }
    if (!await gitSucceeds(boundary.worktree, ["merge-base", "--is-ancestor", input.baseSha, "HEAD"])) {
      throw new Error("Existing Factory worktree does not descend from the frozen base commit.");
    }
    return boundary.worktree;
  }

  const localBranchExists = await gitSucceeds(boundary.checkoutRoot, ["show-ref", "--verify", "--quiet", `refs/heads/${input.branch}`]);
  if (localBranchExists) {
    await runGit(boundary.checkoutRoot, ["worktree", "add", boundary.worktree, input.branch]);
    if (!await gitSucceeds(boundary.worktree, ["merge-base", "--is-ancestor", input.baseSha, "HEAD"])) {
      throw new Error("Existing Factory branch does not descend from the frozen base commit.");
    }
    return boundary.worktree;
  }
  await runGit(boundary.checkoutRoot, ["worktree", "add", "-b", input.branch, boundary.worktree, input.baseSha]);
  return boundary.worktree;
}

export async function listChangedFiles(worktree: string, baseSha?: string) {
  const [tracked, untracked, committed] = await Promise.all([
    runGit(worktree, ["diff", "--name-only", "-z", "HEAD"]),
    runGit(worktree, ["ls-files", "--others", "-z", "--exclude-standard"]),
    baseSha
      ? runGit(worktree, ["diff", "--name-only", "-z", `${baseSha}...HEAD`])
      : Promise.resolve({ stdout: "", stderr: "" }),
  ]);
  return Array.from(new Set([...splitNull(tracked.stdout), ...splitNull(untracked.stdout), ...splitNull(committed.stdout)])).sort();
}

export async function inspectCandidateChange(worktree: string, baseSha: string) {
  if (!/^[a-f0-9]{40,64}$/i.test(baseSha)) throw new Error("Candidate inspection requires the frozen full base SHA.");
  const [sourceRevision, candidateRevision, changed, deleted, numstat, diff] = await Promise.all([
    runGit(worktree, ["rev-parse", baseSha]),
    runGit(worktree, ["rev-parse", "HEAD"]),
    runGit(worktree, ["diff", "--name-only", "-z", `${baseSha}...HEAD`]),
    runGit(worktree, ["diff", "--diff-filter=D", "--name-only", "-z", `${baseSha}...HEAD`]),
    runGit(worktree, ["diff", "--numstat", `${baseSha}...HEAD`]),
    runGit(worktree, ["diff", "--no-ext-diff", "--unified=3", `${baseSha}...HEAD`]),
  ]);
  let linesAdded = 0;
  let linesDeleted = 0;
  for (const line of numstat.stdout.split("\n")) {
    const [added, removed] = line.split("\t");
    if (/^\d+$/.test(added ?? "")) linesAdded += Number(added);
    if (/^\d+$/.test(removed ?? "")) linesDeleted += Number(removed);
  }
  return {
    sourceRevision: sourceRevision.stdout.trim(),
    candidateRevision: candidateRevision.stdout.trim(),
    changedFiles: splitNull(changed.stdout).sort(),
    deletedFiles: splitNull(deleted.stdout).sort(),
    linesAdded,
    linesDeleted,
    diff: diff.stdout,
  };
}

export async function assertFactoryCandidateUnchanged(worktree: string, expectedHead: string) {
  const [head, status] = await Promise.all([
    runGit(worktree, ["rev-parse", "HEAD"]),
    runGit(worktree, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
  ]);
  if (head.stdout.trim() !== expectedHead) throw new Error("Verification changed the candidate commit. Pull-request creation was blocked.");
  if (status.stdout.length > 0) throw new Error("Verification left repository changes behind. Evidence must be produced from the exact clean candidate commit.");
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
