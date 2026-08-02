import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/factory/badges";
import { GitBranch, Github, Layers3, Plus, ShieldCheck } from "lucide-react";

interface WorkspaceRepositoriesPanelProps {
  project: Doc<"projects">;
}

type RepositoryRow = {
  repositoryId: Id<"workspaceRepositories"> | null;
  source: "LEGACY" | "CONNECTION";
  repository: string;
  displayName: string;
  defaultBranch: string;
  isDefault: boolean;
  status: "UNCONFIGURED" | "CONFIGURED" | "READY" | "DEGRADED" | "ERROR";
  validatedAt?: number;
  validationError?: string;
  webhookStatus: "MISSING" | "CONFIGURED" | "READY" | "ERROR";
  scopeCount: number;
};

function statusTone(status: RepositoryRow["status"]): "success" | "warning" | "error" | "neutral" {
  if (status === "READY") return "success";
  if (status === "DEGRADED") return "warning";
  if (status === "ERROR") return "error";
  return "neutral";
}

export function WorkspaceRepositoriesPanel({ project }: WorkspaceRepositoriesPanelProps) {
  const repositoryRows = useQuery(api.projects.listRepositories, {
    projectId: project._id,
  }) as RepositoryRow[] | undefined;
  const setDefaultRepository = useMutation(api.projects.setDefaultRepository);
  const backfillLegacyRepositories = useMutation(api.projects.backfillLegacyRepositories);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<Id<"workspaceRepositories"> | null>(null);
  const [addRepositoryOpen, setAddRepositoryOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    if (!repositoryRows) return;
    const currentStillExists = repositoryRows.some(
      (row) => row.repositoryId === selectedRepositoryId
    );
    if (!currentStillExists) {
      setSelectedRepositoryId(
        repositoryRows.find((row) => row.isDefault)?.repositoryId ??
          repositoryRows.find((row) => row.repositoryId)?.repositoryId ??
          null
      );
    }
  }, [repositoryRows, selectedRepositoryId]);

  const selectedRepository = repositoryRows?.find(
    (row) => row.repositoryId === selectedRepositoryId
  );

  const makeDefault = async (repositoryId: Id<"workspaceRepositories">) => {
    setActionPending(true);
    setActionError("");
    try {
      const result = await setDefaultRepository({ repositoryId });
      if (!result.success) setActionError(result.error || "Default repository could not be changed.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Default repository could not be changed.");
    } finally {
      setActionPending(false);
    }
  };

  const enableCodeScopes = async () => {
    setActionPending(true);
    setActionError("");
    try {
      const result = await backfillLegacyRepositories({ projectId: project._id });
      if (result.failed > 0) {
        setActionError("Repository preparation failed. Existing workspace behavior is unchanged.");
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Repository preparation failed.");
    } finally {
      setActionPending(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12.5px] font-medium text-ink-secondary">Repository connections</div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
            Portable source boundaries for work, agents, runs, and evidence. Local checkout paths remain executor-specific.
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddRepositoryOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add repository
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {repositoryRows === undefined ? (
          <div className="space-y-2" aria-label="Loading repository connections">
            <div className="h-24 animate-pulse rounded-lg bg-surface-2" />
            <div className="h-24 animate-pulse rounded-lg bg-surface-2" />
          </div>
        ) : repositoryRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-2 px-4 py-5">
            <div className="flex items-start gap-3">
              <Github size={16} className="mt-0.5 text-ink-muted" aria-hidden />
              <div>
                <div className="text-[13.5px] font-medium text-ink">No repository connected</div>
                <div className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                  Add a repository before dispatching repository-backed work. Workspaces can contain multiple repositories.
                </div>
              </div>
            </div>
          </div>
        ) : (
          repositoryRows.map((row) => {
            const selected = row.repositoryId !== null && row.repositoryId === selectedRepositoryId;
            return (
              <div
                key={row.repositoryId ?? `legacy-${row.repository}`}
                className={`rounded-xl border px-4 py-4 ${
                  selected ? "border-line-strong bg-surface-2" : "border-line bg-surface-1"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => row.repositoryId && setSelectedRepositoryId(row.repositoryId)}
                    disabled={!row.repositoryId}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Github size={14} className="text-ink-muted" aria-hidden />
                      <span className="font-mono text-[13px] font-medium text-ink">{row.repository}</span>
                      {row.isDefault ? <StatusBadge tone="success">Default</StatusBadge> : null}
                      <StatusBadge tone={statusTone(row.status)}>{row.status.toLowerCase()}</StatusBadge>
                      {row.source === "LEGACY" ? <StatusBadge tone="neutral">Compatibility</StatusBadge> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <GitBranch size={12} aria-hidden /> {row.defaultBranch}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Layers3 size={12} aria-hidden /> {row.scopeCount} code scope{row.scopeCount === 1 ? "" : "s"}
                      </span>
                      <span>Webhook {row.webhookStatus.toLowerCase()}</span>
                      {row.validatedAt ? <span>Validated {new Date(row.validatedAt).toLocaleString()}</span> : null}
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {row.repositoryId && !row.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionPending}
                        onClick={() => makeDefault(row.repositoryId!)}
                      >
                        Make default
                      </Button>
                    ) : null}
                    {row.repositoryId ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRepositoryId(row.repositoryId);
                          setScopeOpen(true);
                        }}
                      >
                        <Layers3 className="h-3.5 w-3.5" /> Add code scope
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled={actionPending} onClick={enableCodeScopes}>
                        Prepare monorepo scopes
                      </Button>
                    )}
                  </div>
                </div>
                {row.validationError ? (
                  <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
                    {row.validationError}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {actionError ? (
        <div role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {actionError}
        </div>
      ) : null}

      {selectedRepository?.repositoryId ? (
        <CodeScopeList
          projectId={project._id}
          repositoryId={selectedRepository.repositoryId}
          repository={selectedRepository.repository}
          onAdd={() => setScopeOpen(true)}
        />
      ) : null}

      {addRepositoryOpen ? (
        <AddRepositoryDialog projectId={project._id} onClose={() => setAddRepositoryOpen(false)} />
      ) : null}
      {scopeOpen && selectedRepository?.repositoryId ? (
        <AddCodeScopeDialog
          projectId={project._id}
          repositoryId={selectedRepository.repositoryId}
          repository={selectedRepository.repository}
          onClose={() => setScopeOpen(false)}
        />
      ) : null}
    </Card>
  );
}

function CodeScopeList({
  projectId,
  repositoryId,
  repository,
  onAdd,
}: {
  projectId: Id<"projects">;
  repositoryId: Id<"workspaceRepositories">;
  repository: string;
  onAdd: () => void;
}) {
  const scopes = useQuery(api.projects.listCodeScopes, { repositoryId });
  const structure = useQuery(api.softwareFactoryControlPlane.listWorkspaceStructure, { projectId });
  const archiveScope = useMutation(api.projects.archiveRepositoryCodeScope);
  const activeScopes = scopes?.filter((scope) => scope.active);

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12.5px] font-medium text-ink-secondary">Monorepo code scopes</div>
          <div className="mt-1 text-[12px] text-ink-muted">Governed repository-relative boundaries for {repository}.</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd}>Add scope</Button>
      </div>
      <div className="mt-3 space-y-2">
        {activeScopes === undefined ? (
          <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
        ) : activeScopes.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-[12.5px] text-ink-secondary">
            No code scopes defined. That is valid for a single-purpose repository; add scopes when a monorepo needs explicit app, service, or package boundaries.
          </div>
        ) : (
          activeScopes.map((scope) => (
            <div key={scope._id} className="rounded-lg border border-line bg-surface-2 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <Layers3 size={13} className="text-ink-muted" aria-hidden />
                    {scope.name}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {scope.includePaths.map((path) => (
                      <code key={path} className="rounded border border-line bg-surface-1 px-1.5 py-0.5 text-[10.5px] text-ink-secondary">
                        {path}
                      </code>
                    ))}
                  </div>
                  <div className="mt-2 text-[11.5px] text-ink-muted">
                    {scope.owningTeamId
                      ? `Owner: ${structure?.teams.find((team) => team._id === scope.owningTeamId)?.name ?? scope.owningTeam ?? "Assigned team"} · `
                      : scope.owningTeam ? `Legacy owner: ${scope.owningTeam} · ` : ""}
                    {scope.allowedEnvironments.join(" + ").toLowerCase()} execution
                    {scope.verificationPolicy ? ` · ${scope.verificationPolicy}` : ""}
                    {scope.overlapPriority ? ` · overlap priority ${scope.overlapPriority}` : ""}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => archiveScope({ scopeId: scope._id })}>
                  Archive
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AddRepositoryDialog({
  projectId,
  onClose,
}: {
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const createRepository = useMutation(api.projects.createRepositoryConnection);
  const [repository, setRepository] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await createRepository({
        projectId,
        repository: repository.trim(),
        defaultBranch: defaultBranch.trim(),
        makeDefault,
      });
      if (!result.success) {
        setError(result.error || "Repository could not be connected.");
        return;
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Repository could not be connected.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Add repository</DialogTitle>
            <DialogDescription>
              Connect another repository to this workspace without changing its current default unless you choose to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-5">
            <Field id="new-repository" label="Repository">
              <Input id="new-repository" value={repository} onChange={(event) => setRepository(event.target.value)} placeholder="owner/repository" autoFocus />
            </Field>
            <Field id="new-repository-branch" label="Default branch">
              <Input id="new-repository-branch" value={defaultBranch} onChange={(event) => setDefaultBranch(event.target.value)} />
            </Field>
            <label className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 px-3 py-3 text-[12.5px] text-ink-secondary">
              <input type="checkbox" checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} className="mt-0.5" />
              <span><strong className="text-ink">Make this the workspace default.</strong><br />New unscoped work will use this repository unless a WorkOrder selects another.</span>
            </label>
          </div>
          {error ? <ErrorNotice message={error} /> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Connecting…" : "Connect repository"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCodeScopeDialog({
  projectId,
  repositoryId,
  repository,
  onClose,
}: {
  projectId: Id<"projects">;
  repositoryId: Id<"workspaceRepositories">;
  repository: string;
  onClose: () => void;
}) {
  const createScope = useMutation(api.projects.createRepositoryCodeScope);
  const structure = useQuery(api.softwareFactoryControlPlane.listWorkspaceStructure, { projectId });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [includePaths, setIncludePaths] = useState("");
  const [excludePaths, setExcludePaths] = useState("");
  const [owningTeamId, setOwningTeamId] = useState<Id<"scrumTeams"> | "">("");
  const [requiredReviewers, setRequiredReviewers] = useState("");
  const [verificationPolicy, setVerificationPolicy] = useState("");
  const [approvalPolicy, setApprovalPolicy] = useState("");
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [overlapPriority, setOverlapPriority] = useState("");
  const [allowLocal, setAllowLocal] = useState(true);
  const [allowCloud, setAllowCloud] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const derivedSlug = useMemo(
    () => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    [name]
  );
  useEffect(() => {
    if (!slugEdited) setSlug(derivedSlug);
  }, [derivedSlug, slugEdited]);

  const splitList = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const allowedEnvironments = [
      ...(allowLocal ? ["LOCAL" as const] : []),
      ...(allowCloud ? ["CLOUD" as const] : []),
    ];
    if (allowedEnvironments.length === 0) {
      setError("Allow at least one execution environment.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await createScope({
        repositoryId,
        name: name.trim(),
        slug: slug.trim(),
        includePaths: splitList(includePaths),
        excludePaths: splitList(excludePaths),
        owningTeamId: owningTeamId || undefined,
        requiredReviewers: splitList(requiredReviewers),
        allowedEnvironments,
        verificationPolicy: verificationPolicy.trim() || undefined,
        approvalPolicy: approvalPolicy.trim() || undefined,
        allowOverlap,
        overlapPriority: allowOverlap && overlapPriority ? Number(overlapPriority) : undefined,
      });
      if (!result.success) {
        setError(result.error || "Code scope could not be created.");
        return;
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Code scope could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Add monorepo code scope</DialogTitle>
            <DialogDescription>
              Define repository-relative paths that agents may target in {repository}. Overlapping scopes are rejected until ownership is reviewed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5 md:grid-cols-2">
            <Field id="scope-name" label="Name">
              <Input id="scope-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Buyer portal" autoFocus />
            </Field>
            <Field id="scope-slug" label="Slug">
              <Input id="scope-slug" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value.toLowerCase()); }} placeholder="buyer-portal" />
            </Field>
            <Field id="scope-includes" label="Included paths" className="md:col-span-2">
              <Textarea id="scope-includes" value={includePaths} onChange={(event) => setIncludePaths(event.target.value)} rows={3} placeholder={"apps/buyer-portal\npackages/checkout-ui"} />
            </Field>
            <Field id="scope-excludes" label="Excluded paths" className="md:col-span-2">
              <Textarea id="scope-excludes" value={excludePaths} onChange={(event) => setExcludePaths(event.target.value)} rows={2} placeholder="apps/buyer-portal/generated" />
            </Field>
            <Field id="scope-team" label="Owning team">
              <select id="scope-team" value={owningTeamId} onChange={(event) => setOwningTeamId(event.target.value as Id<"scrumTeams"> | "")} className="h-9 w-full rounded-md border border-line bg-surface-1 px-3 text-[13px] text-ink outline-none focus:border-info-accent focus:ring-2 focus:ring-info-accent/25">
                <option value="">No owning team</option>
                {(structure?.teams ?? []).filter((team) => team.status === "ACTIVE").map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
              </select>
            </Field>
            <Field id="scope-reviewers" label="Required reviewers">
              <Input id="scope-reviewers" value={requiredReviewers} onChange={(event) => setRequiredReviewers(event.target.value)} placeholder="Platform, Security" />
            </Field>
            <Field id="scope-policy" label="Verification policy" className="md:col-span-2">
              <Input id="scope-policy" value={verificationPolicy} onChange={(event) => setVerificationPolicy(event.target.value)} placeholder="Unit + browser + independent review" />
            </Field>
            <div className="md:col-span-2 rounded-lg border border-line bg-surface-2 px-4 py-3">
              <label className="flex items-start gap-2 text-[12.5px] text-ink-secondary">
                <input type="checkbox" checked={allowOverlap} onChange={(event) => setAllowOverlap(event.target.checked)} className="mt-0.5" />
                <span><strong className="font-medium text-ink">Allow an intentional path overlap</strong><br />Overlaps need deterministic priority and an approval policy.</span>
              </label>
              {allowOverlap ? (
                <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr]">
                  <Field id="scope-priority" label="Priority">
                    <Input id="scope-priority" type="number" min={1} value={overlapPriority} onChange={(event) => setOverlapPriority(event.target.value)} placeholder="1" />
                  </Field>
                  <Field id="scope-approval-policy" label="Approval policy">
                    <Input id="scope-approval-policy" value={approvalPolicy} onChange={(event) => setApprovalPolicy(event.target.value)} placeholder="Both owning team leads approve" />
                  </Field>
                </div>
              ) : null}
            </div>
            <div className="md:col-span-2 rounded-lg border border-line bg-surface-2 px-4 py-3">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink"><ShieldCheck size={14} /> Allowed execution</div>
              <div className="mt-3 flex flex-wrap gap-5 text-[12.5px] text-ink-secondary">
                <label className="flex items-center gap-2"><input type="checkbox" checked={allowLocal} onChange={(event) => setAllowLocal(event.target.checked)} /> Local executors</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={allowCloud} onChange={(event) => setAllowCloud(event.target.checked)} /> Cloud executors</label>
              </div>
            </div>
          </div>
          {error ? <ErrorNotice message={error} /> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Create code scope"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">{message}</div>;
}
