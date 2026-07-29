import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, statusTone } from "./automationModel";

export function AutomationReceipts({ receipts }: { receipts: any[] }) {
  if (receipts.length === 0) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">No Automation receipts yet. Missing evidence blocks reliability promotion.</Card>;
  return <div className="grid gap-3">
    {receipts.map((receipt) => (
      <Card key={receipt._id} className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-medium text-foreground">{receipt.automationName ?? "Automation receipt"}</div>
            <p className="mt-1 text-sm text-muted-foreground">{receipt.acceptanceCriterionId} · {receipt.verifier ?? "Unknown validator"}</p>
          </div>
          <Badge variant="outline" className={statusTone(receipt.status)}>{receipt.status}</Badge>
        </div>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span>Recorded: {formatDate(receipt.recordedAt)}</span>
          <span>Evidence: {receipt.evidenceLocation ?? receipt.artifactReference ?? "Incomplete"}</span>
          <span>Policy: independent receipt required</span>
        </div>
      </Card>
    ))}
  </div>;
}
