import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  buildChangeReviewLenses,
  buildMutationTestingReport,
  type PrCheckSignals,
} from "../lib/harnessPrChecks";

export const applyCiIngest = internalMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    releaseDeploymentId: v.optional(v.id("deployments")),
    prUrl: v.string(),
    prNumber: v.optional(v.number()),
    repoFullName: v.string(),
    branch: v.optional(v.string()),
    title: v.optional(v.string()),
    ciStatus: v.optional(
      v.union(
        v.literal("PASS"),
        v.literal("FAIL"),
        v.literal("PENDING"),
        v.literal("UNKNOWN")
      )
    ),
    ciRunUrl: v.optional(v.string()),
    headSha: v.optional(v.string()),
    checkRuns: v.optional(
      v.array(
        v.object({
          name: v.string(),
          status: v.string(),
          conclusion: v.optional(v.union(v.string(), v.null())),
          html_url: v.optional(v.string()),
          details_url: v.optional(v.string()),
        })
      )
    ),
    signals: v.optional(
      v.object({
        testPassCount: v.optional(v.number()),
        testFailCount: v.optional(v.number()),
        diffLineCount: v.optional(v.number()),
        verificationPassRate: v.optional(v.number()),
        ciStatus: v.optional(
          v.union(
            v.literal("PASS"),
            v.literal("FAIL"),
            v.literal("PENDING"),
            v.literal("UNKNOWN")
          )
        ),
        securityFindingCount: v.optional(v.number()),
        qcFindings: v.optional(
          v.array(
            v.object({
              title: v.optional(v.string()),
              category: v.optional(v.string()),
              severity: v.string(),
            })
          )
        ),
      })
    ),
    sourceRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.releaseDeploymentId) {
      const deployment = await ctx.db.get(args.releaseDeploymentId);
      if (!deployment) throw new Error("Linked deployment not found");
      if (deployment.status !== "PENDING") {
        throw new Error("GitHub CI evidence can only be linked to a pending deployment");
      }
    }
    const signals: PrCheckSignals = {
      qcFindings: args.signals?.qcFindings ?? [],
      testPassCount: args.signals?.testPassCount,
      testFailCount: args.signals?.testFailCount,
      diffLineCount: args.signals?.diffLineCount,
      verificationPassRate: args.signals?.verificationPassRate,
      securityFindingCount: args.signals?.securityFindingCount,
    };

    const changeReviewLenses = buildChangeReviewLenses(signals);
    const mutationTesting = buildMutationTestingReport(signals);
    const now = Date.now();

    const existing = await ctx.db
      .query("harnessPrChecks")
      .withIndex("by_pr_url", (q) => q.eq("prUrl", args.prUrl))
      .unique();
    const releaseDeploymentId = args.releaseDeploymentId ?? existing?.releaseDeploymentId;

    const doc = {
      projectId: args.projectId,
      releaseDeploymentId,
      prUrl: args.prUrl,
      prNumber: args.prNumber,
      repoFullName: args.repoFullName,
      branch: args.branch,
      title: args.title,
      ciStatus: args.ciStatus ?? "UNKNOWN",
      ciRunUrl: args.ciRunUrl,
      ciProvider: "github",
      source: "GITHUB" as const,
      sourceRef: args.sourceRef ?? args.headSha,
      changeReviewLenses,
      mutationTesting,
      syncedAt: now,
      createdAt: existing?.createdAt ?? now,
      metadata: {
        headSha: args.headSha,
        checkRuns: args.checkRuns,
        diffLineCount: args.signals?.diffLineCount,
      },
    };

    const id = existing
      ? existing._id
      : await ctx.db.insert("harnessPrChecks", doc);
    if (existing) {
      await ctx.db.patch(existing._id, doc);
    }
    if (releaseDeploymentId) {
      await ctx.scheduler.runAfter(0, internal.governance.releaseGateAutomation.fromGithubCi, { harnessPrCheckId: id });
    }
    return id;
  },
});
