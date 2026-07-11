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

const AI_STATUS_STYLES: Record<ShellAiTone, { ring: string; dot: string; badge: string }> = {
  active: {
    ring: "border-line bg-ok-soft text-ok",
    dot: "bg-ok",
    badge: "text-ok",
  },
  thinking: {
    ring: "border-line bg-warn-soft text-warn",
    dot: "bg-warn",
    badge: "text-warn",
  },
  idle: {
    ring: "border-line bg-info-soft text-info-accent",
    dot: "bg-info-accent",
    badge: "text-info-accent",
  },
  offline: {
    ring: "border-line bg-surface-2 text-ink-muted",
    dot: "bg-ink-muted",
    badge: "text-ink-muted",
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
          toneClass: "border-line bg-warn-soft text-warn",
          onClick: onOpenApprovals,
        }
      : (aiStatus.tone === "offline" || activeCount === 0) && onOpenAiStatus
        ? {
            label: "Agent network idle",
            detail: "No live execution is reporting in. Inspect the fleet before trust degrades.",
            actionLabel: "Inspect fleet",
            icon: Bot,
            toneClass: "border-line bg-surface-2 text-ink-secondary",
            onClick: onOpenAiStatus,
          }
        : taskCount === 0
          ? {
              label: "Mission queue is empty",
              detail: "Seed the next task now so the system does not stall between cycles.",
              actionLabel: "Create task",
              icon: Plus,
              toneClass: "border-line bg-info-soft text-info-accent",
              onClick: onNewTask,
            }
          : onOpenSuggestionsDrawer
            ? {
                label: "Create the next move",
                detail: "Use mission-aligned suggestions to keep the system proactive instead of reactive.",
                actionLabel: "Generate tasks",
                icon: Sparkles,
                toneClass: "border-line bg-ok-soft text-ok",
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
    <header className="relative grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line bg-rail px-4">
      <div className="relative flex min-w-0 flex-1 items-center gap-3">
        <div className="hidden 2xl:flex items-center gap-3 rounded-xl border border-line bg-surface-1 px-3.5 py-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-secondary">
            <Bot className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-ink-muted">
              SellerFi
            </div>
            <div className="text-sm font-semibold text-ink">
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
          className="h-9 w-9 rounded-lg sm:hidden"
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
            className="group flex min-w-[210px] max-w-[252px] items-center gap-3 rounded-xl border border-line bg-surface-1 px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-line-strong hover:bg-surface-2"
            title={aiStatus.detail}
          >
            <div
              className={cn(
                "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
                aiStatusStyle.ring,
              )}
            >
              <HeartPulse className="h-4.5 w-4.5" strokeWidth={1.7} />
              <span
                className={cn(
                  "absolute right-1.5 top-1.5 h-2 w-2 rounded-full",
                  aiStatusStyle.dot,
                )}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11.5px] font-medium text-ink-muted">
                  AI status
                </span>
                <span className={cn("text-[11px] font-medium", aiStatusStyle.badge)}>
                  {aiStatus.lastSeenLabel}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-ink">
                {aiStatus.label}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-ink-muted">
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
              "group flex min-w-[228px] max-w-[300px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-line-strong",
              operatorCue.toneClass
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-1">
              <operatorCue.icon className="h-4 w-4" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-medium">
                {operatorCue.label}
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-secondary">
                {operatorCue.detail}
              </div>
              <div className="mt-1 text-[11px] font-medium">
                {operatorCue.actionLabel}
              </div>
            </div>
          </button>
        )}

      </div>

      <div className="relative flex items-center gap-1.5">
        <div className="hidden 2xl:flex items-center gap-1 rounded-lg border border-line bg-surface-1 p-0.5">
          {onOpenAiStatus && (
            <button
              type="button"
              onClick={onOpenAiStatus}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-[11px] text-ink-secondary transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              title={aiStatus.detail}
            >
              <span className={cn("h-2 w-2 rounded-full", aiStatusStyle.dot)} />
              <span>{aiStatus.label}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAgentsFlyout ?? onOpenDashboardOverview}
            className="rounded-md px-3 py-1.5 text-[11px] text-ink-secondary transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <span className="font-medium text-ink">{activeCount}</span> live
          </button>
          <button
            type="button"
            onClick={onOpenDashboardOverview}
            className="rounded-md px-3 py-1.5 text-[11px] text-ink-secondary transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <span className="font-medium text-ink">{taskCount}</span> tasks
          </button>
          <button
            type="button"
            onClick={onOpenApprovals ?? onOpenDashboardOverview}
            className="rounded-md px-3 py-1.5 text-[11px] text-ink-secondary transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            {reviewLabel}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 rounded-lg border border-line bg-surface-1 px-1.5 py-1">
          {onOpenApprovals && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-8 rounded-lg px-3 text-xs"
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
                className="h-8 rounded-lg px-3 text-xs"
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
            className="h-8 rounded-lg px-3 text-xs text-warn hover:text-warn"
            onClick={onOpenControls}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            <span className="hidden xl:inline">Controls</span>
          </Button>
        </div>

        <Button size="sm" className="h-9 px-3" onClick={onNewTask}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Task
        </Button>

        <span className="hidden 2xl:inline whitespace-nowrap rounded-md border border-line bg-surface-1 px-3 py-1.5 text-[11px] text-ink-secondary">
          {timeStr} {dateStr}
        </span>
        <span className="hidden xl:flex items-center gap-1.5 rounded-md border border-transparent bg-ok-soft px-3 py-1.5 text-[11px] font-medium text-ok">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          Operator online
        </span>

        <QuotaFuelGauge compact className="hidden xl:flex ml-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
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
          className="h-9 w-9 rounded-lg"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu placeholder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
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
