import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricBlock, MetricRow } from "./components/factory/MetricBlock";
import { StatusBadge, type StatusBadgeProps } from "./components/factory/badges";

interface HealthDashboardProps {
  projectId: Id<"projects"> | null;
  onClose: () => void;
}

function statusTone(status: string): StatusBadgeProps["tone"] {
  switch (status) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "unhealthy":
      return "error";
    default:
      return "neutral";
  }
}

function statusDotClass(status: string): string {
  switch (status) {
    case "healthy":
      return "bg-ok";
    case "degraded":
      return "bg-warn";
    case "unhealthy":
      return "bg-err";
    default:
      return "bg-ink-muted";
  }
}

export function HealthDashboard({ onClose }: HealthDashboardProps) {
  // Convex queries are reactive, but this counter gives users a visual
  // "click-to-refresh" action. The setter is used by the button below.
  const [, setRefreshKey] = useState(0);
  const healthStatus = useQuery(api.health.status, {});
  const metrics = useQuery(api.health.metrics, {});

  if (!healthStatus || !metrics) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
        <div className="rounded-xl border border-line bg-surface-1 p-10 text-[13px] text-ink-secondary">
          Loading health status...
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-auto bg-black/70 p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[1200px] overflow-auto rounded-xl border border-line bg-surface-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-6">
          <div>
            <h2 className="text-[19px] font-semibold text-ink">System health</h2>
            <p className="mt-1 text-[13px] text-ink-secondary">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close system health"
            className="rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-6">
          {/* Overall Status */}
          <div className="mb-6 rounded-xl border border-line bg-surface-2 p-5">
            <div className="flex items-center gap-3">
              <StatusBadge tone={statusTone(healthStatus.status)}>
                {healthStatus.status.toUpperCase()}
              </StatusBadge>
              <div className="text-[13.5px] text-ink-secondary">{healthStatus.message}</div>
            </div>
          </div>

          {/* Component Status Grid */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(healthStatus.checks).map(([component, check]: [string, any]) => (
              <div key={component} className="rounded-xl border border-line bg-surface-1 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", statusDotClass(check.status))}
                    aria-hidden
                  />
                  <div className="text-[13px] font-semibold capitalize text-ink">{component}</div>
                </div>
                <div className="text-[12.5px] text-ink-muted">{check.message}</div>
                {check.responseTime && (
                  <div className="mt-1 font-mono text-[11.5px] text-ink-muted">
                    Response: {check.responseTime}ms
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="rounded-xl border border-line bg-surface-1 p-5">
            <h3 className="mb-4 text-[15px] font-semibold text-ink">System metrics</h3>
            <MetricRow className="border-b-0 pb-0 sm:grid-cols-3 xl:grid-cols-6">
              <MetricBlock label="Total projects" value={metrics.projects?.total || 0} />
              <MetricBlock
                label="Active agents"
                value={metrics.agents?.active || 0}
                detail={`${metrics.agents?.total || 0} total`}
              />
              <MetricBlock
                label="Tasks"
                value={metrics.tasks?.total || 0}
                detail={`${metrics.tasks?.byStatus?.inProgress || 0} in progress`}
              />
              <MetricBlock
                label="Pending approvals"
                value={metrics.approvals?.pending || 0}
                adornment={
                  metrics.approvals?.pending > 0 ? (
                    <StatusBadge tone="warning">Action</StatusBadge>
                  ) : undefined
                }
              />
              <MetricBlock
                label="Open alerts"
                value={metrics.alerts?.open || 0}
                adornment={
                  metrics.alerts?.open > 0 ? <StatusBadge tone="error">Open</StatusBadge> : undefined
                }
              />
              <MetricBlock label="Uptime" value={healthStatus.uptime || "N/A"} />
            </MetricRow>
          </div>

          {/* Refresh Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex h-9 items-center rounded-lg bg-act px-3 text-[13px] font-medium text-act-ink transition-opacity duration-150 hover:opacity-90"
            >
              Refresh now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
