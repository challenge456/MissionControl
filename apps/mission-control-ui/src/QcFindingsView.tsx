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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, FileText, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";

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

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    RED: "bg-red-500/10 text-red-600 border-red-500/20",
    YELLOW: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    GREEN: "bg-primary/10 text-primary border-primary/20",
    INFO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", colors[severity] ?? "")}>
      {severity}
    </Badge>
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
      <div className="flex-1 overflow-auto p-6">
        <div className="text-sm text-muted-foreground">Loading findings…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-primary" />
          Findings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and filter QC findings across runs
        </p>
      </div>

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
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* List */}
      {findings.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No findings match the current filters.
        </Card>
      ) : groupByCategory ? (
        <div className="space-y-4">
          {Object.entries(byCategory as Record<string, FindingItem[]>).map(([category, items]) => (
            <Card key={category}>
              <div className="px-4 py-2 border-b border-border flex items-center gap-2">
                <span className="font-medium">{category}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="divide-y divide-border">
                {items.map((f) => (
                  <FindingRow key={f._id} finding={f} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-border">
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
    <div className="p-4 hover:bg-accent/30">
      <div className="flex items-start gap-3">
        <SeverityBadge severity={finding.severity} />
        <div className="flex-1 min-w-0">
          <div className="font-medium">{finding.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{finding.description}</div>
          {finding.filePaths?.length ? (
            <div className="flex items-center gap-1 mt-2 text-xs font-mono text-muted-foreground">
              <FileText className="h-3 w-3 flex-shrink-0" />
              {finding.filePaths.slice(0, 3).join(", ")}
              {finding.filePaths.length > 3 && ` +${finding.filePaths.length - 3}`}
            </div>
          ) : null}
          {finding.suggestedFix ? (
            <div className="mt-2 text-xs bg-muted/50 rounded p-2">{finding.suggestedFix}</div>
          ) : null}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            {runId && <span>Run: {runId}</span>}
            {environment && <Badge variant="outline">{environment}</Badge>}
            {finding.confidence != null && (
              <span>Confidence: {Math.round(finding.confidence * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
