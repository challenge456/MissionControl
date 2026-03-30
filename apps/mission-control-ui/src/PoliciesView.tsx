/**
 * Policies View — Governance Dashboard
 *
 * Policy cards with scope badges, autonomy tier indicator, default decision.
 * Collapsed Evaluation Playground at bottom for dev testing.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./components/PageHeader";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Shield, Plus, FlaskConical } from "lucide-react";

function fmtTime(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

type RulesShape = {
  defaultDecision?: string;
  requireApprovalOnRisk?: string[];
  toolPolicies?: Record<string, string>;
  autonomyTier?: number;
  [key: string]: unknown;
};

export function PoliciesView({ projectId }: { projectId: Id<"projects"> | null }) {
  const { toast } = useToast();
  const [selectedTenantId, setSelectedTenantId] = useState<Id<"tenants"> | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<Id<"agentTemplates"> | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<Id<"agentVersions"> | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [toolName, setToolName] = useState("shell");
  const [riskLevel, setRiskLevel] = useState<"GREEN" | "YELLOW" | "RED">("YELLOW");

  const tenants = useQuery(api["registry/tenants"].listTenants, { activeOnly: false });
  const templates = useQuery(api["registry/agentTemplates"].listTemplates, {
    tenantId: selectedTenantId ?? undefined,
    projectId: projectId ?? undefined,
    activeOnly: false,
  });
  const versions = useQuery(
    api["registry/agentVersions"].listVersions,
    selectedTemplateId ? { templateId: selectedTemplateId } : "skip"
  );
  const envelopes = useQuery(api["governance/policyEnvelopes"].listPolicyEnvelopes, {
    tenantId: selectedTenantId ?? undefined,
    projectId: projectId ?? undefined,
    versionId: selectedVersionId ?? undefined,
    activeOnly,
  });
  const evalResult = useQuery(api["governance/policyEnvelopes"].evaluate, {
    tenantId: selectedTenantId ?? undefined,
    projectId: projectId ?? undefined,
    versionId: selectedVersionId ?? undefined,
    toolName: toolName || undefined,
    riskLevel,
  });

  const createPolicyEnvelope = useMutation(api["governance/policyEnvelopes"].createPolicyEnvelope);
  const attachPolicy = useMutation(api["governance/policyEnvelopes"].attachPolicy);

  useEffect(() => {
    if (!selectedTenantId && tenants?.length) setSelectedTenantId(tenants[0]._id);
  }, [selectedTenantId, tenants]);

  useEffect(() => {
    if (!selectedTemplateId && templates?.length) setSelectedTemplateId(templates[0]._id);
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (!selectedVersionId && versions?.length) setSelectedVersionId(versions[0]._id);
  }, [selectedVersionId, versions]);

  const handleCreatePolicy = async () => {
    try {
      const suffix = Date.now().toString().slice(-6);
      await createPolicyEnvelope({
        tenantId: selectedTenantId ?? undefined,
        projectId: projectId ?? undefined,
        templateId: selectedTemplateId ?? undefined,
        versionId: selectedVersionId ?? undefined,
        name: `Guardrail Policy ${suffix}`,
        priority: 100,
        rules: {
          defaultDecision: "ALLOW",
          requireApprovalOnRisk: ["RED"],
          toolPolicies: {
            shell: "NEEDS_APPROVAL",
            exec: "NEEDS_APPROVAL",
            write_file: "NEEDS_APPROVAL",
            delete_file: "DENY",
          },
        },
        metadata: { source: "policies.ui" },
      });
      toast("Policy created.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to create policy", true);
    }
  };

  const togglePolicy = async (envelopeId: Id<"policyEnvelopes">, active: boolean) => {
    try {
      await attachPolicy({ envelopeId, active });
      toast(active ? "Policy activated." : "Policy deactivated.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to update policy", true);
    }
  };

  const list = envelopes ?? [];
  const activeCount = list.filter((e) => e.active).length;

  return (
    <main className="flex-1 overflow-auto">
      <PageHeader
        title="Policies"
        description="Version-aware guardrails (version → project → tenant precedence)"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveOnly((v) => !v)}>
              {activeOnly ? "Show All" : "Active Only"}
            </Button>
            <Button size="sm" onClick={handleCreatePolicy}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Policy
            </Button>
          </div>
        }
      />

      {/* Summary bar */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{list.length}</span>
          <span className="text-xs text-muted-foreground">total policies</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <span className="text-sm font-semibold text-primary/70 dark:text-primary">{activeCount}</span>
          <span className="text-xs text-muted-foreground">active</span>
        </div>
      </div>

      {/* Scope filters */}
      <div className="px-6 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tenant</span>
          <select
            value={selectedTenantId ?? ""}
            onChange={(e) => setSelectedTenantId((e.target.value || null) as Id<"tenants"> | null)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            {(tenants ?? []).map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Template</span>
          <select
            value={selectedTemplateId ?? ""}
            onChange={(e) => setSelectedTemplateId((e.target.value || null) as Id<"agentTemplates"> | null)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            {(templates ?? []).map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Version</span>
          <select
            value={selectedVersionId ?? ""}
            onChange={(e) => setSelectedVersionId((e.target.value || null) as Id<"agentVersions"> | null)}
            className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Any</option>
            {(versions ?? []).map((v) => (
              <option key={v._id} value={v._id}>v{v.version} ({v.status})</option>
            ))}
          </select>
        </label>
      </div>

      {/* Policy cards */}
      <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((envelope) => {
          const rules = (envelope.rules ?? {}) as RulesShape;
          const defaultDecision = rules.defaultDecision ?? "ALLOW";
          const autonomyTier = typeof rules.autonomyTier === "number" ? rules.autonomyTier : 3;
          const toolCount = rules.toolPolicies ? Object.keys(rules.toolPolicies).length : 0;
          const scope = envelope.versionId ? "Version" : envelope.projectId ? "Project" : envelope.tenantId ? "Tenant" : "Global";

          return (
            <Card key={envelope._id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-foreground leading-tight">{envelope.name}</h3>
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[11px] font-semibold shrink-0",
                    envelope.active ? "bg-primary/15 text-primary/70 dark:text-primary border-primary/30" : "bg-zinc-500/15 text-zinc-500 border-zinc-500/30"
                  )}
                >
                  {envelope.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {scope}
                </span>
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 text-[11px] font-semibold",
                    defaultDecision === "ALLOW" && "bg-primary/15 text-primary/70 dark:text-primary border-primary/30",
                    defaultDecision === "DENY" && "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
                    defaultDecision === "NEEDS_APPROVAL" && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                    !["ALLOW", "DENY", "NEEDS_APPROVAL"].includes(defaultDecision) && "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {defaultDecision}
                </span>
              </div>
              {/* Autonomy tier 0–5 */}
              <div className="mb-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Autonomy tier
                </div>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map((tier) => (
                    <div
                      key={tier}
                      className={cn(
                        "h-2 flex-1 rounded-sm border transition-colors",
                        tier <= autonomyTier
                          ? "bg-primary border-primary/40"
                          : "bg-muted/50 border-border"
                      )}
                      title={`Tier ${tier}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground mb-3">
                {toolCount > 0 ? `${toolCount} tool rule${toolCount !== 1 ? "s" : ""}` : "No tool rules"}
                {rules.requireApprovalOnRisk?.length ? ` · Approval on ${rules.requireApprovalOnRisk.join(", ")}` : ""}
              </div>
              <div className="text-[11px] text-muted-foreground/70 mt-auto">
                Updated {fmtTime(envelope.updatedAt)}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => togglePolicy(envelope._id, !envelope.active)}
                >
                  {envelope.active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="px-6 pb-6 text-center py-12 text-muted-foreground text-sm">
          No policies match the current scope. Create one or change filters.
        </div>
      )}

      {/* Collapsed Evaluation Playground */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={() => setPlaygroundOpen((o) => !o)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          {playgroundOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <FlaskConical className="h-3.5 w-3.5" />
          Evaluation Playground
        </button>
        {playgroundOpen && (
          <Card className="mt-2 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Test policy evaluation
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm">
                Tool
                <input
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="shell"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Risk
                <select
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as "GREEN" | "YELLOW" | "RED")}
                >
                  <option value="GREEN">GREEN</option>
                  <option value="YELLOW">YELLOW</option>
                  <option value="RED">RED</option>
                </select>
              </label>
              <div className="rounded-md border border-border bg-muted/30 p-2.5 text-sm">
                <div className="text-[11px] uppercase text-muted-foreground">Decision</div>
                <div className={cn(
                  "mt-1 font-semibold",
                  evalResult?.decision === "ALLOW" && "text-primary",
                  evalResult?.decision === "DENY" && "text-red-500",
                  evalResult?.decision === "NEEDS_APPROVAL" && "text-amber-500"
                )}>
                  {evalResult?.decision ?? "…"}
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-2.5 text-sm">
                <div className="text-[11px] uppercase text-muted-foreground">Source</div>
                <div className="mt-1 font-medium text-foreground/80">{evalResult?.source ?? "…"}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
