import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { DocsView } from "../DocsView";
import { DesignSystemView } from "../DesignSystemView";
import { MemoryView } from "../MemoryView";
import { SearchBar } from "../SearchBar";
import { SkillsView } from "../SkillsView";
import { PageHeader } from "../components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen } from "lucide-react";

interface KnowledgeSectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  onTaskSelect: (taskId: string) => void;
}

export function KnowledgeSection({ currentView, projectId, onTaskSelect }: KnowledgeSectionProps) {
  if (currentView === "docs") return <DocsView />;
  if (currentView === "design-system") return <DesignSystemView />;
  if (currentView === "skills") return <SkillsView />;
  if (currentView === "memory") return <MemoryView projectId={projectId} />;
  if (currentView === "search") {
    return (
      <main className="mc-page">
        <PageHeader
          title="Search"
          description="Find tasks, agents, and context across Mission Control. Results open in the Mission Queue."
          icon={<Search className="h-4.5 w-4.5" strokeWidth={1.7} />}
          status={
            <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
              Cross-surface lookup
            </Badge>
          }
        />
        <div className="mc-page-body mc-page-stack">
          <Card className="p-5">
            <div className="mc-kicker">Operator search</div>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="text-sm font-semibold text-foreground">Search tasks, agents, and project context from one place.</div>
                <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Use this when you know the signal you need but not the view that owns it. Matching tasks still open directly in Operations.
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-2 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-cyan-100" />
                Results stay within Mission Control
              </div>
            </div>
            <div className="mt-4">
              <SearchBar
                projectId={projectId ?? undefined}
                onResultClick={(taskId) => onTaskSelect(taskId as string)}
              />
            </div>
          </Card>
        </div>
      </main>
    );
  }
  return null;
}
