import { GitBranch } from "lucide-react";
import type { MainView } from "../../TopNav";
import { HarnessPage } from "../components/HarnessUi";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { LoopEngineeringWorkspace } from "../components/LoopEngineeringWorkspace";

export function HarnessLoopsView({
  projectId,
  onNavigate,
}: {
  projectId: Id<"projects"> | null;
  onNavigate: (view: MainView) => void;
}): JSX.Element {
  return (
    <HarnessPage
      title="Graph Engineering"
      description="Dispatch bounded multi-agent graphs for independent research, verification, synthesis, and explicit approval."
      icon={<GitBranch className="h-5 w-5 text-registry-accent" />}
    >
      <div className="mx-auto max-w-[1400px] px-1">
        <LoopEngineeringWorkspace projectId={projectId} onNavigate={onNavigate} />
      </div>
    </HarnessPage>
  );
}
