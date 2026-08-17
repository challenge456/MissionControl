import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "./components/PageHeader";
import { StatusBadge } from "./components/factory/badges";
import { MetricBlock } from "./components/factory/MetricBlock";
import { WorkspaceRepositoriesPanel } from "./workspace/WorkspaceRepositoriesPanel";
import { CompanyAccessPanel } from "./workspace/CompanyAccessPanel";
import { WorkspaceTeamsPanel } from "./workspace/WorkspaceTeamsPanel";
import {
  Clock3,
  Building2,
  FolderKanban,
  GitCommit,
  Github,
  HardDrive,
  Link2,
  Orbit,
  Plus,
  Pencil,
  Server,
  Sparkles,
  Users,
} from "lucide-react";

interface ProjectsViewProps {
  projectId: Id<"projects"> | null;
  onProjectSelect: (projectId: Id<"projects">) => void;
  tenantId: Id<"tenants"> | null;
  companyContextEnabled: boolean;
}

export function ProjectsView({ projectId, onProjectSelect, tenantId, companyContextEnabled }: ProjectsViewProps) {
  const scopedProjects = useQuery(
    api.companyContext.listWorkspaces,
    companyContextEnabled && tenantId ? { tenantId } : "skip"
  );
  const legacyProjects = useQuery(api.projects.list, companyContextEnabled ? "skip" : {});
  const projects = companyContextEnabled ? scopedProjects : legacyProjects;
  const companySummary = useQuery(
    api.companyContext.getCompanySummary,
    companyContextEnabled && tenantId ? { tenantId } : "skip"
  );
  const legacyRepositorySummary = useQuery(
    api.projects.getRepositoryPortfolioSummary,
    companyContextEnabled ? "skip" : {}
  );
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(projectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [companyEditOpen, setCompanyEditOpen] = useState(false);

  useEffect(() => {
    if (projectId) setSelectedProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!selectedProject && projects && projects.length > 0) {
      setSelectedProject(projects[0]._id);
    }
  }, [projects, selectedProject]);

  const totals = useMemo(() => {
    if (!projects || (companyContextEnabled ? !companySummary : !legacyRepositorySummary)) return null;
    return {
      total: projects.length,
      connected: companyContextEnabled
        ? companySummary!.counts.repositories
        : legacyRepositorySummary!.repositories,
      connectedWorkspaces: companyContextEnabled
        ? projects.filter((project) => Boolean(project.githubRepo)).length
        : legacyRepositorySummary!.workspacesWithRepositories,
      swarms: projects.filter((project) => Boolean(project.swarmConfig)).length,
    };
  }, [companyContextEnabled, companySummary, legacyRepositorySummary, projects]);

  if (!projects || !totals) {
    return (
      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-app">
        <PageHeader
          title="Workspaces & Repositories"
          description="Loading repository and execution boundaries."
          icon={<FolderKanban size={16} strokeWidth={1.7} />}
        />
        <div
          className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6"
          role="status"
          aria-label="Loading workspaces and repositories"
        >
          <div className="h-24 animate-pulse rounded-xl border border-line bg-surface-2" />
          <div className="grid gap-4 2xl:grid-cols-[400px_minmax(0,1fr)]">
            <div className="h-[520px] animate-pulse rounded-xl border border-line bg-surface-2" />
            <div className="h-[520px] animate-pulse rounded-xl border border-line bg-surface-2" />
          </div>
        </div>
      </section>
    );
  }

  const selectedProjectDoc = projects.find((project) => project._id === selectedProject) ?? null;
  const selectProject = (nextProjectId: Id<"projects">) => {
    setSelectedProject(nextProjectId);
    onProjectSelect(nextProjectId);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-app">
      <PageHeader
        title="Workspaces & Repositories"
        description="Define the repository and execution boundary used by Work Orders, agents, runs, and context."
        icon={<FolderKanban size={16} strokeWidth={1.7} />}
        status={
          <StatusBadge tone="neutral">{totals.total} workspaces</StatusBadge>
        }
        actions={
          !companyContextEnabled || companySummary?.canManageCompany ? (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              New workspace
            </Button>
          ) : null
        }
      />

      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-6">
        {companyContextEnabled && companySummary ? (
          <CompanyAccountCard
            summary={companySummary}
            onEdit={() => setCompanyEditOpen(true)}
          />
        ) : null}
        {companyContextEnabled && tenantId ? (
          <CompanyAccessPanel tenantId={tenantId} />
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <MetricBlock
              label="Portfolio"
              value={totals.total}
              detail="Active operating workspaces in this company account."
            />
          </Card>
          <Card className="p-5">
            <MetricBlock
              label="Connected repos"
              value={totals.connected}
              detail={`Across ${totals.connectedWorkspaces} workspace${totals.connectedWorkspaces === 1 ? "" : "s"}.`}
            />
          </Card>
          <Card className="p-5">
            <MetricBlock
              label="Swarm-ready"
              value={totals.swarms}
              detail="Workspaces that already define a swarm configuration."
            />
          </Card>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <div className="text-[12.5px] font-medium text-ink-secondary">Workspace registry</div>
              <div className="mt-1 text-[15px] font-semibold text-ink">Choose where you want to operate</div>
            </div>
            <div className="space-y-3 p-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  isSelected={project._id === selectedProject}
                  onSelect={() => selectProject(project._id)}
                />
              ))}
            </div>
          </Card>

          {selectedProjectDoc ? (
            <ProjectDetails project={selectedProjectDoc} />
          ) : (
            <Card className="flex min-h-[520px] items-center justify-center p-10 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-muted">
                  <Sparkles size={16} strokeWidth={1.7} />
                </div>
                <div className="mt-4 text-[15px] font-semibold text-ink">Select a workspace</div>
                <div className="mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-secondary">
                  Use the registry on the left to inspect agent staffing, repositories, and swarm configuration for the workspace you want to operate.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {createOpen ? (
        <CreateWorkspaceDialog
          tenantId={tenantId}
          companyContextEnabled={companyContextEnabled}
          onClose={() => setCreateOpen(false)}
          onCreated={selectProject}
        />
      ) : null}
      {companyEditOpen && companySummary ? (
        <EditCompanyDialog
          company={companySummary.company}
          onClose={() => setCompanyEditOpen(false)}
        />
      ) : null}
    </section>
  );
}

interface ProjectCardProps {
  project: Doc<"projects">;
  isSelected: boolean;
  onSelect: () => void;
}

interface CompanySummary {
  company: Doc<"tenants">;
  roleNames: string[];
  canManageCompany: boolean;
  mode: "AUTHENTICATED" | "DEMO";
  counts: {
    activeWorkspaces: number;
    activeOperators: number;
    repositories: number;
  };
}

function CompanyAccountCard({
  summary,
  onEdit,
}: {
  summary: CompanySummary;
  onEdit: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-secondary">
            <Building2 size={17} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[12px] font-medium text-ink-secondary">Company account</div>
              <StatusBadge tone={summary.mode === "DEMO" ? "warning" : "success"}>
                {summary.mode === "DEMO" ? "Local demo access" : "Authenticated"}
              </StatusBadge>
            </div>
            <div className="mt-1 text-[17px] font-semibold text-ink">{summary.company.name}</div>
            <div className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-ink-secondary">
              {summary.company.description || "Add a company description so operators understand the shared business and policy boundary."}
            </div>
            {summary.company.missionStatement ? (
              <div className="mt-2 text-[12px] text-ink-muted">
                Mission: {summary.company.missionStatement}
              </div>
            ) : null}
          </div>
        </div>
        {summary.canManageCompany ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit company
          </Button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ContractField label="Active workspaces" value={String(summary.counts.activeWorkspaces)} />
        <ContractField label="Active operators" value={String(summary.counts.activeOperators)} />
        <ContractField label="Connected repositories" value={String(summary.counts.repositories)} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-muted">
        <Users size={13} aria-hidden />
        {summary.roleNames.length > 0 ? summary.roleNames.join(", ") : "Company member"}
      </div>
    </Card>
  );
}

function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
  const stats = useQuery(api.projects.getStats, { projectId: project._id });
  const agents = useQuery(api.agents.list, { projectId: project._id });
  const activeAgents = agents?.filter((agent) => agent.status === "ACTIVE").length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border px-4 py-4 text-left transition-colors duration-150",
        isSelected
          ? "border-line-strong bg-surface-2"
          : "border-line bg-surface-1 hover:border-line-strong hover:bg-surface-2"
      )}
      aria-label={`Workspace ${project.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-ink">{project.name}</div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">
            {project.description || "No description yet. Define the operating scope for this workspace."}
          </div>
        </div>
        {project.githubRepo && (
          <Github size={14} strokeWidth={1.7} className="mt-1 shrink-0 text-ink-muted" aria-hidden />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatPill label="Tasks" value={stats?.tasks.total ?? "—"} />
        <StatPill label="Active" value={activeAgents ?? "—"} />
        <StatPill label="Approvals" value={stats?.approvals.pending ?? "—"} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.githubRepo ? (
          <StatusBadge
            tone={project.repositoryStatus === "READY" ? "success" : "neutral"}
          >
            {(project.repositoryStatus ?? "CONFIGURED").toLowerCase()}
          </StatusBadge>
        ) : null}
        {project.swarmConfig && (
          <StatusBadge tone="success">Swarm configured</StatusBadge>
        )}
      </div>
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2">
      <div className="text-[15px] font-semibold text-ink">{value}</div>
      <div className="text-[11.5px] text-ink-muted">{label}</div>
    </div>
  );
}

function ProjectDetails({ project }: { project: Doc<"projects"> }) {
  const agents = useQuery(api.agents.list, { projectId: project._id });
  const stats = useQuery(api.projects.getStats, { projectId: project._id });
  const hostBindings = useQuery(api.workspaceHostBindings.listByProject, {
    projectId: project._id,
  });
  const [repositoryOpen, setRepositoryOpen] = useState(false);

  const activeAgents = agents?.filter((agent) => agent.status === "ACTIVE") ?? [];
  const pausedAgents = agents?.filter((agent) => agent.status === "PAUSED") ?? [];
  const repositoryStatus =
    project.repositoryStatus ?? (project.githubRepo ? "CONFIGURED" : "UNCONFIGURED");

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-ink-secondary">Workspace detail</div>
            <div className="mt-2">
              <div className="text-[19px] font-semibold tracking-tight text-ink">{project.name}</div>
              <div className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-secondary">
                {project.description || "Add a workspace description so operators understand its outcome, constraints, and business purpose."}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={project.status === "PAUSED" ? "warning" : "success"}>
              {(project.status || "ACTIVE").toLowerCase()}
            </StatusBadge>
            <StatusBadge tone={repositoryStatus === "READY" ? "success" : repositoryStatus === "ERROR" ? "error" : "neutral"}>
              repo {repositoryStatus.toLowerCase()}
            </StatusBadge>
            <Button variant="outline" size="sm" onClick={() => setRepositoryOpen(true)}>
              {project.githubRepo ? (
                <Github className="h-3.5 w-3.5" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {project.githubRepo ? "Edit repository" : "Connect repository"}
            </Button>
            {project.swarmConfig && (
              <Button variant="outline" size="sm">
                <Orbit className="h-3.5 w-3.5" />
                Swarm live
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <MetricBlock
                label="Task load"
                value={stats?.tasks.total ?? "—"}
                detail="Total tasks attached to this workspace."
              />
            </Card>
            <Card className="p-4">
              <MetricBlock
                label="Agent capacity"
                value={agents === undefined ? "—" : activeAgents.length}
                detail="Agents actively operating right now."
              />
            </Card>
            <Card className="p-4">
              <MetricBlock
                label="Approvals"
                value={stats?.approvals.pending ?? "—"}
                detail="Human decisions still waiting in queue."
              />
            </Card>
          </div>

          <Card className="p-5">
            <div className="text-[12.5px] font-medium text-ink-secondary">Workspace contract</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <ContractField label="Purpose" value={project.purpose || "Not defined"} />
              <ContractField label="Owner" value={project.owner || "Unassigned"} />
              <ContractField
                label="Default policy"
                value={project.defaultPolicy || "Not configured"}
              />
            </div>
          </Card>

          <WorkspaceRepositoriesPanel project={project} />

          {project.tenantId ? <WorkspaceTeamsPanel project={project} /> : null}

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12.5px] font-medium text-ink-secondary">
                  Executor checkouts
                </div>
                <div className="mt-1 text-[12.5px] text-ink-muted">
                  Host-specific paths reported by execution workers.
                </div>
              </div>
              <HardDrive size={16} strokeWidth={1.7} className="text-ink-muted" />
            </div>
            <div className="mt-4 space-y-3">
              {hostBindings === undefined ? (
                <div className="h-20 animate-pulse rounded-lg bg-surface-2" />
              ) : hostBindings.length === 0 ? (
                <div className="rounded-lg border border-line bg-surface-2 px-4 py-4 text-[13px] text-ink-secondary">
                  No executor has reported a checkout for this workspace yet.
                </div>
              ) : (
                hostBindings.map((binding) => (
                  <div key={binding._id} className="rounded-lg border border-line bg-surface-2 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        <Server size={14} strokeWidth={1.7} className="text-ink-muted" />
                        {binding.hostId}
                      </div>
                      <StatusBadge
                        tone={
                          binding.status === "READY"
                            ? "success"
                            : binding.status === "ERROR" || binding.status === "MISSING"
                              ? "error"
                              : "warning"
                        }
                      >
                        {binding.status.toLowerCase()}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 grid gap-2 text-[11.5px] text-ink-muted sm:grid-cols-2">
                      <div className="flex items-center gap-1.5">
                        <HardDrive size={12} aria-hidden />
                        <span className="truncate font-mono" title={binding.checkoutRoot}>
                          {binding.checkoutRoot}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GitCommit size={12} aria-hidden />
                        <span className="truncate font-mono">
                          {binding.observedBranch || "branch unknown"}
                          {binding.observedCommit
                            ? ` · ${binding.observedCommit.slice(0, 8)}`
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock3 size={12} aria-hidden />
                        {new Date(binding.checkedAt).toLocaleString()}
                      </div>
                      <div>{binding.dirty ? "Uncommitted changes present" : "Working tree clean"}</div>
                    </div>
                    {binding.error ? (
                      <div className="mt-2 text-[12px] text-danger">{binding.error}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <WorkspaceRecommendations
            project={project}
            hostBindings={hostBindings}
            onConnectRepository={() => setRepositoryOpen(true)}
          />

          <Card className="p-5">
            <div className="text-[12.5px] font-medium text-ink-secondary">Swarm settings</div>
            <div className="mt-3 space-y-3">
              {project.swarmConfig ? (
                <>
                  <IntegrationRow
                    icon={<Orbit size={15} strokeWidth={1.7} />}
                    label="Max agents"
                    value={String(project.swarmConfig.maxAgents)}
                    detail={project.swarmConfig.autoScale ? "Auto-scale is enabled." : "Capacity is fixed manually."}
                  />
                  <IntegrationRow
                    icon={<Sparkles size={15} strokeWidth={1.7} />}
                    label="Default model"
                    value={project.swarmConfig.defaultModel || "Claude Sonnet 4"}
                    detail="Primary runtime model for default assignments."
                  />
                </>
              ) : (
                <div className="rounded-xl border border-line bg-surface-2 px-4 py-4 text-[13.5px] leading-relaxed text-ink-secondary">
                  This workspace does not have swarm settings yet. Add one before expecting repeatable routing and capacity behavior.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[12.5px] font-medium text-ink-secondary">Agent roster</div>
            <div className="mt-3 space-y-3">
              <RosterGroup title="Active agents" agents={activeAgents} emptyLabel="No active agents are currently assigned." />
              <RosterGroup title="Paused agents" agents={pausedAgents} emptyLabel="No paused agents." />
            </div>
          </Card>
        </div>
      </div>

      {repositoryOpen ? (
        <ConnectRepositoryDialog
          project={project}
          onClose={() => setRepositoryOpen(false)}
        />
      ) : null}
    </Card>
  );
}

function WorkspaceRecommendations({
  project,
  hostBindings,
  onConnectRepository,
}: {
  project: Doc<"projects">;
  hostBindings: Array<{ status: string }> | undefined;
  onConnectRepository: () => void;
}) {
  const recommendations = [
    ...(!project.purpose || !project.owner || !project.defaultPolicy
      ? [{ id: "contract", title: "Complete the workspace contract", detail: "Purpose, owner, and default policy make responsibility and governance explicit." }]
      : []),
    ...(!project.githubRepo
      ? [{ id: "repository", title: "Connect the default repository", detail: "Repository-backed WorkOrders need a visible source and branch boundary." }]
      : project.repositoryStatus !== "READY"
        ? [{ id: "validation", title: "Validate repository readiness", detail: "Confirm repository access, branch context, webhook posture, and executor checkout." }]
        : []),
    ...(!project.swarmConfig
      ? [{ id: "capacity", title: "Define fleet capacity", detail: "Set an agent limit and default routing posture before repeatable dispatch." }]
      : []),
    ...(hostBindings !== undefined && hostBindings.length === 0
      ? [{ id: "executor", title: "Register an execution checkout", detail: "No local or cloud executor has reported a checkout for this workspace." }]
      : hostBindings?.length && !hostBindings.some((binding) => binding.status === "READY")
        ? [{ id: "executor-health", title: "Repair executor readiness", detail: "Connected execution hosts are not currently ready for repository-backed work." }]
        : []),
  ];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12.5px] font-medium text-ink-secondary">Setup recommendations</div>
          <div className="mt-1 text-[12px] text-ink-muted">Deterministic next steps based on the workspace contract and live readiness.</div>
        </div>
        <Sparkles size={15} className="text-ink-muted" aria-hidden />
      </div>
      <div className="mt-3 space-y-2">
        {recommendations.length === 0 ? (
          <div className="rounded-lg border border-ok/20 bg-ok-soft px-3 py-3 text-[12.5px] text-ok">
            Workspace foundation is ready. No setup exception needs attention.
          </div>
        ) : (
          recommendations.map((recommendation) => (
            <div key={recommendation.id} className="rounded-lg border border-line bg-surface-2 px-3 py-3">
              <div className="text-[12.5px] font-medium text-ink">{recommendation.title}</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">{recommendation.detail}</div>
              {recommendation.id === "repository" ? (
                <Button variant="ghost" size="sm" className="mt-2" onClick={onConnectRepository}>Connect repository</Button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ContractField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
      <div className="text-[11.5px] text-ink-muted">{label}</div>
      <div className="mt-1 text-[13.5px] font-medium leading-relaxed text-ink">{value}</div>
    </div>
  );
}

function IntegrationRow({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-ink-secondary">{icon}</span>
        <div className="min-w-0">
          <div className="text-[11.5px] text-ink-muted">{label}</div>
          <div className="mt-1 text-[13.5px] font-medium text-ink">{value}</div>
        </div>
      </div>
      <div className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{detail}</div>
    </div>
  );
}

function RosterGroup({
  title,
  agents,
  emptyLabel,
}: {
  title: string;
  agents: Doc<"agents">[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="mb-2 text-[11.5px] text-ink-muted">{title}</div>
      {agents.length > 0 ? (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent._id} className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface-3 text-[13px] font-semibold text-ink-secondary">
                {agent.emoji || agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-ink">{agent.name}</div>
                <div className="text-[12.5px] text-ink-muted">{agent.role}</div>
              </div>
              <StatusBadge tone="neutral">{agent.status.toLowerCase()}</StatusBadge>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[13.5px] text-ink-secondary">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

type WorkspaceStatus = "ACTIVE" | "PAUSED";

interface WorkspaceForm {
  name: string;
  slug: string;
  description: string;
  purpose: string;
  owner: string;
  defaultPolicy: string;
  status: WorkspaceStatus;
}

const EMPTY_WORKSPACE: WorkspaceForm = {
  name: "",
  slug: "",
  description: "",
  purpose: "",
  owner: "",
  defaultPolicy: "Governed research",
  status: "ACTIVE",
};

function slugifyWorkspaceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CreateWorkspaceDialog({
  tenantId,
  companyContextEnabled,
  onClose,
  onCreated,
}: {
  tenantId: Id<"tenants"> | null;
  companyContextEnabled: boolean;
  onClose: () => void;
  onCreated: (projectId: Id<"projects">) => void;
}) {
  const createLegacyWorkspace = useMutation(api.projects.create);
  const createScopedWorkspace = useMutation(api.companyContext.createWorkspace);
  const [form, setForm] = useState<WorkspaceForm>(EMPTY_WORKSPACE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof WorkspaceForm>(key: K, value: WorkspaceForm[K]) => {
    setForm((current) => {
      if (key === "name") {
        const shouldUpdateSlug =
          current.slug.length === 0 || current.slug === slugifyWorkspaceName(current.name);
        return {
          ...current,
          name: value as string,
          slug: shouldUpdateSlug ? slugifyWorkspaceName(value as string) : current.slug,
        };
      }
      return { ...current, [key]: value };
    });
    setErrors((current) => ({ ...current, [key]: "", form: "" }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Workspace name is required.";
    if (!form.slug.trim()) {
      nextErrors.slug = "Workspace slug is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
      nextErrors.slug = "Use lowercase letters, numbers, and single hyphens.";
    }
    if (!form.purpose.trim()) nextErrors.purpose = "Purpose is required.";
    if (!form.owner.trim()) nextErrors.owner = "Owner is required.";
    if (!form.defaultPolicy.trim()) nextErrors.defaultPolicy = "Default policy is required.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      if (companyContextEnabled && !tenantId) {
        setErrors({ form: "Select an accessible company account first." });
        return;
      }
      const input = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        purpose: form.purpose.trim(),
        owner: form.owner.trim(),
        defaultPolicy: form.defaultPolicy.trim(),
        status: form.status,
      };
      const result = companyContextEnabled
        ? await createScopedWorkspace({ ...input, tenantId: tenantId! })
        : await createLegacyWorkspace(input);
      if (!result.success || !("project" in result) || !result.project) {
        setErrors({ form: "error" in result ? result.error : "Workspace could not be created." });
        return;
      }
      onCreated(result.project._id);
      onClose();
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Workspace could not be created.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Define the operating boundary before importing requirements or dispatching agents.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-5 md:grid-cols-2">
            <WorkspaceField id="workspace-name" label="Name" error={errors.name}>
              <Input
                id="workspace-name"
                value={form.name}
                maxLength={120}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "workspace-name-error" : undefined}
                autoFocus
              />
            </WorkspaceField>
            <WorkspaceField id="workspace-slug" label="Slug" error={errors.slug}>
              <Input
                id="workspace-slug"
                value={form.slug}
                maxLength={80}
                onChange={(event) => updateField("slug", event.target.value.toLowerCase())}
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={errors.slug ? "workspace-slug-error" : undefined}
                placeholder="software-factory-research-lab"
              />
            </WorkspaceField>
            <WorkspaceField id="workspace-description" label="Description" className="md:col-span-2">
              <Textarea
                id="workspace-description"
                value={form.description}
                maxLength={1000}
                onChange={(event) => updateField("description", event.target.value)}
                rows={2}
              />
            </WorkspaceField>
            <WorkspaceField id="workspace-purpose" label="Purpose" error={errors.purpose} className="md:col-span-2">
              <Textarea
                id="workspace-purpose"
                value={form.purpose}
                maxLength={500}
                onChange={(event) => updateField("purpose", event.target.value)}
                aria-invalid={Boolean(errors.purpose)}
                aria-describedby={errors.purpose ? "workspace-purpose-error" : undefined}
                rows={3}
              />
            </WorkspaceField>
            <WorkspaceField id="workspace-owner" label="Owner" error={errors.owner}>
              <Input
                id="workspace-owner"
                value={form.owner}
                maxLength={120}
                onChange={(event) => updateField("owner", event.target.value)}
                aria-invalid={Boolean(errors.owner)}
                aria-describedby={errors.owner ? "workspace-owner-error" : undefined}
              />
            </WorkspaceField>
            <WorkspaceField id="workspace-policy" label="Default policy" error={errors.defaultPolicy}>
              <Input
                id="workspace-policy"
                value={form.defaultPolicy}
                maxLength={120}
                onChange={(event) => updateField("defaultPolicy", event.target.value)}
                aria-invalid={Boolean(errors.defaultPolicy)}
                aria-describedby={errors.defaultPolicy ? "workspace-policy-error" : undefined}
              />
            </WorkspaceField>
            <WorkspaceField id="workspace-status" label="Status">
              <select
                id="workspace-status"
                value={form.status}
                onChange={(event) => updateField("status", event.target.value as WorkspaceStatus)}
                className="h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13.5px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </WorkspaceField>
          </div>

          {errors.form ? (
            <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {errors.form}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceField({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <div id={`${id}-error`} className="text-[12px] text-danger">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function EditCompanyDialog({
  company,
  onClose,
}: {
  company: Doc<"tenants">;
  onClose: () => void;
}) {
  const updateCompany = useMutation(api.companyContext.updateCompany);
  const [name, setName] = useState(company.name);
  const [description, setDescription] = useState(company.description || "");
  const [missionStatement, setMissionStatement] = useState(company.missionStatement || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await updateCompany({
        tenantId: company._id,
        name: name.trim(),
        description: description.trim() || undefined,
        missionStatement: missionStatement.trim() || undefined,
        expectedUpdatedAt: company.updatedAt ?? 0,
      });
      if (!result.success) {
        setError(result.error || "Company profile could not be updated.");
        return;
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Company profile could not be updated.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Edit company account</DialogTitle>
            <DialogDescription>
              Update the identity and mission shared by this company’s workspaces. Access and billing changes are managed separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-5">
            <WorkspaceField id="company-name" label="Company name">
              <Input id="company-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} autoFocus />
            </WorkspaceField>
            <WorkspaceField id="company-description" label="Description">
              <Textarea id="company-description" value={description} maxLength={1000} onChange={(event) => setDescription(event.target.value)} rows={3} />
            </WorkspaceField>
            <WorkspaceField id="company-mission" label="Mission statement">
              <Textarea id="company-mission" value={missionStatement} maxLength={1000} onChange={(event) => setMissionStatement(event.target.value)} rows={3} />
            </WorkspaceField>
          </div>
          {error ? (
            <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save company"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConnectRepositoryDialog({
  project,
  onClose,
}: {
  project: Doc<"projects">;
  onClose: () => void;
}) {
  const connectRepository = useMutation(api.projects.connectRepository);
  const [repository, setRepository] = useState(project.githubRepo || "");
  const [defaultBranch, setDefaultBranch] = useState(project.githubBranch || "main");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedRepository = repository.trim();
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalizedRepository)) {
      setError("Use the repository format owner/repository.");
      return;
    }
    if (!defaultBranch.trim()) {
      setError("Default branch is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await connectRepository({
        projectId: project._id,
        repository: normalizedRepository,
        defaultBranch: defaultBranch.trim(),
      });
      if (!result.success) {
        setError(result.error || "Repository could not be configured.");
        return;
      }
      onClose();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Repository could not be configured.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{project.githubRepo ? "Edit repository" : "Connect repository"}</DialogTitle>
            <DialogDescription>
              Configure repository context for this workspace. This records the owner, repository, and default branch; it does not create a remote repository.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-5">
            <WorkspaceField id="repository-name" label="Repository">
              <Input
                id="repository-name"
                value={repository}
                onChange={(event) => {
                  setRepository(event.target.value);
                  setError("");
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "repository-error" : undefined}
                placeholder="owner/repository"
                autoFocus
              />
            </WorkspaceField>
            <WorkspaceField id="repository-branch" label="Default branch">
              <Input
                id="repository-branch"
                value={defaultBranch}
                onChange={(event) => {
                  setDefaultBranch(event.target.value);
                  setError("");
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "repository-error" : undefined}
              />
            </WorkspaceField>
          </div>

          {error ? (
            <div id="repository-error" role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              {error}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save repository"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
