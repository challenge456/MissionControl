import { useState } from "react";
import { useMutation } from "convex/react";
import { ReceiptText, ShieldAlert } from "lucide-react";
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

export function AutomationCandidates({ projectId, candidates }: { projectId: Id<"projects">; candidates: any[] }) {
  const accept = useMutation(api.automations.acceptCandidate);
  const [selected, setSelected] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);

  async function confirm() {
    if (!selected || reason.trim().length < 5) return;
    setBusy(true);
    try {
      const result = await accept({
        projectId,
        candidateId: selected.id,
        actorId: "operator",
        reason: reason.trim(),
        policyVersion: "automation-v1",
      });
      setMessage({ text: result.created ? "Disabled Automation Definition created. Activation remains a separate decision." : "This candidate already has an Automation Definition." });
      setSelected(null);
      setReason("");
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Candidate acceptance failed" });
    } finally {
      setBusy(false);
    }
  }

  if (candidates.length === 0) {
    return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">No repeated-work candidates yet. Two completed WorkOrders with comparable scope are required.</Card>;
  }
  return (
    <div className="space-y-3">
      {message ? <p role={message.error ? "alert" : "status"} className={message.error ? "text-sm text-red-300" : "text-sm text-emerald-300"}>{message.text}</p> : null}
      <div className="grid gap-3">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-foreground">{candidate.pattern}</h2>
                  {candidate.status === "ACCEPTED" ? <Badge variant="secondary">Definition created</Badge> : null}
                  <Badge variant="outline">{Math.round(candidate.confidence * 100)}% confidence</Badge>
                  <Badge variant="outline">{candidate.riskLevel} risk</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-5">
                  <span>{candidate.occurrences} occurrences</span>
                  <span className="flex items-center gap-1"><ReceiptText className="h-4 w-4" /> {candidate.receiptCount} eligible receipts</span>
                  <span>{candidate.workflowId ? `Workflow ${candidate.workflowId}` : "Workflow required"}</span>
                  <span>{candidate.suggestedCadence}</span>
                  <span>~{candidate.estimatedHumanMinutesSaved} min saved</span>
                </div>
              </div>
              <Button disabled={!candidate.eligible || candidate.status === "ACCEPTED"} onClick={() => setSelected(candidate)}>
                {candidate.status === "ACCEPTED" ? "Definition created" : candidate.eligible ? "Review candidate" : "Workflow design required"}
              </Button>
            </div>
            {!candidate.eligible ? <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-200"><ShieldAlert className="h-3.5 w-3.5" /> Repository-only patterns cannot activate until they reference a versioned Workflow and passing receipt.</p> : null}
          </Card>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept candidate: {selected?.pattern}</DialogTitle>
            <DialogDescription>This creates a disabled LEVEL_1 Automation Definition. It does not activate, approve, or dispatch work.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
            {selected?.occurrences} occurrences · {selected?.receiptCount} receipts · {selected?.workflowId}@current
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidate-decision-reason">Acceptance reason</Label>
            <Textarea id="candidate-decision-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why should this pattern become a governed definition?" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button disabled={busy || reason.trim().length < 5} onClick={() => void confirm()}>{busy ? "Creating…" : "Create disabled definition"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
