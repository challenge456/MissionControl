import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import {
  Bot,
  Zap,
  Eye,
  CheckCircle2,
  ShieldAlert,
  DollarSign,
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
  Users,
  Hammer,
  Loader2,
  Rocket,
  TrendingUp,
  GitBranch,
  Cpu,
  Network,
  Plus,
  ListChecks,
  FlaskConical,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Gauge,
  Shield,
  Layers,
  GripVertical,
  Radio,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusDot, type StatusDotVariant } from "@/components/ui/status-dot";
import { AutoRefreshBadge } from "@/components/ui/auto-refresh-badge";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { MissionBanner } from "@/components/MissionBanner";
import { NetworkConnections } from "@/components/NetworkConnections";
import { NeonChartContainer, NeonChartTheme } from "@/components/NeonChartTheme";
import { QuotaFuelGauge } from "@/components/QuotaFuelGauge";
import { cn } from "@/lib/utils";
import { getOrchestrationBaseUrl } from "@/lib/orchestrationUrl";
import type { LucideIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const DASHBOARD_LAYOUT_KEY = "mc.dashboard_layout";
const DEFAULT_SECTION_ORDER = [
  "statusBar",
  "quickActions",
  "aiUsage",
  "metricRow1",
  "metricRow2",
  "agentSquad",
  "buildQueue",
  "blockers",
  "taskPipelineActivity",
  "usageTrends",
  "topTasksByCost",
  "topRunsByTokens",
  "velocityFooter",
] as const;

const SECTION_LABELS: Record<string, string> = {
  statusBar: "System status",
  quickActions: "Quick navigation",
  aiUsage: "AI usage (24h)",
  metricRow1: "Metrics (quota & agents)",
  metricRow2: "Metrics (spend & tasks)",
  agentSquad: "Agent squad",
  buildQueue: "Build queue",
  blockers: "Blockers",
  taskPipelineActivity: "Task pipeline & activity",
  usageTrends: "Usage trends",
  topTasksByCost: "Top tasks by cost",
  topRunsByTokens: "Top runs by tokens",
  velocityFooter: "Velocity summary",
};

interface DashboardOverviewProps {
  projectId: Id<"projects"> | null;
  onClose: () => void;
  onOpenMissionModal?: () => void;
  onOpenSuggestionsDrawer?: () => void;
  onSelectAgent?: (agentId: Id<"agents">) => void;
  onNavigate?: (view: MainView) => void;
  onOpenApprovals?: () => void;
  onOpenCostAnalytics?: () => void;
  onOpenAlertRules?: () => void;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
  onNavigateToGateway?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: string;
  onClick?: () => void;
  badge?: string;
  badgeVariant?: "urgent" | "info" | "success";
  trend?: { direction: "up" | "down" | "flat"; label: string };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent = "text-primary",
  onClick,
  badge,
  badgeVariant = "info",
  trend,
}: MetricCardProps) {
  const iconBg =
    accent.includes("primary") || accent.includes("emerald") ? "bg-primary/10 border-primary/20" :
    accent.includes("amber")   ? "bg-amber-500/10 border-amber-500/20" :
    accent.includes("destructive") || accent.includes("red") ? "bg-red-500/10 border-red-500/20" :
    accent.includes("violet")  ? "bg-violet-500/10 border-violet-500/20" :
    "bg-primary/10 border-primary/20";

  const topBar =
    accent.includes("primary") || accent.includes("emerald") ? "bg-primary/60" :
    accent.includes("amber")   ? "bg-amber-500/60" :
    accent.includes("destructive") || accent.includes("red") ? "bg-red-500/60" :
    accent.includes("violet")  ? "bg-violet-500/60" :
    "bg-primary/60";

  const badgeStyles = {
    urgent: "bg-red-500/15 text-red-400 border-red-500/20",
    info: "bg-primary/10 text-primary border-primary/20",
    success: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <Card
      className={cn(
        "p-5 relative overflow-hidden group transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:border-border/80 hover:-translate-y-[1px]"
      )}
      onClick={onClick}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${topBar}`} />

      <div className="flex items-start justify-between mb-4">
        <div className={`rounded-xl ${iconBg} p-2.5 border`}>
          <Icon className={`h-4 w-4 ${accent}`} strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={cn("text-[0.6rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border", badgeStyles[badgeVariant])}>
              {badge}
            </span>
          )}
          {onClick && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
          )}
        </div>
      </div>

      <div className={`text-3xl font-bold tracking-tight tabular-nums ${accent} mb-1`}>
        {value}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {subtitle && (
        <div className="text-[11px] text-muted-foreground/60 mt-1.5 leading-relaxed">
          {subtitle}
        </div>
      )}
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-[10px] font-medium",
          trend.direction === "up" ? "text-primary" :
          trend.direction === "down" ? "text-red-400" : "text-muted-foreground"
        )}>
          <TrendingUp className={cn("h-3 w-3", trend.direction === "down" && "rotate-180")} />
          {trend.label}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT SQUAD CARD
// ─────────────────────────────────────────────────────────────────────────────

const agentStatusDotMap: Record<string, StatusDotVariant> = {
  ACTIVE: "active",
  PAUSED: "paused",
  DRAINED: "warning",
  QUARANTINED: "error",
  OFFLINE: "offline",
};

function AgentSquadCard({
  agent,
  currentTask,
  onClick,
}: {
  agent: Doc<"agents">;
  currentTask?: Doc<"tasks"> | null;
  onClick?: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="p-3.5 cursor-pointer hover:bg-muted/50 hover:border-border/80 hover:shadow-sm transition-all group"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }}
            aria-label={`Agent ${agent.name}, ${agent.status}. Click to open details.`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg shrink-0">{agent.emoji ?? "🤖"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground truncate" title={agent._id}>
                    {agent.name}
                  </span>
                  <StatusDot
                    variant={agentStatusDotMap[agent.status] ?? "offline"}
                    pulse={agent.status === "ACTIVE"}
                    size="sm"
                  />
                </div>
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground/60">
                  {agent.role}
                </span>
              </div>
              <ArrowUpRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
            </div>
            <div className="mt-2 pl-8">
              {currentTask ? (
                <p className="text-[0.65rem] text-muted-foreground leading-relaxed truncate">
                  {currentTask.title}
                </p>
              ) : (
                <p className="text-[0.65rem] text-muted-foreground/40 italic">
                  {agent.status === "ACTIVE" ? "Idle" : agent.status.toLowerCase()}
                </p>
              )}
              {agent.lastHeartbeatAt && (
                <p className="text-[0.6rem] text-muted-foreground/30 mt-0.5">
                  Last seen {formatRelativeTime(agent.lastHeartbeatAt)}
                </p>
              )}
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <div className="font-medium">{agent.name}</div>
          <div className="text-[0.65rem] text-muted-foreground break-all">{agent._id}</div>
          <div className="text-[0.65rem] mt-0.5">Click to open agent details</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function QuickActionsBar({
  onNavigate,
  onOpenApprovals,
  onOpenAlertRules,
  onToggleLayout,
  isLayoutCustomizing,
}: {
  onNavigate?: (view: MainView) => void;
  onOpenApprovals?: () => void;
  onOpenAlertRules?: () => void;
  onToggleLayout?: () => void;
  isLayoutCustomizing?: boolean;
}) {
  const actions: { icon: LucideIcon; label: string; description: string; onClick: () => void; accent: string }[] = [
    {
      icon: Plus,
      label: "New Task",
      description: "Add to INBOX",
      onClick: () => onNavigate?.("tasks"),
      accent: "text-primary",
    },
    {
      icon: GitBranch,
      label: "DAG View",
      description: "Mission graph",
      onClick: () => onNavigate?.("dag"),
      accent: "text-violet-500",
    },
    {
      icon: Shield,
      label: "Approvals",
      description: "Review queue",
      onClick: () => onOpenApprovals?.(),
      accent: "text-amber-500",
    },
    ...(onOpenAlertRules
      ? [
          {
            icon: Layers,
            label: "Alerts",
            description: "Cost thresholds",
            onClick: () => onOpenAlertRules?.(),
            accent: "text-rose-500",
          } as const,
        ]
      : []),
    {
      icon: Cpu,
      label: "Agents",
      description: "Registry",
      onClick: () => onNavigate?.("agents"),
      accent: "text-primary",
    },
    {
      icon: Network,
      label: "Policies",
      description: "Risk controls",
      onClick: () => onNavigate?.("policies"),
      accent: "text-blue-500",
    },
    {
      icon: FlaskConical,
      label: "QC",
      description: "Quality gates",
      onClick: () => onNavigate?.("qc-dashboard"),
      accent: "text-rose-500",
    },
    {
      icon: FileText,
      label: "Audit",
      description: "Audit trail",
      onClick: () => onNavigate?.("audit"),
      accent: "text-zinc-400",
    },
    {
      icon: Layers,
      label: "Memory",
      description: "Agent memory",
      onClick: () => onNavigate?.("memory"),
      accent: "text-cyan-500",
    },
  ];

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Navigation
          </span>
        </div>
        {onToggleLayout && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[0.65rem] text-muted-foreground hover:text-foreground"
            onClick={onToggleLayout}
          >
            {isLayoutCustomizing ? "Done" : "Customize layout"}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
          >
            <div className={cn("p-2 rounded-lg bg-muted/40 group-hover:bg-muted/80 transition-colors")}>
              <action.icon className={cn("h-3.5 w-3.5", action.accent)} strokeWidth={1.5} />
            </div>
            <span className="text-[0.6rem] font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM STATUS BAR
// ─────────────────────────────────────────────────────────────────────────────

function SystemStatusBar({
  agents,
  tasks,
  approvals,
}: {
  agents: Doc<"agents">[];
  tasks: Doc<"tasks">[];
  approvals: Doc<"approvals">[];
}) {
  const quarantinedCount = agents.filter((a) => a.status === "QUARANTINED").length;
  const failedCount = tasks.filter((t) => t.status === "FAILED").length;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const pendingApprovals = approvals.length;

  const issues = [
    quarantinedCount > 0 && { label: `${quarantinedCount} quarantined`, variant: "error" as const },
    failedCount > 0 && { label: `${failedCount} failed`, variant: "error" as const },
    blockedCount > 0 && { label: `${blockedCount} blocked`, variant: "warning" as const },
    pendingApprovals > 0 && { label: `${pendingApprovals} pending approvals`, variant: "warning" as const },
  ].filter(Boolean) as { label: string; variant: "error" | "warning" }[];

  const isHealthy = issues.length === 0;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg border mb-6 text-xs",
      isHealthy
        ? "bg-primary/5 border-primary/20"
        : issues.some((i) => i.variant === "error")
          ? "bg-red-500/5 border-red-500/20"
          : "bg-amber-500/5 border-amber-500/20"
    )}>
      <StatusDot
        variant={isHealthy ? "active" : issues.some((i) => i.variant === "error") ? "error" : "warning"}
        pulse
        size="sm"
      />
      <span className={cn(
        "font-semibold",
        isHealthy ? "text-primary" : issues.some((i) => i.variant === "error") ? "text-red-400" : "text-amber-500"
      )}>
        {isHealthy ? "All Systems Operational" : "Attention Required"}
      </span>
      {issues.length > 0 && (
        <span className="text-muted-foreground">·</span>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {issues.map((issue, i) => (
          <span
            key={i}
            className={cn(
              "px-2 py-0.5 rounded-full border text-[0.6rem] font-medium uppercase tracking-wider",
              issue.variant === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}
          >
            {issue.label}
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-muted-foreground/60">
        <Clock className="h-3 w-3" />
        <span className="text-[0.6rem]">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARY (so missing Convex function doesn't crash the whole dashboard)
// ─────────────────────────────────────────────────────────────────────────────

class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP RUNS BY TOKENS (isolated so missing getTopRunsByTokens doesn't crash dashboard)
// ─────────────────────────────────────────────────────────────────────────────

function TopRunsByTokensSection({
  projectId,
  onTaskSelect,
  onNavigate,
}: {
  projectId: Id<"projects"> | null;
  onTaskSelect?: (taskId: Id<"tasks">) => void;
  onNavigate?: (view: MainView) => void;
}) {
  const topRunsByTokens = useQuery(
    api.runs.getTopRunsByTokens,
    projectId ? { projectId, limit: 10, windowHours: 24 } : { limit: 10, windowHours: 24 }
  );

  if (!Array.isArray(topRunsByTokens) || topRunsByTokens.length === 0) return null;

  return (
    <Card className="p-4 mb-4">
      <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Top runs by tokens (24h)
      </div>
      <div className="space-y-1">
        {topRunsByTokens.map((run) => {
          const totalTokens = (run.inputTokens ?? 0) + (run.outputTokens ?? 0);
          const sessionLabel = run.sessionKey
            ? run.sessionKey.length > 24
              ? `${run.sessionKey.slice(0, 21)}…`
              : run.sessionKey
            : run._id;
          return (
            <button
              key={run._id}
              type="button"
              onClick={() => {
                if (run.taskId) {
                  onTaskSelect?.(run.taskId);
                  onNavigate?.("tasks");
                }
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md text-left group",
                run.taskId
                  ? "hover:bg-muted/50 transition-colors cursor-pointer"
                  : "cursor-default"
              )}
            >
              <span
                className="text-xs text-foreground/90 truncate flex-1 mr-2 group-hover:text-foreground"
                title={run.sessionKey ?? run._id}
              >
                {sessionLabel}
              </span>
              <span className="text-[0.65rem] text-muted-foreground shrink-0 mr-2">
                {(totalTokens / 1000).toFixed(1)}k
              </span>
              <span className="text-xs font-medium text-[var(--neon-green)] shrink-0">
                ${(run.costUsd ?? 0).toFixed(2)}
              </span>
              {run.taskId && (
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatElapsed(startMs: number): string {
  const diff = Date.now() - startMs;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SORTABLE SECTION (for layout customize)
// ─────────────────────────────────────────────────────────────────────────────

function SortableSection({
  id,
  canDrag,
  children,
}: {
  id: string;
  canDrag: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !canDrag });

  const style = transform
    ? { transform: CSS.Transform.toString(transform), transition }
    : undefined;

  if (!canDrag) {
    return <div className="mb-0">{children}</div>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "mb-6 flex items-start gap-2 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 p-2",
        isDragging && "opacity-60 z-10"
      )}
    >
      <button
        type="button"
        className="mt-1.5 p-1 rounded hover:bg-muted/50 cursor-grab active:cursor-grabbing text-muted-foreground"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardOverview({
  projectId,
  onOpenMissionModal,
  onOpenSuggestionsDrawer,
  onSelectAgent,
  onNavigate,
  onOpenApprovals,
  onOpenAlertRules,
  onTaskSelect,
  onNavigateToGateway,
}: DashboardOverviewProps) {
  const [deploying, setDeploying] = useState(false);
  const [customizeLayout, setCustomizeLayout] = useState(false);
  const [gatewayConfigured, setGatewayConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = getOrchestrationBaseUrl();
    fetch(base ? `${base}/gateway/status` : "/gateway/status")
      .then((r) => r.json())
      .then((data: { configured?: boolean; urlConfigured?: boolean; tokenConfigured?: boolean }) => {
        if (!cancelled)
          setGatewayConfigured(Boolean(data.configured ?? (data.urlConfigured && data.tokenConfigured)));
      })
      .catch(() => {
        if (!cancelled) setGatewayConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(DASHBOARD_LAYOUT_KEY);
      if (s) {
        const a = JSON.parse(s) as unknown;
        if (Array.isArray(a) && a.length > 0) return a;
      }
    } catch {
      // ignore
    }
    return [...DEFAULT_SECTION_ORDER];
  });

  const orderedIds = useMemo(() => {
    const merged = sectionOrder.filter((id) =>
      (DEFAULT_SECTION_ORDER as readonly string[]).includes(id)
    );
    for (const id of DEFAULT_SECTION_ORDER) {
      if (!merged.includes(id)) merged.push(id);
    }
    return merged;
  }, [sectionOrder]);

  const layoutSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleLayoutDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setSectionOrder((prev) => {
        const ids = [...prev];
        const from = ids.indexOf(active.id as string);
        const to = ids.indexOf(over.id as string);
        if (from === -1 || to === -1) return prev;
        const [removed] = ids.splice(from, 1);
        ids.splice(to, 0, removed);
        try {
          localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify(ids));
        } catch {
          // ignore
        }
        return ids;
      });
    },
    []
  );

  const agents = useQuery(api.agents.listAll, projectId ? { projectId } : {});
  const tasks = useQuery(api.tasks.listAll, projectId ? { projectId } : {});
  const approvals = useQuery(api.approvals.listPending, projectId ? { projectId, limit: 100 } : { limit: 100 });
  const activities = useQuery(api.activities.listRecent, projectId ? { projectId, limit: 12 } : { limit: 12 });
  const usageByModel = useQuery(api.runs.getUsageByModel, projectId ? { projectId, windowHours: 24 } : { windowHours: 24 });
  const [chartWindowHours, setChartWindowHours] = useState<24 | 168 | 720>(24);
  const usageTimeSeries = useQuery(
    api.runs.getUsageTimeSeries,
    projectId
      ? {
          projectId,
          windowHours: chartWindowHours,
          bucketHours: chartWindowHours === 24 ? 1 : chartWindowHours === 168 ? 24 : 24,
        }
      : {
          windowHours: chartWindowHours,
          bucketHours: chartWindowHours === 24 ? 1 : chartWindowHours === 168 ? 24 : 24,
        }
  );
  const deploySquad = useMutation(api.squad.deploySquad);

  const isLoading = !agents || !tasks || !approvals || !activities;

  if (isLoading) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="h-1.5 w-full rounded bg-muted/40 mb-6 skeleton-shimmer" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-5 w-48 rounded skeleton-shimmer mb-2" />
              <div className="h-3 w-64 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} lines={2} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Computed metrics ──────────────────────────────────────────────────────
  const activeAgents = agents.filter((a) => a.status === "ACTIVE").length;
  const pausedAgents = agents.filter((a) => a.status === "PAUSED").length;
  const quarantinedAgents = agents.filter((a) => a.status === "QUARANTINED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const reviewTasks = tasks.filter((t) => t.status === "REVIEW").length;
  const doneTasks = tasks.filter((t) => t.status === "DONE").length;
  const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
  const needsApprovalTasks = tasks.filter((t) => t.status === "NEEDS_APPROVAL").length;
  const totalCost = tasks.reduce((sum, t) => sum + t.actualCost, 0);
  const completionRate = ((doneTasks / Math.max(tasks.length, 1)) * 100).toFixed(0);

  const statusCounts = {
    INBOX: tasks.filter((t) => t.status === "INBOX").length,
    ASSIGNED: tasks.filter((t) => t.status === "ASSIGNED").length,
    IN_PROGRESS: inProgressTasks,
    REVIEW: reviewTasks,
    NEEDS_APPROVAL: needsApprovalTasks,
    BLOCKED: blockedTasks,
    DONE: doneTasks,
    CANCELED: tasks.filter((t) => t.status === "CANCELED").length,
  };

  const buildTasks = tasks.filter(
    (t) => t.status === "IN_PROGRESS" && (t.type === "ENGINEERING" || t.type === "OPS")
  );

  const blockedTasksList = tasks.filter((t) => t.status === "BLOCKED").slice(0, 4);

  const networkConnections = [
    { id: "l1", from: { x: 18, y: 22 }, to: { x: 50, y: 50 } },
    { id: "l2", from: { x: 18, y: 50 }, to: { x: 50, y: 50 } },
    { id: "l3", from: { x: 18, y: 78 }, to: { x: 50, y: 50 } },
    { id: "r1", from: { x: 50, y: 50 }, to: { x: 82, y: 22 } },
    { id: "r2", from: { x: 50, y: 50 }, to: { x: 82, y: 50 } },
    { id: "r3", from: { x: 50, y: 50 }, to: { x: 82, y: 78 } },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-5">
        <MissionBanner
          projectId={projectId}
          onEditClick={() => onOpenMissionModal?.()}
          onReversePromptClick={() => onOpenSuggestionsDrawer?.()}
        />

        {gatewayConfigured === false && onNavigateToGateway && (
          <Card className="mb-6 p-4 border-primary/30 bg-primary/5 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Radio className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Connect OpenClaw Gateway</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect to your Gateway for live agent chat and streaming.
                </p>
              </div>
            </div>
            <Button size="sm" variant="neon" onClick={onNavigateToGateway}>
              Connect Gateway
            </Button>
          </Card>
        )}

        {/* Network hub: left (Suppliers) | center (Core) | right (Customers) */}
        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,380px)_1fr] gap-4 lg:gap-6 mb-8 min-h-[320px]">
          <NetworkConnections connections={networkConnections} />

          {/* Left: Suppliers */}
          <div className="flex flex-col gap-3 justify-center">
            <Card
              className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
              onClick={() => onNavigate?.("tasks")}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  INBOX
                </span>
                <span className="text-xl font-bold tabular-nums text-[var(--neon-cyan)]">
                  {statusCounts.INBOX}
                </span>
              </div>
              <p className="text-[0.6rem] text-muted-foreground/70 mt-1">Tasks ready</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
              onClick={onOpenApprovals}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pending approvals
                </span>
                <span className="text-xl font-bold tabular-nums text-[var(--neon-cyan)]">
                  {approvals.length}
                </span>
              </div>
              <p className="text-[0.6rem] text-muted-foreground/70 mt-1">Awaiting review</p>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
              onClick={() => onNavigate?.("agents")}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agent pool
                </span>
                <span className="text-xl font-bold tabular-nums text-[var(--neon-cyan)]">
                  {agents.length}
                </span>
              </div>
              <p className="text-[0.6rem] text-muted-foreground/70 mt-1">{activeAgents} active</p>
            </Card>
          </div>

          {/* Center: Core system */}
          <Card className="relative flex flex-col items-center justify-center p-6 border-[var(--glass-border-green)] shadow-[var(--glow-green)]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--neon-green)]/60 rounded-t-xl" />
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--neon-green)]/20 flex items-center justify-center border border-[var(--glass-border-green)]">
                <Cpu className="h-4 w-4 text-[var(--neon-green)]" strokeWidth={1.5} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Mission Control
              </h2>
            </div>
            <p className="text-[0.65rem] text-muted-foreground text-center mb-4">
              Core system status
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <Button
                disabled={deploying}
                variant="neon"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={async () => {
                  setDeploying(true);
                  try {
                    await deploySquad({ projectId: projectId ?? undefined });
                  } finally {
                    setDeploying(false);
                  }
                }}
              >
                {deploying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Rocket className="h-3 w-3" />
                )}
                Deploy Squad
              </Button>
              <AutoRefreshBadge interval={15} active />
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--neon-green)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--neon-green)] status-dot-pulse" />
                Live
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="text-center p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <span className="text-lg font-bold tabular-nums text-[var(--neon-green)]">{activeAgents}</span>
                <p className="text-[0.6rem] text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <span className="text-lg font-bold tabular-nums text-[var(--neon-green)]">{inProgressTasks}</span>
                <p className="text-[0.6rem] text-muted-foreground">In progress</p>
              </div>
            </div>
          </Card>

          {/* Right: Customers */}
          <div className="flex flex-col gap-3 justify-center">
            <Card
              className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
              onClick={() => onNavigate?.("tasks")}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Completed
                </span>
                <span className="text-xl font-bold tabular-nums text-[var(--neon-green)]">
                  {doneTasks}
                </span>
              </div>
              <p className="text-[0.6rem] text-muted-foreground/70 mt-1">{completionRate}% rate</p>
            </Card>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
                    onClick={() => onNavigate?.("tasks")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total spend
                      </span>
                      <span className="text-lg font-bold tabular-nums text-[var(--neon-green)]">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[0.6rem] text-muted-foreground/70 mt-1">Across tasks</p>
                    <p className="text-[0.6rem] text-muted-foreground/50 mt-1 flex items-center gap-1">
                      Est. monthly savings
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/30 text-muted-foreground/70 hover:text-muted-foreground cursor-help text-[0.5rem] font-bold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ?
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[260px]">
                          Savings vs. paying full window price without cache/optimizations.
                        </TooltipContent>
                      </Tooltip>
                      <span className="tabular-nums">—</span>
                    </p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px]">
                  Cost from agent runs. Savings vs. paying list price without run-level optimizations.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Card
              className="p-4 cursor-pointer hover:-translate-y-0.5 transition-all"
              onClick={() => onNavigate?.("tasks")}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent activity
                </span>
                <span className="text-xl font-bold tabular-nums text-[var(--neon-green)]">
                  {activities.length}
                </span>
              </div>
              <p className="text-[0.6rem] text-muted-foreground/70 mt-1">Events</p>
            </Card>
          </div>
        </div>

        {/* System Status Bar */}
        <SystemStatusBar agents={agents} tasks={tasks} approvals={approvals} />

        {/* Quick Navigation */}
        <QuickActionsBar
          onNavigate={onNavigate}
          onOpenApprovals={onOpenApprovals}
          onOpenAlertRules={onOpenAlertRules}
          onToggleLayout={() => setCustomizeLayout((v) => !v)}
          isLayoutCustomizing={customizeLayout}
        />

        {/* AI Usage (24h) — tokens + cost per model; empty state when no usage */}
        <Card className="p-4 mb-4">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            AI Usage (24h)
          </div>
          {usageByModel && usageByModel.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {usageByModel.map(({ model, inputTokens, outputTokens, costUsd }) => (
                <div
                  key={model}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
                >
                  <div className="font-medium text-foreground truncate" title={model}>
                    {model}
                  </div>
                  <div className="text-muted-foreground mt-1">
                    In: {(inputTokens / 1000).toFixed(1)}k · Out: {(outputTokens / 1000).toFixed(1)}k · ~${costUsd.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/70 py-2">No usage in last 24h</p>
          )}
        </Card>

        {/* Metric cards row + Quota fuel gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <QuotaFuelGauge className="min-h-[120px]" />
          <MetricCard
            icon={Bot}
            label="Active Agents"
            value={activeAgents}
            subtitle={`${agents.length} total · ${pausedAgents} paused${quarantinedAgents > 0 ? ` · ${quarantinedAgents} quarantined` : ""}`}
            accent="text-primary"
            onClick={() => onNavigate?.("agents")}
            badge={quarantinedAgents > 0 ? `${quarantinedAgents} issue${quarantinedAgents > 1 ? "s" : ""}` : undefined}
            badgeVariant="urgent"
            trend={{ direction: "up", label: `${activeAgents} of ${agents.length} running` }}
          />
          <MetricCard
            icon={Zap}
            label="In Progress"
            value={inProgressTasks}
            subtitle={`${tasks.length} total tasks`}
            accent="text-amber-500"
            onClick={() => onNavigate?.("tasks")}
            trend={{ direction: inProgressTasks > 0 ? "up" : "flat", label: `${tasks.length} across all states` }}
          />
          <MetricCard
            icon={Eye}
            label="In Review"
            value={reviewTasks}
            subtitle={`${doneTasks} completed`}
            accent="text-primary"
            onClick={() => onNavigate?.("tasks")}
            badge={reviewTasks > 0 ? "needs review" : undefined}
            badgeVariant="info"
          />
          <MetricCard
            icon={ShieldAlert}
            label="Pending Approvals"
            value={approvals.length}
            subtitle={approvals.length > 0 ? "Action required" : "All clear"}
            accent={approvals.length > 0 ? "text-destructive" : "text-primary"}
            onClick={onOpenApprovals}
            badge={approvals.length > 0 ? "urgent" : undefined}
            badgeVariant="urgent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MetricCard
                    icon={DollarSign}
                    label="Total Spend"
                    value={`$${totalCost.toFixed(2)}`}
                    subtitle="Across all tasks"
                    accent="text-primary"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px]">
                Cost from agent runs. Savings vs. paying list price without run-level optimizations.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <MetricCard
            icon={CheckCircle2}
            label="Completed"
            value={doneTasks}
            subtitle={`${completionRate}% completion rate`}
            accent="text-primary"
            onClick={() => onNavigate?.("tasks")}
            trend={{ direction: "up", label: `${completionRate}% done` }}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Blocked"
            value={blockedTasks}
            subtitle={blockedTasks > 0 ? "Needs attention" : "No blockers"}
            accent={blockedTasks > 0 ? "text-destructive" : "text-primary"}
            onClick={() => onNavigate?.("tasks")}
            badge={blockedTasks > 0 ? "blocked" : undefined}
            badgeVariant="urgent"
          />
          <MetricCard
            icon={ListChecks}
            label="Needs Approval"
            value={needsApprovalTasks}
            subtitle={needsApprovalTasks > 0 ? "Awaiting review" : "Clear"}
            accent={needsApprovalTasks > 0 ? "text-amber-500" : "text-primary"}
            onClick={() => onNavigate?.("tasks")}
          />
        </div>

        {/* Agent Squad */}
        {agents.length > 0 && (
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agent Squad
                </span>
                <span className="text-[0.6rem] text-muted-foreground/50 ml-1">
                  {activeAgents} active / {agents.length} total
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
                onClick={() => onNavigate?.("agents")}
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {agents.map((agent) => {
                const currentTask = agent.currentTaskId
                  ? tasks.find((t) => t._id === agent.currentTaskId) ?? null
                  : null;
                return (
                  <AgentSquadCard
                    key={agent._id}
                    agent={agent}
                    currentTask={currentTask}
                    onClick={() => onSelectAgent?.(agent._id)}
                  />
                );
              })}
            </div>
          </Card>
        )}

        {/* Build Queue */}
        {buildTasks.length > 0 && (
          <Card className="p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Hammer className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Build Queue
                </span>
                <span className="text-[0.6rem] text-muted-foreground/50 ml-1">
                  {buildTasks.length} active
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
                onClick={() => onNavigate?.("tasks")}
              >
                View board
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {buildTasks.slice(0, 8).map((task) => {
                const assignee = task.assigneeIds[0]
                  ? agents.find((a) => a._id === task.assigneeIds[0])
                  : null;
                return (
                  <button
                    key={task._id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-left group"
                    onClick={() => onNavigate?.("tasks")}
                  >
                    <Loader2 className="h-3 w-3 text-amber-500 animate-spin shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground/90 truncate group-hover:text-foreground transition-colors">
                        {task.title}
                      </p>
                      <p className="text-[0.6rem] text-muted-foreground/50">
                        {assignee
                          ? `${assignee.emoji ?? "🤖"} ${assignee.name}`
                          : "Unassigned"}
                        {task.startedAt && (
                          <> &middot; {formatElapsed(task.startedAt)}</>
                        )}
                      </p>
                    </div>
                    <span className="text-[0.6rem] uppercase tracking-wider text-amber-500/70 shrink-0">
                      {task.type}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Blockers Alert — only shown when there are blocked tasks */}
        {blockedTasksList.length > 0 && (
          <Card className="p-5 mb-6 border-red-500/20 bg-red-500/3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Blockers
                </span>
                <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20 font-medium uppercase tracking-wider">
                  {blockedTasksList.length} task{blockedTasksList.length > 1 ? "s" : ""} blocked
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[0.65rem] text-red-400/70 hover:text-red-400"
                onClick={() => onNavigate?.("tasks")}
              >
                Resolve
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {blockedTasksList.map((task) => (
                <button
                  key={task._id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-red-500/5 transition-colors text-left group"
                  onClick={() => onNavigate?.("tasks")}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-xs text-foreground/80 truncate flex-1 group-hover:text-foreground transition-colors">
                    {task.title}
                  </span>
                  <span className="text-[0.6rem] text-muted-foreground/40 shrink-0">{task.type}</span>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Task Pipeline + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NeonChartContainer className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Pipeline
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[0.65rem] text-muted-foreground hover:text-foreground"
                onClick={() => onNavigate?.("tasks")}
              >
                Open board
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(statusCounts).map(([status, count]) => ({
                    name: status.replace(/_/g, " "),
                    count,
                    fill: status === "DONE" ? "var(--neon-green)" : status === "IN_PROGRESS" ? "var(--neon-cyan)" : "var(--muted-foreground)",
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickLine={{ stroke: "var(--glass-border)" }}
                    axisLine={{ stroke: "var(--glass-border)" }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                    formatter={(value: number) => [value, "Tasks"]}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {Object.entries(statusCounts).map(([status], i) => (
                      <Cell
                        key={status}
                        fill={
                          status === "DONE"
                            ? "var(--neon-green)"
                            : status === "IN_PROGRESS" || status === "REVIEW"
                              ? "var(--neon-cyan)"
                              : status === "BLOCKED" || status === "NEEDS_APPROVAL"
                                ? "var(--neon-magenta)"
                                : NeonChartTheme.gradientColors[0]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </NeonChartContainer>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Activity
                </span>
              </div>
              <span className="text-[0.6rem] text-muted-foreground/40">Live</span>
            </div>
            <div className="space-y-0.5 max-h-[280px] overflow-y-auto">
              {activities.slice(0, 12).map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-default"
                >
                  <div className="mt-1 shrink-0">
                    <Clock className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground/80 leading-relaxed truncate">
                      {activity.description}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground/50 mt-0.5">
                      <span className="uppercase tracking-wider">{activity.actorType}</span>
                      {" · "}
                      {new Date(activity._creationTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="py-10 text-center">
                  <Activity className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground/50">No recent activity</p>
                  <p className="text-[0.65rem] text-muted-foreground/30 mt-1">
                    Activity will appear here once agents start working
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Usage trends — tokens + cost over time */}
        {usageTimeSeries && usageTimeSeries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <NeonChartContainer className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Token usage
                </span>
                <div className="flex gap-1">
                  <Button
                    variant={chartWindowHours === 24 ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-[0.65rem]"
                    onClick={() => setChartWindowHours(24)}
                  >
                    24h
                  </Button>
                  <Button
                    variant={chartWindowHours === 168 ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-[0.65rem]"
                    onClick={() => setChartWindowHours(168)}
                  >
                    7d
                  </Button>
                  <Button
                    variant={chartWindowHours === 720 ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-[0.65rem]"
                    onClick={() => setChartWindowHours(720)}
                  >
                    30d
                  </Button>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={usageTimeSeries.map((d) => ({
                      ...d,
                      totalTokens: d.inputTokens + d.outputTokens,
                    }))}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="period"
                      tick={{ fill: NeonChartTheme.styles.fill, fontSize: 10 }}
                      tickFormatter={(v) =>
                      chartWindowHours === 24
                        ? v.slice(11, 13)
                        : chartWindowHours === 168
                          ? v.slice(5, 10)
                          : v.slice(0, 10)
                    }
                    />
                    <YAxis
                      tick={{ fill: NeonChartTheme.styles.fill, fontSize: 10 }}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value, "Tokens"]}
                      labelFormatter={(l) => (typeof l === "string" ? l : "")}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalTokens"
                      stroke="var(--neon-cyan)"
                      fill="var(--neon-cyan)"
                      fillOpacity={0.2}
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </NeonChartContainer>
            <NeonChartContainer className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cost trend
                </span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={usageTimeSeries}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="period"
                      tick={{ fill: NeonChartTheme.styles.fill, fontSize: 10 }}
                      tickFormatter={(v) =>
                      chartWindowHours === 24
                        ? v.slice(11, 13)
                        : chartWindowHours === 168
                          ? v.slice(5, 10)
                          : v.slice(0, 10)
                    }
                    />
                    <YAxis
                      tick={{ fill: NeonChartTheme.styles.fill, fontSize: 10 }}
                      tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Cost"]}
                      labelFormatter={(l) => (typeof l === "string" ? l : "")}
                    />
                    <Line
                      type="monotone"
                      dataKey="costUsd"
                      stroke="var(--neon-green)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </NeonChartContainer>
          </div>
        )}

        {/* Top tasks by cost — clickable to open task */}
        {tasks.filter((t) => t.actualCost > 0).length > 0 && (
          <Card className="p-4 mb-4">
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Top tasks by cost
            </div>
            <div className="space-y-1">
              {[...tasks]
                .filter((t) => t.actualCost > 0)
                .sort((a, b) => b.actualCost - a.actualCost)
                .slice(0, 5)
                .map((task) => (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => {
                      onTaskSelect?.(task._id);
                      onNavigate?.("tasks");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-left group"
                  >
                    <span className="text-xs text-foreground/90 truncate flex-1 mr-2 group-hover:text-foreground">
                      {task.title}
                    </span>
                    <span className="text-xs font-medium text-[var(--neon-green)] shrink-0">
                      ${task.actualCost.toFixed(2)}
                    </span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
            </div>
          </Card>
        )}

        {/* Top runs by tokens — isolated so missing Convex function doesn't crash dashboard */}
        <SectionErrorBoundary>
          <TopRunsByTokensSection
            projectId={projectId}
            onTaskSelect={onTaskSelect}
            onNavigate={onNavigate}
          />
        </SectionErrorBoundary>

        {/* Velocity / Summary Footer */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: TrendingUp,
              label: "Throughput",
              value: `${doneTasks} tasks`,
              sub: "completed total",
            },
            {
              icon: Cpu,
              label: "Squad Utilization",
              value: agents.length > 0 ? `${Math.round((activeAgents / agents.length) * 100)}%` : "0%",
              sub: `${activeAgents}/${agents.length} agents active`,
            },
            {
              icon: DollarSign,
              label: "Avg Cost / Task",
              value: doneTasks > 0 ? `$${(totalCost / doneTasks).toFixed(3)}` : "$0.000",
              sub: "per completed task",
            },
            {
              icon: Shield,
              label: "Policy Status",
              value: approvals.length === 0 ? "Clear" : `${approvals.length} pending`,
              sub: approvals.length > 0 ? "review required" : "no approvals needed",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 border border-border/50">
              <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <div>
                <div className="text-xs font-semibold text-foreground">{item.value}</div>
                <div className="text-[0.6rem] text-muted-foreground/60 uppercase tracking-wider">{item.label}</div>
                <div className="text-[0.6rem] text-muted-foreground/40">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Customize layout dialog — reorder sections; order persisted to localStorage */}
        <Dialog open={customizeLayout} onOpenChange={(open) => !open && setCustomizeLayout(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reorder dashboard sections</DialogTitle>
              <DialogDescription>
                Drag to reorder. Order is saved automatically. Dashboard section order is stored in this browser.
              </DialogDescription>
            </DialogHeader>
            <DndContext
              sensors={layoutSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleLayoutDragEnd}
            >
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1 mt-2 max-h-[60vh] overflow-y-auto">
                  {orderedIds.map((id) => (
                    <SortableSection key={id} id={id} canDrag={true}>
                      <span className="text-sm font-medium">{SECTION_LABELS[id] ?? id}</span>
                    </SortableSection>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSectionOrder([...DEFAULT_SECTION_ORDER]);
                  try {
                    localStorage.setItem(DASHBOARD_LAYOUT_KEY, JSON.stringify([...DEFAULT_SECTION_ORDER]));
                  } catch {
                    // ignore
                  }
                }}
              >
                Reset to default
              </Button>
              <Button size="sm" onClick={() => setCustomizeLayout(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
