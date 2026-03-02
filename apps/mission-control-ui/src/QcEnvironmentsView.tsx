/**
 * QC Environments View
 *
 * 5-environment health matrix and pipeline flow (local → dev → staging → pilot → production).
 */

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const ENV_ORDER = ["local", "dev", "staging", "pilot", "production"] as const;

interface QcEnvironmentsViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
}

export function QcEnvironmentsView({ projectId, onNavigate }: QcEnvironmentsViewProps) {
  const summary = useQuery(api.qcRuns.environmentSummary, { projectId: projectId ?? undefined });

  if (!summary) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="text-sm text-muted-foreground">Loading environment summary…</div>
      </div>
    );
  }

  const ordered = ENV_ORDER.map((env) => summary.find((s) => s.environment === env)).filter(Boolean);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Environments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quality status across local, dev, staging, pilot, and production
        </p>
      </div>

      {/* Pipeline view: left-to-right flow */}
      <div className="flex items-stretch gap-2 flex-wrap">
        {ordered.map((s, i) => (
          <div key={s!.environment} className="flex items-center gap-1">
            <Card
              className={cn(
                "p-4 min-w-[140px] flex flex-col gap-2",
                s!.latestGrade === "RED" && "border-red-500/30",
                s!.latestGrade === "YELLOW" && "border-yellow-500/30",
                s!.latestGrade === "GREEN" && "border-primary/30"
              )}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {s!.environment}
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    s!.latestGrade === "RED" && "bg-red-500",
                    s!.latestGrade === "YELLOW" && "bg-yellow-500",
                    s!.latestGrade === "GREEN" && "bg-green-500",
                    !s!.latestGrade && "bg-muted-foreground/50"
                  )}
                />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    s!.latestGrade === "RED" && "bg-red-500/10 text-red-600 border-red-500/20",
                    s!.latestGrade === "YELLOW" && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                    s!.latestGrade === "GREEN" && "bg-primary/10 text-primary border-primary/20",
                    !s!.latestGrade && "text-muted-foreground"
                  )}
                >
                  {s!.latestGrade ?? "—"}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {s!.latestScore != null ? s!.latestScore : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                Gate: {s!.gatePassed === true ? "PASSED" : s!.gatePassed === false ? "FAILED" : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {s!.runCount} runs · {s!.completedCount} completed
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs"
                onClick={() => onNavigate?.("qc-dashboard")}
              >
                View runs
              </Button>
            </Card>
            {i < ordered.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Grid of same cards (alternative layout) */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Health by environment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ordered.map((s) => (
            <Card key={s!.environment} className="p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {s!.environment}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    s!.latestGrade === "RED" && "bg-red-500",
                    s!.latestGrade === "YELLOW" && "bg-yellow-500",
                    s!.latestGrade === "GREEN" && "bg-green-500",
                    !s!.latestGrade && "bg-muted-foreground/50"
                  )}
                />
                <span className="text-sm font-medium">{s!.latestScore ?? "—"}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Pass rate: {s!.completedCount ? Math.round(s!.passRate * 100) : 0}%
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                R · Y · G: {s!.redCount} · {s!.yellowCount} · {s!.greenCount}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
