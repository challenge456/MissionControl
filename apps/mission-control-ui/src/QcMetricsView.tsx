/**
 * QC Metrics View
 *
 * Quality score trends, gate pass rates, finding rate charts, agent output quality panel.
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle, XCircle, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const ENVIRONMENTS = ["local", "dev", "staging", "pilot", "production"] as const;
const TIME_RANGES = [
  { id: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d", label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "90d", label: "90 days", ms: 90 * 24 * 60 * 60 * 1000 },
  { id: "all", label: "All", ms: 0 },
] as const;

interface QcMetricsViewProps {
  projectId: Id<"projects"> | null;
}

export function QcMetricsView({ projectId }: QcMetricsViewProps) {
  const [envTab, setEnvTab] = useState<string>("dev");
  const [timeRange, setTimeRange] = useState<string>("30d");

  const fromTs =
    timeRange === "all"
      ? undefined
      : Date.now() - (TIME_RANGES.find((t) => t.id === timeRange)?.ms ?? 0);
  const toTs = Date.now();

  const metrics = useQuery(
    api.qcMetrics.listByEnvironment,
    projectId
      ? {
          projectId,
          environment: envTab as "local" | "dev" | "staging" | "pilot" | "production",
          metricName: "quality_score",
          fromTs,
          toTs,
          limit: 50,
        }
      : "skip"
  );

  const aggregate = useQuery(
    api.qcMetrics.aggregate,
    projectId
      ? {
          projectId,
          environment: envTab as "local" | "dev" | "staging" | "pilot" | "production",
          metricName: "quality_score",
          fromTs,
          toTs,
        }
      : "skip"
  );

  const envSummary = useQuery(api.qcRuns.environmentSummary, { projectId: projectId ?? undefined });
  const runs = useQuery(api.qcRuns.list, {
    projectId: projectId ?? undefined,
    limit: 100,
  });

  const gatePassRate = useMemo(() => {
    if (!runs) return null;
    const completed = runs.filter((r) => r.status === "COMPLETED");
    const passed = completed.filter((r) => r.gatePassed === true).length;
    return completed.length ? Math.round((passed / completed.length) * 100) : 0;
  }, [runs]);

  const agentOutputRuns = useMemo(() => {
    if (!runs) return [];
    return runs.filter((r) => r.checkType === "AGENT_OUTPUT" && r.status === "COMPLETED");
  }, [runs]);

  const qualityScoresForChart = useMemo(() => {
    if (!metrics || !metrics.length) return [];
    const sorted = [...metrics].sort((a, b) => a.recordedAt - b.recordedAt);
    return sorted.slice(-20);
  }, [metrics]);

  const currentEnvSummary = envSummary?.find((s) => s.environment === envTab);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Metrics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quality score trends, gate pass rates, and agent output quality
        </p>
      </div>

      {/* Time range + environment tabs */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            {TIME_RANGES.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={envTab} onValueChange={setEnvTab}>
          <TabsList>
            {ENVIRONMENTS.map((e) => (
              <TabsTrigger key={e} value={e}>
                {e}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Gate pass rate */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">Gate pass rate (all runs)</h3>
        <div className="flex items-center gap-4">
          {gatePassRate !== null ? (
            <>
              <div
                className={cn(
                  "text-3xl font-bold",
                  gatePassRate >= 80 && "text-primary",
                  gatePassRate >= 50 && gatePassRate < 80 && "text-yellow-600",
                  gatePassRate < 50 && "text-red-600"
                )}
              >
                {gatePassRate}%
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Passed</span>
                <XCircle className="h-4 w-4 text-red-500 ml-2" />
                <span>Failed</span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">No completed runs</span>
          )}
        </div>
      </Card>

      {/* Quality score trend */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">
          Quality score trend — {envTab}
        </h3>
        {qualityScoresForChart.length > 0 ? (
          <div className="flex items-end gap-1 h-40">
            {qualityScoresForChart.map((m, i) => {
              const height = Math.max(4, (m.value / 100) * 100);
              return (
                <div
                  key={`${m.recordedAt}-${i}`}
                  className="flex-1 min-w-0 flex flex-col items-center gap-0.5"
                  title={`${new Date(m.recordedAt).toLocaleDateString()}: ${m.value}`}
                >
                  <div
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${height}%` }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            No quality score data for this environment and range
          </div>
        )}
        {aggregate && aggregate.length > 0 && (
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span>Avg: {Math.round(aggregate[0].avg)}</span>
            <span>Min: {aggregate[0].min}</span>
            <span>Max: {aggregate[0].max}</span>
            <span>P95: {aggregate[0].p95}</span>
          </div>
        )}
      </Card>

      {/* Agent output quality panel */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Agent output quality
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Runs with check type &quot;Agent Output&quot;
        </p>
        {agentOutputRuns.length > 0 ? (
          <div className="space-y-2">
            {agentOutputRuns.slice(0, 10).map((run) => (
              <div
                key={run._id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div>
                  <span className="font-mono text-sm">{run.runId}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {run.environment ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{run.qualityScore ?? "—"}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      run.riskGrade === "GREEN" && "bg-primary/10 text-primary",
                      run.riskGrade === "YELLOW" && "bg-yellow-500/10 text-yellow-600",
                      run.riskGrade === "RED" && "bg-red-500/10 text-red-600"
                    )}
                  >
                    {run.riskGrade ?? "—"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No agent output QC runs yet. Start a run with check type &quot;Agent Output&quot;.
          </div>
        )}
      </Card>

      {/* Current environment summary */}
      {currentEnvSummary && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">Summary — {envTab}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Latest score</div>
              <div className="font-medium">{currentEnvSummary.latestScore ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pass rate</div>
              <div className="font-medium">
                {currentEnvSummary.completedCount
                  ? Math.round(currentEnvSummary.passRate * 100)
                  : 0}
                %
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Runs</div>
              <div className="font-medium">{currentEnvSummary.runCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">R · Y · G</div>
              <div className="font-medium">
                {currentEnvSummary.redCount} · {currentEnvSummary.yellowCount} ·{" "}
                {currentEnvSummary.greenCount}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
