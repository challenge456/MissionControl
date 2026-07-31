import { CommandCenterView } from "./views/CommandCenterView";
import { MissionPortfolioView } from "./views/MissionPortfolioView";
import { MissionDetailView } from "./views/MissionDetailView";
import { ExecutionInspectorView } from "./views/ExecutionInspectorView";
import { EffectivenessView } from "./views/EffectivenessView";
import { FactoryHealthView } from "./views/FactoryHealthView";
import { FactoryOpsView } from "./views/FactoryOpsView";
import { ReadinessView } from "./views/ReadinessView";
import { FrictionView } from "./views/FrictionView";
import { AgentCatalogView } from "./views/AgentCatalogView";
import { DossierView } from "./views/DossierView";
import { RecommendationsView } from "./views/RecommendationsView";
import { OperatorEvalsView } from "./views/OperatorEvalsView";
import { DemoTourBar } from "./components";
import { useFlag } from "../hooks/useFlag";
import type { Id } from "../../../../convex/_generated/dataModel";

export const EOS_VIEWS = [
  "command-center", "missions", "mission-detail", "trace-inspector",
  "effectiveness", "operator-evals", "factory-health", "readiness", "friction",
  "agent-catalog", "dossier", "recommendations",
] as const;

export type EosView = (typeof EOS_VIEWS)[number];

export function isEosView(view: string): view is EosView {
  return (EOS_VIEWS as readonly string[]).includes(view);
}

export function EosViewRenderer({
  view,
  projectId,
  onNavigate,
}: {
  view: EosView;
  projectId: Id<"projects">;
  onNavigate: (v: string) => void;
}): JSX.Element {
  const showDemoTour = useFlag("ui.navigation.demo-routes");
  return (
    <>
      <EosViewBody view={view} projectId={projectId} onNavigate={onNavigate} />
      {showDemoTour ? <DemoTourBar currentView={view} onNavigate={onNavigate} /> : null}
    </>
  );
}

function EosViewBody({
  view,
  projectId,
  onNavigate,
}: {
  view: EosView;
  projectId: Id<"projects">;
  onNavigate: (v: string) => void;
}): JSX.Element {
  switch (view) {
    case "command-center": return <CommandCenterView projectId={projectId} onNavigate={onNavigate} />;
    case "missions": return <MissionPortfolioView projectId={projectId} />;
    case "mission-detail": return <MissionDetailView projectId={projectId} onNavigate={onNavigate} />;
    case "trace-inspector": return <ExecutionInspectorView projectId={projectId} onNavigate={onNavigate} />;
    case "effectiveness": return <EffectivenessView onNavigate={onNavigate} />;
    case "operator-evals": return <OperatorEvalsView projectId={projectId} />;
    case "factory-health":
      return (
        <>
          <FactoryOpsView projectId={projectId} onNavigate={onNavigate} />
          <FactoryHealthView onNavigate={onNavigate} />
        </>
      );
    case "readiness": return <ReadinessView onNavigate={onNavigate} />;
    case "friction": return <FrictionView onNavigate={onNavigate} />;
    case "agent-catalog": return <AgentCatalogView onNavigate={onNavigate} />;
    case "dossier": return <DossierView onNavigate={onNavigate} />;
    case "recommendations": return <RecommendationsView onNavigate={onNavigate} />;
  }
}
