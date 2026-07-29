import { useState } from "react";
import { ArrowUpRight, ReceiptText } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, statusTone, workspacePath } from "./automationModel";

const FILTERS = ["ALL", "FRESH", "FAILED", "MISSING", "STALE", "EXPIRED", "WAIVED"] as const;

export function AutomationReceipts({ projectId, receipts }: { projectId: Id<"projects">; receipts: any[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const filtered = receipts.filter((receipt) =>
    filter === "ALL"
    || receipt.evidenceState === filter
    || (filter === "FAILED" && receipt.status === "FAILED")
  );
  if (receipts.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center">
        <ReceiptText className="mx-auto h-5 w-5 text-muted-foreground" />
        <h2 className="mt-3 text-sm font-semibold text-foreground">No independent verification receipts have been recorded</h2>
        <p className="mt-2 text-sm text-muted-foreground">Missing evidence will appear here as soon as an Automation review gate exists.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Receipt filters">
        {FILTERS.map((item) => (
          <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>
            {item} ({item === "ALL" ? receipts.length : receipts.filter((receipt) => receipt.evidenceState === item || (item === "FAILED" && receipt.status === "FAILED")).length})
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">No receipts match this filter.</Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((receipt) => (
            <Card key={receipt._id} className={receipt.evidenceState === "MISSING" ? "border-amber-500/25 p-4" : "p-4"}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-foreground">{receipt.automationName ?? "Automation receipt"}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{receipt.workOrderTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{receipt.criterionTitle ?? receipt.acceptanceCriterionId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={statusTone(receipt.evidenceState)}>{receipt.evidenceState}</Badge>
                  <Badge variant="outline" className={statusTone(receipt.status)}>{receipt.status}</Badge>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                <Item label="Validator" value={receipt.verifier ?? "Not recorded"} />
                <Item label="Evidence" value={receipt.evidenceLocation ?? receipt.artifactReference ?? "Missing"} />
                <Item label="Recorded" value={formatDate(receipt.recordedAt)} />
                <Item label="Valid until" value={formatDate(receipt.validUntil)} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <a href={workspacePath(`/v2/control-work-orders?workOrder=${receipt.workOrderId}`, projectId)} className="inline-flex items-center gap-1 text-registry-accent hover:text-foreground">Open WorkOrder <ArrowUpRight className="h-3 w-3" /></a>
                {receipt.evidenceLocation ? <a href={receipt.evidenceLocation} className="inline-flex items-center gap-1 text-registry-accent hover:text-foreground">Open evidence <ArrowUpRight className="h-3 w-3" /></a> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd className="mt-1 break-words text-foreground">{value}</dd></div>;
}
