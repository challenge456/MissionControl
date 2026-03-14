import type { Id } from "../../../convex/_generated/dataModel";
import type { MainView } from "./TopNav";
import { PageHeader } from "./components/PageHeader";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { GitBranch, FileText, Users, ListTodo } from "lucide-react";

interface PipelineViewProps {
  projectId: Id<"projects"> | null;
  onNavigate: (view: MainView) => void;
}

const PIPELINES: { id: MainView; label: string; description: string; icon: React.ReactNode }[] = [
  { id: "content-pipeline", label: "Content Pipeline", description: "Content drops, stages, and publishing", icon: <FileText className="h-5 w-5" /> },
  { id: "code", label: "Code Pipeline", description: "Build, test, and deployment pipeline", icon: <GitBranch className="h-5 w-5" /> },
  { id: "crm", label: "CRM Pipeline", description: "Leads and deal stages", icon: <Users className="h-5 w-5" /> },
  { id: "command", label: "Task Pipeline", description: "Command panel and task flow", icon: <ListTodo className="h-5 w-5" /> },
];

export function PipelineView({ projectId: _projectId, onNavigate }: PipelineViewProps) {
  return (
    <main className="flex-1 overflow-auto bg-background">
      <PageHeader
        title="Pipeline"
        description="Jump to any pipeline. Content, code, CRM, and task pipelines in one place."
        icon={<GitBranch className="h-4 w-4" />}
      />
      <div className="p-6 space-y-6">
        {onNavigate && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Platform:</span>
            <button type="button" className="underline hover:text-foreground" onClick={() => onNavigate("system")}>
              System
            </button>
            <span>·</span>
            <button type="button" className="underline hover:text-foreground" onClick={() => onNavigate("radar")}>
              Radar
            </button>
            <span>·</span>
            <button type="button" className="underline hover:text-foreground" onClick={() => onNavigate("factory")}>
              Factory
            </button>
            <span>·</span>
            <button type="button" className="underline hover:text-foreground" onClick={() => onNavigate("feedback")}>
              Feedback
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINES.map((p) => (
            <Card
              key={p.id}
              className="p-5 cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => onNavigate(p.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {p.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{p.label}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>
                  <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs">
                    Open
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

