/**
 * Harness PR checks — change review lenses + mutation testing synced from PR/CI sources.
 */

import { v } from "convex/values";
import { action, internalQuery, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  buildChangeReviewLenses,
  buildMutationTestingReport,
  parseGitHubPrUrl,
  repoFullName,
  type PrCheckSignals,
} from "../lib/harnessPrChecks";
import { computeMergeGates } from "../lib/mergeGates";
import { fetchPullRequestCi } from "../lib/githubCiIngest";
import { buildFileChanges } from "../lib/runInspector";
import { mergeAuthoritySatisfied } from "../lib/prEvaluation";

const lensValidator = v.array(
  v.object({
    id: v.string(),
    label: v.string(),
    enabled: v.boolean(),
    score: v.optional(v.number()),
  })
);

export const listForProject = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let rows = args.projectId
      ? await ctx.db
          .query("harnessPrChecks")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : await ctx.db.query("harnessPrChecks").collect();
    rows.sort((a, b) => b.syncedAt - a.syncedAt);
    return rows.slice(0, args.limit ?? 20);
  },
});

export const getLatest = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    let rows = args.projectId
      ? await ctx.db
          .query("harnessPrChecks")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : await ctx.db.query("harnessPrChecks").collect();
    rows.sort((a, b) => b.syncedAt - a.syncedAt);
    return rows[0] ?? null;
  },
});

export const getByPrUrl = query({
  args: { prUrl: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("harnessPrChecks")
      .withIndex("by_pr_url", (q) => q.eq("prUrl", args.prUrl))
      .collect();
    rows.sort((a, b) => b.syncedAt - a.syncedAt);
    return rows[0] ?? null;
  },
});

export const getMergeGateStatus = query({
  args: { projectId: v.optional(v.id("projects")), prUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let check = null;
    if (args.prUrl) {
      const rows = await ctx.db
        .query("harnessPrChecks")
        .withIndex("by_pr_url", (q) => q.eq("prUrl", args.prUrl!))
        .collect();
      rows.sort((a, b) => b.syncedAt - a.syncedAt);
      check = rows[0] ?? null;
    } else {
      let rows = args.projectId
        ? await ctx.db
            .query("harnessPrChecks")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect()
        : await ctx.db.query("harnessPrChecks").collect();
      rows.sort((a, b) => b.syncedAt - a.syncedAt);
      check = rows[0] ?? null;
    }

    let verifiers = await ctx.db.query("contextVerifiers").collect();
    if (args.projectId) {
      verifiers = verifiers.filter((v) => v.projectId === args.projectId);
    }
    const activeVerifierCount = verifiers.filter((v) => v.active).length;

    const lenses = check?.changeReviewLenses ?? [];
    const meta =
      check?.metadata && typeof check.metadata === "object"
        ? (check.metadata as { securityFindingCount?: number })
        : {};
    const gates = computeMergeGates({
      lenses,
      ciStatus: check?.ciStatus,
      mutationCoveragePct: check?.mutationTesting?.diffCoveragePct,
      activeVerifierCount,
      securityFindingCount: meta.securityFindingCount,
    });

    return {
      gates,
      allPass: gates.every((g) => g.passed),
      evaluationId: check?._id,
      prUrl: check?.prUrl,
      ciStatus: check?.ciStatus,
      headSha: check?.headSha,
      workOrderId: check?.workOrderId,
      workflowRunId: check?.workflowRunId,
      taskId: check?.taskId,
      loopEngineeringCycleId: check?.loopEngineeringCycleId,
      syncedAt: check?.syncedAt,
      mergeActor: check?.mergeActor,
      mergedAt: check?.mergedAt,
      mergeCommitSha: check?.mergeCommitSha,
    };
  },
});

async function collectSignalsForPr(
  ctx: { db: any },
  projectId: string | undefined,
  prUrl: string,
  diffText?: string
): Promise<PrCheckSignals> {
  const qcRuns = await ctx.db.query("qcRuns").order("desc").take(30);
  const scopedRuns = projectId
    ? qcRuns.filter((r: { projectId?: string }) => r.projectId === projectId)
    : qcRuns;

  const qcFindings: PrCheckSignals["qcFindings"] = [];
  for (const run of scopedRuns.slice(0, 5)) {
    const findings = await ctx.db
      .query("qcFindings")
      .withIndex("by_run", (q: any) => q.eq("qcRunId", run._id))
      .collect();
    for (const f of findings) {
      qcFindings.push({
        title: f.title,
        category: f.category,
        severity: f.severity,
      });
    }
  }

  let testPassCount = 0;
  let testFailCount = 0;
  const workflowRuns = projectId
    ? (await ctx.db.query("workflowRuns").collect()).filter(
        (r: { projectId?: string }) => r.projectId === projectId
      )
    : await ctx.db.query("workflowRuns").order("desc").take(20);

  for (const run of workflowRuns.slice(0, 10)) {
    const events = await ctx.db
      .query("runEvents")
      .withIndex("by_run", (q: any) => q.eq("workflowRunId", run._id))
      .collect();
    const fileChanges = buildFileChanges(events);
    if (fileChanges.some((c) => c.pullRequestUrl === prUrl)) {
      for (const ev of events) {
        if (ev.eventType === "TEST_COMPLETED" || ev.toolName === "vitest") {
          if (ev.status === "COMPLETED" || ev.status === "PASS") testPassCount += 1;
          else testFailCount += 1;
        }
      }
    }
  }

  const diffLineCount = diffText
    ? diffText.split("\n").filter((l) => l.startsWith("+") || l.startsWith("-")).length
    : undefined;

  const securityFindingCount = qcFindings.filter(
    (f) => f.category?.toLowerCase().includes("security") || f.severity === "RED"
  ).length;

  const verificationPassRate =
    testPassCount + testFailCount > 0
      ? Math.round((testPassCount / (testPassCount + testFailCount)) * 100)
      : undefined;

  return {
    qcFindings,
    verificationPassRate,
    diffLineCount,
    testPassCount,
    testFailCount,
    securityFindingCount,
  };
}

async function upsertPrCheck(
  ctx: { db: any },
  input: {
    projectId?: string;
    prUrl: string;
    repoFullName: string;
    prNumber?: number;
    branch?: string;
    title?: string;
    source: "CODEGEN" | "WORKFLOW" | "GITHUB" | "MANUAL";
    sourceRef?: string;
    ciStatus?: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
    ciRunUrl?: string;
    diffText?: string;
  }
) {
  const signals = await collectSignalsForPr(ctx, input.projectId, input.prUrl, input.diffText);
  const changeReviewLenses = buildChangeReviewLenses(signals);
  const mutationTesting = buildMutationTestingReport(signals);
  const now = Date.now();

  const existingRows = await ctx.db
    .query("harnessPrChecks")
    .withIndex("by_pr_url", (q: any) => q.eq("prUrl", input.prUrl))
    .collect();
  existingRows.sort((a: any, b: any) => b.syncedAt - a.syncedAt);
  const existing = existingRows[0];

  const doc = {
    projectId: input.projectId,
    prUrl: input.prUrl,
    prNumber: input.prNumber,
    repoFullName: input.repoFullName,
    branch: input.branch,
    title: input.title,
    ciStatus: input.ciStatus ?? (signals.testFailCount ? "FAIL" : signals.testPassCount ? "PASS" : "UNKNOWN"),
    ciRunUrl: input.ciRunUrl,
    ciProvider: "github",
    source: input.source,
    sourceRef: input.sourceRef,
    changeReviewLenses,
    mutationTesting,
    syncedAt: now,
    createdAt: existing?.createdAt ?? now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, doc);
    return existing._id;
  }
  return ctx.db.insert("harnessPrChecks", doc);
}

export const syncFromSources = mutation({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    const synced: string[] = [];

    const codegenRows = args.projectId
      ? await ctx.db
          .query("codegenRequests")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : await ctx.db.query("codegenRequests").collect();

    for (const row of codegenRows) {
      if (!row.prUrl) continue;
      const parsed = parseGitHubPrUrl(row.prUrl);
      const fullName = parsed
        ? repoFullName(parsed.owner, parsed.repo)
        : "unknown/repo";
      await upsertPrCheck(ctx, {
        projectId: args.projectId,
        prUrl: row.prUrl,
        prNumber: parsed?.prNumber,
        repoFullName: fullName,
        branch: row.branchName,
        title: row.filePath,
        source: "CODEGEN",
        sourceRef: row.requestId,
        diffText: row.diff,
        ciStatus: row.status === "COMPLETED" ? "PASS" : row.status === "FAILED" ? "FAIL" : "PENDING",
      });
      synced.push(row.prUrl);
    }

    const tasks = args.projectId
      ? await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .collect()
      : await ctx.db.query("tasks").take(100);

    for (const task of tasks) {
      const meta = (task.metadata ?? {}) as Record<string, unknown>;
      const prNumber = meta.githubPrNumber as number | undefined;
      const repoUrl = meta.githubRepoUrl as string | undefined;
      const branch = meta.githubBranch as string | undefined;
      if (!prNumber || !repoUrl) continue;
      const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/?#]+)/i);
      if (!match) continue;
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, "");
      const prUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
      if (synced.includes(prUrl)) continue;
      await upsertPrCheck(ctx, {
        projectId: args.projectId ?? task.projectId,
        prUrl,
        prNumber,
        repoFullName: repoFullName(owner, repo),
        branch,
        title: task.title,
        source: "GITHUB",
        sourceRef: String(task._id),
      });
      synced.push(prUrl);
    }

    const runs = args.projectId
      ? (await ctx.db.query("workflowRuns").collect()).filter(
          (r) => r.projectId === args.projectId
        )
      : await ctx.db.query("workflowRuns").order("desc").take(30);

    for (const run of runs) {
      const events = await ctx.db
        .query("runEvents")
        .withIndex("by_run", (q) => q.eq("workflowRunId", run._id))
        .collect();
      for (const change of buildFileChanges(events)) {
        if (!change.pullRequestUrl || synced.includes(change.pullRequestUrl)) continue;
        const parsed = parseGitHubPrUrl(change.pullRequestUrl);
        const fullName = parsed
          ? repoFullName(parsed.owner, parsed.repo)
          : "unknown/repo";
        await upsertPrCheck(ctx, {
          projectId: args.projectId ?? run.projectId,
          prUrl: change.pullRequestUrl,
          prNumber: parsed?.prNumber,
          repoFullName: fullName,
          source: "WORKFLOW",
          sourceRef: run.runId,
          ciStatus: run.status === "COMPLETED" ? "PASS" : run.status === "FAILED" ? "FAIL" : "PENDING",
        });
        synced.push(change.pullRequestUrl);
      }
    }

    return { syncedCount: synced.length, prUrls: synced };
  },
});

export const recordManual = mutation({
  args: {
    projectId: v.optional(v.id("projects")),
    prUrl: v.string(),
    repoFullName: v.string(),
    changeReviewLenses: v.optional(lensValidator),
  },
  handler: async (ctx, args) => {
    const id = await upsertPrCheck(ctx, {
      projectId: args.projectId,
      prUrl: args.prUrl,
      repoFullName: args.repoFullName,
      source: "MANUAL",
    });
    if (args.changeReviewLenses) {
      await ctx.db.patch(id, { changeReviewLenses: args.changeReviewLenses });
    }
    return { id };
  },
});

export const recordMerge = mutation({
  args: {
    evaluationId: v.id("harnessPrChecks"),
    actorId: v.string(),
    mergeCommitSha: v.string(),
    humanConfirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const evaluation = await ctx.db.get(args.evaluationId);
    if (!evaluation) throw new Error("PR evaluation not found");
    if (evaluation.mergedAt && evaluation.mergeCommitSha === args.mergeCommitSha) {
      return { recorded: false, evaluation };
    }
    const verifiers = await ctx.db.query("contextVerifiers").collect();
    const activeVerifierCount = verifiers.filter((row) => row.active && (!evaluation.projectId || row.projectId === evaluation.projectId)).length;
    const metadata = evaluation.metadata as { securityFindingCount?: number } | undefined;
    const gates = computeMergeGates({
      lenses: evaluation.changeReviewLenses,
      ciStatus: evaluation.ciStatus,
      mutationCoveragePct: evaluation.mutationTesting?.diffCoveragePct,
      activeVerifierCount,
      securityFindingCount: metadata?.securityFindingCount,
    });
    const workOrder = evaluation.workOrderId ? await ctx.db.get(evaluation.workOrderId) : null;
    if (evaluation.workOrderId && !workOrder) throw new Error("Linked WorkOrder not found");
    if (!mergeAuthoritySatisfied({
      ciStatus: evaluation.ciStatus ?? "UNKNOWN",
      gatesPass: gates.every((gate) => gate.passed),
      approvalStatus: workOrder?.approvalStatus,
      humanConfirmed: args.humanConfirmed,
    })) {
      throw new Error("Passing gates, WorkOrder approval, and explicit merge confirmation are required before merge");
    }
    const actorId = args.actorId.trim();
    const mergeCommitSha = args.mergeCommitSha.trim();
    if (!actorId || !mergeCommitSha) throw new Error("Merge actor and commit SHA are required");
    const mergedAt = Date.now();
    await ctx.db.patch(evaluation._id, { mergeActor: actorId, mergeCommitSha, mergedAt });
    if (workOrder) {
      await ctx.db.patch(workOrder._id, {
        state: "AWAITING_VERIFICATION",
        blockingIssue: undefined,
        requiredHumanAction: "Record independent post-merge verification evidence.",
        metadata: {
          ...(workOrder.metadata ?? {}),
          merge: { actorId, mergeCommitSha, mergedAt, prUrl: evaluation.prUrl, headSha: evaluation.headSha },
        },
        updatedAt: mergedAt,
      });
    }
    await ctx.db.insert("activities", {
      projectId: evaluation.projectId,
      actorType: "HUMAN",
      actorId,
      action: "PR_MERGE_RECORDED",
      description: `Merged ${evaluation.prUrl} at ${mergeCommitSha}`,
      targetType: "PULL_REQUEST",
      targetId: evaluation.prUrl,
      metadata: { evaluationId: evaluation._id, workOrderId: evaluation.workOrderId, headSha: evaluation.headSha, mergeCommitSha },
    });
    return { recorded: true, mergedAt, mergeCommitSha };
  },
});

export const ingestPullRequest = action({
  args: {
    prUrl: v.string(),
    projectId: v.optional(v.id("projects")),
    releaseDeploymentId: v.optional(v.id("deployments")),
    sourceEventId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    id: Id<"harnessPrChecks">;
    prUrl: string;
    ciStatus: "PASS" | "FAIL" | "PENDING" | "UNKNOWN";
    checkCount: number;
    diffLineCount?: number;
  }> => {
    const parsed = parseGitHubPrUrl(args.prUrl.trim());
    if (!parsed) {
      throw new Error("Invalid GitHub PR URL — expected https://github.com/owner/repo/pull/123");
    }

    const payload = await fetchPullRequestCi(
      parsed.owner,
      parsed.repo,
      parsed.prNumber,
      process.env.GITHUB_TOKEN
    );
    const lineage = await ctx.runQuery(internal.factory.prChecks.resolveLineage, {
      projectId: args.projectId,
      repoFullName: payload.repoFullName,
      branch: payload.branch,
    });

    const id: Id<"harnessPrChecks"> = await ctx.runMutation(
      internal.factory.githubCi.applyCiIngest,
      {
      projectId: lineage.projectId,
      workOrderId: lineage.workOrderId,
      workflowRunId: lineage.workflowRunId,
      taskId: lineage.taskId,
      loopEngineeringCycleId: lineage.loopEngineeringCycleId,
      releaseDeploymentId: args.releaseDeploymentId,
      prUrl: payload.prUrl,
      prNumber: payload.prNumber,
      repoFullName: payload.repoFullName,
      branch: payload.branch,
      title: payload.title,
      ciStatus: payload.ciStatus,
      ciRunUrl: payload.ciRunUrl,
      headSha: payload.headSha,
      checkRuns: payload.checkRuns,
      signals: payload.signals,
      sourceRef: payload.headSha,
      sourceEventId: args.sourceEventId,
      }
    );

    return {
      id,
      prUrl: payload.prUrl,
      ciStatus: payload.ciStatus,
      checkCount: payload.checkRuns.length,
      diffLineCount: payload.diffLineCount,
    };
  },
});

export const resolveLineage = internalQuery({
  args: {
    projectId: v.optional(v.id("projects")),
    repoFullName: v.string(),
    branch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalize = (value?: string) => value?.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").toLowerCase();
    let projectId = args.projectId;
    if (!projectId) {
      const projects = await ctx.db.query("projects").collect();
      projectId = projects.find((project) => normalize(project.githubRepo) === normalize(args.repoFullName))?._id;
    }
    if (!projectId) return {};
    const workOrders = await ctx.db.query("workOrders")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const candidates = workOrders.filter((workOrder) =>
      normalize(workOrder.repository) === normalize(args.repoFullName)
      && !["CANCELED", "SUPERSEDED"].includes(workOrder.state)
    );
    candidates.sort((a, b) => b.updatedAt - a.updatedAt);
    const workOrder = candidates.find((candidate) =>
      !args.branch || candidate.branchStrategy?.includes(args.branch)
    ) ?? candidates[0];
    if (!workOrder) return { projectId };
    const runs = await ctx.db.query("workflowRuns").collect();
    const workflowRun = runs
      .filter((run) => run.workOrderId === workOrder._id)
      .sort((a, b) => b.startedAt - a.startedAt)[0];
    const tasks = await ctx.db.query("tasks")
      .withIndex("by_work_order", (q) => q.eq("workOrderId", workOrder._id))
      .collect();
    const cycles = await ctx.db.query("loopEngineeringCycles").collect();
    const cycle = cycles.find((candidate) => candidate.workOrderIds.includes(workOrder._id));
    return {
      projectId,
      workOrderId: workOrder._id,
      workflowRunId: workflowRun?._id,
      taskId: workflowRun?.parentTaskId ?? tasks[0]?._id,
      loopEngineeringCycleId: cycle?._id,
    };
  },
});
