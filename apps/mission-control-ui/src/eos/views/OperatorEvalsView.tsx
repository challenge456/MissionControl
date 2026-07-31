import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "../../components/factory/DetailLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Loader2,
  Play,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "../../lib/utils";

const DIMENSION_LABELS: Record<string, string> = {
  attention: "Attention",
  authority: "Authority",
  policy: "Policy",
  grounding: "Grounding",
  dispatch: "Dispatch",
  proof: "Proof",
  closure: "Closure",
  durability: "Durability",
};

function metricTone(value?: number | null) {
  if (value == null) return "text-muted-foreground";
  if (value >= 90) return "text-emerald-300";
  if (value >= 75) return "text-amber-200";
  return "text-red-300";
}

function MetricCard({ icon: Icon, label, value, note }: { icon: typeof Gauge; label: string; value: string | number; note: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{note}</div>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11.5px]"><span className="text-muted-foreground">{label}</span><span className={cn("font-mono", metricTone(value))}>{value}</span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background/70"><div className={cn("h-full rounded-full", value >= 90 ? "bg-emerald-400" : value >= 75 ? "bg-amber-300" : "bg-red-400")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
    </div>
  );
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function OperatorEvalsView({ projectId }: { projectId: Id<"projects"> }): JSX.Element {
  const dashboard = useQuery(api.operatorEvals.getDashboard, { projectId });
  const seedV1 = useMutation(api.operatorEvals.seedV1);
  const runStructuralProxy = useMutation(api.operatorEvals.runStructuralProxy);
  const recordHumanObservation = useMutation(api.operatorEvals.recordHumanObservation);
  const [busy, setBusy] = useState<"seed" | "run" | "observe" | null>(null);
  const [message, setMessage] = useState<{ error?: boolean; text: string } | null>(null);
  const [observationScenarioId, setObservationScenarioId] = useState<string | null>(null);
  const [operatorRef, setOperatorRef] = useState("");
  const [decision, setDecision] = useState("");
  const [evidence, setEvidence] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [notes, setNotes] = useState("");

  const latest = dashboard?.latestRun ?? null;
  const dimensionEntries = useMemo(
    () => Object.entries((latest?.dimensionScores ?? {}) as Record<string, number>),
    [latest]
  );

  async function seed() {
    try {
      setBusy("seed"); setMessage(null);
      const result = await seedV1({ projectId, actorId: "operator" });
      setMessage({ text: result.createdScenarios ? `Fleet Operator contract seeded with ${result.createdScenarios} scenarios.` : "Fleet Operator contract is already current." });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Could not seed the operator eval contract." });
    } finally { setBusy(null); }
  }

  async function runProxy() {
    if (!dashboard?.persona) return;
    try {
      setBusy("run"); setMessage(null);
      await runStructuralProxy({ projectId, personaId: dashboard.persona._id, idempotencyKey: `operator-proxy:${dashboard.persona._id}:${Date.now()}`, actorId: "operator" });
      setMessage({ text: "Structural proxy completed. It validates the eval contract, not human behavior." });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Structural proxy failed." });
    } finally { setBusy(null); }
  }

  async function saveObservation() {
    if (!dashboard?.persona || !observationScenarioId) return;
    if (!operatorRef.trim() || !decision.trim()) {
      setMessage({ error: true, text: "Operator reference and observed decision are required." });
      return;
    }
    try {
      setBusy("observe"); setMessage(null);
      await recordHumanObservation({
        projectId,
        personaId: dashboard.persona._id,
        scenarioId: observationScenarioId as Id<"operatorEvalScenarios">,
        sessionKey: `operator-session:${observationScenarioId}:${crypto.randomUUID()}`,
        operatorRef: operatorRef.trim(),
        decision: decision.trim(),
        evidenceRequired: evidence.split("\n").map((line) => line.trim()).filter(Boolean),
        assumptions: assumptions.split("\n").map((line) => line.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
      });
      setObservationScenarioId(null); setOperatorRef(""); setDecision(""); setEvidence(""); setAssumptions(""); setNotes("");
      setMessage({ text: "Human observation recorded. It contributes to calibration; it does not change production policy." });
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Human observation could not be recorded." });
    } finally { setBusy(null); }
  }

  return (
    <div className="relative flex-1 overflow-auto bg-app">
      <PageHeader
        title="Operator Evals"
        description="Pressure-test the governed operator loop with fixed scenarios, explicit rubrics, durability variants, and human calibration."
        actions={dashboard?.persona ? <Button size="sm" onClick={runProxy} disabled={busy !== null}><Play className="mr-1.5 h-3.5 w-3.5" />{busy === "run" ? "Running…" : "Run structural proxy"}</Button> : undefined}
      />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-8 py-6">
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[12.5px] leading-relaxed text-amber-100">
          Synthetic personas are forecasts. Proxy runs check whether this evaluation is grounded and durable; only real operator sessions can calibrate behavioral claims.
        </div>
        {message ? <div role={message.error ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-[12.5px]", message.error ? "border-red-500/30 bg-red-500/[0.07] text-red-200" : "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200")}>{message.text}</div> : null}

        {dashboard === undefined ? (
          <Card className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading operator evaluation contract…</Card>
        ) : dashboard === null ? (
          <Card className="p-10 text-center">
            <FlaskConical className="mx-auto h-6 w-6 text-cyan-200" />
            <h2 className="mt-3 text-base font-semibold text-foreground">No operator eval contract in this workspace</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Seed one grounded Fleet Operator and eight fixed scenarios. This creates research records only and cannot approve or dispatch production work.</p>
            <Button className="mt-4" size="sm" onClick={seed} disabled={busy !== null}>{busy === "seed" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />}Seed V1 contract</Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard icon={FlaskConical} label="Scenarios" value={dashboard.scenarios.length} note="fixed operating worlds" />
              <MetricCard icon={Gauge} label="Latest score" value={latest?.overallScore ?? "—"} note={latest ? `${latest.mode.toLowerCase()} provenance` : "no runs yet"} />
              <MetricCard icon={ShieldCheck} label="Durability" value={latest?.durabilityScore ?? "—"} note="order, wording, missing, adversarial" />
              <MetricCard icon={Users} label="Human observations" value={dashboard.calibration.observationCount} note={dashboard.calibration.status.toLowerCase().replace(/_/g, " ")} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Grounded persona · v{dashboard.persona.version}</div>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{dashboard.persona.name}</h2>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{dashboard.persona.role}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-200">Active</Badge>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <PersonaList title="May" items={dashboard.persona.may} tone="good" />
                  <PersonaList title="May not" items={dashboard.persona.mayNot} tone="warn" />
                  <PersonaList title="Decision rules" items={dashboard.persona.decisionRules} />
                  <PersonaList title="Fixed-world rules" items={dashboard.persona.fixedWorldRules} />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest evaluation</div>
                    <h2 className="mt-1 text-base font-semibold text-foreground">{latest ? `${latest.mode} · ${latest.status}` : "No run recorded"}</h2>
                  </div>
                  {latest ? <Badge variant="outline" className={latest.mode === "PROXY" ? "border-amber-500/30 text-amber-200" : latest.mode === "HUMAN" ? "border-emerald-500/30 text-emerald-200" : "border-cyan-500/30 text-cyan-200"}>{latest.mode}</Badge> : null}
                </div>
                {latest ? (
                  <>
                    <p className="mt-3 rounded-lg border border-[var(--panel-line)] bg-background/40 p-3 text-[12px] leading-relaxed text-muted-foreground">{latest.caveat}</p>
                    <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-2">{dimensionEntries.map(([dimension, value]) => <ScoreBar key={dimension} label={DIMENSION_LABELS[dimension] ?? dimension} value={value} />)}</div>
                    <div className="mt-4 flex flex-wrap gap-3 border-t border-[var(--panel-line)] pt-3 font-mono text-[11px] text-muted-foreground">
                      <span>{latest.completedScenarios}/{latest.scenarioCount} scenarios</span>
                      <span>{latest.unsupportedAssumptionCount ?? 0} unsupported assumptions</span>
                      <span>{latest.runnerVersion ?? "runner unknown"}</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-[var(--panel-line)] p-8 text-center text-sm text-muted-foreground">Run the structural proxy to validate scenario grounding and rubric coverage.</div>
                )}
              </Card>
            </div>

            <section>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Scenario battery</div><h2 className="mt-1 text-lg font-semibold text-foreground">Eight operator pressure tests</h2></div>
                <div className="text-[12px] text-muted-foreground">Every scenario includes reorder, reword, missing-evidence, and adversarial variants.</div>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {dashboard.scenarios.map((scenario, index) => {
                  const rubric = scenario.rubric as any;
                  const context = scenario.fixedContext as any;
                  const observing = observationScenarioId === scenario._id;
                  return (
                    <Card key={scenario._id} className="overflow-hidden">
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--panel-line)] px-4 py-3">
                        <div className="min-w-0"><div className="font-mono text-[10px] text-muted-foreground">SCENARIO {String(index + 1).padStart(2, "0")} · {scenario.category}</div><h3 className="mt-1 text-[14px] font-semibold text-foreground">{scenario.name}</h3><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{scenario.description}</p></div>
                        <Badge variant="outline" className={String(context.risk).startsWith("CRITICAL") ? "border-red-500/30 text-red-200" : String(context.risk).startsWith("HIGH") ? "border-amber-500/30 text-amber-200" : ""}>{String(context.risk).split(",")[0]}</Badge>
                      </div>
                      <div className="grid gap-3 p-4 sm:grid-cols-2">
                        <ScenarioList title="Evidence available" items={stringList(context.evidenceAvailable)} />
                        <ScenarioList title="Evidence missing" items={stringList(context.evidenceMissing)} warn />
                        <ScenarioList title="Allowed decisions" items={stringList(rubric.allowedDecisions)} />
                        <ScenarioList title="Prohibited assumptions" items={stringList(rubric.prohibitedAssumptions)} warn />
                      </div>
                      <div className="border-t border-[var(--panel-line)] px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">{scenario.variants.map((variant) => <Badge key={variant.id} variant="outline" className="font-mono text-[9.5px] text-muted-foreground">{variant.kind}</Badge>)}</div>
                          <Button size="sm" variant="outline" onClick={() => setObservationScenarioId(observing ? null : scenario._id)}>{observing ? "Close observation" : "Record human observation"}</Button>
                        </div>
                        {observing ? (
                          <div className="mt-4 grid gap-3 border-t border-[var(--panel-line)] pt-4 sm:grid-cols-2">
                            <div className="space-y-1.5"><Label>Operator reference</Label><Input value={operatorRef} onChange={(event) => setOperatorRef(event.target.value)} placeholder="Anonymous participant or internal ID" /></div>
                            <div className="space-y-1.5"><Label>Observed decision</Label><Input value={decision} onChange={(event) => setDecision(event.target.value)} placeholder="Approve, revise, reject, escalate…" /></div>
                            <div className="space-y-1.5"><Label>Evidence required</Label><Textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} rows={3} placeholder="One item per line" /></div>
                            <div className="space-y-1.5"><Label>Assumptions made</Label><Textarea value={assumptions} onChange={(event) => setAssumptions(event.target.value)} rows={3} placeholder="One assumption per line; leave blank if none" /></div>
                            <div className="space-y-1.5 sm:col-span-2"><Label>Session notes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Confusion, hesitations, or context requests" /></div>
                            <div className="sm:col-span-2"><Button size="sm" onClick={saveObservation} disabled={busy !== null}>{busy === "observe" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Users className="mr-1.5 h-3.5 w-3.5" />}Save observation</Button></div>
                          </div>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--panel-line)] px-4 py-3"><div><div className="text-[13px] font-semibold text-foreground">Run history</div><div className="mt-0.5 text-[11.5px] text-muted-foreground">Provenance stays visible; scores from different modes are not interchangeable.</div></div><Badge variant="outline">{dashboard.recentRuns.length} runs</Badge></div>
              {dashboard.recentRuns.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[12px]"><thead className="border-b border-[var(--panel-line)] text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"><tr>{["Created", "Mode", "Status", "Scenarios", "Overall", "Durability", "Human n"].map((label) => <th key={label} className="px-4 py-2.5 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[var(--panel-line)]">{dashboard.recentRuns.map((run) => <tr key={run._id}><td className="px-4 py-3 font-mono text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</td><td className="px-4 py-3"><Badge variant="outline">{run.mode}</Badge></td><td className="px-4 py-3">{run.status}</td><td className="px-4 py-3 font-mono">{run.completedScenarios}/{run.scenarioCount}</td><td className={cn("px-4 py-3 font-mono", metricTone(run.overallScore))}>{run.overallScore ?? "—"}</td><td className={cn("px-4 py-3 font-mono", metricTone(run.durabilityScore))}>{run.durabilityScore ?? "—"}</td><td className="px-4 py-3 font-mono">{run.humanObservationCount}</td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-sm text-muted-foreground">No evaluation runs recorded.</div>}
            </Card>

            <div className="grid gap-3 md:grid-cols-3">
              <Guardrail icon={AlertTriangle} title="No production authority" body="Eval mutations cannot approve, dispatch, waive, or accept operational work." />
              <Guardrail icon={Users} title="Human calibration required" body="Synthetic scores remain forecasts until compared with repeated real operator sessions." />
              <Guardrail icon={CheckCircle2} title="Unknown stays unknown" body="Missing policy, evidence, ownership, or consequence must be named instead of inferred." />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PersonaList({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "neutral" | "good" | "warn" }) {
  return <div><div className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">{title}</div><ul className={cn("mt-2 space-y-1.5 text-[11.5px] leading-relaxed", tone === "good" ? "text-emerald-100" : tone === "warn" ? "text-amber-100" : "text-foreground/80")}>{items.map((item) => <li key={item}>— {item}</li>)}</ul></div>;
}

function ScenarioList({ title, items, warn = false }: { title: string; items: string[]; warn?: boolean }) {
  return <div><div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</div><ul className={cn("mt-1.5 space-y-1 text-[11.5px] leading-relaxed", warn ? "text-amber-100" : "text-foreground/80")}>{items.length ? items.map((item) => <li key={item}>— {item}</li>) : <li>— None recorded</li>}</ul></div>;
}

function Guardrail({ icon: Icon, title, body }: { icon: typeof AlertTriangle; title: string; body: string }) {
  return <Card className="p-4"><Icon className="h-4 w-4 text-cyan-200" /><div className="mt-3 text-[12.5px] font-semibold text-foreground">{title}</div><p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{body}</p></Card>;
}
