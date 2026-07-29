import { useState } from "react";
import { useMutation } from "convex/react";
import { CalendarClock, PlayCircle } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, statusTone } from "./automationModel";

export function AutomationSchedule({ projectId, definitions }: { projectId: Id<"projects">; definitions: any[] }) {
  const evaluate = useMutation(api.automationScheduler.evaluateNow);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const scheduled = definitions.filter((definition) => definition.triggerType === "SCHEDULE");
  async function evaluateNow(definition: any) {
    setBusyId(definition._id);
    setMessage(null);
    try {
      const result = await evaluate({ projectId, automationDefinitionId: definition._id, actorId: "operator" });
      setMessage(result.created === 1 ? "One review-gate WorkOrder created." : `No duplicate created (${result.skipped} skipped).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Evaluation failed");
    } finally {
      setBusyId(null);
    }
  }
  return (
    <div className="space-y-4">
      <p role="status" className="min-h-5 text-sm text-muted-foreground">{message}</p>
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-registry-accent" />
          <h2 className="text-sm font-semibold text-foreground">Upcoming review gates</h2>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">List view is authoritative. Times use each Automation’s configured timezone.</p>
        {scheduled.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No scheduled Automation Definitions.</p> : (
          <ul className="mt-4 divide-y divide-[var(--panel-line)]">
            {scheduled.map((definition) => (
              <li key={definition._id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <div className="flex items-center gap-2"><span className="font-medium text-foreground">{definition.name}</span><Badge variant="outline" className={statusTone(definition.status)}>{definition.status}</Badge></div>
                  <p className="mt-1 text-sm text-muted-foreground">{definition.triggerConfig?.cron} · {definition.triggerConfig?.timezone ?? "UTC"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Next: {formatDate(definition.nextRunAt)} · Last: {formatDate(definition.lastRunAt)} · Catch-up: {definition.catchUpPolicy}</p>
                </div>
                <Button size="sm" variant="outline" disabled={definition.status !== "ACTIVE" || busyId === definition._id} onClick={() => void evaluateNow(definition)}>
                  <PlayCircle className="h-3.5 w-3.5" /> {busyId === definition._id ? "Evaluating…" : "Evaluate due gate"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
