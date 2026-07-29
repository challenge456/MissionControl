import { History, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, statusTone } from "./automationModel";

export function AutomationDecisions({
  decisions,
  definitions,
  onSelectDefinition,
}: {
  decisions: any[];
  definitions: any[];
  onSelectDefinition: (definitionId: string) => void;
}) {
  if (decisions.length === 0) {
    return (
      <Card className="border-dashed p-8 text-center">
        <History className="mx-auto h-5 w-5 text-muted-foreground" />
        <h2 className="mt-3 text-sm font-semibold text-foreground">No governance decisions recorded</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Candidate acceptance, rejection, activation, pause, suspension, and retirement will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-amber-400/20 bg-amber-400/[0.04] p-4">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Trusted-operator attribution</h2>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
              Actor labels are asserted by the trusted deployment and are not independently authenticated Mission Control identities.
            </p>
          </div>
        </div>
      </Card>
      <div className="overflow-x-auto rounded-xl border border-[var(--panel-line)]">
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="bg-card/70 text-[11px] uppercase tracking-[0.13em] text-muted-foreground">
            <tr>
              {["Automation", "Decision", "Actor", "Reason", "Policy", "Version", "Timestamp", "Result"].map((label) => (
                <th key={label} className="px-3 py-3 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-line)]">
            {decisions.map((decision) => {
              const definition = definitions.find((item) => item._id === decision.automationDefinitionId);
              return (
                <tr key={decision._id} className="bg-card/30 align-top">
                  <td className="px-3 py-3">
                    {definition ? (
                      <button
                        type="button"
                        onClick={() => onSelectDefinition(definition._id)}
                        className="font-medium text-foreground hover:text-registry-accent"
                      >
                        {definition.name}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{decision.candidateId ?? "Candidate decision"}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={statusTone(decision.decisionType)}>
                      {decision.decisionType}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-foreground">{decision.actorId}</div>
                    <div className="mt-1 text-[11px] text-amber-100/70">
                      {decision.actorIdentitySource ?? (decision.actorId.startsWith("automation-") ? "SYSTEM" : "LEGACY_UNSPECIFIED")}
                    </div>
                  </td>
                  <td className="max-w-[320px] px-3 py-3 text-muted-foreground">{decision.reason}</td>
                  <td className="px-3 py-3 text-muted-foreground">{decision.policyVersion}</td>
                  <td className="px-3 py-3 text-muted-foreground">v{decision.definitionVersion}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(decision.decidedAt)}</td>
                  <td className="px-3 py-3 text-muted-foreground">Recorded</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
