import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import { FileText, ShieldCheck, Clock, XCircle, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fmtTime(ts?: number) {
  if (!ts) return "n/a";
  return new Date(ts).toLocaleString();
}

const PILL_VARIANTS: Record<string, string> = {
  ACTIVE:           "bg-primary/15 text-primary border-primary/30",
  APPROVED:         "bg-primary/15 text-primary border-primary/30",
  ALLOW:            "bg-primary/15 text-primary border-primary/30",
  GREEN:            "bg-primary/15 text-primary border-primary/30",
  PENDING:          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  YELLOW:           "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  NEEDS_APPROVAL:   "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  DENIED:           "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  RED:              "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  FAILED:           "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  TASK_TRANSITIONED:"bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  APPROVAL_REQUESTED:"bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
};

function StatusPill({ value }: { value: string }) {
  const cls = PILL_VARIANTS[value.toUpperCase()] ?? "bg-muted text-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap", cls)}>
      {value}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: number; accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold tracking-tight tabular-nums", accent ?? "text-foreground")}>{value}</p>
    </Card>
  );
}

function TableSection({
  title,
  children,
  controls,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
  empty: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap bg-muted/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        {controls}
      </div>
      {empty ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No records found.</div>
      ) : (
        <div className="overflow-auto">{children}</div>
      )}
    </Card>
  );
}

export function AuditView({ projectId: _projectId }: { projectId: Id<"projects"> | null }) {
  const [limit, setLimit] = useState(100);
  const [changeTypeFilter, setChangeTypeFilter] = useState("");

  const changes   = useQuery(api["governance/changeRecords"].listChangeRecords, { type: changeTypeFilter || undefined, limit });
  const approvals = useQuery(api["governance/approvalRecords"].listApprovals, {});

  const pendingCount = (approvals ?? []).filter((r) => r.status === "PENDING").length;
  const deniedCount  = (approvals ?? []).filter((r) => r.status === "DENIED").length;

  const handleExport = () => {
    const changeRows = (changes ?? []).map((c) =>
      [fmtTime(c.timestamp), c.type, c.summary, c.projectId ?? "", c.instanceId ?? "", c.versionId ?? "", `${c.relatedTable ?? ""} ${c.relatedId ?? ""}`].join(",")
    );
    const approvalRows = (approvals ?? []).map((a) =>
      [fmtTime(a.requestedAt), a.actionType, a.riskLevel, a.status, fmtTime(a.decidedAt), (a.decisionReason ?? a.justification ?? "").replace(/"/g, '""')].join(",")
    );
    const csv =
      "Change Records\nTime,Type,Summary,Project,Instance,Version,Related\n" + changeRows.join("\n") +
      "\n\nApproval Records\nRequested,Action,Risk,Status,Decided,Reason\n" + approvalRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arm-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader
        title="ARM Audit"
        description="Governance trail for approvals, lifecycle transitions, deployments, and policy decisions."
        actions={
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={FileText}   label="Change Records"   value={(changes ?? []).length} />
        <StatCard icon={ShieldCheck} label="Approval Records" value={(approvals ?? []).length} />
        <StatCard icon={Clock}      label="Pending Approvals" value={pendingCount} accent={pendingCount > 0 ? "text-amber-500" : undefined} />
        <StatCard icon={XCircle}    label="Denied Decisions"  value={deniedCount}  accent={deniedCount  > 0 ? "text-red-500"   : undefined} />
      </div>

      <div className="px-6 pb-4 flex flex-col gap-4">
        {/* Change records */}
        <TableSection
          title="Change Records"
          empty={(changes ?? []).length === 0}
          controls={
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <input
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-44"
                  placeholder="Filter by type…"
                  value={changeTypeFilter}
                  onChange={(e) => setChangeTypeFilter(e.target.value)}
                />
              </div>
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
                <option value={200}>200 rows</option>
              </select>
            </div>
          }
        >
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Time", "Type", "Summary", "Project", "Instance", "Version", "Related"].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(changes ?? []).map((change, i) => (
                <tr
                  key={change._id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/40 transition-colors",
                    i % 2 === 0 ? "" : "bg-muted/20"
                  )}
                >
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap font-mono">{fmtTime(change.timestamp)}</td>
                  <td className="px-3 py-2.5"><StatusPill value={change.type} /></td>
                  <td className="px-3 py-2.5 text-foreground/80 max-w-[280px] truncate">{change.summary}</td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground truncate max-w-[140px]">{change.projectId ?? "n/a"}</td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground truncate max-w-[120px]">{change.instanceId ?? "n/a"}</td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground truncate max-w-[120px]">{change.versionId ?? "n/a"}</td>
                  <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[180px]">
                    {change.relatedTable ?? "n/a"}{change.relatedId ? ` · ${change.relatedId}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableSection>

        {/* Approval records */}
        <TableSection title="Approval Records" empty={(approvals ?? []).length === 0}>
          <table className="w-full min-w-[840px] text-left text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {["Requested", "Action", "Risk", "Status", "Decided", "Reason"].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(approvals ?? []).map((approval, i) => (
                <tr
                  key={approval._id}
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/40 transition-colors",
                    i % 2 === 0 ? "" : "bg-muted/20"
                  )}
                >
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap font-mono">{fmtTime(approval.requestedAt)}</td>
                  <td className="px-3 py-2.5 text-foreground/80">{approval.actionType}</td>
                  <td className="px-3 py-2.5"><StatusPill value={approval.riskLevel} /></td>
                  <td className="px-3 py-2.5"><StatusPill value={approval.status} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap font-mono">{fmtTime(approval.decidedAt)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[200px]">
                    {approval.decisionReason ?? approval.justification ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableSection>
      </div>
    </main>
  );
}
