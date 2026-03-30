/**
 * QC Dashboard View
 *
 * Overview of quality control runs, trends, and key metrics.
 * Environment filter, Start QC Run modal, latest findings, environment health strip.
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "./components/PageHeader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const ENV_OPTIONS = [
  "ALL",
  "local",
  "dev",
  "staging",
  "pilot",
  "production",
] as const;
type EnvFilter = (typeof ENV_OPTIONS)[number];

interface QcDashboardViewProps {
  projectId: Id<"projects"> | null;
  onRunSelect?: (runId: Id<"qcRuns">) => void;
  onOpenStartQcRun?: () => void;
}

function RiskGradeBadge({ grade }: { grade: "GREEN" | "YELLOW" | "RED" | undefined }) {
  if (!grade) return <Badge variant="muted">N/A</Badge>;

  const variantMap: Record<string, "success" | "warning" | "error"> = {
    GREEN: "success",
    YELLOW: "warning",
    RED: "error",
  };

  return (
    <Badge variant={variantMap[grade]} className="font-mono">
      {grade}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "success" | "muted" | "error"> = {
    COMPLETED: "success",
    RUNNING: "muted",
    PENDING: "muted",
    FAILED: "error",
    CANCELED: "muted",
  };

  return (
    <Badge variant={variantMap[status] ?? "muted"} className="text-xs">
      {status}
    </Badge>
  );
}

export function QcDashboardView({ projectId, onRunSelect, onOpenStartQcRun }: QcDashboardViewProps) {
  const [envFilter, setEnvFilter] = useState<EnvFilter>("ALL");

  const runsList = useQuery(
    api.qcRuns.list,
    { projectId: projectId ?? undefined, limit: 50 }
  );
  const runsByEnv = useQuery(
    api.qcRuns.listByEnvironment,
    envFilter !== "ALL" && projectId
      ? { projectId, environment: envFilter, limit: 50 }
      : "skip"
  );
  const envSummary = useQuery(api.qcRuns.environmentSummary, { projectId: projectId ?? undefined });

  const runs = (envFilter === "ALL" ? runsList : runsByEnv) ?? [];

  const completedRuns = runs
    .filter((r) => r.status === "COMPLETED")
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const latestRun = completedRuns[0] ?? null;
  const previousRun = completedRuns[1] ?? null;
  const scoresForTrend = completedRuns
    .filter((r) => r.qualityScore !== undefined)
    .slice(0, 10)
    .map((r) => ({
      runId: r.runId,
      runSequence: r.runSequence,
      qualityScore: r.qualityScore!,
      riskGrade: r.riskGrade,
      completedAt: r.completedAt,
    }))
    .reverse();

  const latestFindings = useQuery(
    api.qcFindings.listByRun,
    latestRun?._id ? { qcRunId: latestRun._id, severity: "RED" } : "skip"
  );
  const topRedFindings = (latestFindings ?? []).slice(0, 5);

  let trend: "up" | "down" | "neutral" = "neutral";
  if (latestRun && previousRun && latestRun.qualityScore !== undefined && previousRun.qualityScore !== undefined) {
    if (latestRun.qualityScore > previousRun.qualityScore) trend = "up";
    else if (latestRun.qualityScore < previousRun.qualityScore) trend = "down";
  }

  const totalRuns = runs.length;
  const redRuns = completedRuns.filter((r) => r.riskGrade === "RED").length;
  const yellowRuns = completedRuns.filter((r) => r.riskGrade === "YELLOW").length;
  const greenRuns = completedRuns.filter((r) => r.riskGrade === "GREEN").length;
  const avgQualityScore = completedRuns.length > 0
    ? Math.round(completedRuns.reduce((sum, r) => sum + (r.qualityScore ?? 0), 0) / completedRuns.length)
    : 0;

  if (envFilter === "ALL" && !runsList) {
    return (
      <main className="mc-page">
        <div className="mc-page-body flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading QC runs...</div>
        </div>
      </main>
    );
  }
  if (envFilter !== "ALL" && runsByEnv === undefined) {
    return (
      <main className="mc-page">
        <div className="mc-page-body flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading QC runs...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mc-page">
      <PageHeader
        title="Quality Control"
        description="Automated quality checks, coverage analysis, and delivery gates."
        icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.7} />}
        eyebrow="Quality"
        status={
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            {totalRuns} runs
          </Badge>
        }
        actions={
          <Button size="sm" className="gap-2" onClick={onOpenStartQcRun}>
            <Play className="h-4 w-4" />
            Start QC Run
          </Button>
        }
      />
      <div className="mc-page-body mc-page-stack">

      {/* Environment filter tabs */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mc-kicker">Environment lens</div>
            <div className="mt-1 text-sm font-semibold text-foreground">Filter the QC posture by environment</div>
          </div>
          <Tabs value={envFilter} onValueChange={(v) => setEnvFilter(v as EnvFilter)}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {ENV_OPTIONS.map((env) => (
                <TabsTrigger key={env} value={env} className="text-xs">
                  {env === "ALL" ? "All" : env}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Environment health strip */}
      {envSummary && envSummary.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mc-kicker">Environment posture</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Quick quality read across local, staging, and production lanes</div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {envSummary.map((s) => (
                <TooltipProvider key={s.environment}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="rounded-full border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-1.5 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "mr-2 inline-block h-2 w-2 rounded-full",
                            s.latestGrade === "RED" && "bg-red-500",
                            s.latestGrade === "YELLOW" && "bg-yellow-500",
                            s.latestGrade === "GREEN" && "bg-green-500",
                            !s.latestGrade && "bg-muted-foreground/50"
                          )}
                        />
                        {s.environment}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {s.environment}: {s.latestGrade ?? "—"} {s.latestScore != null ? `(${s.latestScore})` : ""} · {s.runCount} runs
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Latest Score</div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-bold">{latestRun?.qualityScore ?? "--"}</div>
            {trend === "up" && <TrendingUp className="h-4 w-4 text-primary" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {latestRun ? `Run ${latestRun.runId}` : "No runs yet"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Quality</div>
          <div className="mt-2 text-3xl font-bold">{avgQualityScore}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Across {completedRuns.length} runs
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Distribution</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm font-medium">{redRuns}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">{yellowRuns}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">{greenRuns}</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            RED / YELLOW / GREEN
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Runs</div>
          <div className="mt-2 text-3xl font-bold">{totalRuns}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {runs.filter((r) => r.status === "RUNNING").length} running
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
      {/* Quality Score Trend */}
      {scoresForTrend.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Quality Score Trend</h3>
          <div className="flex items-end gap-2 h-32">
            <TooltipProvider>
              {scoresForTrend.map((s) => {
                const height = (s.qualityScore / 100) * 100;
                const color = s.riskGrade === "RED" ? "bg-red-500" : s.riskGrade === "YELLOW" ? "bg-yellow-500" : "bg-green-500";
                return (
                  <Tooltip key={s.runId}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 flex flex-col items-center gap-1 cursor-default">
                        <div className={cn("w-full rounded-t", color)} style={{ height: `${height}%` }} />
                        <div className="text-[0.65rem] text-muted-foreground">#{s.runSequence}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Run {s.runId}: {s.qualityScore} {s.riskGrade ?? ""}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </Card>
      )}

      {/* Latest Findings (RED) */}
      {topRedFindings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Latest RED Findings</h3>
          <div className="space-y-2">
            {topRedFindings.map((f) => (
              <div
                key={f._id}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm"
              >
                <div className="font-medium">{f.title}</div>
                <div className="text-muted-foreground text-xs mt-1">{f.description}</div>
                {f.filePaths?.length ? (
                  <div className="text-xs mt-1 font-mono text-muted-foreground">
                    {f.filePaths.slice(0, 2).join(", ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      )}
      </div>

      <Card className="p-5">
        <div className="mc-kicker">Operator guidance</div>
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>The dashboard matters most when it tells you whether a release should keep moving. Trends matter less than the newest red findings and the latest gate result.</p>
          <p>Use environment filters to separate local noise from production risk. A green local run does not buy confidence if staging is yellow or red.</p>
        </div>
      </Card>
      </div>

      {/* Recent Runs */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Recent Runs</h3>
        <div className="space-y-3">
          {runs.slice(0, 10).map((run) => (
            <div
              key={run._id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => onRunSelect?.(run._id)}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="font-mono text-sm font-medium">{run.runId}</div>
                  <div className="text-xs text-muted-foreground">
                    {run.branch ?? "main"} • {run.commitSha?.substring(0, 7)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {run.qualityScore !== undefined && (
                  <div className="text-sm font-medium">{run.qualityScore}</div>
                )}
                <RiskGradeBadge grade={run.riskGrade} />
                <StatusBadge status={run.status} />
                {run.status === "COMPLETED" && run.gatePassed === false && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                {run.status === "COMPLETED" && run.gatePassed === true && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
                {run.status === "RUNNING" && (
                  <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      </div>
    </main>
  );
}
