import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { MessageSquare, FlaskConical, ShieldAlert, AlertTriangle, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: string) => void;
}

export function FeedbackView({ projectId, onNavigate }: FeedbackViewProps) {
  const qcFindings = useQuery(
    api.qcFindings.listRecent,
    projectId ? { projectId, limit: 10 } : { limit: 10 }
  );
  const approvals = useQuery(
    api.approvals.listPending,
    projectId ? { projectId, limit: 10 } : { limit: 10 }
  );
  const alerts = useQuery(api.alerts.listOpen, { limit: 10 });
  const activities = useQuery(
    api.activities.listRecent,
    projectId ? { projectId, limit: 8 } : { limit: 8 }
  );

  const findingsList = qcFindings ?? [];
  const approvalsList = approvals ?? [];
  const alertsList = alerts ?? [];
  const activitiesList = activities ?? [];

  const hasAny = findingsList.length > 0 || approvalsList.length > 0 || alertsList.length > 0;

  return (
    <main className="flex-1 overflow-auto bg-background">
      <PageHeader
        title="Feedback"
        description="Feedback on runs and decisions. QC findings, approvals, and alerts that may need review."
        icon={<MessageSquare className="h-4 w-4" />}
      />
      <div className="p-6 space-y-6">
        {!hasAny ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-semibold text-foreground mb-1">No feedback yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              QC findings, pending approvals, and open alerts will appear here. Use System and Radar for live status.
            </p>
            {onNavigate && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => onNavigate("system")}>
                  System
                </Button>
                <Button variant="outline" size="sm" onClick={() => onNavigate("qc-dashboard")}>
                  QC Dashboard
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {findingsList.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                    Recent QC findings
                  </h3>
                  {onNavigate && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("qc-findings")}>
                      View all
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {findingsList.slice(0, 5).map((f) => (
                    <li
                      key={f._id}
                      className={cn(
                        "flex items-center justify-between text-xs py-2 px-3 rounded-md border border-border/50",
                        f.severity === "ERROR" || f.severity === "CRITICAL" ? "bg-red-500/5 border-red-500/20" : "bg-muted/20"
                      )}
                    >
                      <span className="font-medium text-foreground truncate flex-1 mr-2">{f.title ?? f.category ?? "Finding"}</span>
                      <span className={cn(
                        "text-[0.65rem] font-medium uppercase shrink-0",
                        f.severity === "ERROR" || f.severity === "CRITICAL" ? "text-red-400" : "text-amber-500"
                      )}>
                        {f.severity}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {approvalsList.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    Pending approvals
                  </h3>
                  {onNavigate && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("tasks")}>
                      Tasks
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {approvalsList.length} approval{approvalsList.length !== 1 ? "s" : ""} awaiting review. Open Approvals from the home dashboard or task board.
                </p>
              </Card>
            )}

            {alertsList.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    Open alerts
                  </h3>
                  {onNavigate && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate("radar")}>
                      Radar
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
                <ul className="space-y-1">
                  {alertsList.slice(0, 5).map((a) => (
                    <li key={a._id} className="text-xs py-1.5 border-b border-border/50 last:border-0">
                      <span className={cn(
                        "font-medium",
                        a.severity === "ERROR" || a.severity === "CRITICAL" ? "text-red-400" : "text-amber-500"
                      )}>
                        {a.severity}
                      </span>
                      <span className="text-muted-foreground ml-2">{a.title}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {activitiesList.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Recent activity
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activitiesList.length} recent event{activitiesList.length !== 1 ? "s" : ""}. Activity is also on the home dashboard.
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
