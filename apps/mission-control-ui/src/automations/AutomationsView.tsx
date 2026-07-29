import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bot, RefreshCw } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { AutomationCandidates } from "./AutomationCandidates";
import { AutomationDefinitions } from "./AutomationDefinitions";
import { AutomationOverview } from "./AutomationOverview";
import { AutomationReceipts } from "./AutomationReceipts";
import { AutomationRuns } from "./AutomationRuns";
import { AutomationSchedule } from "./AutomationSchedule";
import { AUTOMATION_TABS, normalizeAutomationTab, type AutomationTab } from "./automationModel";

const TAB_LABELS: Record<AutomationTab, string> = {
  overview: "Overview",
  definitions: "Definitions",
  runs: "Runs",
  schedule: "Schedule",
  candidates: "Candidates",
  receipts: "Receipts",
};

export function AutomationsView({
  projectId,
  forceRuns = false,
}: {
  projectId: Id<"projects"> | null;
  forceRuns?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = forceRuns ? "runs" : normalizeAutomationTab(searchParams.get("tab"));
  const data = useQuery(api.automations.getControlPlane, projectId ? { projectId } : "skip");
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const selectedDefinitionId = pathSegments[1] === "automations" && pathSegments[2] ? pathSegments[2] : null;
  const selectedDefinition = data?.definitions.find((definition: any) => definition._id === selectedDefinitionId);
  const selectedDecisions = (data?.decisions ?? []).filter((decision: any) => decision.automationDefinitionId === selectedDefinitionId);

  useEffect(() => {
    if (!forceRuns || searchParams.get("tab") === "runs") return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", "runs");
    setSearchParams(next, { replace: true });
  }, [forceRuns, searchParams, setSearchParams]);

  function setTab(nextTab: AutomationTab) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next);
  }

  function selectDefinition(definitionId: string) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "definitions");
    navigate({ pathname: `/v2/automations/${definitionId}`, search: `?${next.toString()}` });
  }

  if (!projectId) {
    return <StateCard title="Workspace required" body="Select a workspace before opening Automations." tone="error" />;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-app">
      <PageHeader
        eyebrow="Operations"
        title="Automations"
        description="Governed repetition of versioned Workflows. Skills reason, Tools act, Workflows orchestrate, Automations repeat, Receipts prove, Policies control."
        icon={<Bot className="h-5 w-5" />}
      />
      <div className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 sm:px-6">
        <div role="tablist" aria-label="Automation control plane" className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--panel-line)] bg-card/40 p-1">
          {AUTOMATION_TABS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={tab === item}
              aria-controls={`automation-panel-${item}`}
              onClick={() => setTab(item)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === item ? "bg-registry-accent-soft text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {TAB_LABELS[item]}
            </button>
          ))}
        </div>

        {selectedDefinitionId ? (
          selectedDefinition ? (
            <Card className="border-registry-accent/25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-registry-accent">Selected Automation</div>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">{selectedDefinition.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedDefinition.workflowId}@{selectedDefinition.workflowVersion} · {selectedDefinition.scope}</p>
                </div>
                <button type="button" onClick={() => navigate({ pathname: "/v2/automations", search: location.search })} className="text-sm text-muted-foreground hover:text-foreground">Close details</button>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Status" value={selectedDefinition.status} />
                <Detail label="Autonomy" value={selectedDefinition.autonomyLevel} />
                <Detail label="Approval" value={selectedDefinition.requiredApprovalTypes.join(", ")} />
                <Detail label="Verification" value={selectedDefinition.verificationContract?.receiptRequired ? "Receipt required" : "Not configured"} />
              </dl>
              {selectedDecisions[0] ? (
                <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3 text-sm">
                  <div className="font-medium text-foreground">Latest governed decision</div>
                  <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <span>{selectedDecisions[0].decisionType} by {selectedDecisions[0].actorId}</span>
                    <span>{selectedDecisions[0].policyVersion}</span>
                    <span>Definition v{selectedDecisions[0].definitionVersion}</span>
                    <span>{new Date(selectedDecisions[0].decidedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{selectedDecisions[0].reason}</p>
                </div>
              ) : null}
            </Card>
          ) : data ? <StateCard title="Automation scope error" body="This Automation does not exist in the selected workspace." tone="error" /> : null
        ) : null}

        {!data ? (
          <StateCard title="Loading Automations" body="Reading workspace definitions, candidates, review gates, and receipts." />
        ) : (
          <div id={`automation-panel-${tab}`} role="tabpanel" aria-label={TAB_LABELS[tab]} tabIndex={0}>
            {tab === "overview" ? <AutomationOverview data={data} onTabChange={setTab} /> : null}
            {tab === "definitions" ? <AutomationDefinitions projectId={projectId} definitions={data.definitions} onSelect={selectDefinition} /> : null}
            {tab === "runs" ? <AutomationRuns runs={data.runs} /> : null}
            {tab === "schedule" ? <AutomationSchedule projectId={projectId} definitions={data.definitions} /> : null}
            {tab === "candidates" ? <AutomationCandidates projectId={projectId} candidates={data.candidates} /> : null}
            {tab === "receipts" ? <AutomationReceipts receipts={data.receipts} /> : null}
          </div>
        )}
      </div>
    </section>
  );
}

function StateCard({ title, body, tone = "default" }: { title: string; body: string; tone?: "default" | "error" }) {
  return <div className="flex flex-1 items-center justify-center bg-app p-6">
    <Card className={`max-w-lg p-6 text-center ${tone === "error" ? "border-red-500/30" : ""}`}>
      <RefreshCw className="mx-auto h-5 w-5 text-muted-foreground" />
      <h1 className="mt-3 text-lg font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </Card>
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-foreground">{value}</dd></div>;
}
