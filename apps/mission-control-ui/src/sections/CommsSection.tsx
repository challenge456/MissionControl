import { Component, type ErrorInfo, type ReactNode } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import type { MainView } from "../TopNav";
import { TelegraphInbox } from "../TelegraphInbox";
import { MeetingsView } from "../MeetingsView";
import { VoicePanel } from "../VoicePanel";
import { PeopleView } from "../PeopleView";
import { OrgView } from "../OrgView";
import { TeamView } from "../TeamView";
import { OfficeView } from "../OfficeView";
import { LiveOfficeView } from "../LiveOfficeView";
import { CrmView } from "../CrmView";
import { HiringView } from "../HiringView";

interface CommsSectionProps {
  currentView: MainView;
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
}

/** Catches Convex "Could not find public function" for agentHiring and shows a setup message. */
class HiringErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HiringView error:", error, errorInfo);
  }

  render() {
    const e = this.state.error;
    if (e?.message?.includes("Could not find public function") || e?.message?.includes("agentHiring")) {
      return (
        <main className="flex-1 overflow-auto p-6 bg-background">
          <div className="max-w-lg rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
            <h2 className="text-lg font-semibold mb-2">Agent Hiring backend not deployed</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The Convex functions for Agent Hiring are not available. Deploy them so the Hiring view works.
            </p>
            <p className="text-sm font-mono bg-background/50 rounded px-2 py-1.5">
              npx convex dev
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Or run <code className="font-mono">npx convex deploy</code> for production. Then refresh this page.
            </p>
          </div>
        </main>
      );
    }
    if (e) throw e;
    return this.props.children;
  }
}

export function CommsSection({ currentView, projectId, onNavigate }: CommsSectionProps) {
  if (currentView === "telegraph") return <TelegraphInbox projectId={projectId} />;
  if (currentView === "meetings") return <MeetingsView projectId={projectId} />;
  if (currentView === "voice") return <VoicePanel projectId={projectId} />;
  if (currentView === "people") return <PeopleView projectId={projectId} />;
  if (currentView === "team") return <TeamView projectId={projectId} onNavigate={onNavigate} />;
  if (currentView === "org") return <OrgView projectId={projectId} />;
  if (currentView === "office") return <OfficeView projectId={projectId} />;
  if (currentView === "live-office") return <LiveOfficeView projectId={projectId} />;
  if (currentView === "crm") return <CrmView projectId={projectId} />;
  if (currentView === "hiring") {
    return (
      <HiringErrorBoundary>
        <HiringView projectId={projectId} />
      </HiringErrorBoundary>
    );
  }
  return null;
}
