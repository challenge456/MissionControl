import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useToast } from "../../Toast";
import { StatusBadge } from "@/components/factory/badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  CirclePause,
  ExternalLink,
  FlaskConical,
  History,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react";

type ResearchSource = Doc<"researchSources">;
type SourceKind = ResearchSource["kind"];
type Cadence = ResearchSource["schedule"]["cadence"];

const DEFAULTS = {
  cadence: "DAILY" as Cadence,
  timezone: "America/Los_Angeles",
  freshnessTargetMinutes: "1440",
  maxItemsPerRun: "20",
  monthlyCostCeilingUsd: "5",
  retentionDays: "90",
  allowedContentClasses: "Public article or feed item",
  exclusions: "Paywalled or authenticated content\nPersonal or sensitive data\nInstruction-like content",
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stateTone(state: ResearchSource["state"]) {
  if (state === "ACTIVE") return "success" as const;
  if (state === "VERIFIED") return "info" as const;
  if (state === "DEGRADED" || state === "REVOKED") return "error" as const;
  if (state === "PAUSED") return "warning" as const;
  return "neutral" as const;
}

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function formatTime(value?: number) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "Never";
}

function safeCanonicalUrl(value?: string) {
  return value?.startsWith("https://") ? value : undefined;
}

export function ResearchWatchlistPanel({ projectId }: { projectId: Id<"projects"> }) {
  const sources = useQuery(api.researchSources.listByProject, { projectId });
  const createDraft = useMutation(api.researchSources.createDraft);
  const validateSource = useMutation(api.researchSources.validate);
  const acknowledgePolicy = useMutation(api.researchSources.acknowledgePolicy);
  const activate = useMutation(api.researchSources.activate);
  const pause = useMutation(api.researchSources.pause);
  const retire = useMutation(api.researchSources.retire);
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<Id<"researchSources"> | null>(null);
  const [busySourceId, setBusySourceId] = useState<Id<"researchSources"> | "create" | null>(null);
  const events = useQuery(
    api.researchSources.listEvents,
    selectedSourceId ? { projectId, sourceId: selectedSourceId } : "skip",
  );

  const counts = useMemo(() => ({
    active: sources?.filter((source) => source.state === "ACTIVE").length ?? 0,
    review: sources?.filter((source) => ["DRAFT", "VERIFIED"].includes(source.state)).length ?? 0,
    exceptions: sources?.filter((source) => ["DEGRADED", "REVOKED"].includes(source.state)).length ?? 0,
  }), [sources]);

  const run = async (
    sourceId: Id<"researchSources">,
    operation: () => Promise<unknown>,
    success: string,
  ) => {
    setBusySourceId(sourceId);
    try {
      await operation();
      toast(success);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Research source action failed", true);
    } finally {
      setBusySourceId(null);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-surface-1" aria-labelledby="research-watchlist-heading">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-registry-accent" aria-hidden />
            <h2 id="research-watchlist-heading" className="text-[15px] font-semibold text-ink">
              Research Watchlist
            </h2>
            <StatusBadge tone="info">Source authority</StatusBadge>
          </div>
          <p className="mt-1.5 max-w-[78ch] text-[12.5px] text-ink-secondary">
            Approve exact public sources, limits, and retention before any future collection. Phase 1 validates authority only; fetching and schedules are off.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add source
        </Button>
      </div>

      <div className="grid border-b border-line sm:grid-cols-3">
        <WatchMetric label="Active authority" value={counts.active} tone="text-ok" />
        <WatchMetric label="Needs decision" value={counts.review} tone="text-info-accent" />
        <WatchMetric label="Exceptions" value={counts.exceptions} tone={counts.exceptions ? "text-err" : "text-ink"} />
      </div>

      {sources === undefined ? (
        <div className="space-y-3 p-5" aria-label="Loading research sources">
          <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
          <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
        </div>
      ) : sources.length === 0 ? (
        <div className="px-6 py-9 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-ink-muted" aria-hidden />
          <h3 className="mt-3 text-sm font-medium text-ink">No approved source authority</h3>
          <p className="mx-auto mt-1 max-w-[58ch] text-[12.5px] text-ink-secondary">
            Add one public website or RSS feed. Mission Control will preview the exact host and policy envelope without making a network request.
          </p>
          <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
            Add the first source
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {sources.map((source) => (
            <SourceRow
              key={source._id}
              source={source}
              busy={busySourceId === source._id}
              selected={selectedSourceId === source._id}
              onSelect={() => setSelectedSourceId((current) => current === source._id ? null : source._id)}
              onValidate={() => void run(
                source._id,
                () => validateSource({ projectId, sourceId: source._id }),
                "Source validation recorded",
              )}
              onApprove={() => void run(
                source._id,
                () => acknowledgePolicy({
                  projectId,
                  sourceId: source._id,
                  acknowledgement: "Operator confirms this exact source, scope, limits, exclusions, and retention policy.",
                }),
                "Source policy approved",
              )}
              onActivate={() => void run(
                source._id,
                () => activate({ projectId, sourceId: source._id }),
                source.state === "PAUSED" ? "Source authority resumed" : "Source authority activated",
              )}
              onPause={() => void run(
                source._id,
                () => pause({
                  projectId,
                  sourceId: source._id,
                  reason: source.state === "DEGRADED"
                    ? "Operator quarantined degraded source authority."
                    : "Operator paused source authority from the Research Watchlist.",
                }),
                "Source authority paused",
              )}
              onRetire={() => void run(
                source._id,
                () => retire({
                  projectId,
                  sourceId: source._id,
                  reason: "Operator retired source authority from the Research Watchlist.",
                }),
                "Source authority retired",
              )}
            />
          ))}
        </div>
      )}

      {selectedSourceId && (
        <div className="border-t border-line bg-surface-2/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
              Immutable decisions
            </h3>
          </div>
          {events === undefined ? (
            <p className="mt-3 text-[12.5px] text-ink-secondary">Loading decision history…</p>
          ) : events.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-ink-secondary">No decision events recorded.</p>
          ) : (
            <ol className="mt-3 grid gap-2 lg:grid-cols-2">
              {events.slice(0, 6).map((event) => (
                <li key={event._id} className="rounded-lg border border-line bg-surface-1 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-ink">{humanize(event.eventType)}</span>
                    <time className="text-[11px] text-ink-muted">{formatTime(event.createdAt)}</time>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11.5px] text-ink-secondary">{event.reason}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <CreateSourceDialog
        open={createOpen}
        projectId={projectId}
        busy={busySourceId === "create"}
        onClose={() => setCreateOpen(false)}
        onCreate={async (values) => {
          setBusySourceId("create");
          try {
            await createDraft({
              projectId,
              ...values,
              idempotencyKey: `research-source:${projectId}:${crypto.randomUUID()}`,
            });
            setCreateOpen(false);
            toast("Research source draft created");
          } catch (error) {
            toast(error instanceof Error ? error.message : "Research source creation failed", true);
          } finally {
            setBusySourceId(null);
          }
        }}
      />
    </section>
  );
}

function WatchMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="border-line px-5 py-3 sm:border-r sm:last:border-r-0">
      <div className={`font-mono text-xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-ink-muted">{label}</div>
    </div>
  );
}

function SourceRow({
  source,
  busy,
  selected,
  onSelect,
  onValidate,
  onApprove,
  onActivate,
  onPause,
  onRetire,
}: {
  source: ResearchSource;
  busy: boolean;
  selected: boolean;
  onSelect: () => void;
  onValidate: () => void;
  onApprove: () => void;
  onActivate: () => void;
  onPause: () => void;
  onRetire: () => void;
}) {
  const needsResolution = source.validationStatus === "PROVIDER_RESOLUTION_REQUIRED";
  const canRetire = ["DRAFT", "VERIFIED", "PAUSED", "DEGRADED"].includes(source.state);
  return (
    <article className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onSelect} className="min-h-6 text-left text-sm font-semibold text-ink hover:underline">
              {source.displayName}
            </button>
            <StatusBadge tone={stateTone(source.state)}>{humanize(source.state)}</StatusBadge>
            <StatusBadge tone={source.validationStatus === "PASSED" ? "success" : needsResolution ? "warning" : "neutral"}>
              {humanize(source.validationStatus)}
            </StatusBadge>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-ink-secondary">
            <span>{humanize(source.kind)}</span>
            <span aria-hidden>·</span>
            {safeCanonicalUrl(source.canonicalUrl) ? (
              <a
                href={safeCanonicalUrl(source.canonicalUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-1 text-info-accent hover:underline"
              >
                <span className="truncate">{source.canonicalUrl}</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              </a>
            ) : (
              <span className="truncate">{source.locator}</span>
            )}
          </div>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-ink-muted">
            <div><dt className="inline">Cadence </dt><dd className="inline text-ink-secondary">{humanize(source.schedule.cadence)}</dd></div>
            <div><dt className="inline">Item cap </dt><dd className="inline text-ink-secondary">{source.maxItemsPerRun}</dd></div>
            <div><dt className="inline">Spend cap </dt><dd className="inline text-ink-secondary">${source.monthlyCostCeilingUsd.toFixed(2)}/mo</dd></div>
            <div><dt className="inline">Retention </dt><dd className="inline text-ink-secondary">{source.retentionDays}d</dd></div>
            <div><dt className="inline">Last success </dt><dd className="inline text-ink-secondary">{formatTime(source.lastSuccessfulRunAt)}</dd></div>
          </dl>
          {source.validationMessage && source.validationStatus !== "PASSED" && (
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-warn">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {source.validationMessage}
            </p>
          )}
          {source.state === "DEGRADED" && (
            <p className="mt-2 text-[11.5px] text-err" role="alert">
              Collection authority is quarantined: {source.lastError ?? "Policy or credential failure requires review."}
            </p>
          )}
          {source.state === "RETIRED" && (
            <p className="mt-2 text-[11.5px] text-ink-muted">
              This authority is retained for audit history and cannot be reactivated.
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {busy && <Loader2 className="mt-2 h-4 w-4 animate-spin text-ink-muted" aria-label="Saving" />}
          {source.state === "DRAFT" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onValidate}>Validate</Button>
          )}
          {source.state === "VERIFIED" && source.policyReviewState !== "APPROVED" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onApprove}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Approve policy
            </Button>
          )}
          {source.state === "VERIFIED" && source.policyReviewState === "APPROVED" && (
            <Button size="sm" variant="success" disabled={busy} onClick={onActivate}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Activate authority
            </Button>
          )}
          {source.state === "ACTIVE" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onPause}>
              <CirclePause className="h-3.5 w-3.5" />
              Pause
            </Button>
          )}
          {source.state === "PAUSED" && (
            <Button size="sm" variant="success" disabled={busy} onClick={onActivate}>Resume</Button>
          )}
          {source.state === "DEGRADED" && (
            <Button size="sm" variant="warning" disabled={busy} onClick={onPause}>Pause authority</Button>
          )}
          {canRetire && source.state !== "DRAFT" && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={onRetire}>Retire</Button>
          )}
        </div>
      </div>
      {selected && <span className="sr-only">Decision history expanded</span>}
    </article>
  );
}

function CreateSourceDialog({
  open,
  projectId,
  busy,
  onClose,
  onCreate,
}: {
  open: boolean;
  projectId: Id<"projects">;
  busy: boolean;
  onClose: () => void;
  onCreate: (values: {
    kind: SourceKind;
    locator: string;
    displayName: string;
    cadence: Cadence;
    timezone: string;
    freshnessTargetMinutes: number;
    maxItemsPerRun: number;
    monthlyCostCeilingUsd: number;
    retentionDays: number;
    allowedContentClasses: string[];
    exclusions: string[];
  }) => Promise<void>;
}) {
  const [kind, setKind] = useState<SourceKind>("RSS_ATOM");
  const [locator, setLocator] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [cadence, setCadence] = useState<Cadence>(DEFAULTS.cadence);
  const [timezone, setTimezone] = useState(DEFAULTS.timezone);
  const [freshnessTargetMinutes, setFreshnessTargetMinutes] = useState(DEFAULTS.freshnessTargetMinutes);
  const [maxItemsPerRun, setMaxItemsPerRun] = useState(DEFAULTS.maxItemsPerRun);
  const [monthlyCostCeilingUsd, setMonthlyCostCeilingUsd] = useState(DEFAULTS.monthlyCostCeilingUsd);
  const [retentionDays, setRetentionDays] = useState(DEFAULTS.retentionDays);
  const [allowedContentClasses, setAllowedContentClasses] = useState(DEFAULTS.allowedContentClasses);
  const [exclusions, setExclusions] = useState(DEFAULTS.exclusions);
  const preview = useQuery(
    api.researchSources.previewValidation,
    open && locator.trim() ? { projectId, kind, locator } : "skip",
  );
  const numbersValid = [freshnessTargetMinutes, maxItemsPerRun, monthlyCostCeilingUsd, retentionDays]
    .every((value) => value.trim() !== "" && Number.isFinite(Number(value)));

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Research Watchlist source</DialogTitle>
          <DialogDescription>
            Preview an exact provider identity and bounded policy envelope. This creates a draft only and makes no network request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="research-source-kind">Source type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as SourceKind)}>
                <SelectTrigger id="research-source-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RSS_ATOM">RSS or Atom feed</SelectItem>
                  <SelectItem value="WEBSITE">Public website</SelectItem>
                  <SelectItem value="X_USER">X creator</SelectItem>
                  <SelectItem value="YOUTUBE_CHANNEL">YouTube channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="research-source-name">Display name</Label>
              <Input id="research-source-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="OpenAI product updates" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="research-source-locator">Exact public URL or provider handle</Label>
            <Input
              id="research-source-locator"
              value={locator}
              onChange={(event) => setLocator(event.target.value)}
              placeholder={kind === "X_USER" ? "@OpenAI" : kind === "YOUTUBE_CHANNEL" ? "https://www.youtube.com/@OpenAI" : "https://example.com/feed.xml"}
            />
          </div>

          {locator.trim() && (
            <div className="rounded-lg border border-line bg-surface-2 px-4 py-3" aria-live="polite">
              {preview === undefined ? (
                <p className="flex items-center gap-2 text-[12px] text-ink-secondary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Validating exact target…
                </p>
              ) : preview.valid ? (
                <div>
                  <p className="flex items-center gap-2 text-[12px] font-medium text-ok">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {preview.activatable ? "Eligible for governed verification" : "Valid draft; provider identity resolution still required"}
                  </p>
                  <dl className="mt-2 grid gap-1 text-[11.5px] text-ink-secondary sm:grid-cols-2">
                    <div><dt className="inline text-ink-muted">Canonical target: </dt><dd className="inline break-all">{preview.canonicalUrl ?? "Pending"}</dd></div>
                    <div><dt className="inline text-ink-muted">Host allowlist: </dt><dd className="inline">{preview.networkPolicy.exactHostAllowlist.join(", ") || "Pending"}</dd></div>
                  </dl>
                  {preview.warnings.map((warning) => <p key={warning} className="mt-2 text-[11.5px] text-warn">{warning}</p>)}
                </div>
              ) : (
                <div role="alert">
                  <p className="flex items-center gap-2 text-[12px] font-medium text-err">
                    <AlertTriangle className="h-3.5 w-3.5" /> Target rejected
                  </p>
                  {preview.errors.map((error) => <p key={error} className="mt-1 text-[11.5px] text-err">{error}</p>)}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="research-source-cadence">Authorized cadence</Label>
              <Select value={cadence} onValueChange={(value) => setCadence(value as Cadence)}>
                <SelectTrigger id="research-source-cadence"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual only</SelectItem>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="research-source-timezone">Timezone</Label>
              <Input id="research-source-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField id="research-source-freshness" label="Freshness (min)" min={15} value={freshnessTargetMinutes} onChange={setFreshnessTargetMinutes} />
            <NumberField id="research-source-item-cap" label="Items per run" min={1} max={100} value={maxItemsPerRun} onChange={setMaxItemsPerRun} />
            <NumberField id="research-source-spend" label="Spend cap ($/mo)" min={0} step="0.01" value={monthlyCostCeilingUsd} onChange={setMonthlyCostCeilingUsd} />
            <NumberField id="research-source-retention" label="Retention (days)" min={1} max={3650} value={retentionDays} onChange={setRetentionDays} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="research-source-content">Allowed content classes (one per line)</Label>
            <Textarea id="research-source-content" value={allowedContentClasses} onChange={(event) => setAllowedContentClasses(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="research-source-exclusions">Explicit exclusions (one per line)</Label>
            <Textarea id="research-source-exclusions" value={exclusions} onChange={(event) => setExclusions(event.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={
              busy
              || !displayName.trim()
              || !preview?.valid
              || !numbersValid
              || !timezone.trim()
              || splitLines(allowedContentClasses).length === 0
              || splitLines(exclusions).length === 0
            }
            onClick={() => void onCreate({
              kind,
              locator,
              displayName,
              cadence,
              timezone,
              freshnessTargetMinutes: Number(freshnessTargetMinutes),
              maxItemsPerRun: Number(maxItemsPerRun),
              monthlyCostCeilingUsd: Number(monthlyCostCeilingUsd),
              retentionDays: Number(retentionDays),
              allowedContentClasses: splitLines(allowedContentClasses),
              exclusions: splitLines(exclusions),
            })}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create governed draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max?: number;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
