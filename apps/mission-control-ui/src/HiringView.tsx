/**
 * Agent Hiring Pipeline — Comms > Hiring
 * Stage 0–5: role specs, candidates, screen, assessments, panel, decision.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Briefcase,
  ChevronRight,
  Plus,
  ClipboardList,
  FileCheck,
  Users,
  Gavel,
} from "lucide-react";
import { PageHeader } from "./components/PageHeader";

const STAGES = [
  { id: 0, label: "Role", icon: Briefcase },
  { id: 1, label: "Candidates", icon: UserPlus },
  { id: 2, label: "Screen", icon: ClipboardList },
  { id: 3, label: "Assessments", icon: FileCheck },
  { id: 4, label: "Panel", icon: Users },
  { id: 5, label: "Decision", icon: Gavel },
] as const;

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  screening: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  assessed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  panel: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  offer: "bg-green-500/15 text-green-400 border-green-500/30",
  no_hire: "bg-red-500/15 text-red-400 border-red-500/30",
};

interface HiringViewProps {
  projectId: Id<"projects"> | null;
}

export function HiringView({ projectId }: HiringViewProps) {
  const [selectedRoleSpecId, setSelectedRoleSpecId] = useState<Id<"agentRoleSpecs"> | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<Id<"hiringCandidates"> | null>(null);
  const [showNewRoleForm, setShowNewRoleForm] = useState(false);
  const [showAddCandidateForm, setShowAddCandidateForm] = useState(false);

  const roleSpecs = useQuery(
    api.agentHiring.listRoleSpecs,
    projectId ? { projectId } : "skip"
  );
  const candidates = useQuery(
    api.agentHiring.listCandidates,
    selectedRoleSpecId ? { roleSpecId: selectedRoleSpecId } : "skip"
  );
  const selectedRole = useQuery(
    api.agentHiring.getRoleSpec,
    selectedRoleSpecId ? { id: selectedRoleSpecId } : "skip"
  );
  const selectedCandidate = useQuery(
    api.agentHiring.getCandidate,
    selectedCandidateId ? { id: selectedCandidateId } : "skip"
  );

  const createRoleSpec = useMutation(api.agentHiring.createRoleSpec);
  const createCandidate = useMutation(api.agentHiring.createCandidate);
  const saveScreenReport = useMutation(api.agentHiring.saveScreenReport);
  const saveAssessmentPacket = useMutation(api.agentHiring.saveAssessmentPacket);
  const savePanelPacket = useMutation(api.agentHiring.savePanelPacket);
  const saveDecisionRecord = useMutation(api.agentHiring.saveDecisionRecord);

  if (!projectId) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <PageHeader title="Agent Hiring Pipeline" />
        <p className="text-muted-foreground mt-2">Select a project to manage agent hiring.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden flex flex-col bg-background">
      <PageHeader
        title="Agent Hiring Pipeline"
        description="Role specs, candidates, and pipeline stages (Screen → Assessments → Panel → Decision)"
      />

      <div className="flex flex-1 overflow-hidden border-t border-border">
        {/* Left: Role list */}
        <div className="w-72 border-r border-border flex flex-col bg-card/30">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Roles
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setShowNewRoleForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!roleSpecs ? (
              <p className="text-sm text-muted-foreground p-2">Loading…</p>
            ) : roleSpecs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No roles. Create one to start.</p>
            ) : (
              roleSpecs.map((r) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => {
                    setSelectedRoleSpecId(r._id);
                    setSelectedCandidateId(null);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors",
                    selectedRoleSpecId === r._id
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-foreground"
                  )}
                >
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.slug}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Center: Candidates + pipeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedRoleSpecId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a role or create one
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border flex justify-between items-center">
                <h2 className="text-sm font-semibold text-foreground">
                  {selectedRole?.name ?? "Role"} — Candidates
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCandidateForm(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Add candidate
                </Button>
              </div>
              <div className="flex-1 overflow-hidden flex">
                {/* Candidate list */}
                <div className="w-56 border-r border-border flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-2">
                    {!candidates ? (
                      <p className="text-xs text-muted-foreground p-2">Loading…</p>
                    ) : candidates.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">No candidates yet.</p>
                    ) : (
                      candidates.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setSelectedCandidateId(c._id)}
                          className={cn(
                            "w-full text-left rounded-lg px-2.5 py-2 text-xs transition-colors",
                            selectedCandidateId === c._id
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className="font-medium truncate">{c.label}</div>
                          <Badge
                            variant="outline"
                            className={cn("mt-1 text-[10px]", STATUS_BADGE[c.status] ?? "")}
                          >
                            {c.status}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Pipeline detail */}
                <div className="flex-1 overflow-y-auto p-4">
                  {!selectedCandidateId ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                      <ClipboardList className="h-10 w-10 mb-2 opacity-50" />
                      Select a candidate to view or record pipeline stages
                    </div>
                  ) : (
                    <CandidatePipelineDetail
                      projectId={projectId}
                      roleSpecId={selectedRoleSpecId}
                      candidate={selectedCandidate}
                      onSaveScreenReport={saveScreenReport}
                      onSaveAssessmentPacket={saveAssessmentPacket}
                      onSavePanelPacket={savePanelPacket}
                      onSaveDecisionRecord={saveDecisionRecord}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New role form (Stage 0) — minimal for now */}
      {showNewRoleForm && (
        <NewRoleSpecForm
          projectId={projectId}
          onClose={() => setShowNewRoleForm(false)}
          onCreated={(id) => {
            setSelectedRoleSpecId(id);
            setShowNewRoleForm(false);
          }}
          createRoleSpec={createRoleSpec}
        />
      )}

      {/* Add candidate form (Stage 1) */}
      {showAddCandidateForm && selectedRoleSpecId && (
        <AddCandidateForm
          projectId={projectId}
          roleSpecId={selectedRoleSpecId}
          onClose={() => setShowAddCandidateForm(false)}
          onCreated={() => {
            setShowAddCandidateForm(false);
          }}
          createCandidate={createCandidate}
        />
      )}
    </main>
  );
}

function NewRoleSpecForm({
  projectId,
  onClose,
  onCreated,
  createRoleSpec,
}: {
  projectId: Id<"projects">;
  onClose: () => void;
  onCreated: (id: Id<"agentRoleSpecs">) => void;
  createRoleSpec: ReturnType<typeof useMutation<typeof api.agentHiring.createRoleSpec>>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [purpose, setPurpose] = useState("");
  const [outcomesText, setOutcomesText] = useState("");
  const [includesText, setIncludesText] = useState("");
  const [excludesText, setExcludesText] = useState("");
  const [allowedTools, setAllowedTools] = useState("");
  const [forbiddenTools, setForbiddenTools] = useState("");
  const [redlinesText, setRedlinesText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = (slug || name.toLowerCase().replace(/\s+/g, "_")).replace(/[^a-z0-9_]/gi, "");
    if (!s || !name.trim() || !purpose.trim()) return;
    setSaving(true);
    try {
      const id = await createRoleSpec({
        projectId,
        name: name.trim(),
        slug: s,
        purpose: purpose.trim(),
        outcomes: outcomesText.trim() ? outcomesText.trim().split("\n").filter(Boolean) : [],
        scope: {
          includes: includesText.trim() ? includesText.trim().split("\n").filter(Boolean) : [],
          excludes: excludesText.trim() ? excludesText.trim().split("\n").filter(Boolean) : [],
        },
        tooling: {
          allowed_tools: allowedTools.trim() ? allowedTools.split(",").map((t) => t.trim()).filter(Boolean) : [],
          forbidden_tools: forbiddenTools.trim() ? forbiddenTools.split(",").map((t) => t.trim()).filter(Boolean) : [],
        },
        policyEnvelope: {
          redlines: redlinesText.trim() ? redlinesText.trim().split("\n").filter(Boolean) : [],
        },
      });
      onCreated(id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">New role spec (Stage 0)</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support Triage Agent" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="support_triage_agent" />
          </div>
          <div>
            <Label>Purpose</Label>
            <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} placeholder="Own intake, triage..." />
          </div>
          <div>
            <Label>Outcomes (one per line)</Label>
            <Textarea value={outcomesText} onChange={(e) => setOutcomesText(e.target.value)} rows={2} placeholder="Issue classification..." />
          </div>
          <div>
            <Label>Scope includes (one per line)</Label>
            <Textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Scope excludes (one per line)</Label>
            <Textarea value={excludesText} onChange={(e) => setExcludesText(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Allowed tools (comma-separated)</Label>
            <Input value={allowedTools} onChange={(e) => setAllowedTools(e.target.value)} placeholder="ticketing.read, kb.search" />
          </div>
          <div>
            <Label>Forbidden tools (comma-separated)</Label>
            <Input value={forbiddenTools} onChange={(e) => setForbiddenTools(e.target.value)} placeholder="billing, mass_messaging" />
          </div>
          <div>
            <Label>Redlines (one per line)</Label>
            <Textarea value={redlinesText} onChange={(e) => setRedlinesText(e.target.value)} rows={2} placeholder="No production DB modifications" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !purpose.trim()}>
              {saving ? "Creating…" : "Create role"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function AddCandidateForm({
  projectId,
  roleSpecId,
  onClose,
  onCreated,
  createCandidate,
}: {
  projectId: Id<"projects">;
  roleSpecId: Id<"agentRoleSpecs">;
  onClose: () => void;
  onCreated: () => void;
  createCandidate: ReturnType<typeof useMutation<typeof api.agentHiring.createCandidate>>;
}) {
  const [label, setLabel] = useState("");
  const [source, setSource] = useState<"model_provider" | "template" | "internal">("model_provider");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      await createCandidate({ projectId, roleSpecId, label: label.trim(), source });
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">Add candidate (Stage 1)</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Claude Opus + triage prompt" />
          </div>
          <div>
            <Label>Source</Label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as "model_provider" | "template" | "internal")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="model_provider">Model / provider</option>
              <option value="template">Template</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !label.trim()}>
              {saving ? "Adding…" : "Add candidate"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function CandidatePipelineDetail({
  roleSpecId,
  candidate,
  onSaveScreenReport,
  onSaveAssessmentPacket,
  onSavePanelPacket,
  onSaveDecisionRecord,
}: {
  projectId: Id<"projects">;
  roleSpecId: Id<"agentRoleSpecs">;
  candidate: ReturnType<typeof useQuery<typeof api.agentHiring.getCandidate>>;
  onSaveScreenReport: ReturnType<typeof useMutation<typeof api.agentHiring.saveScreenReport>>;
  onSaveAssessmentPacket: ReturnType<typeof useMutation<typeof api.agentHiring.saveAssessmentPacket>>;
  onSavePanelPacket: ReturnType<typeof useMutation<typeof api.agentHiring.savePanelPacket>>;
  onSaveDecisionRecord: ReturnType<typeof useMutation<typeof api.agentHiring.saveDecisionRecord>>;
}) {
  const [activeTab, setActiveTab] = useState("screen");
  if (!candidate || !("_id" in candidate)) {
    return <p className="text-sm text-muted-foreground">Loading candidate…</p>;
  }
  const candidateId = candidate._id;

  return (
    <div className="space-y-4">
      {/* Pipeline stepper */}
      <div className="flex items-center gap-1 flex-wrap">
        {STAGES.map((s, i) => {
          const tab = i === 2 ? "screen" : i === 3 ? "assessments" : i === 4 ? "panel" : i === 5 ? "decision" : null;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => tab && setActiveTab(tab)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  activeTab === tab ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground",
                  !tab && "cursor-default"
                )}
              >
                {s.label}
              </button>
              {i < STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="screen">Screen</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="panel">Panel</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
        </TabsList>
        <TabsContent value="screen" className="mt-4">
          <ScreenReportForm
            candidateId={candidateId}
            roleSpecId={roleSpecId}
            existing={candidate.screenReport}
            onSave={onSaveScreenReport}
          />
        </TabsContent>
        <TabsContent value="assessments" className="mt-4">
          <AssessmentPacketForm
            candidateId={candidateId}
            roleSpecId={roleSpecId}
            existing={candidate.assessmentPacket}
            onSave={onSaveAssessmentPacket}
          />
        </TabsContent>
        <TabsContent value="panel" className="mt-4">
          <PanelPacketForm
            candidateId={candidateId}
            roleSpecId={roleSpecId}
            existing={candidate.panelPacket}
            onSave={onSavePanelPacket}
          />
        </TabsContent>
        <TabsContent value="decision" className="mt-4">
          <DecisionRecordForm
            candidateId={candidateId}
            roleSpecId={roleSpecId}
            existing={candidate.decisionRecord}
            onSave={onSaveDecisionRecord}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScreenReportForm({
  candidateId,
  roleSpecId,
  existing,
  onSave,
}: {
  candidateId: Id<"hiringCandidates">;
  roleSpecId: Id<"agentRoleSpecs">;
  existing: { pass: boolean; scores: unknown; disqualifiers: string[] } | null;
  onSave: ReturnType<typeof useMutation<typeof api.agentHiring.saveScreenReport>>;
}) {
  const [pass, setPass] = useState(existing?.pass ?? true);
  const [disqualifiersText, setDisqualifiersText] = useState((existing?.disqualifiers ?? []).join("\n"));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        candidateId,
        roleSpecId,
        pass,
        scores: existing?.scores ?? { structure: 4, triage: 4, policy: 4, tool_reliability: 4, collaboration: 4 },
        disqualifiers: disqualifiersText.trim() ? disqualifiersText.trim().split("\n").filter(Boolean) : [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">Stage 2 — Recruiter screen</h4>
      {existing && <p className="text-xs text-muted-foreground mb-2">Previously: {existing.pass ? "Pass" : "Fail"}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="pass" checked={pass} onChange={(e) => setPass(e.target.checked)} />
          <Label htmlFor="pass">Pass</Label>
        </div>
        <div>
          <Label>Disqualifiers (one per line)</Label>
          <Textarea value={disqualifiersText} onChange={(e) => setDisqualifiersText(e.target.value)} rows={2} />
        </div>
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save screen report"}</Button>
      </form>
    </Card>
  );
}

function AssessmentPacketForm({
  candidateId,
  roleSpecId,
  existing,
  onSave,
}: {
  candidateId: Id<"hiringCandidates">;
  roleSpecId: Id<"agentRoleSpecs">;
  existing: { assessments: unknown[]; overallScores?: unknown } | null;
  onSave: ReturnType<typeof useMutation<typeof api.agentHiring.saveAssessmentPacket>>;
}) {
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        candidateId,
        roleSpecId,
        assessments: existing?.assessments ?? [{ id: "A1", name: "Triage work sample", score: 4 }, { id: "A2", name: "Evidence correlation", score: 4 }, { id: "A3", name: "Duplicate detection", score: 4 }, { id: "A4", name: "Policy escalation", score: 4 }],
        overallScores: existing?.overallScores ?? undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">Stage 3 — Competency assessments</h4>
      {existing && <p className="text-xs text-muted-foreground mb-2">Saved: {existing.assessments?.length ?? 0} assessments</p>}
      <form onSubmit={handleSubmit}>
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save assessment packet"}</Button>
      </form>
    </Card>
  );
}

function PanelPacketForm({
  candidateId,
  roleSpecId,
  existing,
  onSave,
}: {
  candidateId: Id<"hiringCandidates">;
  roleSpecId: Id<"agentRoleSpecs">;
  existing: { panelNotes: unknown; hireDecisionDraft: string } | null;
  onSave: ReturnType<typeof useMutation<typeof api.agentHiring.savePanelPacket>>;
}) {
  const [draft, setDraft] = useState<"strong_hire" | "hire" | "no_hire">((existing?.hireDecisionDraft as "strong_hire" | "hire" | "no_hire") ?? "hire");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        candidateId,
        roleSpecId,
        panelNotes: existing?.panelNotes ?? { CTO: "", Orchestrator: "", Peer: "" },
        hireDecisionDraft: draft,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">Stage 4 — Panel roundtable</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Hire decision draft</Label>
          <select value={draft} onChange={(e) => setDraft(e.target.value as "strong_hire" | "hire" | "no_hire")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
            <option value="strong_hire">Strong Hire</option>
            <option value="hire">Hire</option>
            <option value="no_hire">No Hire</option>
          </select>
        </div>
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save panel packet"}</Button>
      </form>
    </Card>
  );
}

function DecisionRecordForm({
  candidateId,
  roleSpecId,
  existing,
  onSave,
}: {
  candidateId: Id<"hiringCandidates">;
  roleSpecId: Id<"agentRoleSpecs">;
  existing: { decision: string; autonomyLevel: number; decidedBy?: string } | null;
  onSave: ReturnType<typeof useMutation<typeof api.agentHiring.saveDecisionRecord>>;
}) {
  const [decision, setDecision] = useState<"strong_hire" | "hire" | "no_hire">((existing?.decision as "strong_hire" | "hire" | "no_hire") ?? "hire");
  const [autonomyLevel, setAutonomyLevel] = useState<1 | 2 | 3>((existing?.autonomyLevel as 1 | 2 | 3) ?? 1);
  const [decidedBy, setDecidedBy] = useState(existing?.decidedBy ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        candidateId,
        roleSpecId,
        decision,
        autonomyLevel,
        decidedBy: decidedBy.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">Stage 5 — Hiring decision</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Decision</Label>
          <select value={decision} onChange={(e) => setDecision(e.target.value as "strong_hire" | "hire" | "no_hire")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
            <option value="strong_hire">Strong Hire</option>
            <option value="hire">Hire</option>
            <option value="no_hire">No Hire</option>
          </select>
        </div>
        <div>
          <Label>Autonomy level (L1–L3)</Label>
          <select value={autonomyLevel} onChange={(e) => setAutonomyLevel(Number(e.target.value) as 1 | 2 | 3)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
            <option value={1}>L1 — Human-approved</option>
            <option value={2}>L2 — Sandbox autonomous</option>
            <option value={3}>L3 — Policy-bounded</option>
          </select>
        </div>
        <div>
          <Label>Decided by</Label>
          <Input value={decidedBy} onChange={(e) => setDecidedBy(e.target.value)} placeholder="Operator or user ID" />
        </div>
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save decision record"}</Button>
      </form>
    </Card>
  );
}
