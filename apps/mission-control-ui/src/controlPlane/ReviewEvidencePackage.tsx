import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type ReviewEvidencePackageData = {
  status: "READY" | "BLOCKED" | "INCOMPLETE";
  summary: string;
  nextAction: string;
  blockers: string[];
  identity: {
    runId: string;
    workOrderId: string | null;
    workOrderRevisionNumber: number | null;
    repositoryId: string | null;
    branch: string | null;
    baseSha: string | null;
    headSha: string | null;
    pullRequestUrl: string | null;
    pullRequestNumber: number | null;
  };
  ci: {
    status: string;
    runUrl: string | null;
    evaluationId: string | null;
    headSha: string | null;
    prState: string;
    lenses: Array<{ id: string; label: string; enabled: boolean; score?: number }>;
  };
  criteria: Array<{
    id: string;
    title: string;
    verificationMethod: string | null;
    status: string;
    receiptId: string | null;
    verifier: string | null;
    result: string | null;
    evidenceLocation: string | null;
    validUntil: number | null;
    integrityIssue: string | null;
  }>;
  changedFiles: string[];
  deviations: string[];
  failedChecks: string[];
  risks: string[];
  rollbackApproach: string | null;
  recovery: { attempts: number; staleRecoveries: number };
};

const packageTone = {
  READY: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  BLOCKED: "border-red-500/30 bg-red-500/10 text-red-200",
  INCOMPLETE: "border-amber-500/30 bg-amber-500/10 text-amber-200",
};

const evidenceTone: Record<string, string> = {
  PASS: "border-emerald-500/30 text-emerald-200",
  WAIVED: "border-sky-500/30 text-sky-200",
  FAIL: "border-red-500/30 text-red-200",
  STALE: "border-red-500/30 text-red-200",
  UNKNOWN: "border-red-500/30 text-red-200",
  PENDING: "border-amber-500/30 text-amber-200",
  MISSING: "border-amber-500/30 text-amber-200",
};

export function ReviewEvidencePackage({ review }: { review: ReviewEvidencePackageData }) {
  const StatusIcon = review.status === "READY" ? CheckCircle2 : review.status === "BLOCKED" ? AlertTriangle : Clock3;
  return (
    <Card id="run-review-package" className="scroll-mt-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <StatusIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <div className="text-sm font-medium text-foreground">Review evidence package</div>
            <p className="mt-1 text-sm text-muted-foreground">{review.summary}</p>
          </div>
        </div>
        <span className={`rounded border px-2 py-1 text-[10px] font-semibold tracking-wide ${packageTone[review.status]}`}>
          {review.status}
        </span>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--panel-line)] bg-background/30 px-3 py-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Next action</div>
        <p className="mt-1 text-sm text-foreground">{review.nextAction}</p>
      </div>

      {review.blockers.length > 0 ? (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-xs font-medium text-foreground">Required before review</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {review.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <PackageMeta label="WorkOrder revision" value={review.identity.workOrderRevisionNumber ? `v${review.identity.workOrderRevisionNumber}` : "—"} />
        <PackageMeta label="Branch" value={review.identity.branch ?? "—"} mono />
        <PackageMeta label="Base → head" value={[review.identity.baseSha?.slice(0, 10), review.identity.headSha?.slice(0, 10)].filter(Boolean).join(" → ") || "—"} mono />
        <PackageMeta label="Attempts / recoveries" value={`${review.recovery.attempts} / ${review.recovery.staleRecoveries}`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div>
          <div className="mb-2 text-xs font-medium text-foreground">Acceptance criteria</div>
          <div className="space-y-2">
            {review.criteria.length === 0 ? (
              <p className="rounded-lg border border-[var(--panel-line)] bg-background/30 p-3 text-sm text-muted-foreground">No criterion evidence is bound.</p>
            ) : review.criteria.map((criterion) => (
              <div key={criterion.id} className="rounded-lg border border-[var(--panel-line)] bg-background/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-foreground">{criterion.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {criterion.verificationMethod ?? "Method unspecified"} · {criterion.verifier ?? "Verifier missing"}
                    </div>
                  </div>
                  <Badge variant="outline" className={evidenceTone[criterion.status] ?? ""}>{criterion.status}</Badge>
                </div>
                {criterion.result ? <p className="mt-2 text-xs text-muted-foreground">{criterion.result}</p> : null}
                {criterion.integrityIssue ? (
                  <p role="alert" className="mt-2 text-xs text-red-200">{criterion.integrityIssue}</p>
                ) : null}
                {criterion.evidenceLocation ? (
                  <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-xs">
                    <a href={criterion.evidenceLocation} target="_blank" rel="noreferrer">Open evidence <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" /></a>
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--panel-line)] bg-background/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Exact-head CI</div>
              <div className="flex items-center gap-2"><Badge variant="outline">PR {review.ci.prState}</Badge><Badge variant="outline">{review.ci.status}</Badge></div>
            </div>
            <div className="mt-2 break-all font-mono text-xs text-muted-foreground">{review.ci.headSha ?? "No matching head SHA"}</div>
            {review.ci.runUrl ? <Button asChild size="sm" variant="outline" className="mt-3"><a href={review.ci.runUrl} target="_blank" rel="noreferrer">Open CI</a></Button> : null}
          </div>
          <PackageList label="Changed files" values={review.changedFiles} empty="No structured file lineage." mono />
          <PackageList label="Unresolved risks" values={review.risks} empty="No unresolved risks recorded." />
          <div className="rounded-lg border border-[var(--panel-line)] bg-background/30 p-3">
            <div className="text-xs font-medium text-foreground">Rollback guidance</div>
            <p className="mt-2 text-xs text-muted-foreground">{review.rollbackApproach ?? "No rollback guidance recorded."}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PackageMeta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div><div className={`mt-1 break-all text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</div></div>;
}

function PackageList({ label, values, empty, mono = false }: { label: string; values: string[]; empty: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--panel-line)] bg-background/30 p-3">
      <div className="text-xs font-medium text-foreground">{label}</div>
      {values.length > 0 ? <ul className={`mt-2 space-y-1 break-all text-xs text-muted-foreground ${mono ? "font-mono" : ""}`}>{values.slice(0, 8).map((value) => <li key={value}>• {value}</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">{empty}</p>}
    </div>
  );
}
