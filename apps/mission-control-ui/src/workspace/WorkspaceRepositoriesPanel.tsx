import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
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
import { AlertTriangle, CheckCircle2, GitBranch, Github, Layers3, Plus, ShieldCheck } from "lucide-react";
import { FactoryConfigurationPanel } from "./FactoryConfigurationPanel";

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
        <>
          <GitHubAppReadinessPanel repositoryId={selectedRepository.repositoryId} />
          <FactoryConfigurationPanel projectId={project._id} repositoryId={selectedRepository.repositoryId} />
          <CodeScopeList
            repositoryId={selectedRepository.repositoryId}
            repository={selectedRepository.repository}
            onAdd={() => setScopeOpen(true)}
          />
        </>
      ) : null}

      {addRepositoryOpen ? (
        <AddRepositoryDialog projectId={project._id} onClose={() => setAddRepositoryOpen(false)} />
      ) : null}
      {scopeOpen && selectedRepository?.repositoryId ? (
        <AddCodeScopeDialog
          repositoryId={selectedRepository.repositoryId}
          repository={selectedRepository.repository}
          onClose={() => setScopeOpen(false)}
        />
      ) : null}
    </Card>
  );
}

function GitHubAppReadinessPanel({
  repositoryId,
}: {
  repositoryId: Id<"workspaceRepositories">;
}) {
  const readiness = useQuery(api.githubAppConnections.getRepositoryReadiness, {
    repositoryId,
  });
  const beginInstallation = useAction(api.githubAppConnections.beginInstallation);
  const [installPending, setInstallPending] = useState(false);
  const [installError, setInstallError] = useState("");

  if (readiness === undefined) {
    return (
      <div className="mt-5 border-t border-line pt-5" aria-label="Loading GitHub App readiness">
        <div className="h-24 animate-pulse rounded-lg bg-surface-2" />
      </div>
    );
  }

  const tone = readiness.overall === "VERIFIED"
    ? "success" as const
    : readiness.overall === "STALE"
      ? "warning" as const
      : "error" as const;

  const install = async () => {
    setInstallPending(true);
    setInstallError("");
    try {
      const result = await beginInstallation({ repositoryId });
      if (!result.ok) {
        setInstallError(
          "GitHub App setup is not configured for this environment. Add the required server credentials, then try again."
        );
        setInstallPending(false);
        return;
      }
      window.location.assign(result.installUrl);
    } catch (error) {
      setInstallError("GitHub App setup could not start. Try again or ask a workspace administrator.");
      setInstallPending(false);
    }
  };

  return (
    <section className="mt-5 border-t border-line pt-5" aria-labelledby="github-app-readiness-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div id="github-app-readiness-title" className="flex items-center gap-2 text-[12.5px] font-medium text-ink-secondary">
            <ShieldCheck size={14} aria-hidden /> GitHub App readiness
          </div>
          <div className="mt-1 text-[12px] text-ink-muted">
            Installation identity, least privilege, webhook coverage, and verification freshness.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={tone}>{readiness.overall.toLowerCase()}</StatusBadge>
          {readiness.overall !== "VERIFIED" ? (
            <Button variant="outline" size="sm" disabled={installPending} onClick={install}>
              <Github className="h-3.5 w-3.5" aria-hidden />
              {installPending ? "Opening GitHub…" : readiness.installation ? "Repair installation" : "Install GitHub App"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {readiness.checks.map((check) => {
          const passing = check.status === "VERIFIED";
          return (
            <div key={check.id} className="rounded-lg border border-line bg-surface-2 px-3 py-3">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                {passing ? (
                  <CheckCircle2 size={14} className="text-success" aria-hidden />
                ) : (
                  <AlertTriangle size={14} className="text-warning" aria-hidden />
                )}
                {check.label}
                <span className="sr-only">: {check.status}</span>
              </div>
              <div className="mt-1.5 text-[11.5px] leading-relaxed text-ink-muted">{check.detail}</div>
              {check.remediation ? (
                <div className="mt-2 text-[11.5px] leading-relaxed text-ink-secondary">
                  Next: {check.remediation}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {readiness.installation ? (
        <div className="mt-2 text-[11px] text-ink-muted">
          Installation {readiness.installation.installationId} · {readiness.installation.accountLogin} · tokens are not stored
        </div>
      ) : null}
      {installError ? <ErrorNotice message={installError} /> : null}
    </section>
  );
}

function CodeScopeList({
  repositoryId,
  repository,
  onAdd,
}: {
  repositoryId: Id<"workspaceRepositories">;
  repository: string;
  onAdd: () => void;
}) {
  const scopes = useQuery(api.projects.listCodeScopes, { repositoryId });
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
                    {scope.owningTeam ? `Owner: ${scope.owningTeam} · ` : ""}
                    {scope.allowedEnvironments.join(" + ").toLowerCase()} execution
                    {scope.verificationPolicy ? ` · ${scope.verificationPolicy}` : ""}
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
  repositoryId,
  repository,
  onClose,
}: {
  repositoryId: Id<"workspaceRepositories">;
  repository: string;
  onClose: () => void;
}) {
  const createScope = useMutation(api.projects.createRepositoryCodeScope);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [includePaths, setIncludePaths] = useState("");
  const [excludePaths, setExcludePaths] = useState("");
  const [owningTeam, setOwningTeam] = useState("");
  const [requiredReviewers, setRequiredReviewers] = useState("");
  const [verificationPolicy, setVerificationPolicy] = useState("");
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
        owningTeam: owningTeam.trim() || undefined,
        requiredReviewers: splitList(requiredReviewers),
        allowedEnvironments,
        verificationPolicy: verificationPolicy.trim() || undefined,
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
              <Input id="scope-team" value={owningTeam} onChange={(event) => setOwningTeam(event.target.value)} placeholder="Checkout" />
            </Field>
            <Field id="scope-reviewers" label="Required reviewers">
              <Input id="scope-reviewers" value={requiredReviewers} onChange={(event) => setRequiredReviewers(event.target.value)} placeholder="Platform, Security" />
            </Field>
            <Field id="scope-policy" label="Verification policy" className="md:col-span-2">
              <Input id="scope-policy" value={verificationPolicy} onChange={(event) => setVerificationPolicy(event.target.value)} placeholder="Unit + browser + independent review" />
            </Field>
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
