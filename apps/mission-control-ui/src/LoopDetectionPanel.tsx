/**
 * Loop Detection Panel
 *
 * Shows loop-detected alerts (comment storms, review ping-pong, repeated failures)
 * and provides one-click actions to acknowledge, resolve, or unblock tasks.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MessageSquareWarning,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
  Activity,
  Clock,
} from "lucide-react";

interface LoopDetectionPanelProps {
  projectId: Id<"projects"> | null;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
}

type LoopType = "COMMENT_STORM" | "REVIEW_PING_PONG" | "BACK_AND_FORTH" | "REPEATED_FAILURES";

const LOOP_TYPE_INFO: Record<
  string,
  { icon: React.ReactNode; label: string; description: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  COMMENT_STORM: {
    icon: <MessageSquareWarning className="h-4 w-4" />,
    label: "Comment Storm",
    description: "Too many messages in a short window",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/40",
  },
  REVIEW_PING_PONG: {
    icon: <RefreshCw className="h-4 w-4" />,
    label: "Review Ping-Pong",
    description: "Excessive review cycles without resolution",
    colorClass: "text-red-400",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/40",
  },
  BACK_AND_FORTH: {
    icon: <Zap className="h-4 w-4" />,
    label: "State Churn",
    description: "Task repeatedly bouncing between states",
    colorClass: "text-orange-400",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/40",
  },
  REPEATED_FAILURES: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Repeated Failures",
    description: "Same operation failing repeatedly",
    colorClass: "text-red-500",
    bgClass: "bg-red-600/10",
    borderClass: "border-red-600/40",
  },
};

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "Critical", className: "bg-red-500/20 text-red-300 border-red-500/30" },
  WARNING: { label: "Warning", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  INFO: { label: "Info", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

export function LoopDetectionPanel({
  projectId: _projectId,
  onTaskSelect,
}: LoopDetectionPanelProps) {
  const [filter, setFilter] = useState<"all" | "OPEN" | "ACKNOWLEDGED">("all");
  const [expanded, setExpanded] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const openAlerts = useQuery(api.alerts.listOpen, { limit: 100 });
  const acknowledgeAlert = useMutation(api.alerts.acknowledge);
  const resolveAlert = useMutation(api.alerts.resolve);
  const ignoreAlert = useMutation(api.alerts.ignore);
  const transitionTask = useMutation(api.tasks.transition);

  const loopAlerts = (openAlerts ?? []).filter((a) => a.type === "LOOP_DETECTED");
  const filteredAlerts = filter === "all" ? loopAlerts : loopAlerts.filter((a) => a.status === filter);
  const hasLoopAlerts = loopAlerts.length > 0;
  const openCount = loopAlerts.filter((a) => a.status === "OPEN").length;
  const acknowledgedCount = loopAlerts.filter((a) => a.status === "ACKNOWLEDGED").length;

  const summary = useMemo(
    () =>
      Object.entries(LOOP_TYPE_INFO).map(([type, info]) => ({
        type: type as LoopType,
        info,
        count: loopAlerts.filter(
          (a) => (a.metadata as Record<string, unknown> & { loopData?: { type?: string } })?.loopData?.type === type || a.title.includes(type)
        ).length,
      })),
    [loopAlerts]
  );

  const activeSummary = summary.filter((item) => item.count > 0);

  const handleAcknowledge = async (alertId: Id<"alerts">) => {
    setActionLoading(alertId);
    try {
      await acknowledgeAlert({ alertId, acknowledgedBy: "operator" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = async (alertId: Id<"alerts">) => {
    setActionLoading(alertId);
    try {
      await resolveAlert({ alertId, resolutionNote: "Resolved via Loop Detection Panel" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleIgnore = async (alertId: Id<"alerts">) => {
    setActionLoading(alertId);
    try {
      await ignoreAlert({ alertId, reason: "Ignored via Loop Detection Panel" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockTask = async (taskId: Id<"tasks">, alertId: Id<"alerts">) => {
    setActionLoading(alertId);
    try {
      await transitionTask({
        taskId,
        toStatus: "ASSIGNED",
        actorType: "HUMAN",
        reason: "Unblocked from Loop Detection Panel",
        idempotencyKey: `unblock-loop-${taskId}-${Date.now()}`,
      });
      await resolveAlert({ alertId, resolutionNote: "Task unblocked by operator" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={cn(
      "mx-4 my-3 rounded-xl border bg-card transition-all duration-300",
      hasLoopAlerts
        ? "border-amber-500/30 shadow-[0_0_16px_-4px_rgba(245,158,11,0.2)]"
        : "border-primary/20 shadow-[0_0_16px_-4px_rgba(16,185,129,0.12)]"
    )}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3 transition-colors",
          expanded ? "rounded-t-xl" : "rounded-xl",
          "hover:bg-white/[0.02]"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Live status dot */}
          <div className="relative flex items-center justify-center w-3 h-3">
            {hasLoopAlerts ? (
              <>
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-amber-500 opacity-50" />
                <span className="relative h-2 w-2 rounded-full bg-amber-400" />
              </>
            ) : (
              <>
                <span className="absolute h-3 w-3 animate-ping rounded-full bg-primary opacity-25" />
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ShieldAlert className={cn("h-4 w-4", hasLoopAlerts ? "text-amber-400" : "text-primary")} strokeWidth={1.5} />
            <span className="text-sm font-semibold text-foreground">Loop Risk Monitor</span>
          </div>

          {hasLoopAlerts ? (
            <div className="flex items-center gap-1.5">
              {openCount > 0 && (
                <Badge className="h-5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-semibold px-1.5">
                  {openCount} Open
                </Badge>
              )}
              {acknowledgedCount > 0 && (
                <Badge className="h-5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 text-[10px] px-1.5">
                  {acknowledgedCount} Ack'd
                </Badge>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              All Clear
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          {hasLoopAlerts && activeSummary.length > 0 && (
            <div className="flex items-center gap-1 mr-1">
              {activeSummary.map(({ type, info, count }) => (
                <span
                  key={type}
                  className={cn("flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border", info.bgClass, info.colorClass, info.borderClass)}
                >
                  {info.icon}
                  <span className="font-semibold">{count}</span>
                </span>
              ))}
            </div>
          )}
          {expanded
            ? <ChevronDown className="h-4 w-4 opacity-50" />
            : <ChevronRight className="h-4 w-4 opacity-50" />
          }
        </div>
      </button>

      {/* Divider only when expanded */}
      {expanded && (
        <div className={cn(
          "h-px mx-4",
          hasLoopAlerts ? "bg-amber-500/10" : "bg-primary/10"
        )} />
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {!hasLoopAlerts ? (
            /* ── ALL CLEAR STATE ── */
            <div className="space-y-3">
              {/* Hero status card */}
              <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-transparent p-5">
                {/* Decorative glow */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

                <div className="relative flex items-center gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
                    <ShieldCheck className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">No active loop incidents</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Stable
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Comment storms and state churn are currently stable.
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Last scan</div>
                    <div className="text-xs font-medium text-muted-foreground mt-0.5">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-monitor health rows */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(LOOP_TYPE_INFO).map(([type, info]) => (
                  <div
                    key={type}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8 border border-primary/15">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-foreground/80 truncate">{info.label}</div>
                      <div className="text-[10px] text-muted-foreground/50 mt-0.5">0 incidents</div>
                    </div>
                    <Activity className="h-3 w-3 text-primary/40 shrink-0" />
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground/40">
                <Clock className="h-3 w-3" />
                <span>Loop detection scans every 5 minutes · Powered by Convex cron</span>
              </div>
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex items-center gap-1.5">
                {(["all", "OPEN", "ACKNOWLEDGED"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "h-7 px-3 rounded-md text-xs font-medium border transition-all",
                      filter === f
                        ? "bg-accent text-foreground border-border"
                        : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {f === "all" ? "All" : f === "OPEN" ? `Open (${openCount})` : `Acknowledged (${acknowledgedCount})`}
                  </button>
                ))}
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="px-4 py-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  No incidents for this filter.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredAlerts.map((alert) => {
                    const loopData = (alert.metadata as Record<string, unknown> & { loopData?: Record<string, unknown> })?.loopData;
                    const loopType = (loopData as { type?: string })?.type ?? "UNKNOWN";
                    const info = LOOP_TYPE_INFO[loopType] ?? {
                      icon: <AlertTriangle className="h-4 w-4" />,
                      label: loopType,
                      description: "",
                      colorClass: "text-amber-400",
                      bgClass: "bg-amber-500/10",
                      borderClass: "border-amber-500/30",
                    };
                    const severityConfig = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.INFO;
                    const isLoading = actionLoading === alert._id;

                    return (
                      <div
                        key={alert._id}
                        className={cn(
                          "rounded-lg border-l-2 border border-border bg-card/60 p-3 space-y-2.5",
                          info.borderClass.replace("border-", "border-l-")
                        )}
                      >
                        {/* Alert header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className={cn("mt-0.5 shrink-0", info.colorClass)}>{info.icon}</span>
                            <div>
                              <div className="text-sm font-semibold text-foreground leading-tight">{alert.title}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(alert._creationTime).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <Badge className={cn("text-[10px] font-bold shrink-0 border", severityConfig.className)}>
                            {severityConfig.label}
                          </Badge>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>

                        {/* Loop detail chips */}
                        {loopData && (
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: "Count", value: String((loopData as { count?: unknown }).count) },
                              { label: "Threshold", value: String((loopData as { threshold?: unknown }).threshold) },
                              (loopData as { window?: unknown }).window
                                ? { label: "Window", value: `${(loopData as { window: unknown }).window} min` }
                                : null,
                              (loopData as { detail?: unknown }).detail
                                ? { label: "Detail", value: String((loopData as { detail: unknown }).detail) }
                                : null,
                            ]
                              .filter(Boolean)
                              .map((item) => (
                                <div
                                  key={item!.label}
                                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 border border-border"
                                >
                                  <span className="text-[10px] text-muted-foreground font-medium">{item!.label}</span>
                                  <span className="text-[11px] font-semibold text-foreground">{item!.value}</span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {alert.taskId && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 text-xs px-3"
                                disabled={isLoading}
                                onClick={() => handleUnblockTask(alert.taskId as Id<"tasks">, alert._id)}
                              >
                                {isLoading ? "Working…" : "Unblock Task"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-3"
                                onClick={() => onTaskSelect?.(alert.taskId as Id<"tasks">)}
                              >
                                View Task
                              </Button>
                            </>
                          )}
                          {alert.status === "OPEN" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-3"
                              disabled={isLoading}
                              onClick={() => handleAcknowledge(alert._id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-3 text-primary border-primary/30 hover:bg-primary/10"
                            disabled={isLoading}
                            onClick={() => handleResolve(alert._id)}
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-3 text-muted-foreground"
                            disabled={isLoading}
                            onClick={() => handleIgnore(alert._id)}
                          >
                            Ignore
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
