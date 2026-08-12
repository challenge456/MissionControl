import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ExecutionRecoveryData = {
  state: "WAITING" | "ACTIVE" | "CANCELING" | "RECOVERABLE" | "EXHAUSTED" | "RECOVERED" | "TERMINAL";
  nextAction: string;
  activeLease: boolean;
  leaseExpired: boolean;
  attempts: number;
  maxAttempts: number | null;
  attemptsRemaining: number | null;
  staleRecoveryCount: number;
  retryOfClaimId: string | null;
  retryReason: string | null;
  leaseExpiresAt: number | null;
  checkpointAt: number | null;
  checkpointSummary: string | null;
};

export function ExecutionRecoveryCard({ recovery }: { recovery: ExecutionRecoveryData }) {
  return (
    <Card className={recovery.state === "EXHAUSTED" || recovery.state === "RECOVERABLE" ? "border-amber-500/30 p-4" : "p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">Durable recovery</div>
          <p className="mt-1 text-xs text-muted-foreground">Lease, checkpoint, and bounded restart state for unattended execution.</p>
        </div>
        <Badge variant="outline">{recovery.state}</Badge>
      </div>
      <div className="mt-4 rounded-lg border border-[var(--panel-line)] bg-background/30 p-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Next action</div>
        <p className="mt-1 text-sm text-foreground">{recovery.nextAction}</p>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <RecoveryMeta label="Attempt budget" value={`${recovery.attempts}/${recovery.maxAttempts ?? "—"}`} />
        <RecoveryMeta label="Attempts remaining" value={recovery.attemptsRemaining === null ? "—" : String(recovery.attemptsRemaining)} />
        <RecoveryMeta label="Stale recoveries" value={String(recovery.staleRecoveryCount)} />
        <RecoveryMeta label="Lease expiry" value={recovery.leaseExpiresAt ? new Date(recovery.leaseExpiresAt).toLocaleString() : "Not leased"} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <RecoveryMeta label="Checkpoint" value={recovery.checkpointSummary ?? "No checkpoint recorded."} />
        <RecoveryMeta label="Latest recovery reason" value={recovery.retryReason ?? "No stale recovery recorded."} />
      </div>
    </Card>
  );
}

function RecoveryMeta({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div><div className="mt-1 break-words text-sm text-foreground">{value}</div></div>;
}
