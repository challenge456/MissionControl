/**
 * Shared Create Agent modal (OpenClaw Studio parity).
 * Identity, role, config, tool policy (allowed tools), budget, exec approval note, spawning.
 * Used from OrgView (with optional parentAgentId) and from Agent Registry / Command Palette.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Wrench } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export interface CreateAgentForm {
  name: string;
  emoji: string;
  role: string;
  workspacePath: string;
  allowedTaskTypes: string;
  allowedTools: string;
  budgetDaily: string;
  budgetPerRun: string;
  canSpawn: boolean;
  maxSubAgents: string;
  email: string;
  telegram: string;
  whatsapp: string;
  discord: string;
}

export const defaultCreateForm: CreateAgentForm = {
  name: "",
  emoji: "",
  role: "SPECIALIST",
  workspacePath: "/workspace",
  allowedTaskTypes: "",
  allowedTools: "",
  budgetDaily: "",
  budgetPerRun: "",
  canSpawn: false,
  maxSubAgents: "0",
  email: "",
  telegram: "",
  whatsapp: "",
  discord: "",
};

const roleOptions = [
  { value: "INTERN", label: "Intern", desc: "Limited access, lower budget ($2/day)" },
  { value: "SPECIALIST", label: "Specialist", desc: "Standard agent, focused tasks ($5/day)" },
  { value: "LEAD", label: "Lead", desc: "Full access, coordination role ($12/day)" },
];

const TOOL_PRESETS = [
  { label: "Read-only", value: "read,web_fetch" },
  { label: "Code", value: "read,write,shell,git,convex" },
  { label: "Research", value: "read,web_search,web_fetch,planner" },
  { label: "Full", value: "read,write,shell,web_search,web_fetch,git,github,convex,tasks,content,planner" },
];

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-5 pb-4 border-b border-border last:border-b-0">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

export interface CreateAgentModalProps {
  open: boolean;
  projectId: Id<"projects"> | null;
  parentAgentId?: Id<"agents">;
  onClose: () => void;
  onCreate: (form: CreateAgentForm) => void | Promise<void>;
}

export function CreateAgentModal({
  open,
  projectId,
  parentAgentId,
  onClose,
  onCreate,
}: CreateAgentModalProps) {
  const [form, setForm] = useState<CreateAgentForm>({ ...defaultCreateForm });
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof CreateAgentForm, value: CreateAgentForm[keyof CreateAgentForm]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.name.trim().length > 0 && form.role && form.workspacePath.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onCreate(form);
      setForm({ ...defaultCreateForm });
      onClose();
    } catch {
      // Keep modal open on error (caller may set error state)
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[560px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-5 border-b border-border">
          <DialogTitle>{parentAgentId ? "Add Sub-Agent" : "Create Agent"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <ModalSection title="Identity">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Research Agent" autoFocus />
              </div>
              <div className="w-20">
                <label className="block text-xs text-muted-foreground mb-1">Emoji</label>
                <Input value={form.emoji} onChange={(e) => update("emoji", e.target.value)} placeholder="🤖" />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Role">
            <div className="flex flex-col gap-2">
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("role", opt.value)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-colors",
                    form.role === opt.value ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                    {form.role === opt.value && <span className="text-primary text-sm">✓</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </ModalSection>

          <ModalSection title="Configuration">
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Workspace Path *</label>
              <Input value={form.workspacePath} onChange={(e) => update("workspacePath", e.target.value)} placeholder="/workspace" />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Allowed Task Types</label>
              <Input
                value={form.allowedTaskTypes}
                onChange={(e) => update("allowedTaskTypes", e.target.value)}
                placeholder="ENGINEERING, CONTENT, OPS (comma-separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty to allow all</p>
            </div>
          </ModalSection>

          <ModalSection title="Tool policy (allowed tools)">
            <div className="flex flex-wrap gap-2 mb-2">
              {TOOL_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => update("allowedTools", preset.value)}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
            <Input
              value={form.allowedTools}
              onChange={(e) => update("allowedTools", e.target.value)}
              placeholder="read, write, shell, web_search, git (comma-separated)"
            />
            <p className="text-xs text-muted-foreground mt-1">Allowlist only. RED-risk tool calls require human approval below.</p>
          </ModalSection>

          <ModalSection title="Exec approvals">
            <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                High-risk (RED) tool calls—e.g. destructive or external writes—require human approval before the agent can proceed. Approve or deny from the Approvals center (top bar).
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Budget">
            <p className="text-xs text-muted-foreground mb-3">Leave empty for role defaults</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Daily ($)</label>
                <Input
                  type="number"
                  value={form.budgetDaily}
                  onChange={(e) => update("budgetDaily", e.target.value)}
                  placeholder={form.role === "LEAD" ? "12" : form.role === "SPECIALIST" ? "5" : "2"}
                  step="0.50"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Per run ($)</label>
                <Input
                  type="number"
                  value={form.budgetPerRun}
                  onChange={(e) => update("budgetPerRun", e.target.value)}
                  placeholder={form.role === "LEAD" ? "1.50" : form.role === "SPECIALIST" ? "0.75" : "0.25"}
                  step="0.25"
                />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Contact (optional)">
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="agent@example.com" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Telegram</label>
                <Input value={form.telegram} onChange={(e) => update("telegram", e.target.value)} placeholder="@username" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">WhatsApp</label>
                <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="+1234567890" />
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Sub-agent spawning">
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => update("canSpawn", !form.canSpawn)}
                className={cn(
                  "relative w-10 h-6 rounded-full transition-colors shrink-0",
                  form.canSpawn ? "bg-primary" : "bg-border"
                )}
                aria-label="Toggle sub-agent spawning"
              >
                <div className={cn("absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform", form.canSpawn && "translate-x-4")} />
              </button>
              <span className="text-sm text-foreground">Can spawn sub-agents</span>
            </div>
            {form.canSpawn && (
              <div className="w-[120px]">
                <label className="block text-xs text-muted-foreground mb-1">Max sub-agents</label>
                <Input type="number" value={form.maxSubAgents} onChange={(e) => update("maxSubAgents", e.target.value)} min={0} max={10} />
              </div>
            )}
          </ModalSection>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Creating…" : "Create Agent"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
