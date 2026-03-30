import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "./components/PageHeader";
import { FolderKanban, Github, Orbit, RadioTower, Sparkles } from "lucide-react";

interface ProjectsViewProps {
  projectId: Id<"projects"> | null;
}

export function ProjectsView({ projectId }: ProjectsViewProps) {
  const projects = useQuery(api.projects.list);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(projectId);

  useEffect(() => {
    if (projectId) setSelectedProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!selectedProject && projects && projects.length > 0) {
      setSelectedProject(projects[0]._id);
    }
  }, [projects, selectedProject]);

  const totals = useMemo(() => {
    if (!projects) return null;
    return {
      total: projects.length,
      connected: projects.filter((project) => Boolean(project.githubRepo)).length,
      swarms: projects.filter((project) => Boolean(project.swarmConfig)).length,
    };
  }, [projects]);

  if (!projects || !totals) {
    return (
      <main className="mc-page">
        <div className="mc-page-body mc-page-stack">
          <div className="h-24 rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
          <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
            <div className="h-[520px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
            <div className="h-[520px] rounded-2xl border border-[var(--panel-line)] skeleton-shimmer" />
          </div>
        </div>
      </main>
    );
  }

  const selectedProjectDoc = projects.find((project) => project._id === selectedProject) ?? null;

  return (
    <main className="mc-page">
      <PageHeader
        title="Projects"
        description="Operate every mission, repo, and swarm from a single view. Select a project to inspect readiness, agent staffing, and integration health."
        icon={<FolderKanban className="h-4.5 w-4.5" strokeWidth={1.7} />}
        status={
          <Badge variant="outline" className="border-cyan-300/25 text-cyan-100">
            {totals.total} tracked projects
          </Badge>
        }
      />

      <div className="mc-page-body mc-page-stack">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <div className="mc-kicker">Portfolio</div>
            <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{totals.total}</div>
            <div className="mt-1 text-sm text-muted-foreground">Active project workspaces under Mission Control.</div>
          </Card>
          <Card className="p-5">
            <div className="mc-kicker">Connected repos</div>
            <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-cyan-100">{totals.connected}</div>
            <div className="mt-1 text-sm text-muted-foreground">Projects with a linked GitHub repository and branch context.</div>
          </Card>
          <Card className="p-5">
            <div className="mc-kicker">Swarm-ready</div>
            <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-emerald-100">{totals.swarms}</div>
            <div className="mt-1 text-sm text-muted-foreground">Projects that already define a swarm configuration.</div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--panel-line)] px-5 py-4">
              <div className="mc-kicker">Project registry</div>
              <div className="mt-1 text-sm font-semibold text-foreground">Choose where you want to operate</div>
            </div>
            <div className="space-y-3 p-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  isSelected={project._id === selectedProject}
                  onSelect={() => setSelectedProject(project._id)}
                />
              ))}
            </div>
          </Card>

          {selectedProjectDoc ? (
            <ProjectDetails project={selectedProjectDoc} />
          ) : (
            <Card className="flex min-h-[520px] items-center justify-center p-10 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 shadow-[var(--glow-cyan)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="mt-4 text-lg font-semibold text-foreground">Select a project</div>
                <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Use the registry on the left to inspect agent staffing, GitHub connectivity, and swarm configuration for the project you want to drive next.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

interface ProjectCardProps {
  project: Doc<"projects">;
  isSelected: boolean;
  onSelect: () => void;
}

function ProjectCard({ project, isSelected, onSelect }: ProjectCardProps) {
  const stats = useQuery(api.projects.getStats, { projectId: project._id });
  const agents = useQuery(api.agents.list, { projectId: project._id });
  const activeAgents = agents?.filter((agent) => agent.status === "ACTIVE").length ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200",
        isSelected
          ? "border-cyan-300/25 bg-cyan-400/10 shadow-[var(--glow-cyan)]"
          : "border-[var(--panel-line)] bg-[color:var(--shell-panel)] hover:border-[var(--panel-line-strong)] hover:bg-cyan-400/6"
      )}
      aria-label={`Project ${project.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">📁</span>
            <div className="truncate text-sm font-semibold text-foreground">{project.name}</div>
          </div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {project.description || "No description yet. Define the operating scope for this project."}
          </div>
        </div>
        {project.githubRepo && (
          <div className="rounded-full border border-[var(--panel-line)] bg-[color:var(--shell-panel)] p-2 text-cyan-100">
            <Github className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <StatPill label="Tasks" value={stats?.tasks.total ?? 0} />
        <StatPill label="Active" value={activeAgents} />
        <StatPill label="Approvals" value={stats?.approvals.pending ?? 0} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.githubRepo && (
          <Badge variant="outline" className="border-cyan-300/20 text-cyan-100">
            Repo linked
          </Badge>
        )}
        {project.swarmConfig && (
          <Badge variant="outline" className="border-emerald-300/20 text-emerald-100">
            Swarm configured
          </Badge>
        )}
      </div>
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--panel-line)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--panel-muted-bg)_92%,transparent),transparent)] px-3 py-2">
      <div className="text-lg font-semibold tracking-[-0.03em] text-foreground">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
    </div>
  );
}

function ProjectDetails({ project }: { project: Doc<"projects"> }) {
  const agents = useQuery(api.agents.list, { projectId: project._id });
  const stats = useQuery(api.projects.getStats, { projectId: project._id });

  const activeAgents = agents?.filter((agent) => agent.status === "ACTIVE") ?? [];
  const pausedAgents = agents?.filter((agent) => agent.status === "PAUSED") ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--panel-line)] px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mc-kicker">Project detail</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <div className="text-xl font-semibold text-foreground">{project.name}</div>
                <div className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {project.description || "Add a project description so operators understand the project outcome, constraints, and current business purpose."}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.githubRepo && (
              <Button variant="outline" size="sm">
                <Github className="h-3.5 w-3.5" />
                {project.githubBranch || "main"}
              </Button>
            )}
            {project.swarmConfig && (
              <Button variant="neon-cyan" size="sm">
                <Orbit className="h-3.5 w-3.5" />
                Swarm live
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
              <div className="mc-kicker">Task load</div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{stats?.tasks.total ?? 0}</div>
              <div className="mt-1 text-xs text-muted-foreground">Total tasks attached to this project.</div>
            </Card>
            <Card className="p-4">
              <div className="mc-kicker">Agent capacity</div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-cyan-100">{activeAgents.length}</div>
              <div className="mt-1 text-xs text-muted-foreground">Agents actively operating right now.</div>
            </Card>
            <Card className="p-4">
              <div className="mc-kicker">Approvals</div>
              <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-amber-200">{stats?.approvals.pending ?? 0}</div>
              <div className="mt-1 text-xs text-muted-foreground">Human decisions still waiting in queue.</div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="mc-kicker">Integration posture</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <IntegrationRow
                icon={<Github className="h-4 w-4" />}
                label="Repository"
                value={project.githubRepo || "Not connected"}
                detail={project.githubRepo ? `Branch ${project.githubBranch || "main"}` : "Link a repository for release and code context."}
              />
              <IntegrationRow
                icon={<RadioTower className="h-4 w-4" />}
                label="Webhook"
                value={project.githubWebhookSecret ? "Configured" : "Missing"}
                detail={project.githubWebhookSecret ? "Inbound repo events are enabled." : "Set a webhook secret if this project should react to GitHub events."}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mc-kicker">Swarm settings</div>
            <div className="mt-3 space-y-3">
              {project.swarmConfig ? (
                <>
                  <IntegrationRow
                    icon={<Orbit className="h-4 w-4" />}
                    label="Max agents"
                    value={String(project.swarmConfig.maxAgents)}
                    detail={project.swarmConfig.autoScale ? "Auto-scale is enabled." : "Capacity is fixed manually."}
                  />
                  <IntegrationRow
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Default model"
                    value={project.swarmConfig.defaultModel || "Claude Sonnet 4"}
                    detail="Primary runtime model for default assignments."
                  />
                </>
              ) : (
                <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                  This project does not have swarm settings yet. Add one before expecting repeatable routing and capacity behavior.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mc-kicker">Agent roster</div>
            <div className="mt-3 space-y-3">
              <RosterGroup title="Active agents" agents={activeAgents} emptyLabel="No active agents are currently assigned." />
              <RosterGroup title="Paused agents" agents={pausedAgents} emptyLabel="No paused agents." />
            </div>
          </Card>
        </div>
      </div>
    </Card>
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
    <div className="rounded-xl border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/16 bg-cyan-400/10 text-cyan-100">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
        </div>
      </div>
      <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</div>
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
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      {agents.length > 0 ? (
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent._id} className="flex items-center gap-3 rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-3 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/12 text-sm font-semibold text-cyan-100">
                {agent.emoji || agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.role}</div>
              </div>
              <Badge variant="outline" className="border-[var(--panel-line)] text-muted-foreground">
                {agent.status.toLowerCase()}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--panel-line)] bg-[color:var(--shell-panel)] px-4 py-3 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
