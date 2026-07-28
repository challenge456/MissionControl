import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RunRecoveryPanel({
  runId,
  failureSummary,
  busy = false,
  onRetry,
}: {
  runId: string;
  failureSummary?: string | null;
  busy?: boolean;
  onRetry?: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recoveryStarted, setRecoveryStarted] = useState(false);
  const normalizedReason = reason.trim();

  useEffect(() => {
    setReason("");
    setError(null);
    setRecoveryStarted(false);
  }, [runId]);

  if (!onRetry) {
    return (
      <div className="rounded-lg border border-line bg-surface-2 p-4">
        <div className="text-[13px] font-medium text-ink">Recovery requires the linked WorkOrder</div>
        <p className="mt-1 text-[12.5px] text-ink-secondary">
          Open this run from Work Orders to start a governed recovery attempt.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-err/30 bg-err-soft p-4" aria-live="polite">
      <div className="flex items-start gap-3">
        <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-err" strokeWidth={1.7} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-ink">Start a recovery run</div>
          <p className="mt-1 text-[12.5px] leading-5 text-ink-secondary">
            This creates a new run from the current WorkOrder. The failed run, error, timeline, and artifacts remain unchanged.
          </p>
          {failureSummary ? (
            <div className="mt-3 rounded-lg border border-line bg-surface-1 px-3 py-2 text-[12.5px] text-ink-secondary">
              <span className="font-medium text-ink">Original failure:</span> {failureSummary}
            </div>
          ) : null}

          {recoveryStarted ? (
            <div className="mt-3 rounded-lg border border-ok/30 bg-ok-soft px-3 py-2 text-[12.5px] text-ok">
              Recovery run created. The original failure remains available in this inspector.
            </div>
          ) : (
            <div className="mt-4">
              <Label htmlFor={`recovery-reason-${runId}`} className="text-[12.5px] text-ink">
                What changed before retrying?
              </Label>
              <Textarea
                id={`recovery-reason-${runId}`}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError(null);
                }}
                placeholder="Describe the correction, new evidence, or operator intervention."
                className="mt-2 min-h-20 border-line bg-surface-1 text-[13px]"
                aria-describedby={error ? `recovery-error-${runId}` : undefined}
                aria-invalid={!!error}
              />
              {error ? (
                <p id={`recovery-error-${runId}`} className="mt-2 text-[12px] text-err">
                  {error}
                </p>
              ) : (
                <p className="mt-2 text-[12px] text-ink-muted">
                  A reason of at least 10 characters is retained in the audit trail.
                </p>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  disabled={busy || normalizedReason.length < 10}
                  onClick={async () => {
                    setError(null);
                    try {
                      await onRetry(normalizedReason);
                      setRecoveryStarted(true);
                    } catch (caught) {
                      setError(caught instanceof Error ? caught.message : "Recovery run could not be created.");
                    }
                  }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.7} aria-hidden />
                  {busy ? "Starting recovery…" : "Retry as new run"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
