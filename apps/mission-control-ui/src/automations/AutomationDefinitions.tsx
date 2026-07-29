import { useState } from "react";
import { useMutation } from "convex/react";
import { Pause, Play, ShieldCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, statusTone } from "./automationModel";

export function AutomationDefinitions({
  projectId,
  definitions,
  onSelect,
}: {
  projectId: Id<"projects">;
  definitions: any[];
  onSelect: (definitionId: string) => void;
}) {
  const activate = useMutation(api.automations.activate);
  const pause = useMutation(api.automations.pause);
  const [action, setAction] = useState<{ type: "activate" | "pause"; definition: any } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function confirm() {
    if (!action || reason.trim().length < 5) return;
    setBusy(true);
    setMessage(null);
    try {
      const args = {
        projectId,
        automationDefinitionId: action.definition._id,
        actorId: "operator",
        reason: reason.trim(),
        policyVersion: "automation-v1",
      };
      if (action.type === "activate") await activate(args);
      else await pause(args);
      setMessage({ tone: "ok", text: `${action.definition.name} ${action.type === "activate" ? "activated" : "paused"}.` });
      setAction(null);
      setReason("");
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Automation transition failed" });
    } finally {
      setBusy(false);
    }
  }

  if (definitions.length === 0) {
    return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">No Automation Definitions yet. Accept an evidenced candidate to create a disabled definition.</Card>;
  }

  return (
    <div className="space-y-3">
      <div aria-live="polite">
        {message ? <p className={message.tone === "ok" ? "text-sm text-emerald-300" : "text-sm text-red-300"}>{message.text}</p> : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-[var(--panel-line)]">
        <table className="min-w-[1120px] w-full text-left text-sm">
          <thead className="bg-card/70 text-[11px] uppercase tracking-[0.13em] text-muted-foreground">
            <tr>{["Name", "Status", "Reliability", "Workflow", "Trigger", "Scope", "Risk", "Approval", "Next run", "Health", "Action"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-line)]">
            {definitions.map((definition) => (
              <tr key={definition._id} className="bg-card/30 align-top">
                <td className="px-3 py-3">
                  <button type="button" onClick={() => onSelect(definition._id)} className="font-medium text-foreground hover:text-registry-accent">{definition.name}</button>
                  <div className="mt-1 text-xs text-muted-foreground">{definition.ownerId}</div>
                </td>
                <td className="px-3 py-3"><Badge variant="outline" className={statusTone(definition.status)}>{definition.status}</Badge></td>
                <td className="px-3 py-3 text-muted-foreground">{definition.reliabilityState}</td>
                <td className="px-3 py-3 text-muted-foreground">{definition.workflowId}@{definition.workflowVersion}</td>
                <td className="px-3 py-3 text-muted-foreground">{definition.triggerType}<div className="text-xs">{definition.triggerConfig?.cron}</div></td>
                <td className="px-3 py-3 text-muted-foreground">{definition.scope}</td>
                <td className="px-3 py-3">{definition.riskLevel}</td>
                <td className="px-3 py-3 text-muted-foreground">{definition.requiredApprovalTypes.join(", ")}</td>
                <td className="px-3 py-3 text-muted-foreground">{formatDate(definition.nextRunAt)}</td>
                <td className="px-3 py-3"><Badge variant="outline" className={statusTone(definition.health)}>{definition.health}</Badge></td>
                <td className="px-3 py-3">
                  {definition.status === "ACTIVE" ? (
                    <Button size="sm" variant="outline" onClick={() => setAction({ type: "pause", definition })}><Pause className="h-3.5 w-3.5" /> Pause</Button>
                  ) : ["DISABLED", "PAUSED"].includes(definition.status) ? (
                    <Button size="sm" onClick={() => setAction({ type: "activate", definition })}><Play className="h-3.5 w-3.5" /> {definition.status === "PAUSED" ? "Resume" : "Activate"}</Button>
                  ) : <span className="text-xs text-muted-foreground">Review required</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!action} onOpenChange={(open) => { if (!open) { setAction(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.type === "activate" ? "Activate" : "Pause"} {action?.definition.name}</DialogTitle>
            <DialogDescription>
              {action?.type === "activate"
                ? "Activation creates approval-gated review WorkOrders only. It does not approve or dispatch them."
                : "Pausing stops future review gates and leaves existing WorkOrders unchanged."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="automation-decision-reason">Decision reason</Label>
            <Textarea id="automation-decision-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this transition appropriate?" />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Recorded with actor, policy version, time, and definition version.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button disabled={busy || reason.trim().length < 5} onClick={() => void confirm()}>{busy ? "Recording…" : `Confirm ${action?.type}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
