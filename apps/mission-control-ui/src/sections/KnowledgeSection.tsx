import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { DocsView } from "../DocsView";
import { MemoryView } from "../MemoryView";
import { SearchBar } from "../SearchBar";
import { PageHeader } from "../components/PageHeader";

interface KnowledgeSectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  onTaskSelect: (taskId: string) => void;
}

export function KnowledgeSection({ currentView, projectId, onTaskSelect }: KnowledgeSectionProps) {
  if (currentView === "docs") return <DocsView />;
  if (currentView === "memory") return <MemoryView projectId={projectId} />;
  if (currentView === "search") {
    return (
      <main className="flex-1 overflow-auto">
        <PageHeader
          title="Search"
          description="Find tasks, agents, and context across Mission Control. Results open in the Mission Queue."
        />
        <div className="px-6 py-4">
          <SearchBar
            projectId={projectId ?? undefined}
            onResultClick={(taskId) => onTaskSelect(taskId as string)}
          />
        </div>
      </main>
    );
  }
  return null;
}
