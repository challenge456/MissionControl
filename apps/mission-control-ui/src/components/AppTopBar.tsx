import { Button } from "@/components/ui/button";
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
  Bell,
  Shield,
  Bot,
  Sparkles,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AppTopBarProps {
  projectSwitcher: React.ReactNode;
  searchBar: React.ReactNode;
  activeCount: number;
  taskCount: number;
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
  onOpenMissionModal?: () => void;
  onOpenSuggestionsDrawer?: () => void;
}

export function AppTopBar({
  projectSwitcher,
  searchBar,
  activeCount,
  taskCount,
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
  onOpenMissionModal,
  onOpenSuggestionsDrawer,
}: AppTopBarProps) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("mc.theme") || "dark";
  });

  const missionData = useQuery(api.mission.getMission, projectId ? { projectId } : {});
  const { privacyMode, togglePrivacyMode } = usePrivacy();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      root.classList.add("light");
    } else {
      root.removeAttribute("data-theme");
      root.classList.remove("light");
    }
    window.localStorage.setItem("mc.theme", theme);
  }, [theme]);

  return (
      <header className="flex h-11 items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-[var(--blur-panel)] px-4">
      {/* Left: project + search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {projectSwitcher}
        <div className="hidden sm:block flex-1 max-w-[260px]">
          {searchBar}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-8 w-8 text-muted-foreground"
          onClick={onOpenCommandPalette}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Center: mission + metrics */}
      <div className="hidden lg:flex items-center gap-4">
        {missionData?.missionStatement && (
          <>
            <div className="flex items-center gap-2 max-w-[400px] px-3 py-1.5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg">
              <Target className="h-3 w-3 text-muted-foreground shrink-0" strokeWidth={1.5} />
              <span className="text-xs text-foreground/80 truncate">
                {missionData.missionStatement}
              </span>
            </div>
            {onOpenSuggestionsDrawer && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={onOpenSuggestionsDrawer}
                title="Generate mission-aligned tasks"
              >
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              </Button>
            )}
          </>
        )}
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary status-dot-pulse" />
            {activeCount} Active
          </span>
          <span>{taskCount} Tasks</span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Agents flyout toggle */}
        {onOpenAgentsFlyout && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={onOpenAgentsFlyout}
            aria-label="Open agents panel"
          >
            <Bot className="h-3.5 w-3.5 mr-1" />
            <span className="hidden lg:inline">Agents</span>
          </Button>
        )}

        {/* Approvals */}
        {onOpenApprovals && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground relative"
            onClick={onOpenApprovals}
            aria-label={`Approvals${pendingApprovals > 0 ? ` (${pendingApprovals} pending)` : ""}`}
          >
            <Shield className="h-3.5 w-3.5 mr-1" />
            <span className="hidden lg:inline">Approvals</span>
            {pendingApprovals > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                {pendingApprovals}
              </span>
            )}
          </Button>
        )}

        {/* Notifications / Alerts */}
        {onOpenNotifications && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onOpenNotifications}
            aria-label="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              title="Insights — Cost Analytics, Provider billing, Health, Monitoring"
            >
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Insights</span>
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
          className="h-8 text-xs text-amber-400 hover:text-amber-300 hover:shadow-[var(--glow-cyan)]"
          onClick={onOpenControls}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
          <span className="hidden lg:inline">Controls</span>
        </Button>

        <Button variant="neon" size="sm" className="h-8 text-xs" onClick={onNewTask}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Task
        </Button>

        {/* Time + Status */}
        <span className="hidden xl:inline text-[11px] text-muted-foreground whitespace-nowrap ml-1">
          {timeStr} {dateStr}
        </span>
        <span className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-primary ml-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary status-dot-pulse" />
          Online
        </span>

        {/* Quota fuel gauge (compact) */}
        <QuotaFuelGauge compact className="hidden lg:flex ml-1" />

        {/* Privacy / demo mode — redact sensitive names in UI */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
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
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu placeholder */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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
