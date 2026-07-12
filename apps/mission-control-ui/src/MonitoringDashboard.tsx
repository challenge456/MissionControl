import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricBlock, MetricRow } from "./components/factory/MetricBlock";
import { StatusBadge, type StatusBadgeProps } from "./components/factory/badges";

interface MonitoringDashboardProps {
  onClose: () => void;
}

function severityTone(severity: string): StatusBadgeProps["tone"] {
  switch (severity) {
    case "CRITICAL":
    case "ERROR":
      return "error";
    case "WARNING":
      return "warning";
    case "INFO":
      return "info";
    default:
      return "neutral";
  }
}

export function MonitoringDashboard({ onClose }: MonitoringDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"errors" | "performance" | "audit">("errors");
  const recentErrors = useQuery(api.monitoring.listRecentErrors, { limit: 50 });
  const performanceStats = useQuery(api.monitoring.getPerformanceStats, {});
  const auditLog = useQuery(api.monitoring.getAuditLog, { limit: 100 });

  if (!recentErrors || !performanceStats || !auditLog) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
        <div className="rounded-xl border border-line bg-surface-1 p-10 text-[13px] text-ink-secondary">
          Loading monitoring data...
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
        className="max-h-[90vh] w-full max-w-[1400px] overflow-auto rounded-xl border border-line bg-surface-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-6">
          <div>
            <h2 className="text-[19px] font-semibold text-ink">Monitoring</h2>
            <p className="mt-1 text-[13px] text-ink-secondary">
              Real-time system monitoring and audit logs
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close monitoring"
            className="rounded-md p-1.5 text-ink-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-line px-6" role="tablist">
          <TabButton
            label="Errors"
            active={selectedTab === "errors"}
            onClick={() => setSelectedTab("errors")}
            count={recentErrors.length}
          />
          <TabButton
            label="Performance"
            active={selectedTab === "performance"}
            onClick={() => setSelectedTab("performance")}
          />
          <TabButton
            label="Audit log"
            active={selectedTab === "audit"}
            onClick={() => setSelectedTab("audit")}
            count={auditLog.length}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {selectedTab === "errors" && <ErrorsTab errors={recentErrors} />}
          {selectedTab === "performance" && <PerformanceTab stats={performanceStats} />}
          {selectedTab === "audit" && <AuditTab logs={auditLog} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] transition-colors duration-150",
        active
          ? "border-ink text-ink"
          : "border-transparent text-ink-muted hover:text-ink-secondary"
      )}
    >
      {label}
      {count !== undefined && (
        <span className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11.5px] font-medium leading-none text-ink-secondary">
          {count}
        </span>
      )}
    </button>
  );
}

const SENSITIVE_KEYS = new Set([
  "token", "access_token", "refresh_token", "id_token",
  "password", "passwd", "secret", "api_key", "apikey", "apiKey",
  "auth", "authorization", "credentials", "private_key", "privateKey",
  "ssn", "email", "cookie", "session", "jwt", "bearer",
  "client_secret", "clientSecret", "connection_string", "connectionString",
]);

const SENSITIVE_PATTERNS = [
  /^sk[-_]/i, // Stripe/OpenAI secret keys
  /^ghp_/i, // GitHub PATs
  /^xoxb-/i, // Slack tokens
  /bearer\s+\S+/i,
];

function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeMetadata(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    return isSensitiveValue(obj) ? "[REDACTED]" : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadata);
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeMetadata(value);
      }
    }
    return result;
  }
  return obj;
}

function ErrorsTab({ errors }: any) {
  if (errors.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-ink-muted">
        <div className="text-[15px] font-semibold text-ink">No errors</div>
        <div className="mt-1 text-[13px]">System is running smoothly</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {errors.map((error: any, idx: number) => {
        const errorType = error.metadata?.errorType || "ERROR";
        const severity =
          errorType === "CRITICAL" || errorType === "DATABASE_ERROR" || errorType === "API_ERROR"
            ? "CRITICAL"
            : errorType === "WARNING"
              ? "WARNING"
              : "ERROR";

        return (
          <div key={idx} className="rounded-lg border border-line bg-surface-2 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <StatusBadge tone={severityTone(severity)}>{severity}</StatusBadge>
              <div className="text-[12px] text-ink-muted">
                {new Date(error._creationTime).toLocaleString()}
              </div>
            </div>
            <div className="mb-2 text-[13.5px] text-ink">{error.description}</div>
            {error.metadata && (
              <div className="overflow-auto rounded-md bg-surface-1 p-2 font-mono text-[12px] text-ink-muted">
                {JSON.stringify(sanitizeMetadata(error.metadata), null, 2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PerformanceTab({ stats }: any) {
  const logs = stats.recentLogs || [];
  const slowest = [...logs]
    .sort((a: any, b: any) => (b.metadata?.durationMs || 0) - (a.metadata?.durationMs || 0))
    .slice(0, 8);

  return (
    <div>
      <MetricRow className="mb-6">
        <MetricBlock label="Average duration" value={`${Math.round(stats.avgDurationMs || 0)}ms`} />
        <MetricBlock label="Min duration" value={`${Math.round(stats.minDurationMs || 0)}ms`} />
        <MetricBlock
          label="Max duration"
          value={`${Math.round(stats.maxDurationMs || 0)}ms`}
          adornment={
            (stats.maxDurationMs || 0) > 5000 ? <StatusBadge tone="warning">Slow</StatusBadge> : undefined
          }
        />
        <MetricBlock label="Sample count" value={stats.count || 0} />
      </MetricRow>

      <div className="rounded-xl border border-line bg-surface-1 p-5">
        <h3 className="mb-4 text-[15px] font-semibold text-ink">Recent slow operations</h3>
        {slowest.length > 0 ? (
          <div className="flex flex-col">
            {slowest.map((log: any, idx: number) => {
              const duration = log.metadata?.durationMs || 0;
              const operation = log.metadata?.operation || "Unknown operation";
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-line px-1 py-2 last:border-b-0"
                >
                  <span className="text-[13px] text-ink-secondary">{operation}</span>
                  <span
                    className={cn(
                      "font-mono text-[13px]",
                      duration > 1000 ? "text-err" : "text-ink-muted"
                    )}
                  >
                    {Math.round(duration)}ms
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-5 text-center text-[13px] text-ink-muted">
            No performance data yet
          </div>
        )}
      </div>
    </div>
  );
}

function AuditTab({ logs }: any) {
  if (logs.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-ink-muted">
        <div className="text-[15px] font-semibold text-ink">No audit logs</div>
        <div className="mt-1 text-[13px]">Activity will appear here</div>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-auto rounded-xl border border-line">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-line hover:bg-transparent">
            <TableHead className="px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">Time</TableHead>
            <TableHead className="px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">Actor</TableHead>
            <TableHead className="px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">Action</TableHead>
            <TableHead className="px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.06em] text-ink-muted">Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log: any, idx: number) => (
            <TableRow key={idx} className="border-b border-line last:border-b-0 hover:bg-surface-2">
              <TableCell className="px-4 py-3 text-[12.5px] text-ink-muted">
                {new Date(log._creationTime).toLocaleTimeString()}
              </TableCell>
              <TableCell className="px-4 py-3 text-[12.5px] text-ink-secondary">
                {log.actorType}: {log.actorId || "System"}
              </TableCell>
              <TableCell className="px-4 py-3 text-[12.5px] font-medium text-ink">
                {log.action}
              </TableCell>
              <TableCell className="px-4 py-3 text-[12.5px] text-ink-muted">
                {log.targetType}: {log.targetId}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
