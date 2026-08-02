import { GitBranch } from "lucide-react";
import type { MainView } from "../../TopNav";
import { HarnessPage } from "../components/HarnessUi";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { LoopEngineeringWorkspace } from "../components/LoopEngineeringWorkspace";
import { HarnessLoopsDiagram } from "../components/HarnessLoopsDiagram";
import { HarnessMergeGatesPanel } from "../components/HarnessMergeGatesPanel";
import { MetaLoopInboxPanel } from "./HarnessMetaLoopView";

export function HarnessLoopsView({
  projectId,
  onNavigate,
}: {
  projectId: Id<"projects"> | null;
  onNavigate: (view: MainView) => void;
}): JSX.Element {
  return (
    <HarnessPage
      title="Loop Engineering"
      description="Control the inner implementation loop, outer PR/CI gate, and evidence-driven meta improvement loop from one governed surface."
      icon={<GitBranch className="h-5 w-5 text-registry-accent" />}
    >
      <div className="mx-auto max-w-[1400px] space-y-8 px-1">
        <HarnessLoopsDiagram />
        <section aria-labelledby="inner-loop-title">
          <h2 id="inner-loop-title" className="mb-3 text-[18px] font-semibold text-ink">Inner Attempts and Graph execution</h2>
        <LoopEngineeringWorkspace projectId={projectId} onNavigate={onNavigate} />
        </section>
        <section className="rounded-xl border border-line bg-surface-1 p-5" aria-labelledby="outer-loop-title">
          <h2 id="outer-loop-title" className="mb-4 text-[18px] font-semibold text-ink">Outer PR / CI gate</h2>
          <HarnessMergeGatesPanel projectId={projectId} />
        </section>
        <MetaLoopInboxPanel projectId={projectId} onNavigate={onNavigate} />
      </div>
    </HarnessPage>
  );
}
