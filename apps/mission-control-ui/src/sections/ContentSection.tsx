import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { CapturesView } from "../CapturesView";
import { ProjectsView } from "../ProjectsView";
import { ContentPipelineView } from "../ContentPipelineView";

interface ContentSectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  onProjectSelect: (projectId: Id<"projects">) => void;
  tenantId: Id<"tenants"> | null;
  companyContextEnabled: boolean;
}

export function ContentSection({ currentView, projectId, onProjectSelect, tenantId, companyContextEnabled }: ContentSectionProps) {
  if (currentView === "content-pipeline") return <ContentPipelineView projectId={projectId} />;
  if (currentView === "captures") return <CapturesView projectId={projectId} />;
  if (currentView === "projects") {
    return (
      <ProjectsView
        projectId={projectId}
        onProjectSelect={onProjectSelect}
        tenantId={tenantId}
        companyContextEnabled={companyContextEnabled}
      />
    );
  }
  return null;
}
