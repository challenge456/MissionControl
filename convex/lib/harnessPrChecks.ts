export interface ChangeReviewLens {
  id: string;
  label: string;
  enabled: boolean;
  score?: number;
}

export interface MutationFinding {
  id: string;
  mutation: string;
  caught: boolean;
  file?: string;
}

export interface MutationTestingReport {
  diffCoveragePct: number;
  findings: MutationFinding[];
}

export interface PrCheckSignals {
  qcFindings: Array<{ title?: string; category?: string; severity: string }>;
  verificationPassRate?: number;
  diffLineCount?: number;
  testPassCount?: number;
  testFailCount?: number;
  securityFindingCount?: number;
  ciStatus?: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
}

export interface PrLineageCandidate {
  _id: string;
  repository?: string;
  branchStrategy?: string;
  metadata?: unknown;
}

export function normalizeGitHubRepository(value?: string): string | undefined {
  return value
    ?.trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git$/i, "")
    .toLowerCase();
}

export function normalizeGitBranch(value?: string): string | undefined {
  const normalized = value
    ?.trim()
    .replace(/^refs\/heads\//i, "")
    .replace(/^origin\//i, "");
  return normalized || undefined;
}

export function recordedPrLineageBranch(
  candidate: PrLineageCandidate
): string | undefined {
  const metadata = candidate.metadata && typeof candidate.metadata === "object"
    ? candidate.metadata as Record<string, unknown>
    : {};
  const pullRequestArtifact = metadata.pullRequestArtifact;
  const implementationArtifact = metadata.implementationArtifact;
  const artifactBranch = pullRequestArtifact && typeof pullRequestArtifact === "object"
    ? (pullRequestArtifact as Record<string, unknown>).branch
    : implementationArtifact && typeof implementationArtifact === "object"
      ? (implementationArtifact as Record<string, unknown>).branch
      : metadata.branch;
  if (typeof artifactBranch === "string") return normalizeGitBranch(artifactBranch);

  // A branchStrategy is usable only when it is itself one exact branch name.
  // Descriptions such as "isolated-worktree" or "feat/x in a worktree" are
  // policies, not lineage evidence.
  const branchStrategy = candidate.branchStrategy?.trim();
  if (!branchStrategy || /\s/.test(branchStrategy) || branchStrategy.toLowerCase().includes("worktree")) {
    return undefined;
  }
  return normalizeGitBranch(branchStrategy);
}

export function selectExactPrLineageWorkOrder<T extends PrLineageCandidate>(args: {
  candidates: T[];
  repository: string;
  branch?: string;
}): T | null {
  const repository = normalizeGitHubRepository(args.repository);
  const branch = normalizeGitBranch(args.branch);
  if (!repository || !branch) return null;
  const exact = args.candidates.filter((candidate) =>
    normalizeGitHubRepository(candidate.repository) === repository &&
    recordedPrLineageBranch(candidate) === branch
  );
  return exact.length === 1 ? exact[0] : null;
}

export function isVerifiedPrLineage(row: {
  workOrderId?: unknown;
  metadata?: unknown;
}): boolean {
  const metadata = row.metadata && typeof row.metadata === "object"
    ? row.metadata as Record<string, unknown>
    : {};
  return Boolean(
    row.workOrderId &&
    ["EXPLICIT_ARTIFACT", "EXACT_BRANCH"].includes(String(metadata.lineageStatus ?? ""))
  );
}

export function buildChangeReviewLenses(signals: PrCheckSignals): ChangeReviewLens[] {
  const securityHits = signals.securityFindingCount ?? countCategory(signals.qcFindings, "security");
  const readabilityHits = countCategory(signals.qcFindings, "readability");
  const platformHits = countCategory(signals.qcFindings, "platform");

  const base = signals.verificationPassRate ?? 85;
  const securityScore = clampScore(100 - securityHits * 12);
  const readabilityScore = clampScore(base - readabilityHits * 8);
  const platformScore = clampScore(base - platformHits * 6);

  return [
    { id: "security", label: "Security", enabled: true, score: securityScore },
    { id: "readability", label: "Readability", enabled: true, score: readabilityScore },
    { id: "platform", label: "Platform reuse", enabled: true, score: platformScore },
    { id: "custom", label: "Custom skills", enabled: false },
  ];
}

export function buildMutationTestingReport(signals: PrCheckSignals): MutationTestingReport {
  const diffLines = Math.max(signals.diffLineCount ?? 0, 1);
  const testsRun = (signals.testPassCount ?? 0) + (signals.testFailCount ?? 0);
  const caughtRatio = testsRun > 0 ? signals.testPassCount! / testsRun : 0.75;
  const diffCoveragePct = clampScore(Math.round(caughtRatio * 100 - (signals.testFailCount ?? 0) * 3));

  const findings: MutationFinding[] = signals.qcFindings.slice(0, 8).map((f, i) => ({
    id: `qc-${i}`,
    mutation: f.title ?? f.category ?? "QC finding",
    caught: f.severity === "GREEN" || f.severity === "INFO",
    file: f.category,
  }));

  if (findings.length === 0 && diffLines > 0) {
    findings.push(
      {
        id: "boundary-empty",
        mutation: "Boundary: empty input path not covered by tests",
        caught: (signals.testPassCount ?? 0) > 0,
        file: "diff",
      },
      {
        id: "conditional-flip",
        mutation: "Conditional branch in changed hunks",
        caught: (signals.testFailCount ?? 0) === 0,
        file: "diff",
      }
    );
  }

  return { diffCoveragePct, findings };
}

function countCategory(
  findings: Array<{ category?: string; severity: string }>,
  category: string
): number {
  const normalized = category.toLowerCase();
  return findings.filter((f) => {
    const cat = f.category?.toLowerCase() ?? "";
    if (normalized === "security") {
      return cat.includes("security") || f.severity === "RED";
    }
    if (normalized === "readability") {
      return cat.includes("docs") || cat.includes("format") || cat.includes("output");
    }
    if (normalized === "platform") {
      return cat.includes("coverage") || cat.includes("dependency") || cat.includes("config");
    }
    return cat.includes(normalized);
  }).length;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function parseGitHubRepoUrl(url: string): { owner: string; repo: string } | null {
  const trimmed = url.trim();
  const match = trimmed.match(/github\.com[/:]([^/]+)\/([^/?#]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export function parseGitHubPrUrl(
  url: string
): { owner: string; repo: string; prNumber: number } | null {
  const match = url.trim().match(/github\.com[/:]([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
    prNumber: Number.parseInt(match[3], 10),
  };
}

export function repoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export async function sha256Hex(content: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
