import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "./components/PageHeader";
import { StatusBadge } from "./components/factory/badges";
import { useToast } from "./Toast";
import { AlertTriangle, Plus, Route, Save, ShieldCheck, Trash2 } from "lucide-react";

type Tier = "FAST" | "BALANCED" | "POWERFUL";
type Risk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Rule = {
  id: string;
  order: number;
  taskType?: string;
  riskLevel?: Risk;
  requiredCapabilities?: string[];
  modelId: string;
};

const TASK_TYPES = [
  "ENGINEERING",
  "DOCS",
  "OPS",
  "CONTENT",
  "CUSTOMER_RESEARCH",
  "SEO_RESEARCH",
  "SOCIAL",
  "EMAIL_MARKETING",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-ink-secondary">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function ModelRoutingView({ projectId }: { projectId: Id<"projects"> }) {
  const catalog = useQuery(api.modelCatalog.list);
  const policy = useQuery(api.modelRoutingPolicies.getActive, { projectId });
  const decisions = useQuery(api.modelRoutingDecisions.listRecent, { projectId, limit: 30 });
  const enforcementEnabled = useQuery(api.featureFlags.isEnabled, {
    key: "model-routing.enabled",
    projectId,
  });
  const initializeCatalog = useMutation(api.modelCatalog.initializeDefaults);
  const savePolicy = useMutation(api.modelRoutingPolicies.save);
  const setFlag = useMutation(api.featureFlags.setFlag);
  const { toast } = useToast();

  const [name, setName] = useState("Workspace routing policy");
  const [defaultModelId, setDefaultModelId] = useState("");
  const [safeFallbackModelId, setSafeFallbackModelId] = useState("");
  const [fallbackChain, setFallbackChain] = useState<string[]>([]);
  const [budgetLimit, setBudgetLimit] = useState("");
  const [canaryPercent, setCanaryPercent] = useState("0");
  const [killSwitch, setKillSwitch] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [saving, setSaving] = useState(false);
  const [simTaskType, setSimTaskType] = useState("ENGINEERING");
  const [simRisk, setSimRisk] = useState<Risk>("MEDIUM");
  const [simTier, setSimTier] = useState<Tier>("BALANCED");
  const [simCapabilities, setSimCapabilities] = useState("tools, code");
  const [simBudget, setSimBudget] = useState("");

  useEffect(() => {
    if (!policy) return;
    setName(policy.name);
    setDefaultModelId(policy.defaultModelId ?? "");
    setSafeFallbackModelId(policy.safeFallbackModelId ?? "");
    setFallbackChain(policy.fallbackChain);
    setBudgetLimit(policy.budgetLimitUsd == null ? "" : String(policy.budgetLimitUsd));
    setCanaryPercent(String(policy.canaryPercent));
    setKillSwitch(policy.killSwitch);
    setRules(policy.rules as Rule[]);
  }, [policy]);

  useEffect(() => {
    if (!catalog?.length || defaultModelId) return;
    const balanced = catalog.find((model) => model.tier === "BALANCED") ?? catalog[0];
    const powerful = catalog.find((model) => model.tier === "POWERFUL") ?? balanced;
    setDefaultModelId(balanced.modelId);
    setSafeFallbackModelId(powerful.modelId);
    setFallbackChain([powerful.modelId]);
  }, [catalog, defaultModelId]);

  const requiredCapabilities = useMemo(
    () => [...new Set(simCapabilities.split(",").map((value) => value.trim()).filter(Boolean))],
    [simCapabilities]
  );
  const simulation = useQuery(
    api.modelRoutingPolicies.simulate,
    catalog?.length
      ? {
          projectId,
          taskType: simTaskType,
          riskLevel: simRisk,
          requestedTier: simTier,
          requiredCapabilities,
          budgetRemainingUsd: simBudget ? Number(simBudget) : undefined,
        }
      : "skip"
  );

  async function save() {
    setSaving(true);
    try {
      await savePolicy({
        projectId,
        name,
        defaultModelId: defaultModelId || undefined,
        safeFallbackModelId: safeFallbackModelId || undefined,
        fallbackChain,
        rules: rules.map((rule, index) => ({ ...rule, order: index })),
        budgetLimitUsd: budgetLimit ? Number(budgetLimit) : undefined,
        canaryPercent: Number(canaryPercent),
        killSwitch,
        actorId: "operator",
      });
      toast("Routing policy activated");
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Policy update failed", true);
    } finally {
      setSaving(false);
    }
  }

  if (!catalog || policy === undefined || decisions === undefined || enforcementEnabled === undefined) {
    return <div className="p-6 text-sm text-ink-muted">Loading model routing…</div>;
  }

  const healthyCount = catalog.filter((model) => model.availability === "HEALTHY").length;
  const result = simulation?.result;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-app">
      <PageHeader
        eyebrow="Settings"
        title="Model Routing"
        description="Choose models centrally, test decisions safely, and audit every dispatch route."
        status={
          enforcementEnabled ? (
            <StatusBadge tone={killSwitch ? "warning" : "success"}>
              {killSwitch ? "Kill switch active" : "Enforced"}
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Shadow mode</StatusBadge>
          )
        }
        actions={
          <Button
            size="sm"
            variant={enforcementEnabled ? "outline" : "default"}
            disabled={!policy || catalog.length === 0}
            onClick={async () => {
              await setFlag({
                key: "model-routing.enabled",
                enabled: !enforcementEnabled,
                projectId,
                actorId: "operator",
              });
              toast(enforcementEnabled ? "Routing returned to shadow mode" : "Routing enforcement enabled");
            }}
          >
            {enforcementEnabled ? "Use shadow mode" : "Enable enforcement"}
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1400px] gap-4 px-6 py-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)]">
          <div className="space-y-4">
            <section className="rounded-lg border border-line bg-surface-1">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Provider health</h2>
                  <p className="text-[11.5px] text-ink-muted">{healthyCount} of {catalog.length} routes healthy</p>
                </div>
                {catalog.length === 0 && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      const result = await initializeCatalog({ actorId: "operator" });
                      toast(`Initialized ${result.created} model routes`);
                    }}
                  >
                    Initialize safe catalog
                  </Button>
                )}
              </div>
              {catalog.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left">
                    <thead className="bg-surface-2 text-[10.5px] uppercase tracking-[0.06em] text-ink-muted">
                      <tr>
                        <th className="px-4 py-2.5">Route</th>
                        <th className="px-3 py-2.5">Provider</th>
                        <th className="px-3 py-2.5">Tier</th>
                        <th className="px-3 py-2.5">Capabilities</th>
                        <th className="px-4 py-2.5">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((model) => (
                        <tr key={model._id} className="border-t border-line text-[12.5px]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{model.displayName}</p>
                            <p className="font-mono text-[10.5px] text-ink-muted">{model.modelId}</p>
                          </td>
                          <td className="px-3 py-3 text-ink-secondary">{model.provider}</td>
                          <td className="px-3 py-3 text-ink-secondary">{model.tier}</td>
                          <td className="px-3 py-3 text-ink-secondary">{model.capabilities.join(", ")}</td>
                          <td className="px-4 py-3">
                            <StatusBadge tone={model.availability === "HEALTHY" ? "success" : model.availability === "DEGRADED" ? "warning" : "error"}>
                              {model.availability}
                            </StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">
                  Initialize the catalog before creating or enforcing a routing policy.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-line bg-surface-1 p-4">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Workspace policy</h2>
                  <p className="text-[11.5px] text-ink-muted">
                    Every save creates a new immutable policy version. Current: v{policy?.version ?? 0}.
                  </p>
                </div>
                <Button size="sm" disabled={saving || catalog.length === 0} onClick={save}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Activate policy"}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Policy name">
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label="Canary enforcement" hint="0% stays in shadow; increase after decision review.">
                  <Input type="number" min="0" max="100" value={canaryPercent} onChange={(event) => setCanaryPercent(event.target.value)} />
                </Field>
                <Field label="Workspace default">
                  <Select value={defaultModelId} onValueChange={setDefaultModelId}>
                    <SelectTrigger><SelectValue placeholder="Select model route" /></SelectTrigger>
                    <SelectContent>
                      {catalog.map((model) => <SelectItem key={model._id} value={model.modelId}>{model.displayName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Safe fallback">
                  <Select value={safeFallbackModelId} onValueChange={setSafeFallbackModelId}>
                    <SelectTrigger><SelectValue placeholder="Select safe fallback" /></SelectTrigger>
                    <SelectContent>
                      {catalog.filter((model) => model.riskApproved).map((model) => (
                        <SelectItem key={model._id} value={model.modelId}>{model.displayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Per-run budget cap" hint="Optional routing estimate cap in USD.">
                  <Input type="number" min="0" step="0.01" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} placeholder="No cap" />
                </Field>
                <Field label="Fallback chain" hint="Comma-separated ordered model route IDs.">
                  <Input value={fallbackChain.join(", ")} onChange={(event) => setFallbackChain(event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} />
                </Field>
                <label className="flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2.5 text-[12.5px] text-ink md:col-span-2">
                  <input type="checkbox" checked={killSwitch} onChange={(event) => setKillSwitch(event.target.checked)} />
                  Kill switch: keep existing runtime model selection and record the policy as bypassed
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-surface-1">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Ordered rules</h2>
                  <p className="text-[11.5px] text-ink-muted">First matching rule wins after run, workflow, and agent overrides.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!catalog.length}
                  onClick={() =>
                    setRules((current) => [
                      ...current,
                      {
                        id: `rule-${Date.now()}`,
                        order: current.length,
                        taskType: "ENGINEERING",
                        modelId: defaultModelId || catalog[0]?.modelId,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add rule
                </Button>
              </div>
              {rules.length ? (
                <div className="space-y-2 p-4">
                  {rules.map((rule, index) => (
                    <div key={rule.id} className="grid items-center gap-2 rounded-lg border border-line bg-surface-2 p-3 md:grid-cols-[40px_1fr_1fr_1.2fr_36px]">
                      <span className="text-center font-mono text-xs text-ink-muted">{index + 1}</span>
                      <Select value={rule.taskType ?? "ANY"} onValueChange={(value) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, taskType: value === "ANY" ? undefined : value } : item))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ANY">Any task</SelectItem>
                          {TASK_TYPES.map((taskType) => <SelectItem key={taskType} value={taskType}>{taskType}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={rule.riskLevel ?? "ANY"} onValueChange={(value) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, riskLevel: value === "ANY" ? undefined : value as Risk } : item))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ANY">Any risk</SelectItem>
                          {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((riskLevel) => <SelectItem key={riskLevel} value={riskLevel}>{riskLevel}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={rule.modelId} onValueChange={(modelId) => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, modelId } : item))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {catalog.map((model) => <SelectItem key={model._id} value={model.modelId}>{model.displayName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))} aria-label="Remove rule">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-7 text-center text-[12.5px] text-ink-muted">No overrides. The workspace default and fallback chain apply.</p>
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border border-line bg-surface-1 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Route className="h-4 w-4 text-accent" />
                <div>
                  <h2 className="text-sm font-semibold text-ink">Decision simulator</h2>
                  <p className="text-[11.5px] text-ink-muted">Read-only. Uses the same resolver as dispatch.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Field label="Task type">
                  <Select value={simTaskType} onValueChange={setSimTaskType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TASK_TYPES.map((taskType) => <SelectItem key={taskType} value={taskType}>{taskType}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Risk">
                  <Select value={simRisk} onValueChange={(value) => setSimRisk(value as Risk)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Workflow tier">
                  <Select value={simTier} onValueChange={(value) => setSimTier(value as Tier)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["FAST", "BALANCED", "POWERFUL"] as const).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Required capabilities">
                  <Input value={simCapabilities} onChange={(event) => setSimCapabilities(event.target.value)} />
                </Field>
                <Field label="Budget remaining">
                  <Input type="number" min="0" step="0.01" value={simBudget} onChange={(event) => setSimBudget(event.target.value)} placeholder="No request cap" />
                </Field>
              </div>
              <div className="mt-4 rounded-lg border border-line bg-surface-2 p-4">
                {result ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-ink-muted">Selected route</p>
                      <StatusBadge tone={result.status === "SELECTED" ? "success" : "error"}>{result.status}</StatusBadge>
                    </div>
                    <p className="mt-2 font-mono text-sm font-semibold text-ink">{result.selectedModelId ?? "No safe route"}</p>
                    <p className="mt-1 text-[12px] leading-5 text-ink-secondary">{result.explanation}</p>
                    <p className="mt-2 text-[11px] text-ink-muted">Source: {result.source} · Policy v{simulation.policyVersion}</p>
                  </>
                ) : (
                  <p className="text-[12px] text-ink-muted">Resolving…</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-surface-1">
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">Routing decisions</h2>
                <p className="text-[11.5px] text-ink-muted">Immutable evidence from Work Order dispatch.</p>
              </div>
              {decisions.length ? (
                <div className="max-h-[520px] divide-y divide-line overflow-y-auto">
                  {decisions.map((decision) => (
                    <div key={decision._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[12px] font-medium text-ink">{decision.selectedModelId ?? "No safe route"}</p>
                          <p className="text-[10.5px] text-ink-muted">{formatTime(decision.createdAt)} · v{decision.policyVersion}</p>
                        </div>
                        <StatusBadge tone={decision.mode === "ENFORCED" ? "success" : decision.mode === "EXHAUSTED" ? "error" : "neutral"}>{decision.mode}</StatusBadge>
                      </div>
                      <p className="mt-2 text-[11.5px] leading-5 text-ink-secondary">{decision.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-ink-muted" />
                  <p className="text-[12.5px] text-ink-muted">No dispatch decisions recorded yet.</p>
                </div>
              )}
            </section>

            {enforcementEnabled && Number(canaryPercent) === 0 && (
              <div className="flex gap-2 rounded-lg border border-warn/30 bg-warn/5 p-3 text-[12px] text-ink-secondary">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                Enforcement is enabled, but the canary is 0%. Decisions remain in shadow mode until you activate a non-zero policy version.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
