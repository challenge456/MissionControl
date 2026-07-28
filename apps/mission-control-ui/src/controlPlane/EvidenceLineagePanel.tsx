import { useEffect, useState } from "react";
import { BadgeCheck, Database, FileCheck2, Gauge, GitCommitHorizontal, Lightbulb, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type EvidenceLineageStage = {
  id: "evidence" | "claims" | "recommendation" | "approval" | "implementation" | "verification" | "measurement";
  label: string;
  status: "COMPLETE" | "MISSING" | "NOT_REQUIRED" | "PENDING";
  count: number;
  summary: string;
  details: string[];
  target: "timeline" | "files" | "artifacts" | "receipts";
};

const icons = {
  evidence: Database,
  claims: BadgeCheck,
  recommendation: Lightbulb,
  approval: ShieldCheck,
  implementation: GitCommitHorizontal,
  verification: FileCheck2,
  measurement: Gauge,
};

const statusTone = {
  COMPLETE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  NOT_REQUIRED: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  MISSING: "border-red-500/30 bg-red-500/10 text-red-200",
};

export function EvidenceLineagePanel({
  stages,
  onNavigate,
}: {
  stages: EvidenceLineageStage[];
  onNavigate?: (target: EvidenceLineageStage["target"]) => void;
}) {
  const [selectedId, setSelectedId] = useState<EvidenceLineageStage["id"] | null>(stages[0]?.id ?? null);
  useEffect(() => {
    if (!stages.some((stage) => stage.id === selectedId)) setSelectedId(stages[0]?.id ?? null);
  }, [selectedId, stages]);
  const selected = stages.find((stage) => stage.id === selectedId) ?? stages[0];

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Continuous evidence lineage</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Research through measurement, derived from durable run records. Missing links remain visible.
          </div>
        </div>
        <Badge variant="outline">{stages.filter((stage) => stage.status === "COMPLETE").length}/{stages.length} complete</Badge>
      </div>

      <ol aria-label="Continuous evidence lineage" className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {stages.map((stage, index) => {
          const Icon = icons[stage.id];
          const selectedStage = stage.id === selected?.id;
          return (
            <li key={stage.id} className="relative min-w-0">
              <button
                type="button"
                aria-current={selectedStage ? "step" : undefined}
                onClick={() => setSelectedId(stage.id)}
                className={`h-full w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedStage ? "border-registry-accent/60 bg-registry-accent-soft" : "border-[var(--panel-line)] bg-background/30 hover:bg-background/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                </div>
                <div className="mt-3 truncate text-xs font-medium text-foreground">{stage.label}</div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded border px-1.5 py-0.5 text-[9px] font-medium tracking-wide ${statusTone[stage.status]}`}>
                    {stage.status.replace("_", " ")}
                  </span>
                  {stage.count > 0 ? <span className="text-[10px] text-muted-foreground">{stage.count}</span> : null}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {selected ? (
        <div className="mt-4 rounded-lg border border-[var(--panel-line)] bg-background/30 p-4" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-foreground">{selected.label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{selected.summary}</p>
            </div>
            {onNavigate ? (
              <Button size="sm" variant="outline" onClick={() => onNavigate(selected.target)}>
                Inspect records
              </Button>
            ) : null}
          </div>
          {selected.details.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {selected.details.map((detail, index) => <li key={`${detail}-${index}`}>• {detail}</li>)}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No supporting detail is recorded for this stage.</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
