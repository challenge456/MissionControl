import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Cloud, Database, GitBranch, Server, Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { useWorkspaceScope } from "../../workspace/WorkspaceScopeProvider";

type Lens = "MY" | "TEAM" | "WORKSPACE" | "COMPANY";

const LENS_LABEL: Record<Lens, string> = {
  MY: "My Work",
  TEAM: "Team",
  WORKSPACE: "Workspace",
  COMPANY: "Company",
};

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: "border-err/40 bg-err/5 text-err",
  HIGH: "border-warn/40 bg-warn/5 text-warn",
  MEDIUM: "border-info-accent/40 bg-info-accent/5 text-info-accent",
  LOW: "border-line bg-surface-2 text-ink-secondary",
};

function isScopeError(value: unknown): value is { status: "SCOPE_ERROR"; message: string; generatedAt: number } {
  return Boolean(value && typeof value === "object" && "status" in value && (value as { status?: string }).status === "SCOPE_ERROR");
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface-2/35 px-3 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</div>
      <div className="mt-1 font-mono text-[18px] font-semibold text-ink">{value}</div>
      <div className="mt-1 text-[11px] leading-relaxed text-ink-muted">{detail}</div>
    </div>
  );
}

function ScopeSelect({ label, value, options, onChange, allLabel }: {
  label: string;
  value: string;
  options: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
  allLabel: string;
}) {
  return (
    <label className="flex min-w-[150px] flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-md border border-line bg-surface-1 px-2 text-[12px] text-ink outline-none transition focus:border-info-accent focus:ring-2 focus:ring-info-accent/25"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </select>
    </label>
  );
}

function AttentionRows({ data, onOpenWorkOrder, onEnterWorkspace }: { data: any; onOpenWorkOrder: (id: string, workspaceId: string) => void; onEnterWorkspace: (workspaceId: string) => void }) {
  const setAttentionState = useMutation(api.softwareFactoryControlPlane.setAttentionState);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resolve = async (item: any) => {
    setPendingKey(item.correlationKey);
    setMessage(null);
    try {
      await setAttentionState({
        tenantId: data.scope.company.id,
        projectId: item.workspaceId,
        correlationKey: item.correlationKey,
        state: "RESOLVED",
        resolutionNote: "Resolved from the role-aware Command Center.",
      });
      setMessage("Attention item resolved and audited.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The attention item could not be updated.");
    } finally {
      setPendingKey(null);
    }
  };

  if (data.attention.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-line px-6 py-8 text-center">
        <div>
          <CheckCircle2 className="mx-auto h-5 w-5 text-ok" aria-hidden />
          <div className="mt-2 text-[13px] font-medium text-ink">No governed exceptions in this lens</div>
          <div className="mt-1 text-[12px] text-ink-muted">Healthy activity stays quiet. New decisions and missing proof will appear here.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {message ? <div role="status" className="mb-3 rounded-md border border-line bg-surface-2 px-3 py-2 text-[12px] text-ink-secondary">{message}</div> : null}
      <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
        {data.attention.map((item: any) => (
          <article key={item.correlationKey} className="bg-surface-1 px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold", SEVERITY_CLASS[item.severity])}>{item.severity}</span>
                  <span className="text-[11px] font-medium text-ink-muted">{item.type.replaceAll("_", " ")}</span>
                  <span className="text-[11px] text-ink-muted">· {item.age}</span>
                </div>
                <h3 className="mt-1.5 text-[13px] font-semibold text-ink">{item.workOrderTitle ?? item.missionTitle ?? item.reason}</h3>
                <p className="mt-1 max-w-[90ch] text-[12px] leading-relaxed text-ink-secondary">{item.reason}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted">
                  {data.lens === "COMPANY" ? <span>Workspace: <strong className="font-medium text-ink-secondary">{item.workspaceName}</strong></span> : null}
                  {(data.lens === "COMPANY" || data.lens === "WORKSPACE") && item.teamName ? <span>Team: <strong className="font-medium text-ink-secondary">{item.teamName}</strong></span> : null}
                  <span>Owner: <strong className="font-medium text-ink-secondary">{item.ownerLabel}</strong></span>
                  <span>Next: <strong className="font-medium text-ink-secondary">{item.requiredAction}</strong></span>
                  <span>Proof: <strong className="font-medium text-ink-secondary">{item.evidenceLabel}</strong></span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.workOrderId ? (
                  <button type="button" onClick={() => onOpenWorkOrder(item.workOrderId, item.workspaceId)} className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-[11px] font-medium text-ink-secondary hover:border-line-strong hover:text-ink focus:outline-none focus:ring-2 focus:ring-info-accent/30">
                    Inspect proof <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                ) : null}
                {data.lens === "COMPANY" && !item.workOrderId ? (
                  <button type="button" onClick={() => onEnterWorkspace(item.workspaceId)} className="inline-flex h-8 items-center gap-1 rounded-md border border-line px-2.5 text-[11px] font-medium text-ink-secondary hover:border-line-strong hover:text-ink focus:outline-none focus:ring-2 focus:ring-info-accent/30">
                    Enter workspace <ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                ) : null}
                {data.allowedActions.resolveAttention ? (
                  <button type="button" disabled={pendingKey === item.correlationKey} onClick={() => void resolve(item)} className="inline-flex h-8 items-center rounded-md bg-act px-2.5 text-[11px] font-medium text-act-ink disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-info-accent/30">
                    {pendingKey === item.correlationKey ? "Saving…" : "Resolve"}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MissionGrid({ data, onOpenMission, limit = 15 }: { data: any; onOpenMission: (id: string) => void; limit?: number }) {
  if (data.missions.length === 0) {
    return <div className="rounded-lg border border-dashed border-line px-5 py-8 text-center text-[12px] text-ink-muted">No authorized Mission assignments match this scope.</div>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
      {data.missions.slice(0, limit).map((mission: any) => (
        <button key={mission.id} type="button" onClick={() => onOpenMission(mission.id)} className="rounded-lg border border-line bg-surface-1 p-3.5 text-left transition hover:border-line-strong hover:bg-surface-2/50 focus:outline-none focus:ring-2 focus:ring-info-accent/30">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">{mission.state.replaceAll("_", " ")}</span>
            <span className="text-[10px] text-ink-muted">{mission.assignmentRoles.join(" · ") || "Workspace"}</span>
          </div>
          <div className="mt-2 text-[13px] font-semibold text-ink">{mission.title}</div>
          <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-secondary">{mission.objective}</div>
          <div className="mt-2 rounded-md bg-surface-2/55 px-2.5 py-2 text-[11px] leading-relaxed text-ink-secondary"><span className="font-medium text-ink-muted">Next:</span> {mission.nextAction}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-ink-muted">
            <span>{mission.workOrders} WOs</span><span>·</span><span>{mission.runningAgents} agents</span>
            {mission.execution?.model ? <><span>·</span><span>{mission.execution.model}</span></> : null}
            {mission.execution?.environment ? <><span>·</span><span>{mission.execution.environment.toLowerCase()}</span></> : null}
          </div>
          {(mission.evidence.failing > 0 || mission.evidence.stale > 0 || mission.evidence.missing > 0) ? <div className="mt-1 text-[10px] text-warn">Evidence: {mission.evidence.failing} failing · {mission.evidence.stale} stale · {mission.evidence.missing} missing</div> : <div className="mt-1 text-[10px] text-ok">Evidence current</div>}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[11px] text-ink-muted">
            <span>Owner: {mission.owner}</span>
            <span className="flex items-center gap-2"><span>${mission.budget.spentUsd.toFixed(0)} / {mission.budget.budgetUsd == null ? "Unknown" : `$${mission.budget.budgetUsd.toFixed(0)}`}</span><ArrowRight className="h-3 w-3" aria-hidden /></span>
          </div>
        </button>
      ))}
    </div>
  );
}

function TeamDelivery({ data, onOpenMission }: { data: any; onOpenMission: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="bg-surface-2/60 text-[10px] uppercase tracking-[0.09em] text-ink-muted">
            <tr><th className="px-3 py-2.5 font-semibold">Team member</th><th className="px-3 py-2.5 font-semibold">Epic WIP</th><th className="px-3 py-2.5 font-semibold">Review load</th><th className="px-3 py-2.5 font-semibold">Attention</th><th className="px-3 py-2.5 font-semibold">Agents</th><th className="px-3 py-2.5 font-semibold">Evidence</th></tr>
          </thead>
          <tbody className="divide-y divide-line bg-surface-1 text-[12px]">
            {data.people.map((person: any) => {
              const overCapacity = person.capacityLimit != null && person.activeMissions > person.capacityLimit;
              const evidence = person.evidence.failing > 0 ? `${person.evidence.failing} failing` : person.evidence.stale > 0 ? `${person.evidence.stale} stale` : person.evidence.missing > 0 ? `${person.evidence.missing} missing` : `${person.evidence.passing} passing`;
              return (
                <tr key={person.id}>
                  <td className="px-3 py-3"><div className="font-medium text-ink">{person.name}</div><div className="mt-0.5 text-[10px] text-ink-muted">{person.role}</div></td>
                  <td className={cn("px-3 py-3 font-mono", overCapacity ? "text-err" : "text-ink-secondary")}>{person.activeMissions}{person.capacityLimit == null ? " / Unknown" : ` / ${person.capacityLimit}`}</td>
                  <td className="px-3 py-3 text-ink-secondary">{person.reviewMissions} review · {person.contributedMissions} contribute</td>
                  <td className={cn("px-3 py-3 font-mono", person.attention > 0 ? "text-warn" : "text-ok")}>{person.attention}</td>
                  <td className="px-3 py-3 font-mono text-ink-secondary">{person.runningAgents} running</td>
                  <td className={cn("px-3 py-3", person.evidence.failing > 0 ? "text-err" : person.evidence.stale > 0 || person.evidence.missing > 0 ? "text-warn" : "text-ok")}>{evidence}</td>
                </tr>
              );
            })}
            {data.people.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-ink-muted">No active members are assigned to this team.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-muted">Team epics</div>
        <MissionGrid data={data} onOpenMission={onOpenMission} limit={25} />
      </div>
    </div>
  );
}

function PortfolioTable({ data, onEnterWorkspace, onEnterTeam }: { data: any; onEnterWorkspace: (workspaceId: string) => void; onEnterTeam: (teamId: string) => void }) {
  const rows = data.lens === "COMPANY" ? data.workspaces : data.teams;
  const firstLabel = data.lens === "COMPANY" ? "Workspace" : "Team";
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead className="bg-surface-2/60 text-[10px] uppercase tracking-[0.09em] text-ink-muted">
          <tr><th className="px-3 py-2.5 font-semibold">{firstLabel}</th><th className="px-3 py-2.5 font-semibold">People</th><th className="px-3 py-2.5 font-semibold">Active epics</th><th className="px-3 py-2.5 font-semibold">Attention</th><th className="px-3 py-2.5 font-semibold">Repository posture</th></tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface-1 text-[12px]">
          {rows.map((row: any) => (
            <tr key={row.id}>
              <td className="px-3 py-3 font-medium text-ink">
                {data.lens === "COMPANY" ? (
                  <button type="button" onClick={() => onEnterWorkspace(row.id)} className="inline-flex items-center gap-1 text-left text-ink hover:text-info-accent focus:outline-none focus:ring-2 focus:ring-info-accent/30">
                    {row.name}<ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                ) : data.lens === "WORKSPACE" ? (
                  <button type="button" onClick={() => onEnterTeam(row.id)} className="inline-flex items-center gap-1 text-left text-ink hover:text-info-accent focus:outline-none focus:ring-2 focus:ring-info-accent/30">
                    {row.name}<ArrowRight className="h-3 w-3" aria-hidden />
                  </button>
                ) : row.name}
              </td>
              <td className="px-3 py-3 font-mono text-ink-secondary">{row.members ?? "Unknown"}</td>
              <td className="px-3 py-3 font-mono text-ink-secondary">{row.activeMissions}</td>
              <td className="px-3 py-3"><span className={row.attention > 0 ? "text-warn" : "text-ok"}>{row.attention}</span></td>
              <td className="px-3 py-3 text-ink-muted">{data.lens === "COMPANY" ? `${row.repositories} connected` : "Inherited workspace policy"}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-ink-muted">No authorized portfolio records.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

export function OperatingControlPlane({ projectId, onNavigate }: { projectId: Id<"projects">; onNavigate: (view: string) => void }) {
  const { setProjectId } = useWorkspaceScope();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLens = (searchParams.get("lens")?.toUpperCase() || undefined) as Lens | undefined;
  const teamId = searchParams.get("team") as Id<"scrumTeams"> | null;
  const repositoryId = searchParams.get("repository") as Id<"workspaceRepositories"> | null;
  const codeScopeId = searchParams.get("codeScope") as Id<"repositoryCodeScopes"> | null;
  const data = useQuery(api.softwareFactoryControlPlane.getOperatingView, {
    projectId,
    lens: requestedLens,
    teamId: teamId || undefined,
    repositoryId: repositoryId || undefined,
    codeScopeId: codeScopeId || undefined,
  });
  const activeLens = data && !isScopeError(data) ? data.lens : requestedLens;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key === "repository") next.delete("codeScope");
    setSearchParams(next, { replace: false });
  };
  const commitWorkspaceNavigation = (next: URLSearchParams, workspaceId: string, pathname = "/v2/command-center") => {
    const destination = { pathname, search: `?${next.toString()}` };
    navigate(destination);
    setProjectId(workspaceId as Id<"projects">);
    // App persists workspace state in a parent effect. Reapply the complete
    // drill-down URL after that effect so its workspace-only sync cannot erase
    // the target lens or record during the same transition.
    globalThis.setTimeout(() => navigate(destination, { replace: true }), 0);
  };
  const enterWorkspace = (workspaceId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("workspace", workspaceId);
    next.set("lens", "workspace");
    next.delete("team");
    next.delete("repository");
    next.delete("codeScope");
    next.delete("workOrder");
    next.delete("mission");
    commitWorkspaceNavigation(next, workspaceId);
  };
  const enterTeam = (selectedTeamId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("lens", "team");
    next.set("team", selectedTeamId);
    next.delete("repository");
    next.delete("codeScope");
    setSearchParams(next, { replace: false });
  };
  const openWorkOrder = (id: string, workspaceId: string) => {
    const next = new URLSearchParams(searchParams);
    const changesWorkspace = activeLens === "COMPANY" || workspaceId !== projectId;
    if (changesWorkspace) {
      next.set("workspace", workspaceId);
      next.set("lens", "workspace");
      next.delete("team");
      next.delete("repository");
      next.delete("codeScope");
    }
    next.set("workOrder", id);
    onNavigate("control-work-orders");
    if (changesWorkspace) commitWorkspaceNavigation(next, workspaceId, "/v2/control-work-orders");
    else navigate({ pathname: "/v2/control-work-orders", search: `?${next.toString()}` });
  };
  const openMission = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("mission");
    onNavigate("mission-detail");
    navigate({ pathname: `/v2/missions/${encodeURIComponent(id)}`, search: `?${next.toString()}` });
  };
  if (!data) {
    return (
      <section aria-label="Company account control plane" className="rounded-xl border border-line bg-surface-1 p-4">
        <div className="h-4 w-48 animate-pulse rounded bg-surface-2" />
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-surface-2" />)}</div>
      </section>
    );
  }

  if (isScopeError(data)) {
    return (
      <section aria-label="Company account control plane" className="rounded-xl border border-err/40 bg-err/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-err" aria-hidden />
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Operating scope unavailable</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">{data.message}</p>
            <button type="button" onClick={() => { const next = new URLSearchParams(searchParams); next.delete("team"); next.delete("repository"); next.delete("codeScope"); setSearchParams(next, { replace: true }); }} className="mt-3 h-8 rounded-md border border-line bg-surface-1 px-3 text-[11px] font-medium text-ink-secondary hover:border-line-strong hover:text-ink focus:outline-none focus:ring-2 focus:ring-info-accent/30">Reset operating scope</button>
          </div>
        </div>
      </section>
    );
  }
  const confidenceLabel = data.summary.deliveryConfidence.score == null ? "Unknown" : `${data.summary.deliveryConfidence.score}%`;
  const attentionWindow = data.attentionWindow ?? { showing: data.attention.length, total: data.attention.length, limit: data.attention.length };

  return (
    <section aria-label="Company account control plane" className="rounded-xl border border-line bg-surface-1 shadow-sm">
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ok">Company account control plane</div>
            <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-ink">{LENS_LABEL[data.lens]} · {data.scope.workspace.name}</h2>
            <p className="mt-1 max-w-[78ch] text-[12px] leading-relaxed text-ink-secondary">One governed view of ownership, attention, capacity, dispatch, and proof across canonical delivery records.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface-2/45 p-1" role="tablist" aria-label="Operating lens">
            {data.availableLenses.map((lens: Lens) => (
              <button key={lens} type="button" role="tab" aria-selected={data.lens === lens} onClick={() => updateParam("lens", lens.toLowerCase())} className={cn("h-8 rounded-md px-3 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-info-accent/30", data.lens === lens ? "bg-surface-1 text-ink shadow-sm" : "text-ink-muted hover:text-ink")}>{LENS_LABEL[lens]}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-app/40 px-3 py-2.5" aria-label="Operating scope">
          <div className="min-w-[180px] pb-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">Company / workspace</div>
            <div className="mt-1 text-[12px] font-medium text-ink">{data.scope.company.name} / {data.scope.workspace.name}</div>
          </div>
          {(data.lens === "TEAM" || data.lens === "WORKSPACE") ? <ScopeSelect label="Team" value={teamId ?? data.scope.team?.id ?? ""} options={data.filters.teams} onChange={(value) => updateParam("team", value)} allLabel={data.lens === "TEAM" ? "Choose a team" : "All authorized teams"} /> : null}
          <ScopeSelect label="Repository" value={repositoryId ?? ""} options={data.filters.repositories} onChange={(value) => updateParam("repository", value)} allLabel="All repositories" />
          <ScopeSelect label="Code scope" value={codeScopeId ?? ""} options={data.filters.codeScopes} onChange={(value) => updateParam("codeScope", value)} allLabel="All code scopes" />
          <div className="ml-auto flex items-center gap-1.5 pb-1 text-[10px] text-ink-muted"><Clock3 className="h-3 w-3" aria-hidden /> Updated {new Date(data.generatedAt).toLocaleTimeString()}</div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="Active epics" value={data.summary.activeMissions} detail="Canonical active Missions in scope" />
          <Metric label="WorkOrders" value={data.summary.activeWorkOrders} detail="Governed active delivery units" />
          <Metric label="Needs attention" value={data.summary.attentionRequired} detail="Ranked, correlated exceptions" />
          <Metric label="Running agents" value={data.summary.runningAgents} detail="Live workflow instances, not definitions" />
          <Metric label="Delivery confidence" value={confidenceLabel} detail={data.summary.deliveryConfidence.status === "UNKNOWN" ? "Needs active WorkOrder evidence" : data.summary.deliveryConfidence.status.replace(/_/g, " ")} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-[13px] font-semibold text-ink">Needs attention</h3><p className="mt-0.5 text-[11px] text-ink-muted">Severity → overdue → age. Every item names an owner, action, and proof source. {attentionWindow.total > attentionWindow.showing ? `Showing the top ${attentionWindow.showing} of ${attentionWindow.total}.` : ""}</p></div><AlertTriangle className="h-4 w-4 text-warn" aria-hidden /></div>
          <AttentionRows data={data} onOpenWorkOrder={openWorkOrder} onEnterWorkspace={enterWorkspace} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="text-[13px] font-semibold text-ink">{data.lens === "MY" ? "My active epics" : data.lens === "TEAM" ? "Team epic ownership" : "Portfolio posture"}</h3><p className="mt-0.5 text-[11px] text-ink-muted">Drill-down preserves Mission → WorkOrder → run → evidence lineage.</p></div><GitBranch className="h-4 w-4 text-ink-muted" aria-hidden /></div>
          {data.lens === "MY"
            ? <MissionGrid data={data} onOpenMission={openMission} />
            : data.lens === "TEAM"
              ? <TeamDelivery data={data} onOpenMission={openMission} />
              : <PortfolioTable data={data} onEnterWorkspace={enterWorkspace} onEnterTeam={enterTeam} />}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Fleet capacity boundaries">
          <div className="rounded-lg border border-line p-3"><Users className="h-4 w-4 text-info-accent" aria-hidden /><div className="mt-2 text-[12px] font-semibold text-ink">Human capacity</div><div className="mt-1 font-mono text-[15px] text-ink">{data.fleet.humanCapacity.members} people · {data.fleet.humanCapacity.activeAssignments} assignments</div></div>
          <div className="rounded-lg border border-line p-3"><Database className="h-4 w-4 text-info-accent" aria-hidden /><div className="mt-2 text-[12px] font-semibold text-ink">Agent definitions</div><div className="mt-1 text-[11px] text-ink-muted">{data.fleet.agentDefinitions.status}: {data.fleet.agentDefinitions.source}</div></div>
          <div className="rounded-lg border border-line p-3"><Cloud className="h-4 w-4 text-info-accent" aria-hidden /><div className="mt-2 text-[12px] font-semibold text-ink">Agent instances</div><div className="mt-1 font-mono text-[15px] text-ink">{data.fleet.agentInstances.running} running · {data.fleet.agentInstances.failed} failed</div></div>
          <div className="rounded-lg border border-line p-3"><Server className="h-4 w-4 text-info-accent" aria-hidden /><div className="mt-2 text-[12px] font-semibold text-ink">Executor hosts</div><div className="mt-1 text-[11px] text-ink-muted">{data.fleet.executorHosts.status}: {data.fleet.executorHosts.source}</div></div>
        </div>

        <details className="rounded-lg border border-line bg-surface-2/25 px-3 py-2.5 text-[11px] text-ink-muted">
          <summary className="cursor-pointer font-medium text-ink-secondary">Metric source, formula, and freshness</summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-3"><div><strong className="text-ink-secondary">Source</strong><br />{data.summary.source}</div><div><strong className="text-ink-secondary">Confidence</strong><br />{data.summary.formulae.deliveryConfidence}</div><div><strong className="text-ink-secondary">Attention</strong><br />{data.summary.formulae.attention}</div></div>
        </details>
      </div>
    </section>
  );
}
