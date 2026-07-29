import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, PauseCircle, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatPercent, statusTone, type AutomationTab } from "./automationModel";

export function AutomationOverview({
  data,
  onTabChange,
}: {
  data: any;
  onTabChange: (tab: AutomationTab) => void;
}) {
  const next = data.definitions
    .filter((definition: any) => definition.status === "ACTIVE" && definition.nextRunAt)
    .sort((a: any, b: any) => a.nextRunAt - b.nextRunAt)[0];
  const priority = data.metrics.suspended > 0
    ? `${data.metrics.suspended} suspended Automation${data.metrics.suspended === 1 ? "" : "s"} require review`
    : data.metrics.waitingApprovals > 0
      ? `${data.metrics.waitingApprovals} review gate${data.metrics.waitingApprovals === 1 ? "" : "s"} await approval`
      : data.candidates.some((candidate: any) => candidate.eligible)
        ? "An evidenced Automation Candidate is ready for review"
        : "No urgent Automation action";
  const cards = [
    ["Active", data.metrics.active, CheckCircle2, "definitions"],
    ["Paused / suspended", data.metrics.paused + data.metrics.suspended, PauseCircle, "definitions"],
    ["Waiting approvals", data.metrics.waitingApprovals, Clock3, "runs"],
    ["Missing receipts", data.metrics.missingReceipts, ReceiptText, "receipts"],
    ["Verification pass", formatPercent(data.metrics.verificationPassRate), CheckCircle2, "receipts"],
    ["Cost", `$${data.metrics.costUsd.toFixed(2)}`, AlertTriangle, "runs"],
  ] as const;
  return (
    <div className="space-y-5">
      <Card className="border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.17em] text-amber-200">Highest-priority operator action</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-medium text-foreground">{priority}</p>
          <button type="button" onClick={() => onTabChange(data.metrics.suspended ? "definitions" : "runs")} className="flex items-center gap-1 text-sm font-medium text-amber-200 hover:text-amber-100">
            Inspect <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon, tab]) => (
          <button key={label} type="button" onClick={() => onTabChange(tab)} className="text-left">
            <Card className="h-full p-4 transition-colors hover:border-registry-accent/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
            </Card>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Upcoming execution</h2>
          {next ? (
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{next.name}</span>
                <Badge variant="outline" className={statusTone(next.status)}>{next.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatDate(next.nextRunAt)} · {next.workflowId}@{next.workflowVersion}</p>
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">No active Automation is scheduled.</p>}
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Control boundary</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            V1 scheduled Automations are restricted to read-only WorkOrders. Every review gate requires normal operator approval and dispatch.
          </p>
        </Card>
      </div>
    </div>
  );
}
