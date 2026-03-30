import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuotaFuelGauge } from "@/components/QuotaFuelGauge";
import { usePrivacy } from "@/contexts/PrivacyContext";
import {
  Search,
  Plus,
  BarChart3,
  Settings,
  Keyboard,
  Activity,
  DollarSign,
  TrendingDown,
  HeartPulse,
  Monitor,
  LayoutDashboard,
  AlertTriangle,
  User,
  Moon,
  Sun,
  Shield,
  Bot,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

type ShellAiTone = "active" | "thinking" | "idle" | "offline";

interface ShellAiStatus {
  tone: ShellAiTone;
  label: string;
  detail: string;
  lastSeenLabel: string;
}

interface AppTopBarProps {
  projectSwitcher: React.ReactNode;
  searchBar: React.ReactNode;
  activeCount: number;
  taskCount: number;
  aiStatus: ShellAiStatus;
  timeStr: string;
  dateStr: string;
  pendingApprovals?: number;
  projectId?: Id<"projects"> | null;
  onNewTask: () => void;
  onOpenControls: () => void;
  onOpenCommandPalette: () => void;
  onOpenCostAnalytics: () => void;
  onOpenBudgetBurnDown: () => void;
  onOpenAdvancedAnalytics: () => void;
  onOpenHealthDashboard: () => void;
  onOpenMonitoringDashboard: () => void;
  onOpenDashboardOverview: () => void;
  onOpenActivityFeed: () => void;
  onOpenKeyboardHelp: () => void;
  onOpenApprovals?: () => void;
  onOpenNotifications?: () => void;
  onOpenAgentsFlyout?: () => void;
  onOpenAiStatus?: () => void;
  onOpenMissionModal?: () => void;
  onOpenSuggestionsDrawer?: () => void;
}

const AI_STATUS_STYLES: Record<ShellAiTone, { ring: string; glow: string; dot: string; badge: string }> = {
  active: {
    ring: "border-emerald-300/35 bg-emerald-400/12 text-emerald-100",
    glow: "shadow-[0_0_0_1px_rgba(52,211,153,0.12),0_0_18px_rgba(16,185,129,0.16)]",
    dot: "bg-emerald-300",
    badge: "text-emerald-200/85",
  },
  thinking: {
    ring: "border-amber-300/35 bg-amber-300/12 text-amber-100",
    glow: "shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_0_18px_rgba(245,158,11,0.14)]",
    dot: "bg-amber-300",
    badge: "text-amber-100/85",
  },
  idle: {
    ring: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.10),0_0_16px_rgba(14,165,233,0.10)]",
    dot: "bg-cyan-300",
    badge: "text-cyan-100/80",
  },
  offline: {
    ring: "border-zinc-400/20 bg-zinc-300/8 text-zinc-100",
    glow: "shadow-[0_0_0_1px_rgba(161,161,170,0.10),0_0_12px_rgba(63,63,70,0.10)]",
    dot: "bg-zinc-400",
    badge: "text-zinc-300/75",
  },
};

export function AppTopBar({
  projectSwitcher,
  searchBar,
  activeCount,
  taskCount,
  aiStatus,
  timeStr,
  dateStr,
  pendingApprovals = 0,
  projectId,
  onNewTask,
  onOpenControls,
  onOpenCommandPalette,
  onOpenCostAnalytics,
  onOpenBudgetBurnDown,
  onOpenAdvancedAnalytics,
  onOpenHealthDashboard,
  onOpenMonitoringDashboard,
  onOpenDashboardOverview,
  onOpenActivityFeed,
  onOpenKeyboardHelp,
  onOpenApprovals,
  onOpenNotifications,
  onOpenAgentsFlyout,
  onOpenAiStatus,
  onOpenMissionModal,
  onOpenSuggestionsDrawer,
}: AppTopBarProps) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("mc.theme") || "dark";
  });

  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const aiStatusStyle = AI_STATUS_STYLES[aiStatus.tone];
  const reviewLabel = pendingApprovals > 0 ? `${pendingApprovals} review` : "review clear";
  const operatorCue =
    pendingApprovals > 0 && onOpenApprovals
      ? {
          label: "Pending approvals",
          detail: `${pendingApprovals} decision${pendingApprovals === 1 ? "" : "s"} need operator review.`,
          actionLabel: "Review now",
          icon: Shield,
          toneClass: "border-amber-300/25 bg-amber-400/10 text-amber-50",
          onClick: onOpenApprovals,
        }
      : (aiStatus.tone === "offline" || activeCount === 0) && onOpenAiStatus
        ? {
            label: "Agent network idle",
            detail: "No live execution is reporting in. Inspect the fleet before trust degrades.",
            actionLabel: "Inspect fleet",
            icon: Bot,
            toneClass: "border-zinc-300/20 bg-zinc-300/8 text-zinc-50",
            onClick: onOpenAiStatus,
          }
        : taskCount === 0
          ? {
              label: "Mission queue is empty",
              detail: "Seed the next task now so the system does not stall between cycles.",
              actionLabel: "Create task",
              icon: Plus,
              toneClass: "border-cyan-300/20 bg-cyan-400/10 text-cyan-50",
              onClick: onNewTask,
            }
          : onOpenSuggestionsDrawer
            ? {
                label: "Create the next move",
                detail: "Use mission-aligned suggestions to keep the system proactive instead of reactive.",
                actionLabel: "Generate tasks",
                icon: Sparkles,
                toneClass: "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
                onClick: onOpenSuggestionsDrawer,
              }
            : null;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.classList.toggle("light", theme === "light");
    window.localStorage.setItem("mc.theme", theme);
  }, [theme]);

  return (
    <header className="relative grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_97%,transparent),color-mix(in_srgb,var(--background)_92%,transparent))] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.14),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.12),transparent_28%)] opacity-60" />

      <div className="relative flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden 2xl:flex items-center gap-3 rounded-2xl border border-[var(--panel-line-strong)] bg-[color:var(--shell-panel-strong)] px-3.5 py-2 shadow-[var(--card-shadow)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 shadow-[var(--glow-cyan)]">
            <Bot className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
              SellerFi
            </div>
            <div className="font-[family:var(--font-display)] text-sm font-semibold tracking-[0.18em] text-foreground">
              Mission Control
            </div>
          </div>
        </div>

        <div className="shrink-0">{projectSwitcher}</div>

        <div className="hidden sm:block flex-1 max-w-[320px]">
          {searchBar}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-2xl text-muted-foreground sm:hidden"
          onClick={onOpenCommandPalette}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative hidden min-w-0 2xl:flex items-center gap-2.5">
        {onOpenAiStatus && (
          <button
            type="button"
            onClick={onOpenAiStatus}
            className="group flex min-w-[210px] max-w-[252px] items-center gap-3 rounded-2xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel-strong)_97%,transparent),color-mix(in_srgb,var(--shell-panel)_92%,transparent))] px-3.5 py-2.5 text-left shadow-[var(--card-shadow)] transition-all duration-200 hover:border-[var(--panel-line-strong)] hover:shadow-[var(--card-shadow-hover)]"
            title={aiStatus.detail}
          >
            <div
              className={cn(
                "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-xl transition-transform duration-200 group-hover:scale-[1.03]",
                aiStatusStyle.ring,
                aiStatusStyle.glow,
              )}
            >
              <HeartPulse className="h-4.5 w-4.5" strokeWidth={1.7} />
              <span
                className={cn(
                  "absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full",
                  aiStatusStyle.dot,
                  aiStatus.tone !== "offline" && "status-dot-pulse",
                )}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  AI status
                </span>
                <span className={cn("text-[10px] font-medium tracking-[0.04em]", aiStatusStyle.badge)}>
                  {aiStatus.lastSeenLabel}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-foreground">
                {aiStatus.label}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {aiStatus.detail}
              </div>
            </div>
          </button>
        )}

        {operatorCue && (
          <button
            type="button"
            onClick={operatorCue.onClick}
            className={cn(
              "group flex min-w-[228px] max-w-[300px] items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left shadow-[var(--card-shadow)] transition-all duration-200 hover:shadow-[var(--card-shadow-hover)]",
              operatorCue.toneClass
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/10 backdrop-blur-xl">
              <operatorCue.icon className="h-4 w-4" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                {operatorCue.label}
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/82">
                {operatorCue.detail}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                {operatorCue.actionLabel}
              </div>
            </div>
          </button>
        )}

      </div>

      <div className="relative flex items-center gap-1.5">
        <div className="hidden 2xl:flex items-center gap-1 rounded-xl border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--shell-panel)_98%,transparent),color-mix(in_srgb,var(--background)_88%,transparent))] px-1.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {onOpenAiStatus && (
            <button
              type="button"
              onClick={onOpenAiStatus}
              className="flex items-center gap-2 rounded-2xl px-3 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-cyan-400/8 hover:text-foreground"
              title={aiStatus.detail}
            >
              <span className={cn("h-2 w-2 rounded-full", aiStatusStyle.dot, aiStatus.tone !== "offline" && "status-dot-pulse")} />
              <span className="font-[family:var(--font-display)] uppercase tracking-[0.12em]">{aiStatus.label}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAgentsFlyout ?? onOpenDashboardOverview}
            className="rounded-2xl px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-cyan-400/8 hover:text-foreground"
          >
            <span className="font-[family:var(--font-display)] uppercase tracking-[0.12em] text-foreground">{activeCount}</span> live
          </button>
          <button
            type="button"
            onClick={onOpenDashboardOverview}
            className="rounded-2xl px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-cyan-400/8 hover:text-foreground"
          >
            <span className="font-[family:var(--font-display)] uppercase tracking-[0.12em] text-foreground">{taskCount}</span> tasks
          </button>
          <button
            type="button"
            onClick={onOpenApprovals ?? onOpenDashboardOverview}
            className="rounded-2xl px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-cyan-400/8 hover:text-foreground"
          >
            {reviewLabel}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 rounded-2xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          {onOpenApprovals && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-8 rounded-2xl px-3 text-xs text-muted-foreground"
              onClick={onOpenApprovals}
              aria-label={`Approvals${pendingApprovals > 0 ? ` (${pendingApprovals} pending)` : ""}`}
            >
              <Shield className="h-3.5 w-3.5 mr-1" />
              <span className="hidden xl:inline">Approvals</span>
              {pendingApprovals > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                  {pendingApprovals}
                </span>
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-2xl px-3 text-xs text-muted-foreground"
                title="Insights — Cost Analytics, Provider billing, Health, Monitoring"
              >
                <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden xl:inline">Insights</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onOpenCostAnalytics}>
                <DollarSign className="h-4 w-4 mr-2" />Cost Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenBudgetBurnDown}>
                <TrendingDown className="h-4 w-4 mr-2" />Budget Burn-Down
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenAdvancedAnalytics}>
                <BarChart3 className="h-4 w-4 mr-2" />Advanced Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenHealthDashboard}>
                <HeartPulse className="h-4 w-4 mr-2" />Health Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenMonitoringDashboard}>
                <Monitor className="h-4 w-4 mr-2" />Monitoring
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenDashboardOverview}>
                <LayoutDashboard className="h-4 w-4 mr-2" />Overview Snapshot
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenActivityFeed}>
                <Activity className="h-4 w-4 mr-2" />Activity Timeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenKeyboardHelp}>
                <Keyboard className="h-4 w-4 mr-2" />Shortcuts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-2xl px-3 text-xs text-amber-300 hover:text-amber-200 hover:shadow-[var(--glow-cyan)]"
            onClick={onOpenControls}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            <span className="hidden xl:inline">Controls</span>
          </Button>
        </div>

        <Button variant="neon-cyan" size="sm" className="h-10 rounded-2xl px-4 text-xs" onClick={onNewTask}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Task
        </Button>

        <span className="hidden 2xl:inline whitespace-nowrap rounded-full border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-1.5 text-[11px] text-muted-foreground">
          {timeStr} {dateStr}
        </span>
        <span className="hidden xl:flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 status-dot-pulse" />
          Operator online
        </span>

        <QuotaFuelGauge compact className="hidden xl:flex ml-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-2xl text-muted-foreground"
          onClick={togglePrivacyMode}
          aria-label={privacyMode ? "Show sensitive info" : "Hide sensitive info (demo mode)"}
          title={privacyMode ? "Privacy on — click to show names" : "Privacy off — click to redact for demos"}
        >
          {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-2xl text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu placeholder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-2xl text-muted-foreground">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled>
              <Settings className="h-4 w-4 mr-2" />Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenKeyboardHelp}>
              <Keyboard className="h-4 w-4 mr-2" />Shortcuts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
