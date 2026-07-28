import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { CapturesView } from "../CapturesView";
import { ProjectsView } from "../ProjectsView";
import { ContentPipelineView } from "../ContentPipelineView";

interface ContentSectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  onProjectSelect: (projectId: Id<"projects">) => void;
}

export function ContentSection({ currentView, projectId, onProjectSelect }: ContentSectionProps) {
  if (currentView === "content-pipeline") return <ContentPipelineView projectId={projectId} />;
  if (currentView === "captures") return <CapturesView projectId={projectId} />;
  if (currentView === "projects") {
    return <ProjectsView projectId={projectId} onProjectSelect={onProjectSelect} />;
  }
  return null;
}
