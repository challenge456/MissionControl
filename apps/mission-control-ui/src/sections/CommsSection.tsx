import type { ReactNode } from "react";
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

function HiringErrorBoundary({ children }: { children: ReactNode }) {
  return <>{children}</>;
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
