import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, CreditCard } from "lucide-react";

interface CostAnalyticsProps {
  projectId: Id<"projects"> | null;
  onClose: () => void;
}

export function CostAnalytics({ projectId, onClose }: CostAnalyticsProps) {
  const runs = useQuery(
    api.runs.listRecent,
    { limit: 1000 }
  );
  
  const agents = useQuery(
    api.agents.listAll,
    projectId ? { projectId } : {}
  );
  
  const tasks = useQuery(
    api.tasks.listAll,
    projectId ? { projectId } : {}
  );

  if (!runs || !agents || !tasks) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-card rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalCost = runs.reduce((sum, r) => sum + r.costUsd, 0);
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayCost = runs
    .filter((r) => r.startedAt >= todayStart)
    .reduce((sum, r) => sum + r.costUsd, 0);
  
  const last7Days = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7DaysCost = runs
    .filter((r) => r.startedAt >= last7Days)
    .reduce((sum, r) => sum + r.costUsd, 0);
  
  const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30DaysCost = runs
    .filter((r) => r.startedAt >= last30Days)
    .reduce((sum, r) => sum + r.costUsd, 0);
  
  // Cost by agent
  const costByAgent = agents.map((agent) => {
    const agentRuns = runs.filter((r) => r.agentId === agent._id);
    const cost = agentRuns.reduce((sum, r) => sum + r.costUsd, 0);
    const runCount = agentRuns.length;
    return { agent, cost, runCount };
  }).sort((a, b) => b.cost - a.cost);
  
  // Cost by task
  const costByTask = tasks.map((task) => {
    return {
      task,
      cost: task.actualCost,
      budget: task.budgetAllocated || 0,
      remaining: task.budgetRemaining || 0,
    };
  }).sort((a, b) => b.cost - a.cost);
  
  // Cost by model
  const costByModel: Record<string, { cost: number; runs: number }> = {};
  for (const run of runs) {
    if (!costByModel[run.model]) {
      costByModel[run.model] = { cost: 0, runs: 0 };
    }
    costByModel[run.model].cost += run.costUsd;
    costByModel[run.model].runs++;
  }
  const modelStats = Object.entries(costByModel)
    .map(([model, stats]) => ({ model, ...stats }))
    .sort((a, b) => b.cost - a.cost);
  
  // Daily cost trend (last 7 days)
  const dailyCosts: Record<string, number> = {};
  for (const run of runs) {
    if (run.startedAt >= last7Days) {
      const date = new Date(run.startedAt).toISOString().split("T")[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + run.costUsd;
    }
  }
  const costTrend = Object.entries(dailyCosts)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const maxDailyCost = Math.max(...Object.values(dailyCosts), 1);

  // Provider billing dashboards (manual auth only — see docs/COSTS.md). Grouped for clarity.
  const providerBillingGroups: { label: string; links: { name: string; url: string }[] }[] = [
    {
      label: "AI & models",
      links: [
        { name: "Anthropic", url: "https://console.anthropic.com/settings/billing" },
        { name: "OpenAI", url: "https://platform.openai.com/usage" },
        { name: "Google / Gemini", url: "https://console.cloud.google.com/billing" },
        { name: "OpenRouter", url: "https://openrouter.ai/credits" },
        { name: "Perplexity", url: "https://www.perplexity.ai/settings" },
      ],
    },
    {
      label: "Infrastructure",
      links: [
        { name: "Convex", url: "https://dashboard.convex.dev" },
        { name: "Vercel", url: "https://vercel.com/dashboard/billing" },
        { name: "GitHub", url: "https://github.com/settings/billing" },
      ],
    },
    {
      label: "Tools & services",
      links: [
        { name: "Cursor", url: "https://cursor.com" },
        { name: "ElevenLabs", url: "https://elevenlabs.io/subscription" },
        { name: "Twilio", url: "https://console.twilio.com/billing" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Cost Analytics
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {runs.length} runs · ${totalCost.toFixed(2)} total
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[260px]">
                    Cost from agent runs. Savings vs. paying list price without run-level optimizations.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Today</div>
              <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                ${todayCost.toFixed(2)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Last 7 Days</div>
              <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                ${last7DaysCost.toFixed(2)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Last 30 Days</div>
              <div className="text-2xl font-bold text-primary mt-1 tabular-nums">
                ${last30DaysCost.toFixed(2)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-muted-foreground">All Time</div>
              <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                ${totalCost.toFixed(2)}
              </div>
            </Card>
          </div>

          {/* Provider billing — first-class card, grouped vendors */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4 text-primary" />
                Provider billing
              </CardTitle>
              <CardDescription>
                Vendor dashboards require manual sign-in. Review regularly and update{" "}
                <code className="text-[11px] bg-muted/80 px-1.5 py-0.5 rounded">docs/COSTS.md</code> with current spending.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {providerBillingGroups.map(({ label, links }) => (
                  <div key={label}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      {label}
                    </div>
                    <ul className="space-y-1">
                      {links.map(({ name, url }) => (
                        <li key={name}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 rounded-md py-2 px-3 text-sm text-foreground hover:bg-accent transition-colors group"
                          >
                            <span>{name}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                Full checklist and spending table: <code className="bg-muted/80 px-1.5 py-0.5 rounded">docs/COSTS.md</code>
              </p>
            </CardContent>
          </Card>

          {/* Daily Trend Chart */}
          <Card className="p-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Daily cost trend (last 7 days)
            </h3>
            <div className="space-y-2">
              {costTrend.map(({ date, cost }) => (
                <div key={date} className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground w-24 shrink-0">
                    {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-primary/80 h-6 rounded-full transition-all min-w-[2px]"
                      style={{ width: `${(cost / maxDailyCost) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-foreground">
                      ${cost.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost by Agent */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Cost by agent
              </h3>
              <div className="space-y-2">
                {costByAgent.slice(0, 10).map(({ agent, cost, runCount }) => (
                  <div key={agent._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{agent.emoji || "🤖"}</span>
                      <span className="text-sm text-foreground truncate">
                        {agent.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({runCount} runs)
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground tabular-nums shrink-0 ml-2">
                      ${cost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Cost by Model */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Cost by model
              </h3>
              <div className="space-y-2">
                {modelStats.map(({ model, cost, runs }) => (
                  <div key={model} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-foreground truncate">
                        {model}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({runs} runs)
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground tabular-nums shrink-0 ml-2">
                      ${cost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Most Expensive Tasks — fix contrast */}
            <Card className="p-4 lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                Most expensive tasks
              </h3>
              <div className="space-y-3">
                {costByTask.slice(0, 10).map(({ task, cost, budget, remaining }) => (
                  <div key={task._id} className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {task.type} · Priority {task.priority}
                      </div>
                      {budget > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                remaining < 0
                                  ? "bg-destructive"
                                  : remaining < budget * 0.2
                                  ? "bg-amber-500"
                                  : "bg-primary"
                              }`}
                              style={{ width: `${Math.min((cost / budget) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>${cost.toFixed(2)}</span>
                            <span>${budget.toFixed(2)} budget</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-foreground tabular-nums">
                        ${cost.toFixed(2)}
                      </div>
                      {budget > 0 && (
                        <div className={`text-xs mt-0.5 ${
                          remaining < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}>
                          {remaining < 0 ? "Over" : `${remaining.toFixed(2)} left`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
