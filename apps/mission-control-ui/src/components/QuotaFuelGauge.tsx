/**
 * Quota fuel gauge — LLM usage %, reset countdown, burn rate.
 * Manual update flow: user pastes usage from provider dashboard.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Gauge, RefreshCw, Zap } from "lucide-react";

const PROVIDERS = ["anthropic", "openai", "google"] as const;

function formatCountdown(resetAt: number): string {
  const now = Date.now();
  if (resetAt <= now) return "Resets soon";
  const d = Math.floor((resetAt - now) / 86400000);
  const h = Math.floor(((resetAt - now) % 86400000) / 3600000);
  const m = Math.floor(((resetAt - now) % 3600000) / 60000);
  if (d > 0) return `Resets in ${d}d ${h}h ${m}m`;
  if (h > 0) return `Resets in ${h}h ${m}m`;
  return `Resets in ${m}m`;
}

function gaugeTextClass(pct: number): string {
  if (pct >= 80) return "text-err";
  if (pct >= 60) return "text-warn";
  return "text-ok";
}

function gaugeBarClass(pct: number): string {
  if (pct >= 80) return "bg-err";
  if (pct >= 60) return "bg-warn";
  return "bg-ok";
}

/** Flat quota bar with threshold ticks at 60% and 80%. */
function QuotaBar({ value }: { value: number }): JSX.Element {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="LLM quota used"
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-200", gaugeBarClass(pct))}
        style={{ width: `${pct}%` }}
      />
      {[60, 80].map((tick) => (
        <span
          key={tick}
          className="absolute inset-y-0 w-px bg-line-strong"
          style={{ left: `${tick}%` }}
          aria-hidden
        />
      ))}
    </div>
  );
}

interface QuotaFuelGaugeProps {
  /** Compact mode for TopNav inline gauge */
  compact?: boolean;
  className?: string;
}

export function QuotaFuelGauge({ compact = false, className }: QuotaFuelGaugeProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateUsagePct, setUpdateUsagePct] = useState("");
  const [updateResetAt, setUpdateResetAt] = useState("");
  const [updateProvider, setUpdateProvider] = useState<"anthropic" | "openai" | "google">("anthropic");
  const [updatePlanTier, setUpdatePlanTier] = useState("claude_max_200");
  const [updateTokensUsed, setUpdateTokensUsed] = useState("");
  const [updateTokensLimit, setUpdateTokensLimit] = useState("");

  const snapshot = useQuery(api.quotaTracking.getLatestSnapshot, {});
  const projected = useQuery(api.quotaTracking.getProjectedBurnRate, {});
  const upsert = useMutation(api.quotaTracking.upsertQuotaSnapshot);

  const handleUpdate = async () => {
    const pct = Number(updateUsagePct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    let resetAt = Date.now() + 7 * 86400 * 1000;
    if (updateResetAt.trim()) {
      const parsed = Date.parse(updateResetAt);
      if (!Number.isNaN(parsed)) resetAt = parsed;
    }
    const tokensUsed = updateTokensUsed.trim() ? Number(updateTokensUsed) : 0;
    const tokensLimit = updateTokensLimit.trim() ? Number(updateTokensLimit) : 1;
    try {
      await upsert({
        provider: updateProvider,
        planTier: updatePlanTier.trim() || "default",
        usagePct: pct,
        resetAt,
        tokensUsed,
        tokensLimit: tokensLimit || 1,
      });
      setUpdateOpen(false);
      setUpdateUsagePct("");
      setUpdateResetAt("");
    } catch (e) {
      console.error(e);
    }
  };

  if (compact) {
    const pct = snapshot?.usagePct ?? 0;
    return (
      <>
        <button
          type="button"
          onClick={() => setUpdateOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs text-ink-secondary transition-colors duration-150 hover:border-line-strong hover:text-ink",
            className
          )}
          title={snapshot ? `Quota ${pct.toFixed(0)}% · ${formatCountdown(snapshot.resetAt)}` : "Update quota"}
        >
          <Gauge className={cn("h-3.5 w-3.5", snapshot ? gaugeTextClass(pct) : "text-ink-muted")} strokeWidth={1.75} />
          <span className="font-medium tabular-nums">{snapshot ? `${pct.toFixed(0)}%` : "—"}</span>
        </button>
        <UpdateQuotaDialog
          open={updateOpen}
          onOpenChange={setUpdateOpen}
          provider={updateProvider}
          setProvider={setUpdateProvider}
          planTier={updatePlanTier}
          setPlanTier={setUpdatePlanTier}
          usagePct={updateUsagePct}
          setUsagePct={setUpdateUsagePct}
          resetAt={updateResetAt}
          setResetAt={setUpdateResetAt}
          tokensUsed={updateTokensUsed}
          setTokensUsed={setUpdateTokensUsed}
          tokensLimit={updateTokensLimit}
          setTokensLimit={setUpdateTokensLimit}
          onSave={handleUpdate}
        />
      </>
    );
  }

  return (
    <div className={cn("rounded-xl border border-line bg-surface-1 p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Gauge className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
          LLM quota
        </span>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setUpdateOpen(true)}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Update
        </Button>
      </div>

      {!snapshot ? (
        <div className="py-4 text-center text-[13px] text-ink-muted">
          No quota data. Click Update and enter usage from your provider dashboard.
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className={cn("text-[20px] font-semibold leading-none tabular-nums", gaugeTextClass(snapshot.usagePct))}>
              {snapshot.usagePct.toFixed(1)}%
            </p>
            <p className="text-[12px] text-ink-muted">{formatCountdown(snapshot.resetAt)}</p>
          </div>
          <div className="mt-2.5">
            <QuotaBar value={snapshot.usagePct} />
          </div>
          {projected && (
            <p className="mt-2 text-[12px] text-ink-muted">
              Burn rate: ~{projected.pctPerDay >= 0 ? projected.pctPerDay.toFixed(1) : "0"}% per day
              {projected.projectedAtReset < 100 && (
                <> · Projected {projected.projectedAtReset.toFixed(0)}% at reset</>
              )}
            </p>
          )}
          {snapshot.usagePct < 60 && (
            <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-secondary">
              <Zap className="h-3.5 w-3.5 text-ok" strokeWidth={1.75} />
              Available for background work — scheduler can run low-priority jobs.
            </div>
          )}
        </>
      )}

      <UpdateQuotaDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        provider={updateProvider}
        setProvider={setUpdateProvider}
        planTier={updatePlanTier}
        setPlanTier={setUpdatePlanTier}
        usagePct={updateUsagePct}
        setUsagePct={setUpdateUsagePct}
        resetAt={updateResetAt}
        setResetAt={setUpdateResetAt}
        tokensUsed={updateTokensUsed}
        setTokensUsed={setUpdateTokensUsed}
        tokensLimit={updateTokensLimit}
        setTokensLimit={setUpdateTokensLimit}
        onSave={handleUpdate}
      />
    </div>
  );
}

function UpdateQuotaDialog({
  open,
  onOpenChange,
  provider,
  setProvider,
  planTier,
  setPlanTier,
  usagePct,
  setUsagePct,
  resetAt,
  setResetAt,
  tokensUsed,
  setTokensUsed,
  tokensLimit,
  setTokensLimit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: "anthropic" | "openai" | "google";
  setProvider: (p: "anthropic" | "openai" | "google") => void;
  planTier: string;
  setPlanTier: (s: string) => void;
  usagePct: string;
  setUsagePct: (s: string) => void;
  resetAt: string;
  setResetAt: (s: string) => void;
  tokensUsed: string;
  setTokensUsed: (s: string) => void;
  tokensLimit: string;
  setTokensLimit: (s: string) => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update quota</DialogTitle>
          <DialogDescription>
            Enter current usage from your provider dashboard (e.g. Claude usage page). Scheduler uses this for quota-aware runs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label className="text-xs">Provider</Label>
            <Select value={provider} onValueChange={(v: "anthropic" | "openai" | "google") => setProvider(v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Plan tier</Label>
            <Input
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              placeholder="e.g. claude_max_200"
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Usage % (0–100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={usagePct}
              onChange={(e) => setUsagePct(e.target.value)}
              placeholder="e.g. 45"
              className="h-8"
            />
          </div>
          <div>
            <Label className="text-xs">Reset at (optional, ISO or date)</Label>
            <Input
              value={resetAt}
              onChange={(e) => setResetAt(e.target.value)}
              placeholder="e.g. Saturday 10pm or ISO date"
              className="h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tokens used (optional)</Label>
              <Input
                type="number"
                value={tokensUsed}
                onChange={(e) => setTokensUsed(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Tokens limit (optional)</Label>
              <Input
                type="number"
                value={tokensLimit}
                onChange={(e) => setTokensLimit(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
