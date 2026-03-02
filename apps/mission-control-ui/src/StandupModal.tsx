import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckSquare,
  Bell,
  DollarSign,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentItem {
  name: string;
  role: string;
  status: string;
}

interface ApprovalItem {
  actionSummary: string;
  riskLevel: string;
}

const RISK_COLORS: Record<string, string> = {
  RED: "bg-red-500/20 text-red-300 border-red-500/30",
  YELLOW: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  GREEN: "bg-primary/15 text-primary border-primary/30",
};

const TASK_STATUS_CONFIG: { key: string; label: string; colorClass: string }[] = [
  { key: "inbox", label: "Inbox", colorClass: "text-slate-400" },
  { key: "assigned", label: "Assigned", colorClass: "text-blue-400" },
  { key: "inProgress", label: "In Progress", colorClass: "text-indigo-400" },
  { key: "review", label: "Review", colorClass: "text-violet-400" },
  { key: "needsApproval", label: "Needs Approval", colorClass: "text-amber-400" },
  { key: "blocked", label: "Blocked", colorClass: "text-red-400" },
  { key: "done", label: "Done", colorClass: "text-primary" },
];

export function StandupModal({
  projectId,
  onClose,
}: {
  projectId: Id<"projects"> | null;
  onClose: () => void;
}) {
  const report = useQuery(api.standup.generate, projectId ? { projectId } : {});

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[580px] max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Daily Standup</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Live snapshot of agent activity and task pipeline
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {report === undefined ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Generating report…
            </div>
          ) : (
            <div className="px-6 py-5 space-y-6">
              {/* Agents */}
              <Section icon={<Users className="h-4 w-4" />} title="Agents">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <StatCard label="Total" value={report.agents.total} />
                  <StatCard label="Active" value={report.agents.active} accent="primary" />
                  <StatCard label="Paused" value={report.agents.paused} accent="amber" />
                </div>
                {report.agents.list?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {report.agents.list.map((a: AgentItem) => (
                      <div
                        key={a.name}
                        className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs"
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          a.status === "ACTIVE" ? "bg-primary" : "bg-amber-400"
                        )} />
                        <span className="font-medium text-foreground">{a.name}</span>
                        <span className="text-muted-foreground">{a.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Tasks */}
              <Section icon={<CheckSquare className="h-4 w-4" />} title="Task Pipeline">
                <div className="grid grid-cols-4 gap-2">
                  {TASK_STATUS_CONFIG.map(({ key, label, colorClass }) => {
                    const val = (report.tasks as Record<string, number>)[key] ?? 0;
                    return (
                      <div key={key} className="rounded-lg border border-border bg-card p-3 text-center">
                        <div className={cn("text-lg font-bold tabular-nums", colorClass)}>{val}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
                      </div>
                    );
                  })}
                  <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center col-span-4 sm:col-span-1">
                    <div className="text-lg font-bold tabular-nums text-foreground">{report.tasks.total}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Total</div>
                  </div>
                </div>
              </Section>

              {/* Approvals */}
              {(report.approvals.pending > 0 || report.approvals.items?.length > 0) && (
                <Section icon={<Bell className="h-4 w-4" />} title="Pending Approvals">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-bold tabular-nums text-amber-400">{report.approvals.pending}</span>
                    <span className="text-sm text-muted-foreground">awaiting review</span>
                  </div>
                  {report.approvals.items?.length > 0 && (
                    <div className="space-y-1.5">
                      {report.approvals.items.slice(0, 5).map((a: ApprovalItem, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
                          <span className="text-xs text-foreground truncate">{a.actionSummary}</span>
                          <Badge className={cn("text-[10px] border shrink-0", RISK_COLORS[a.riskLevel] ?? RISK_COLORS.GREEN)}>
                            {a.riskLevel}
                          </Badge>
                        </div>
                      ))}
                      {report.approvals.items.length > 5 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{report.approvals.items.length - 5} more
                        </div>
                      )}
                    </div>
                  )}
                </Section>
              )}

              {/* Burn rate */}
              {report.burnRate && (
                <Section icon={<DollarSign className="h-4 w-4" />} title="Burn Rate">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-foreground">
                      ${report.burnRate.today.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">today</span>
                  </div>
                </Section>
              )}

              {/* Footer */}
              {report.generatedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-4">
                  <Clock className="h-3 w-3" />
                  <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "primary" | "amber";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <div className={cn(
        "text-2xl font-bold tabular-nums",
        accent === "primary" ? "text-primary" :
        accent === "amber" ? "text-amber-400" :
        "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
