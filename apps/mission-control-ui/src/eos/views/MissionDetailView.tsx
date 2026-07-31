import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { DetailLayout, MetadataPanel, type DetailTab } from "../../components/factory/DetailLayout";
import { MetricBlock, MetricRow } from "../../components/factory/MetricBlock";
import { StatusBadge, type StatusBadgeProps } from "../../components/factory/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "../../components/ui/empty-state";
import { Target } from "lucide-react";
import { ProvenanceBadge } from "../components";

export interface MissionDetailViewProps { onNavigate: (view: string) => void; }

const TABS: DetailTab[] = [
  { id: "overview", label: "Overview" }, { id: "work-orders", label: "Work Orders" },
  { id: "evidence", label: "Validation" }, { id: "activity", label: "Activity" },
];

function tone(state: string): StatusBadgeProps["tone"] {
  if (state === "DONE") return "success";
  if (["BLOCKED", "AWAITING_PLAN_APPROVAL", "AWAITING_VALIDATION", "AWAITING_ACCEPTANCE"].includes(state)) return "warning";
  if (["IN_PROGRESS", "PLANNING", "READY"].includes(state)) return "info";
  return "neutral";
}

function AssertionList({ assertions }: { assertions: any[] }) {
  if (assertions.length === 0) return <div className="rounded-xl border border-line bg-surface-1 px-4 py-10 text-center text-[13px] text-ink-muted">No validation contract has been approved yet.</div>;
  return <div className="overflow-hidden rounded-xl border border-line bg-surface-1"><ul className="divide-y divide-line">{assertions.map((assertion) => <li key={assertion._id} className="flex items-start justify-between gap-4 px-4 py-3"><div><div className="text-[13px] font-medium text-ink">{assertion.title}</div><div className="mt-0.5 text-[12px] text-ink-muted">{assertion.verificationMethod} · {assertion.requiredEvidence}</div></div><StatusBadge tone={tone(assertion.status)}>{assertion.status}</StatusBadge></li>)}</ul></div>;
}

function WorkOrderList({ workOrders, onNavigate }: { workOrders: any[]; onNavigate: (view: string) => void }) {
  if (workOrders.length === 0) return <div className="rounded-xl border border-line bg-surface-1 px-4 py-10 text-center text-[13px] text-ink-muted">Approved plan work orders will appear here. No execution has been released.</div>;
  return <div className="overflow-hidden rounded-xl border border-line bg-surface-1"><ul className="divide-y divide-line">{workOrders.sort((a, b) => (a.missionSequence ?? 0) - (b.missionSequence ?? 0)).map((workOrder) => <li key={workOrder._id}><button type="button" onClick={() => onNavigate("control-work-orders")} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-surface-2"><div><div className="text-[13px] font-medium text-ink">{workOrder.title}</div><div className="mt-0.5 text-[12px] text-ink-muted">{workOrder.missionRole ?? "WORKER"} · {workOrder.isMutating ? "repository change" : "read-only"}</div></div><StatusBadge tone={tone(workOrder.state)}>{workOrder.state}</StatusBadge></button></li>)}</ul></div>;
}

function PlanEditor({ missionId, onComplete }: { missionId: Id<"missions">; onComplete: () => void }) {
  const submitPlan = useMutation(api.missions.submitPlan);
  const [summary, setSummary] = useState("Deliver the outcome through one implementation stage and an independent validation stage.");
  const [workerTitle, setWorkerTitle] = useState("Implement the mission outcome");
  const [workerOutcome, setWorkerOutcome] = useState("The requested change is implemented and ready for independent validation.");
  const [workerWorkflowId, setWorkerWorkflowId] = useState("feature-dev");
  const [validatorTitle, setValidatorTitle] = useState("Validate the mission outcome");
  const [validatorOutcome, setValidatorOutcome] = useState("Independent validation confirms the required outcome and evidence.");
  const [validatorWorkflowId, setValidatorWorkflowId] = useState("feature-dev");
  const [assertionTitle, setAssertionTitle] = useState("Mission outcome is independently verified");
  const [passCondition, setPassCondition] = useState("The independent validator records a passing result with the required evidence.");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (![summary, workerTitle, workerOutcome, workerWorkflowId, validatorTitle, validatorOutcome, validatorWorkflowId, assertionTitle, passCondition].every((value) => value.trim())) {
      setError("Complete every field before submitting the plan.");
      return;
    }
    setSubmitting(true); setError(null);
    try {
      await submitPlan({
        missionId, idempotencyKey: `ui-plan:${crypto.randomUUID()}`, createdBy: "operator", summary,
        workOrderBlueprints: [
          { id: "milestone-1-worker", title: workerTitle, desiredOutcome: workerOutcome, workflowId: workerWorkflowId, sequence: 1, role: "WORKER", isMutating: true, dependsOnBlueprintIds: [], assertionIds: ["outcome-verified"] },
          { id: "milestone-2-validator", title: validatorTitle, desiredOutcome: validatorOutcome, workflowId: validatorWorkflowId, sequence: 2, role: "VALIDATOR", isMutating: false, dependsOnBlueprintIds: ["milestone-1-worker"], assertionIds: ["outcome-verified"] },
        ],
        assertions: [{ assertionId: "outcome-verified", title: assertionTitle, outcome: validatorOutcome, verificationMethod: "TEST", passCondition, requiredEvidence: "Validator run, command or test output, and concise result summary.", requiresIndependentValidation: true, waiverAllowed: false }],
      });
      onComplete();
    } catch (submitError: any) { setError(submitError.message ?? "Could not submit Mission plan."); } finally { setSubmitting(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open) onComplete(); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Author Mission plan</DialogTitle><DialogDescription>This V1 plan creates two explicit serial milestones: implementation, then independent validation. More stages can be added through a subsequent plan revision.</DialogDescription></DialogHeader><div className="max-h-[60vh] space-y-4 overflow-y-auto px-0.5 py-1"><div className="space-y-1.5"><Label htmlFor="plan-summary">Plan summary</Label><Textarea id="plan-summary" value={summary} onChange={(event) => setSummary(event.target.value)} /></div><div className="rounded-lg border border-line p-3"><div className="mb-3 text-sm font-medium text-ink">Milestone 1 · Worker</div><div className="space-y-3"><div className="space-y-1.5"><Label htmlFor="worker-title">Work Order title</Label><Input id="worker-title" value={workerTitle} onChange={(event) => setWorkerTitle(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="worker-workflow">Workflow ID</Label><Input id="worker-workflow" value={workerWorkflowId} onChange={(event) => setWorkerWorkflowId(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="worker-outcome">Desired outcome</Label><Textarea id="worker-outcome" value={workerOutcome} onChange={(event) => setWorkerOutcome(event.target.value)} /></div></div></div><div className="rounded-lg border border-line p-3"><div className="mb-3 text-sm font-medium text-ink">Milestone 2 · Independent validator</div><div className="space-y-3"><div className="space-y-1.5"><Label htmlFor="validator-title">Validation Work Order title</Label><Input id="validator-title" value={validatorTitle} onChange={(event) => setValidatorTitle(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="validator-workflow">Workflow ID</Label><Input id="validator-workflow" value={validatorWorkflowId} onChange={(event) => setValidatorWorkflowId(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="validator-outcome">Expected validation outcome</Label><Textarea id="validator-outcome" value={validatorOutcome} onChange={(event) => setValidatorOutcome(event.target.value)} /></div></div></div><div className="rounded-lg border border-line p-3"><div className="mb-3 text-sm font-medium text-ink">Validation contract</div><div className="space-y-3"><div className="space-y-1.5"><Label htmlFor="assertion-title">Assertion</Label><Input id="assertion-title" value={assertionTitle} onChange={(event) => setAssertionTitle(event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="pass-condition">Pass condition</Label><Textarea id="pass-condition" value={passCondition} onChange={(event) => setPassCondition(event.target.value)} /></div></div></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}</div><DialogFooter><Button variant="outline" onClick={onComplete} disabled={submitting}>Cancel</Button><Button onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit for approval"}</Button></DialogFooter></DialogContent></Dialog>;
}

export function MissionDetailView({ onNavigate }: MissionDetailViewProps): JSX.Element {
  const [tab, setTab] = useState("overview");
  const [searchParams] = useSearchParams();
  const missionId = searchParams.get("mission") as Id<"missions"> | null;
  const detail = useQuery(api.missions.get, missionId ? { missionId } : "skip");
  const startMission = useMutation(api.missions.start);
  const acceptMission = useMutation(api.missions.accept);
  const approvePlan = useMutation(api.missions.approvePlan);
  const createWorkOrder = useMutation(api.workOrders.create);
  const requestCorrectiveWork = useMutation(api.missions.requestCorrectiveWork);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  if (!missionId) return <div className="flex flex-1 items-center justify-center bg-app"><EmptyState icon={Target} title="Select a Mission" description="Choose a Mission from the portfolio to inspect its plan, handoffs, and validation evidence." action={<Button onClick={() => onNavigate("missions")}>Open Missions</Button>} /></div>;
  if (detail === undefined) return <div className="flex flex-1 items-center justify-center bg-app text-sm text-ink-muted">Loading Mission…</div>;
  if (detail === null) return <div className="flex flex-1 items-center justify-center bg-app"><EmptyState icon={Target} title="Mission not found" description="This Mission may have been removed or you no longer have access." action={<Button onClick={() => onNavigate("missions")}>Back to Missions</Button>} /></div>;
  const { mission, plans, assertions, workOrders, handoffs, events, acceptance } = detail;
  const proposedPlan = plans.find((plan: any) => plan.status === "PROPOSED");
  const approvedPlan = plans.find((plan: any) => plan.status === "APPROVED");
  const canStart = mission.state === "READY";
  const canAccept = mission.state === "AWAITING_ACCEPTANCE" && acceptance.eligible;
  const act = async (action: "start" | "accept" | "approve" | "correct") => { setActing(true); setActionError(null); try { if (action === "start") await startMission({ missionId: mission._id, actorId: "operator", idempotencyKey: `ui-start:${crypto.randomUUID()}` }); else if (action === "accept") await acceptMission({ missionId: mission._id, acceptedBy: "operator", idempotencyKey: `ui-accept:${crypto.randomUUID()}` }); else if (action === "correct") await requestCorrectiveWork({ missionId: mission._id, requestedBy: "operator", reason: "Operator requested correction after failed independent validation.", idempotencyKey: `ui-correct:${crypto.randomUUID()}` }); else if (proposedPlan) await approvePlan({ missionId: mission._id, planId: proposedPlan._id, approvedBy: "operator", idempotencyKey: `ui-approve:${crypto.randomUUID()}` }); } catch (error: any) { setActionError(error.message ?? "Mission action failed."); } finally { setActing(false); } };
  const releaseBlueprint = async (blueprint: any, corrective = false) => { if (!approvedPlan) return; setActing(true); setActionError(null); try { await createWorkOrder({ projectId: mission.projectId, missionId: mission._id, missionPlanId: approvedPlan._id, missionBlueprintId: blueprint.id, missionRole: blueprint.role, isMutating: blueprint.isMutating, idempotencyKey: corrective ? `ui-mission-corrective:${approvedPlan._id}:${blueprint.id}:${crypto.randomUUID()}` : `ui-mission-release:${approvedPlan._id}:${blueprint.id}`, title: blueprint.title, desiredOutcome: blueprint.desiredOutcome, workflowId: blueprint.workflowId, context: mission.context, requestedBy: "operator", metadata: corrective ? { correctiveIteration: mission.correctiveIterations, correctiveReason: mission.requiredHumanAction } : undefined, acceptanceCriteria: blueprint.assertionIds.map((id: string) => { const assertion = assertions.find((item: any) => item.assertionId === id); return { id, title: assertion?.title ?? id, description: assertion?.outcome, verificationMethod: assertion?.verificationMethod === "COMMAND" || assertion?.verificationMethod === "TEST" || assertion?.verificationMethod === "MANUAL" ? assertion.verificationMethod : "CHECKLIST", status: "PENDING" }; }) }); } catch (error: any) { setActionError(error.message ?? "Could not release Work Order."); } finally { setActing(false); } };
  const aside = <MetadataPanel entries={[
    { label: "Owner", value: mission.owner ?? "Unassigned" }, { label: "State", value: <StatusBadge tone={tone(mission.state)}>{mission.state.replace(/_/g, " ")}</StatusBadge> },
    { label: "Execution", value: "Serial mutations" }, { label: "Stop condition", value: mission.stopCondition },
    { label: "Data", value: <ProvenanceBadge provenance="convex" /> },
  ]} />;
  return <div className="relative flex-1 overflow-auto bg-app"><DetailLayout
    breadcrumbs={[{ label: "Strategy" }, { label: "Missions", onClick: () => onNavigate("missions") }, { label: mission.title, current: true }]}
    title={mission.title} description={mission.objective}
    actions={<div className="flex items-center gap-2">{mission.state === "DRAFT" ? <Button onClick={() => setShowPlanEditor(true)}>Author plan</Button> : null}{proposedPlan ? <Button onClick={() => act("approve")} disabled={acting}>{acting ? "Approving…" : "Approve plan"}</Button> : null}{mission.state === "BLOCKED" && assertions.some((assertion: any) => ["FAIL", "STALE", "UNKNOWN"].includes(assertion.status)) ? <Button variant="outline" onClick={() => act("correct")} disabled={acting}>{acting ? "Requesting…" : "Request corrective work"}</Button> : null}{canStart ? <Button onClick={() => act("start")} disabled={acting}>{acting ? "Starting…" : "Start Mission"}</Button> : null}{canAccept ? <Button onClick={() => act("accept")} disabled={acting}>{acting ? "Accepting…" : "Accept Mission"}</Button> : null}</div>}
    metrics={<MetricRow className="xl:grid-cols-4"><MetricBlock label="State" value={mission.state.replace(/_/g, " ")} /><MetricBlock label="Work orders" value={workOrders.length} /><MetricBlock label="Assertions" value={`${assertions.filter((a) => a.status === "PASS" || a.status === "WAIVED").length}/${assertions.length}`} /><MetricBlock label="Corrective iterations" value={`${mission.correctiveIterations}/${mission.maxCorrectiveIterations}`} /></MetricRow>}
    tabs={TABS} activeTabId={tab} onTabChange={setTab} aside={aside}>
      <div className="flex flex-col gap-6"><div className="rounded-xl border border-line bg-surface-1 px-4 py-3 text-[12.5px] text-ink-secondary">Live Convex Mission record. Validation status is derived from durable assertions and independent validator evidence.</div>{actionError ? <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{actionError}</div> : null}
        {tab === "overview" ? <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-line bg-surface-1 p-4"><div className="text-[13px] font-semibold text-ink">Current decision gate</div><p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{mission.requiredHumanAction ?? "No operator action is currently required."}</p></section><section className="rounded-xl border border-line bg-surface-1 p-4"><div className="text-[13px] font-semibold text-ink">Validation coverage</div><p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{acceptance.eligible ? "All contract assertions have independent evidence. Operator acceptance is the final gate." : acceptance.blockingReasons.join(" · ") || "Validation contract is not yet defined."}</p></section></div> : null}
        {tab === "work-orders" ? <div className="space-y-4">{approvedPlan ? <section className="rounded-xl border border-line bg-surface-1 p-4"><div className="text-[13px] font-semibold text-ink">Approved plan release</div><p className="mt-1 text-[12px] text-ink-muted">Release the explicit Work Orders below. Dispatch remains governed by the plan and predecessor handoffs.</p><div className="mt-3 space-y-2">{approvedPlan.workOrderBlueprints.map((blueprint: any) => { const released = workOrders.some((workOrder: any) => workOrder.metadata?.missionBlueprintId === blueprint.id); const canReleaseCorrective = mission.state === "READY" && mission.correctiveIterations > 0 && blueprint.role === "WORKER"; return <div key={blueprint.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"><div><div className="text-[13px] font-medium text-ink">{blueprint.sequence}. {blueprint.title}</div><div className="text-[12px] text-ink-muted">{blueprint.role} · {blueprint.isMutating ? "repository change" : "read-only"}</div></div>{canReleaseCorrective ? <Button size="sm" variant="outline" disabled={acting} onClick={() => releaseBlueprint(blueprint, true)}>Release corrective Work Order</Button> : released ? <StatusBadge tone="success">RELEASED</StatusBadge> : <Button size="sm" variant="outline" disabled={acting} onClick={() => releaseBlueprint(blueprint)}>Release Work Order</Button>}</div>; })}</div></section> : null}<WorkOrderList workOrders={workOrders} onNavigate={onNavigate} /></div> : null}
        {tab === "evidence" ? <AssertionList assertions={assertions} /> : null}
        {tab === "activity" ? <div className="overflow-hidden rounded-xl border border-line bg-surface-1"><ul className="divide-y divide-line">{events.length ? events.map((event) => <li key={event._id} className="px-4 py-3"><div className="text-[13px] text-ink">{event.summary}</div><div className="mt-0.5 font-mono text-[11px] text-ink-muted">{event.eventType} · {new Date(event.timestamp).toLocaleString()}</div></li>) : <li className="px-4 py-10 text-center text-[13px] text-ink-muted">No Mission events recorded yet.</li>}</ul></div> : null}
        {tab === "overview" && handoffs.length ? <section className="rounded-xl border border-line bg-surface-1 p-4"><div className="text-[13px] font-semibold text-ink">Latest handoff</div><p className="mt-2 text-[13px] text-ink-secondary">{handoffs[0].producingRole} → {handoffs[0].consumingRole}: {handoffs[0].nextAction}</p><Button className="mt-3" size="sm" variant="outline" onClick={() => onNavigate("trace-inspector")}>Open execution evidence</Button></section> : null}
      </div>
  </DetailLayout>{showPlanEditor ? <PlanEditor missionId={mission._id} onComplete={() => setShowPlanEditor(false)} /> : null}</div>;
}
