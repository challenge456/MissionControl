import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface HealthDashboardProps {
  projectId: Id<"projects"> | null;
  onClose: () => void;
}

export function HealthDashboard({ onClose }: HealthDashboardProps) {
  // Convex queries are reactive, but this counter gives users a visual
  // "click-to-refresh" action. The setter is used by the button below.
  const [, setRefreshKey] = useState(0);
  const healthStatus = useQuery(api.health.status, {});
  const metrics = useQuery(api.health.metrics, {});

  if (!healthStatus || !metrics) {
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
          Loading health status...
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "#10b981";
      case "degraded": return "#f59e0b";
      case "unhealthy": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return "✅";
      case "degraded": return "⚠️";
      case "unhealthy": return "❌";
      default: return "❓";
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
          maxWidth: "1200px",
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
              🏥 System Health
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "var(--muted-foreground)", fontSize: "14px" }}>
              Last updated: {new Date().toLocaleTimeString()}
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

        {/* Overall Status */}
        <div style={{ padding: "24px" }}>
          <div style={{
            background: "var(--background)",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
            border: `2px solid ${getStatusColor(healthStatus.status)}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "32px" }}>
                {getStatusIcon(healthStatus.status)}
              </span>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 600, textTransform: "capitalize" }}>
                  {healthStatus.status}
                </div>
                <div style={{ fontSize: "14px", color: "var(--muted-foreground)" }}>
                  {healthStatus.message}
                </div>
              </div>
            </div>
          </div>

          {/* Component Status Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}>
            {Object.entries(healthStatus.checks).map(([component, check]: [string, any]) => (
              <div
                key={component}
                style={{
                  background: "var(--background)",
                  borderRadius: "8px",
                  padding: "16px",
                  border: `1px solid ${getStatusColor(check.status)}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>
                    {getStatusIcon(check.status)}
                  </span>
                  <div style={{ fontSize: "14px", fontWeight: 600, textTransform: "capitalize" }}>
                    {component}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
                  {check.message}
                </div>
                {check.responseTime && (
                  <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px" }}>
                    Response: {check.responseTime}ms
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div style={{
            background: "var(--background)",
            borderRadius: "8px",
            padding: "20px",
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600 }}>
              📊 System Metrics
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}>
              <MetricCard
                label="Total Projects"
                value={metrics.projects?.total || 0}
                icon="📁"
              />
              <MetricCard
                label="Active Agents"
                value={metrics.agents?.active || 0}
                icon="🤖"
                subtitle={`${metrics.agents?.total || 0} total`}
              />
              <MetricCard
                label="Tasks"
                value={metrics.tasks?.total || 0}
                icon="📋"
                subtitle={`${metrics.tasks?.byStatus?.inProgress || 0} in progress`}
              />
              <MetricCard
                label="Pending Approvals"
                value={metrics.approvals?.pending || 0}
                icon="✋"
                highlight={metrics.approvals?.pending > 0}
              />
              <MetricCard
                label="Open Alerts"
                value={metrics.alerts?.open || 0}
                icon="🚨"
                highlight={metrics.alerts?.open > 0}
              />
              <MetricCard
                label="Uptime"
                value={healthStatus.uptime || "N/A"}
                icon="⏱️"
              />
            </div>
          </div>

          {/* Refresh Button */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  highlight?: boolean;
}

function MetricCard({ label, value, icon, subtitle, highlight }: MetricCardProps) {
  return (
    <div style={{
      background: highlight ? "#7c2d12" : "var(--background)",
      borderRadius: "6px",
      padding: "12px",
      border: highlight ? "1px solid #ea580c" : "1px solid var(--card)",
    }}>
      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "24px", fontWeight: 600, marginBottom: "2px" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{label}</div>
      {subtitle && (
        <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "2px" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
