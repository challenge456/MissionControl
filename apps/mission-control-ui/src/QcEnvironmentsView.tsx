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
import { Button } from "@/components/ui/button";
import { RiskBadge, StatusBadge } from "@/components/factory/badges";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ENV_ORDER = ["local", "dev", "staging", "pilot", "production"] as const;

interface QcEnvironmentsViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
}

function gradeDotClass(grade: "GREEN" | "YELLOW" | "RED" | null | undefined): string {
  if (grade === "RED") return "bg-err";
  if (grade === "YELLOW") return "bg-warn";
  if (grade === "GREEN") return "bg-ok";
  return "bg-ink-muted";
}

export function QcEnvironmentsView({ projectId, onNavigate }: QcEnvironmentsViewProps) {
  const summary = useQuery(api.qcRuns.environmentSummary, { projectId: projectId ?? undefined });

  if (!summary) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-6">
        <div className="text-[13.5px] text-ink-muted">Loading environment summary…</div>
      </div>
    );
  }

  const ordered = ENV_ORDER.map((env) => summary.find((s) => s.environment === env)).filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Environments</h1>
        <p className="mt-1.5 text-[14px] text-ink-secondary">
          Quality status across local, dev, staging, pilot, and production
        </p>
      </header>

      {/* Pipeline view: left-to-right flow */}
      <div className="flex flex-wrap items-stretch gap-2">
        {ordered.map((s, i) => (
          <div key={s!.environment} className="flex items-center gap-1">
            <Card className="flex min-w-[140px] flex-col gap-2 p-4">
              <div className="text-[12.5px] font-medium text-ink-secondary">
                {s!.environment}
              </div>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("h-2 w-2 shrink-0 rounded-full", gradeDotClass(s!.latestGrade))}
                />
                {s!.latestGrade ? (
                  <RiskBadge level={s!.latestGrade} />
                ) : (
                  <StatusBadge tone="neutral">—</StatusBadge>
                )}
              </div>
              <div className="text-[20px] font-semibold leading-none text-ink">
                {s!.latestScore != null ? s!.latestScore : "—"}
              </div>
              <div className="text-[12px] text-ink-muted">
                Gate: {s!.gatePassed === true ? "PASSED" : s!.gatePassed === false ? "FAILED" : "—"}
              </div>
              <div className="text-[12px] text-ink-muted">
                {s!.runCount} runs · {s!.completedCount} completed
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 self-start text-[12.5px]"
                onClick={() => onNavigate?.("qc-dashboard")}
              >
                View runs
              </Button>
            </Card>
            {i < ordered.length - 1 && (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-ink-muted" strokeWidth={1.75} />
            )}
          </div>
        ))}
      </div>

      {/* Grid of same cards (alternative layout) */}
      <div>
        <h2 className="mb-3 text-[19px] font-semibold tracking-tight text-ink">Health by environment</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ordered.map((s) => (
            <Card key={s!.environment} className="p-4">
              <div className="text-[12.5px] font-medium text-ink-secondary">
                {s!.environment}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("h-2 w-2 shrink-0 rounded-full", gradeDotClass(s!.latestGrade))}
                />
                <span className="text-[13.5px] font-medium text-ink">{s!.latestScore ?? "—"}</span>
              </div>
              <div className="mt-1 text-[12px] text-ink-muted">
                Pass rate: {s!.completedCount ? Math.round(s!.passRate * 100) : 0}%
              </div>
              <div className="mt-1 text-[12px] text-ink-muted">
                R · Y · G: {s!.redCount} · {s!.yellowCount} · {s!.greenCount}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
