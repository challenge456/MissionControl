/**
 * QC Findings View
 *
 * Findings browser with severity/category/environment filters and grouped display.
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeProps } from "@/components/factory/badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Copy, Download } from "lucide-react";

const SEVERITIES = ["ALL", "RED", "YELLOW", "GREEN", "INFO"] as const;
const ENVIRONMENTS = ["ALL", "local", "dev", "staging", "pilot", "production"] as const;

interface QcFindingsViewProps {
  projectId: Id<"projects"> | null;
}

type FindingItem = {
  _id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  filePaths?: string[];
  suggestedFix?: string;
  confidence?: number;
  runId?: string | null;
  qcRunId?: string | null;
  environment?: string | null;
};

const SEVERITY_TONE: Record<string, StatusBadgeProps["tone"]> = {
  RED: "error",
  YELLOW: "warning",
  GREEN: "success",
  INFO: "info",
};

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <StatusBadge tone={SEVERITY_TONE[severity] ?? "neutral"}>{severity}</StatusBadge>
  );
}

export function QcFindingsView({ projectId }: QcFindingsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("ALL");
  const [groupByCategory, setGroupByCategory] = useState(true);

  const findings = useQuery(api.qcFindings.listRecent, {
    projectId: projectId ?? undefined,
    severity: severityFilter === "ALL" ? undefined : severityFilter,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
    environment:
      environmentFilter === "ALL"
        ? undefined
        : (environmentFilter as "local" | "dev" | "staging" | "pilot" | "production"),
    limit: 200,
  });

  const categories = useMemo(() => {
    if (!findings) return [];
    const set = new Set(findings.map((f) => f.category));
    return Array.from(set).sort();
  }, [findings]);

  const byCategory = useMemo(() => {
    if (!findings) return {};
    const map: Record<string, FindingItem[]> = {};
    for (const f of findings) {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    }
    return map;
  }, [findings]);

  const handleCopy = () => {
    if (!findings) return;
    const text = findings
      .map(
        (f) =>
          `[${f.severity}] ${f.title}\n${f.description}\nRun: ${(f as { runId?: string }).runId ?? f.qcRunId}\n`
      )
      .join("\n");
    void navigator.clipboard.writeText(text);
  };

  const handleExportJson = () => {
    if (!findings) return;
    const blob = new Blob([JSON.stringify(findings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qc-findings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!findings) {
    return (
      <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 py-6">
        <div className="text-[13.5px] text-ink-muted">Loading findings…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Findings</h1>
        <p className="mt-1.5 text-[14px] text-ink-secondary">
          Browse and filter QC findings across runs
        </p>
      </header>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e === "ALL" ? "All" : e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={groupByCategory ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setGroupByCategory(!groupByCategory)}
          >
            {groupByCategory ? "Grouped by category" : "Flat list"}
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
              <Copy className="h-4 w-4" strokeWidth={1.75} />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1">
              <Download className="h-4 w-4" strokeWidth={1.75} />
              Export JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      {findings.length === 0 ? (
        <Card className="p-8 text-center text-[13px] text-ink-muted">
          No findings match the current filters.
        </Card>
      ) : groupByCategory ? (
        <div className="space-y-4">
          {Object.entries(byCategory as Record<string, FindingItem[]>).map(([category, items]) => (
            <Card key={category}>
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <span className="text-[13.5px] font-medium text-ink">{category}</span>
                <StatusBadge tone="neutral">{items.length}</StatusBadge>
              </div>
              <div className="divide-y divide-line">
                {items.map((f) => (
                  <FindingRow key={f._id} finding={f} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-line">
            {findings.map((f) => (
              <FindingRow key={f._id} finding={f} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FindingRow({
  finding,
}: {
  finding: {
    _id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    filePaths?: string[];
    suggestedFix?: string;
    confidence?: number;
    runId?: string | null;
    environment?: string | null;
  };
}) {
  const runId = (finding as { runId?: string | null }).runId ?? null;
  const environment = (finding as { environment?: string | null }).environment ?? null;

  return (
    <div className="p-4 transition-colors duration-150 hover:bg-surface-2">
      <div className="flex items-start gap-3">
        <SeverityBadge severity={finding.severity} />
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium text-ink">{finding.title}</div>
          <div className="mt-1 text-[13px] text-ink-secondary">{finding.description}</div>
          {finding.filePaths?.length ? (
            <div className="mt-2 flex items-center gap-1 font-mono text-[12px] text-ink-muted">
              <FileText className="h-3 w-3 flex-shrink-0" strokeWidth={1.75} />
              {finding.filePaths.slice(0, 3).join(", ")}
              {finding.filePaths.length > 3 && ` +${finding.filePaths.length - 3}`}
            </div>
          ) : null}
          {finding.suggestedFix ? (
            <div className="mt-2 rounded-lg bg-surface-2 p-2 text-[12px] text-ink-secondary">{finding.suggestedFix}</div>
          ) : null}
          <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-muted">
            {runId && <span>Run: <span className="font-mono">{runId}</span></span>}
            {environment && <StatusBadge tone="neutral">{environment}</StatusBadge>}
            {finding.confidence != null && (
              <span>Confidence: {Math.round(finding.confidence * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
