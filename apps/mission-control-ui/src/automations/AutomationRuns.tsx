import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, statusTone } from "./automationModel";

export function AutomationRuns({ runs }: { runs: any[] }) {
  if (runs.length === 0) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">No Automation Runs yet. LEVEL_1 begins with an approval-gated WorkOrder.</Card>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--panel-line)]">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-card/70 text-[11px] uppercase tracking-[0.13em] text-muted-foreground">
          <tr>{["Automation", "WorkOrder", "Created", "State", "Workflow", "Approval", "Verification", "Receipt"].map((label) => <th key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--panel-line)]">
          {runs.map((run) => <tr key={run.workOrder._id} className="bg-card/30">
            <td className="px-3 py-3 font-medium text-foreground">{run.definition?.name ?? "Unknown Automation"}</td>
            <td className="px-3 py-3 text-muted-foreground">{run.workOrder.title}</td>
            <td className="px-3 py-3 text-muted-foreground">{formatDate(run.workOrder.createdAt)}</td>
            <td className="px-3 py-3"><Badge variant="outline" className={statusTone(run.workOrder.state)}>{run.workOrder.state}</Badge></td>
            <td className="px-3 py-3 text-muted-foreground">{run.workOrder.workflowId}@{run.workOrder.metadata?.automationWorkflowVersion}</td>
            <td className="px-3 py-3">{run.workOrder.approvalStatus}</td>
            <td className="px-3 py-3">{run.workOrder.verificationStatus}</td>
            <td className="px-3 py-3">{run.receipts.length ? `${run.receipts.length} attached` : "Missing"}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
