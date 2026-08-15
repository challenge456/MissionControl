import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ConvexHttpClient } from "convex/browser";
import { ConvexMutations } from "./convexCalls.js";

const execFileAsync = promisify(execFile);

export interface FactoryHostReporterConfig {
  projectId: string;
  hostId: string;
  checkoutRoot: string;
  maxConcurrentRuns: number;
  getCurrentRuns: () => number;
  approvedModelIds?: string[];
  networkPolicyStatus?: "READY" | "BLOCKED" | "UNKNOWN";
  secretPolicyStatus?: "READY" | "BLOCKED" | "UNKNOWN";
  intervalMs?: number;
  onError?: (error: unknown) => void;
}

export interface FactoryCheckoutObservation {
  repository: string;
  checkoutRoot: string;
  observedBranch?: string;
  observedCommit: string;
  dirty: boolean;
}

export class FactoryHostReporter {
  private timer: ReturnType<typeof setInterval> | null = null;
  private reporting = false;

  constructor(
    private readonly client: ConvexHttpClient,
    private readonly config: FactoryHostReporterConfig,
  ) {}

  start() {
    if (this.timer) return;
    const intervalMs = Math.max(30_000, this.config.intervalMs ?? 60_000);
    const report = () => void this.report().catch((error) => this.config.onError?.(error));
    this.timer = setInterval(report, intervalMs);
    report();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async report() {
    if (this.reporting) return;
    this.reporting = true;
    try {
      const observation = await inspectFactoryCheckout(this.config.checkoutRoot);
      const now = Date.now();
      await this.client.mutation(ConvexMutations.workspaceHostBindings.report as any, {
        projectId: this.config.projectId,
        hostId: this.config.hostId,
        repository: observation.repository,
        checkoutRoot: observation.checkoutRoot,
        observedBranch: observation.observedBranch,
        observedCommit: observation.observedCommit,
        dirty: observation.dirty,
        runtime: `node ${process.version} ${process.platform}/${process.arch}`,
        approvedModelIds: this.config.approvedModelIds,
        networkPolicyStatus: this.config.networkPolicyStatus,
        secretPolicyStatus: this.config.secretPolicyStatus,
        maxConcurrentRuns: this.config.maxConcurrentRuns,
        currentRuns: this.config.getCurrentRuns(),
        attestedAt: now,
        status: observation.dirty ? "DIRTY" : "READY",
        checkedAt: now,
      });
    } finally {
      this.reporting = false;
    }
  }
}

export async function inspectFactoryCheckout(cwd: string): Promise<FactoryCheckoutObservation> {
  const [checkoutRoot, remoteUrl, branch, commit, status] = await Promise.all([
    git(cwd, ["rev-parse", "--show-toplevel"]),
    git(cwd, ["remote", "get-url", "origin"]),
    git(cwd, ["branch", "--show-current"]),
    git(cwd, ["rev-parse", "HEAD"]),
    git(cwd, ["status", "--porcelain=v1", "--untracked-files=all"]),
  ]);
  return {
    repository: canonicalRepositoryFromRemote(remoteUrl),
    checkoutRoot,
    observedBranch: branch || undefined,
    observedCommit: commit,
    dirty: Boolean(status),
  };
}

export function canonicalRepositoryFromRemote(remoteUrl: string) {
  const value = remoteUrl.trim().replace(/\.git$/, "");
  const scpMatch = value.match(/^[^@]+@[^:]+:(.+)$/);
  const pathValue = scpMatch?.[1] ?? (() => {
    try {
      return new URL(value).pathname;
    } catch {
      return value;
    }
  })();
  const repository = pathValue.replace(/^\/+/, "").replace(/\.git$/, "");
  if (repository.split("/").length !== 2) {
    throw new Error("Factory checkout origin must identify one owner/repository pair.");
  }
  return repository;
}

async function git(cwd: string, args: string[]) {
  const result = await execFileAsync("git", args, {
    cwd,
    env: process.env,
    maxBuffer: 2 * 1024 * 1024,
  });
  return result.stdout.trim();
}
