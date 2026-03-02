import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
interface MonitoringDashboardProps {
  onClose: () => void;
}

export function MonitoringDashboard({ onClose }: MonitoringDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"errors" | "performance" | "audit">("errors");
  const recentErrors = useQuery(api.monitoring.listRecentErrors, { limit: 50 });
  const performanceStats = useQuery(api.monitoring.getPerformanceStats, {});
  const auditLog = useQuery(api.monitoring.getAuditLog, { limit: 100 });

  if (!recentErrors || !performanceStats || !auditLog) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}>
        <div style={{
          background: "var(--card)",
          padding: "40px",
          borderRadius: "12px",
          color: "var(--foreground)",
        }}>
          Loading monitoring data...
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "#ef4444";
      case "ERROR": return "#f97316";
      case "WARNING": return "#f59e0b";
      case "INFO": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "🔴";
      case "ERROR": return "❌";
      case "WARNING": return "⚠️";
      case "INFO": return "ℹ️";
      default: return "📝";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
        overflow: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: "12px",
          maxWidth: "1400px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          color: "var(--foreground)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
              📊 Monitoring & Observability
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted-foreground)", fontSize: "14px" }}>
              Real-time system monitoring and audit logs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted-foreground)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0 8px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
        }}>
          <TabButton
            label="🔴 Errors"
            active={selectedTab === "errors"}
            onClick={() => setSelectedTab("errors")}
            count={recentErrors.length}
          />
          <TabButton
            label="⚡ Performance"
            active={selectedTab === "performance"}
            onClick={() => setSelectedTab("performance")}
          />
          <TabButton
            label="📋 Audit Log"
            active={selectedTab === "audit"}
            onClick={() => setSelectedTab("audit")}
            count={auditLog.length}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          {selectedTab === "errors" && (
            <ErrorsTab errors={recentErrors} getSeverityColor={getSeverityColor} getSeverityIcon={getSeverityIcon} />
          )}
          {selectedTab === "performance" && (
            <PerformanceTab stats={performanceStats} />
          )}
          {selectedTab === "audit" && (
            <AuditTab logs={auditLog} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
        color: active ? "#3b82f6" : "var(--muted-foreground)",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{
          background: active ? "#3b82f6" : "var(--border)",
          color: "white",
          borderRadius: "12px",
          padding: "2px 8px",
          fontSize: "12px",
          fontWeight: 600,
        }}>
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

function ErrorsTab({ errors, getSeverityColor, getSeverityIcon }: any) {
  if (errors.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
        <div style={{ fontSize: "18px", fontWeight: 500 }}>No Errors!</div>
        <div style={{ fontSize: "14px", marginTop: "8px" }}>System is running smoothly</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {errors.map((error: any, idx: number) => {
        const errorType = error.metadata?.errorType || "ERROR";
        const severity =
          errorType === "CRITICAL" || errorType === "DATABASE_ERROR" || errorType === "API_ERROR"
            ? "CRITICAL"
            : errorType === "WARNING"
              ? "WARNING"
              : "ERROR";

        return (
          <div
            key={idx}
            style={{
              background: "var(--background)",
              borderRadius: "8px",
              padding: "16px",
              border: `1px solid ${getSeverityColor(severity)}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>{getSeverityIcon(severity)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase" }}>
                    {severity}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                    {new Date(error._creationTime).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                  {error.description}
                </div>
                {error.metadata && (
                  <div style={{
                    background: "#020617",
                    borderRadius: "4px",
                    padding: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    color: "var(--muted-foreground)",
                    overflow: "auto",
                  }}>
                    {JSON.stringify(sanitizeMetadata(error.metadata), null, 2)}
                  </div>
                )}
              </div>
            </div>
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
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}>
        <MetricCard
          label="Average Duration"
          value={`${Math.round(stats.avgDurationMs || 0)}ms`}
          icon="⚡"
        />
        <MetricCard
          label="Min Duration"
          value={`${Math.round(stats.minDurationMs || 0)}ms`}
          icon="⬇️"
        />
        <MetricCard
          label="Max Duration"
          value={`${Math.round(stats.maxDurationMs || 0)}ms`}
          icon="⬆️"
          highlight={(stats.maxDurationMs || 0) > 5000}
        />
        <MetricCard
          label="Sample Count"
          value={stats.count || 0}
          icon="📊"
        />
      </div>

      <div style={{
        background: "var(--background)",
        borderRadius: "8px",
        padding: "20px",
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600 }}>
          Recent Slow Operations
        </h3>
        {slowest.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {slowest.map((log: any, idx: number) => {
              const duration = log.metadata?.durationMs || 0;
              const operation = log.metadata?.operation || "Unknown operation";
              return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px",
                  background: "#020617",
                  borderRadius: "4px",
                }}
              >
                <span style={{ fontSize: "14px" }}>{operation}</span>
                <span style={{ fontSize: "14px", color: duration > 1000 ? "#ef4444" : "var(--muted-foreground)" }}>
                  {Math.round(duration)}ms
                </span>
              </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "20px" }}>
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
      <div style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
        <div style={{ fontSize: "18px", fontWeight: 500 }}>No Audit Logs</div>
        <div style={{ fontSize: "14px", marginTop: "8px" }}>Activity will appear here</div>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--background)",
      borderRadius: "8px",
      padding: "16px",
      maxHeight: "600px",
      overflow: "auto",
    }}>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-700">
            <TableHead className="text-xs text-slate-400">Time</TableHead>
            <TableHead className="text-xs text-slate-400">Actor</TableHead>
            <TableHead className="text-xs text-slate-400">Action</TableHead>
            <TableHead className="text-xs text-slate-400">Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log: any, idx: number) => (
            <TableRow key={idx} className="border-b border-slate-800 hover:bg-transparent">
              <TableCell className="py-2 text-xs text-slate-500">
                {new Date(log._creationTime).toLocaleTimeString()}
              </TableCell>
              <TableCell className="py-2 text-xs">
                {log.actorType}: {log.actorId || "System"}
              </TableCell>
              <TableCell className="py-2 text-xs font-medium">
                {log.action}
              </TableCell>
              <TableCell className="py-2 text-xs text-slate-400">
                {log.targetType}: {log.targetId}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MetricCard({ label, value, icon, highlight }: any) {
  return (
    <div style={{
      background: highlight ? "#7c2d12" : "var(--background)",
      borderRadius: "6px",
      padding: "16px",
      border: highlight ? "1px solid #ea580c" : "1px solid var(--card)",
    }}>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: 600, marginBottom: "4px" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "var(--muted-foreground)", display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
      </div>
    </div>
  );
}
