import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { QcDashboardView } from "../QcDashboardView";
import { QcRunDetailView } from "../QcRunDetailView";
import { QcEnvironmentsView } from "../QcEnvironmentsView";
import { QcFindingsView } from "../QcFindingsView";
import { QcMetricsView } from "../QcMetricsView";
import { QcRulesetsView } from "../QcRulesetsView";

interface QualitySectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  selectedQcRunId: Id<"qcRuns"> | null;
  setSelectedQcRunId: (id: Id<"qcRuns"> | null) => void;
  onNavigate: (view: MainView) => void;
  onOpenStartQcRun?: () => void;
}

export function QualitySection({
  currentView,
  projectId,
  selectedQcRunId,
  setSelectedQcRunId,
  onNavigate,
  onOpenStartQcRun,
}: QualitySectionProps) {
  if (currentView === "qc-dashboard") {
    return (
      <QcDashboardView
        projectId={projectId}
        onRunSelect={(runId) => {
          setSelectedQcRunId(runId);
          onNavigate("qc-runs");
        }}
        onOpenStartQcRun={onOpenStartQcRun}
      />
    );
  }
  if (currentView === "qc-runs") {
    if (selectedQcRunId) {
      return (
        <QcRunDetailView
          runId={selectedQcRunId}
          onBack={() => {
            setSelectedQcRunId(null);
            onNavigate("qc-dashboard");
          }}
        />
      );
    }
    // Runs tab without a selected run: show dashboard so user can pick a run
    return (
      <QcDashboardView
        projectId={projectId}
        onRunSelect={(runId) => {
          setSelectedQcRunId(runId);
        }}
        onOpenStartQcRun={onOpenStartQcRun}
      />
    );
  }
  if (currentView === "qc-environments") return <QcEnvironmentsView projectId={projectId} onNavigate={onNavigate} />;
  if (currentView === "qc-findings") return <QcFindingsView projectId={projectId} />;
  if (currentView === "qc-metrics") return <QcMetricsView projectId={projectId} />;
  if (currentView === "qc-rulesets") return <QcRulesetsView projectId={projectId} />;
  return null;
}
