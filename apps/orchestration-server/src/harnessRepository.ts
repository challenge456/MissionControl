import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { HarnessChangedFile } from "@mission-control/workflow-engine";
import { listChangedFiles } from "./factoryGitRuntime.js";
import { validateChangedFileScope } from "./factoryPathScope.js";

const execFileAsync = promisify(execFile);

export async function captureHarnessRepositoryBaseline(repositoryRoot: string) {
  return await gitOptional(repositoryRoot, ["rev-parse", "HEAD"]);
}

export async function collectHarnessRepositoryResult(input: {
  repositoryRoot: string;
  workingDirectory: string;
  baselineCommit: string | null;
  allowedPaths: string[];
  deniedPaths: string[];
}) {
  const headCommit = await gitOptional(input.repositoryRoot, ["rev-parse", "HEAD"]);
  const changedPaths = await listChangedFiles(input.repositoryRoot, input.baselineCommit ?? undefined);
  const lineCounts = input.baselineCommit
    ? await gitOptional(input.repositoryRoot, ["diff", "--numstat", input.baselineCommit])
    : null;
  const counts = parseNumstat(lineCounts ?? "");
  const changedFiles: HarnessChangedFile[] = changedPaths.map((filePath) => ({
    path: filePath,
    status: "CHANGED",
    additions: counts.get(filePath)?.additions ?? null,
    deletions: counts.get(filePath)?.deletions ?? null,
  }));
  const scope = validateChangedFileScope(changedPaths, {
    allowedPaths: input.allowedPaths,
    excludedPaths: input.deniedPaths,
  });
  return {
    root: input.repositoryRoot,
    workingDirectory: input.workingDirectory,
    baselineCommit: input.baselineCommit,
    headCommit,
    headChanged: Boolean(input.baselineCommit && headCommit && input.baselineCommit !== headCommit),
    changedFiles,
    scopeViolations: scope.ok ? [] : scope.outsideScope,
  };
}

function parseNumstat(value: string) {
  const result = new Map<string, { additions: number | null; deletions: number | null }>();
  for (const line of value.split("\n")) {
    const [added, deleted, filePath] = line.split("\t");
    if (!filePath) continue;
    result.set(filePath, {
      additions: /^\d+$/.test(added ?? "") ? Number(added) : null,
      deletions: /^\d+$/.test(deleted ?? "") ? Number(deleted) : null,
    });
  }
  return result;
}

async function gitOptional(cwd: string, args: string[]) {
  try {
    const result = await execFileAsync("git", args, {
      cwd,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, GIT_TERMINAL_PROMPT: "0" },
      maxBuffer: 20 * 1024 * 1024,
    });
    return result.stdout.trim();
  } catch {
    return null;
  }
}
