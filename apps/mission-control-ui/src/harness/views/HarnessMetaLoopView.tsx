import { useAction, useQuery } from "convex/react";
import { Inbox } from "lucide-react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { HarnessPage } from "../components/HarnessUi";
import { HarnessAutomatePanel } from "../components/HarnessAutomatePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MainView } from "../../TopNav";

export function HarnessMetaLoopView({
  projectId,
  onNavigate,
}: {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
}): JSX.Element {
  return (
    <HarnessPage
      title="Loop Engineering"
      description="Evidence-backed improvements from real execution, review, and measurement signals."
      icon={<Inbox className="h-5 w-5 text-registry-accent" />}
    >
      <MetaLoopInboxPanel projectId={projectId} onNavigate={onNavigate} />
    </HarnessPage>
  );
}

export function MetaLoopInboxPanel({
  projectId,
  onNavigate,
}: {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: MainView) => void;
}): JSX.Element {
  const inbox = useQuery(api.factory.metaLoop.listInbox, {
    projectId: projectId ?? undefined,
    status: "OPEN",
  });
  const history = useQuery(api.factory.metaLoop.listHistory, { projectId: projectId ?? undefined, limit: 10 });
  const resolve = useAction(api.factory.metaLoop.resolve);
  const [dismissReasons, setDismissReasons] = useState<Record<string, string>>({});

  return (
      <section className="space-y-3" aria-labelledby="meta-improvements-title">
        <div>
          <h2 id="meta-improvements-title" className="text-[18px] font-semibold text-ink">Meta improvements</h2>
          <p className="mt-1 text-sm text-ink-secondary">Real failures become deduplicated proposals; acceptance creates governed work, never a direct policy change.</p>
        </div>
        {!inbox ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : inbox.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface-1 px-6 py-10 text-center">
            <h2 className="text-[17px] font-semibold text-ink">No evidence-backed improvements</h2>
            <p className="mx-auto mt-2 max-w-[62ch] text-sm text-ink-secondary">
              This is a truthful empty state. Failed Attempts, CI failures, rejected decisions, and repeated governed work will create deduplicated proposals here.
            </p>
          </div>
        ) : (
          inbox.map((s) => (
            <div key={s._id} className="rounded-xl border border-line bg-surface-1 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] uppercase text-ink-muted">{s.kind}</span>
                  <h3 className="mt-2 font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-secondary">{s.summary}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {s.evidenceCount ?? 1} evidence item(s) · confidence {Math.round((s.confidence ?? 0.5) * 100)}%
                    {s.affectedSurface ? ` · ${s.affectedSurface}` : ""}
                    {s.impact ? ` · impact ${s.impact}` : ""}
                  </p>
                  {s.sourceRef && (
                    <p className="mt-1 text-xs text-ink-muted">
                      Lineage: {s.sourceRef}
                      {s.kind === "EVAL_SCENARIO" ? " → accept creates approval-gated implementation work" : ""}
                      {s.kind === "DELEGATION" && s.payload?.type === "REPETITIVE_TASK_AUTOMATION"
                        ? " → accept creates approval-gated automation work"
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex min-w-[250px] flex-col gap-2">
                  <Button size="sm" onClick={() => void resolve({ suggestionId: s._id, action: "ACCEPT", actorId: "operator" })}>
                    Accept
                  </Button>
                  <Input
                    value={dismissReasons[s._id] ?? ""}
                    onChange={(event) => setDismissReasons((current) => ({ ...current, [s._id]: event.target.value }))}
                    placeholder="Dismissal reason required"
                    aria-label={`Dismissal reason for ${s.title}`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!dismissReasons[s._id]?.trim()}
                    onClick={() => void resolve({ suggestionId: s._id, action: "DISMISS", actorId: "operator", reason: dismissReasons[s._id] })}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        <HarnessAutomatePanel
          projectId={projectId}
          skillName="meta-loop-scan"
          schedule="0 7 * * *"
          onNavigate={onNavigate}
        />
        {(history?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-line bg-surface-1 p-4">
            <h3 className="text-[15px] font-semibold text-ink">Improvement history</h3>
            <ul className="mt-3 divide-y divide-line">
              {history?.map((item) => (
                <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <div className="font-medium text-ink">{item.title}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {item.workOrderId ? `WorkOrder ${String(item.workOrderId).slice(0, 10)} · ` : ""}
                      {item.evidenceCount ?? 1} evidence item(s)
                    </div>
                  </div>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-secondary">{item.status.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
  );
}
