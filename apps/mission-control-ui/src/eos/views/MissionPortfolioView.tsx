import { Target } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useSearchParams } from "react-router-dom";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "../../components/factory/DetailLayout";
import { StatusBadge, type StatusBadgeProps } from "../../components/factory/badges";
import { EmptyState } from "../../components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { ProvenanceBadge } from "../components";

export interface MissionPortfolioViewProps {
  projectId: Id<"projects">;
  onNavigate: (view: string) => void;
}

function stateTone(state: string): StatusBadgeProps["tone"] {
  if (state === "DONE") return "success";
  if (["BLOCKED", "AWAITING_PLAN_APPROVAL", "AWAITING_VALIDATION", "AWAITING_ACCEPTANCE"].includes(state)) return "warning";
  if (["IN_PROGRESS", "PLANNING", "READY"].includes(state)) return "info";
  return "neutral";
}

function healthLabel(mission: any) {
  if (mission.state === "BLOCKED") return "Needs attention";
  if (mission.state === "DONE") return "Validated";
  if (mission.state === "AWAITING_PLAN_APPROVAL") return "Plan approval required";
  return "In progress";
}

function MissionCard({ mission, onOpen }: { mission: any; onOpen: () => void }) {
  const assertionProgress = mission.assertionCount === 0 ? "No contract yet" : `${mission.assertionCount} assertions`;
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface-1 p-4 text-left transition-colors duration-150 hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink">{mission.title}</div>
          <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-secondary">{mission.objective}</p>
        </div>
        <StatusBadge tone={stateTone(mission.state)}>{mission.state.replace(/_/g, " ")}</StatusBadge>
      </div>
      <div className="text-[12.5px] text-ink-secondary">{healthLabel(mission)}</div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5 text-[12px] text-ink-muted">
        <span>{mission.workOrderCount} work orders · {assertionProgress}</span>
        <ProvenanceBadge provenance="convex" variant="dot" className="shrink-0" />
      </div>
    </button>
  );
}

function CreateMissionDialog({ projectId, open, onOpenChange, onCreated }: { projectId: Id<"projects">; open: boolean; onOpenChange: (open: boolean) => void; onCreated: (missionId: string) => void }) {
  const createDraft = useMutation(api.missions.createDraft);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [stopCondition, setStopCondition] = useState("Stop when the approved validation contract is complete or operator intervention is required.");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim() || !objective.trim() || !stopCondition.trim()) {
      setError("Title, objective, and stop condition are required.");
      return;
    }
    setSaving(true); setError(null);
    try {
      const result = await createDraft({ projectId, title: title.trim(), objective: objective.trim(), stopCondition: stopCondition.trim(), owner: "operator", idempotencyKey: `ui-mission:${crypto.randomUUID()}` });
      onOpenChange(false);
      onCreated(result.mission._id);
    } catch (cause: any) {
      setError(cause.message ?? "Mission could not be created.");
    } finally { setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Define a Mission</DialogTitle><DialogDescription>Create a governed objective. Planning and validation approval happen before any WorkOrder is dispatched.</DialogDescription></DialogHeader>
    <div className="space-y-4 py-2">
      <div className="space-y-1.5"><Label htmlFor="mission-title">Title</Label><Input id="mission-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Improve buyer onboarding confidence" /></div>
      <div className="space-y-1.5"><Label htmlFor="mission-objective">Objective</Label><Textarea id="mission-objective" value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Describe the outcome, not an implementation task." /></div>
      <div className="space-y-1.5"><Label htmlFor="mission-stop">Stop condition</Label><Textarea id="mission-stop" value={stopCondition} onChange={(event) => setStopCondition(event.target.value)} /></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create draft"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

export function MissionPortfolioView({ projectId, onNavigate }: MissionPortfolioViewProps): JSX.Element {
  const missions = useQuery(api.missions.list, { projectId });
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const openMission = (missionId: string) => { setSearchParams((current) => { const next = new URLSearchParams(current); next.set("mission", missionId); return next; }); onNavigate("mission-detail"); };
  return <div className="relative flex-1 overflow-auto bg-app">
    <PageHeader title="Missions" description="Governed outcomes with explicit validation, handoffs, and operator decision gates." actions={<Button onClick={() => setCreateOpen(true)}>Define mission</Button>} />
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-8 py-6">
      <div className="rounded-xl border border-line bg-surface-1 px-4 py-3 text-[12.5px] text-ink-secondary">Live Mission records from Convex. A draft remains non-executable until its plan and validation contract are approved.</div>
      {missions === undefined ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-xl bg-surface-2" />)}</div> : null}
      {missions?.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{missions.map((mission) => <MissionCard key={mission._id} mission={mission} onOpen={() => openMission(mission._id)} />)}</div> : null}
      {missions && missions.length === 0 ? <EmptyState icon={Target} title="Define your first Mission" description="Missions turn an approved outcome into serial, evidence-backed WorkOrders." action={<Button onClick={() => setCreateOpen(true)}>Define mission</Button>} /> : null}
    </div>
    <CreateMissionDialog projectId={projectId} open={createOpen} onOpenChange={setCreateOpen} onCreated={openMission} />
  </div>;
}
