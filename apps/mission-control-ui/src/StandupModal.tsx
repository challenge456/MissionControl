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
import { RiskBadge, type RiskLevel } from "@/components/factory/badges";
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

const TASK_STATUS_CONFIG: { key: string; label: string; colorClass: string }[] = [
  { key: "inbox", label: "Inbox", colorClass: "text-ink-secondary" },
  { key: "assigned", label: "Assigned", colorClass: "text-ink-secondary" },
  { key: "inProgress", label: "In Progress", colorClass: "text-info-accent" },
  { key: "review", label: "Review", colorClass: "text-info-accent" },
  { key: "needsApproval", label: "Needs Approval", colorClass: "text-warn" },
  { key: "blocked", label: "Blocked", colorClass: "text-warn" },
  { key: "done", label: "Done", colorClass: "text-ok" },
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
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-ink-secondary" strokeWidth={1.75} />
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
            <div className="flex items-center justify-center py-16 text-sm text-ink-muted">
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
                        className="flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs"
                      >
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          a.status === "ACTIVE" ? "bg-ok" : "bg-warn"
                        )} />
                        <span className="font-medium text-ink">{a.name}</span>
                        <span className="text-ink-muted">{a.role}</span>
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
                      <div key={key} className="rounded-lg border border-line bg-surface-2 p-3 text-center">
                        <div className={cn("text-lg font-semibold tabular-nums", colorClass)}>{val}</div>
                        <div className="text-[10px] text-ink-muted mt-0.5">{label}</div>
                      </div>
                    );
                  })}
                  <div className="rounded-lg border border-line bg-surface-2 p-3 text-center col-span-4 sm:col-span-1">
                    <div className="text-lg font-semibold tabular-nums text-ink">{report.tasks.total}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">Total</div>
                  </div>
                </div>
              </Section>

              {/* Approvals */}
              {(report.approvals.pending > 0 || report.approvals.items?.length > 0) && (
                <Section icon={<Bell className="h-4 w-4" />} title="Pending Approvals">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl font-semibold tabular-nums text-warn">{report.approvals.pending}</span>
                    <span className="text-sm text-ink-muted">awaiting review</span>
                  </div>
                  {report.approvals.items?.length > 0 && (
                    <div className="space-y-1.5">
                      {report.approvals.items.slice(0, 5).map((a: ApprovalItem, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-line bg-surface-2 px-3 py-2">
                          <span className="text-xs text-ink truncate">{a.actionSummary}</span>
                          <RiskBadge level={(a.riskLevel as RiskLevel) ?? "GREEN"} className="shrink-0" />
                        </div>
                      ))}
                      {report.approvals.items.length > 5 && (
                        <div className="text-xs text-ink-muted px-1">
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
                    <span className="text-3xl font-semibold tabular-nums text-ink">
                      ${report.burnRate.today.toFixed(2)}
                    </span>
                    <span className="text-sm text-ink-muted">today</span>
                  </div>
                </Section>
              )}

              {/* Footer */}
              {report.generatedAt && (
                <div className="flex items-center gap-1.5 text-xs text-ink-muted border-t border-line pt-4">
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
        <span className="text-ink-muted">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h3>
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
    <div className="rounded-lg border border-line bg-surface-2 p-3 text-center">
      <div className={cn(
        "text-2xl font-semibold tabular-nums",
        accent === "primary" ? "text-ok" :
        accent === "amber" ? "text-warn" :
        "text-ink"
      )}>
        {value}
      </div>
      <div className="text-[11px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
