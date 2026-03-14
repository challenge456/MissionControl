/**
 * Quota fuel gauge — LLM usage %, reset countdown, burn rate.
 * Manual update flow: user pastes usage from provider dashboard.
 */

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function gaugeColor(pct: number): string {
  if (pct >= 80) return "var(--destructive)";
  if (pct >= 60) return "var(--color-status-needs-approval)";
  return "var(--primary)";
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
    const color = gaugeColor(pct);
    return (
      <>
        <button
          type="button"
          onClick={() => setUpdateOpen(true)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs border border-border/60 hover:bg-accent/50 transition-colors",
            className
          )}
          title={snapshot ? `Quota ${pct.toFixed(0)}% · ${formatCountdown(snapshot.resetAt)}` : "Update quota"}
        >
          <Gauge className="h-3.5 w-3.5" style={{ color }} />
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
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          LLM quota
        </span>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setUpdateOpen(true)}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Update
        </Button>
      </div>

      {!snapshot ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No quota data. Click Update and enter usage from your provider dashboard.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <ArcGauge value={snapshot.usagePct} className="h-20 w-20 shrink-0" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-2xl font-semibold tabular-nums" style={{ color: gaugeColor(snapshot.usagePct) }}>
                {snapshot.usagePct.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">{formatCountdown(snapshot.resetAt)}</p>
              {projected && (
                <p className="text-xs text-muted-foreground">
                  Burn rate: ~{projected.pctPerDay >= 0 ? projected.pctPerDay.toFixed(1) : "0"}% per day
                  {projected.projectedAtReset < 100 && (
                    <> · Projected {projected.projectedAtReset.toFixed(0)}% at reset</>
                  )}
                </p>
              )}
            </div>
          </div>
          {snapshot.usagePct < 60 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--primary)]">
              <Zap className="h-3.5 w-3.5" />
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
    </Card>
  );
}

function ArcGauge({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = gaugeColor(pct);
  const radius = 36;
  const stroke = 6;
  const circumference = Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <svg viewBox="0 0 80 44" className={cn("overflow-visible", className)} aria-hidden>
      <path
        d={`M ${80 - radius} 44 A ${radius} ${radius} 0 0 1 ${radius} 44`}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d={`M ${80 - radius} 44 A ${radius} ${radius} 0 0 1 ${radius} 44`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={0}
        style={{ transition: "stroke-dasharray 0.3s ease" }}
      />
    </svg>
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
