import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/factory/badges";
import { CheckCircle2, Factory, ShieldAlert } from "lucide-react";

export function FactoryConfigurationPanel({
  projectId,
  repositoryId,
}: {
  projectId: Id<"projects">;
  repositoryId: Id<"workspaceRepositories">;
}) {
  const definitions = useQuery(api["factory/configuration"].list, { projectId });
  const createFactory = useMutation(api["factory/configuration"].create);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const definition = definitions?.find((item) => item.repositoryId === repositoryId);

  const create = async () => {
    setPending(true);
    setError("");
    try {
      await createFactory({ repositoryId, name: "Software Factory" });
    } catch {
      setError("The Factory could not be created. Confirm workspace automation authority and try again.");
    } finally {
      setPending(false);
    }
  };

  if (definitions === undefined) {
    return <div className="mt-5 h-24 animate-pulse rounded-lg bg-surface-2" aria-label="Loading Factory configuration" />;
  }

  return (
    <section className="mt-5 border-t border-line pt-5" aria-labelledby="factory-configuration-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div id="factory-configuration-title" className="flex items-center gap-2 text-[12.5px] font-medium text-ink-secondary">
            <Factory size={14} aria-hidden /> Factory configuration
          </div>
          <div className="mt-1 text-[12px] text-ink-muted">
            Freeze the repository, workflow, executor, policy, budget, verifiers, and recovery boundary before activation.
          </div>
        </div>
        {!definition ? (
          <Button variant="outline" size="sm" disabled={pending} onClick={create}>
            {pending ? "Creating…" : "Create Factory"}
          </Button>
        ) : (
          <StatusBadge tone={definition.status === "ACTIVE" ? "success" : "neutral"}>
            {definition.status.toLowerCase()}
          </StatusBadge>
        )}
      </div>
      {error ? <div role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">{error}</div> : null}
      {!definition ? (
        <div className="mt-3 rounded-lg border border-dashed border-line bg-surface-2 px-4 py-4 text-[12.5px] text-ink-secondary">
          No Factory exists for this repository. Creating one does not activate or dispatch work.
        </div>
      ) : (
        <FactoryVersionEditor factoryDefinitionId={definition._id} projectId={projectId} repositoryId={repositoryId} />
      )}
    </section>
  );
}

function FactoryVersionEditor({
  factoryDefinitionId,
  projectId,
  repositoryId,
}: {
  factoryDefinitionId: Id<"factoryDefinitions">;
  projectId: Id<"projects">;
  repositoryId: Id<"workspaceRepositories">;
}) {
  const detail = useQuery(api["factory/configuration"].getDetail, { factoryDefinitionId });
  const workflows = useQuery(api.workflows.list, { activeOnly: true });
  const policies = useQuery(api["governance/policyEnvelopes"].listPolicyEnvelopes, { projectId, activeOnly: true });
  const verifiers = useQuery(api["context/verifiers"].list, { projectId, activeOnly: true });
  const versionOptions = useQuery(api["factory/configuration"].getVersionOptions, { projectId, repositoryId });
  const createVersion = useMutation(api["factory/configuration"].createVersion);
  const assess = useMutation(api["factory/configuration"].assessReadiness);
  const activate = useMutation(api["factory/configuration"].activate);
  const [workflowId, setWorkflowId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [verifierIds, setVerifierIds] = useState<string[]>([]);
  const [codeScopeIds, setCodeScopeIds] = useState<string[]>([]);
  const [agentBindings, setAgentBindings] = useState<Record<string, string>>({});
  const [maxCostUsd, setMaxCostUsd] = useState("100");
  const [maxRuntimeMinutes, setMaxRuntimeMinutes] = useState("120");
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [risk, setRisk] = useState<"GREEN" | "YELLOW" | "RED">("YELLOW");
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const latestVersion = detail?.versions[0];
  const latestAssessment = useMemo(
    () => latestVersion
      ? detail?.assessments.find((item) => item.factoryDefinitionVersionId === latestVersion._id)
      : undefined,
    [detail, latestVersion]
  );

  if (!detail || !workflows || !policies || !verifiers || !versionOptions) {
    return <div className="mt-3 h-28 animate-pulse rounded-lg bg-surface-2" aria-label="Loading Factory version editor" />;
  }

  const save = async () => {
    setError("");
    setMessage("");
    const workflow = workflows.find((item) => item._id === workflowId);
    if (!workflowId || !policyId || verifierIds.length === 0 || codeScopeIds.length === 0) {
      setError("Select an active workflow, policy, code scope, and at least one independent verifier.");
      return;
    }
    if (!workflow || workflow.agents.some((agent) => !agentBindings[agent.id])) {
      setError("Bind every workflow agent to an approved agent version.");
      return;
    }
    setPending("save");
    try {
      await createVersion({
        factoryDefinitionId,
        workflowId: workflowId as Id<"workflows">,
        executor: { adapter: "codex", version: "v1" },
        codeScopeIds: codeScopeIds as Id<"repositoryCodeScopes">[],
        agentBindings: workflow.agents.map((agent) => ({
          workflowAgentId: agent.id,
          agentVersionId: agentBindings[agent.id] as Id<"agentVersions">,
        })),
        policyEnvelopeId: policyId as Id<"policyEnvelopes">,
        budget: {
          maxCostUsd: Number(maxCostUsd),
          maxRuntimeMinutes: Number(maxRuntimeMinutes),
          maxAttempts: Number(maxAttempts),
        },
        verifierIds: verifierIds as Id<"contextVerifiers">[],
        riskBoundary: risk,
        recovery: { pause: false, cancel: true, retry: true, resume: false },
      });
      setMessage("Immutable Factory version created. Run readiness before activation.");
    } catch {
      setError("The Factory version could not be created. Check record scope and numeric limits.");
    } finally {
      setPending("");
    }
  };

  const runAssessment = async () => {
    if (!latestVersion) return;
    setPending("assess");
    setError("");
    try {
      await assess({ factoryDefinitionVersionId: latestVersion._id });
      setMessage("Readiness assessment recorded for this exact version.");
    } catch {
      setError("Readiness could not be assessed. Resolve the record scope and try again.");
    } finally {
      setPending("");
    }
  };

  const activateVersion = async () => {
    if (!latestVersion) return;
    setPending("activate");
    setError("");
    try {
      await activate({ factoryDefinitionVersionId: latestVersion._id });
      setMessage(`Factory version ${latestVersion.version} activated.`);
    } catch {
      setError("Activation requires a current passing assessment for this exact Factory version.");
    } finally {
      setPending("");
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 rounded-lg border border-line bg-surface-2 p-3 md:grid-cols-2">
        <label className="text-[11.5px] text-ink-muted">Workflow
          <select className="mt-1 w-full rounded-md border border-line bg-surface-1 px-2 py-2 text-[12px] text-ink" value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
            <option value="">Select workflow</option>
            {workflows.map((item) => <option key={item._id} value={item._id}>{item.name} · v{item.version}</option>)}
          </select>
        </label>
        <label className="text-[11.5px] text-ink-muted">Governance policy
          <select className="mt-1 w-full rounded-md border border-line bg-surface-1 px-2 py-2 text-[12px] text-ink" value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
            <option value="">Select policy</option>
            {policies.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-[11.5px] text-ink-muted">Maximum cost (USD)<Input className="mt-1" type="number" value={maxCostUsd} onChange={(event) => setMaxCostUsd(event.target.value)} /></label>
        <label className="text-[11.5px] text-ink-muted">Maximum runtime (minutes)<Input className="mt-1" type="number" value={maxRuntimeMinutes} onChange={(event) => setMaxRuntimeMinutes(event.target.value)} /></label>
        <label className="text-[11.5px] text-ink-muted">Maximum attempts<Input className="mt-1" type="number" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} /></label>
        <label className="text-[11.5px] text-ink-muted">Risk boundary
          <select className="mt-1 w-full rounded-md border border-line bg-surface-1 px-2 py-2 text-[12px] text-ink" value={risk} onChange={(event) => setRisk(event.target.value as typeof risk)}>
            <option value="GREEN">Green</option><option value="YELLOW">Yellow</option><option value="RED">Red</option>
          </select>
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-[11.5px] text-ink-muted">Independent verifiers</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {verifiers.length === 0 ? <span className="text-[12px] text-warning">No active verifiers available.</span> : verifiers.map((item) => (
              <label key={item._id} className="flex items-center gap-2 rounded border border-line bg-surface-1 px-2 py-1.5 text-[12px] text-ink-secondary">
                <input type="checkbox" checked={verifierIds.includes(item._id)} onChange={(event) => setVerifierIds((current) => event.target.checked ? [...current, item._id] : current.filter((id) => id !== item._id))} /> {item.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="md:col-span-2">
          <legend className="text-[11.5px] text-ink-muted">Approved repository code scopes</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {versionOptions.codeScopes.length === 0 ? <span className="text-[12px] text-warning">No active code scopes available.</span> : versionOptions.codeScopes.map((scope) => (
              <label key={scope._id} className="flex items-center gap-2 rounded border border-line bg-surface-1 px-2 py-1.5 text-[12px] text-ink-secondary">
                <input type="checkbox" checked={codeScopeIds.includes(scope._id)} onChange={(event) => setCodeScopeIds((current) => event.target.checked ? [...current, scope._id] : current.filter((id) => id !== scope._id))} /> {scope.name}
              </label>
            ))}
          </div>
        </fieldset>
        {workflows.find((item) => item._id === workflowId)?.agents.length ? (
          <fieldset className="md:col-span-2">
            <legend className="text-[11.5px] text-ink-muted">Frozen workflow agent versions</legend>
            <div className="mt-1 grid gap-2 md:grid-cols-2">
              {workflows.find((item) => item._id === workflowId)?.agents.map((agent) => (
                <label key={agent.id} className="text-[11.5px] text-ink-muted">{agent.persona} · {agent.id}
                  <select className="mt-1 w-full rounded-md border border-line bg-surface-1 px-2 py-2 text-[12px] text-ink" value={agentBindings[agent.id] ?? ""} onChange={(event) => setAgentBindings((current) => ({ ...current, [agent.id]: event.target.value }))}>
                    <option value="">Select approved version</option>
                    {versionOptions.agentVersions.map((version) => <option key={version._id} value={version._id}>{version.template.name} · v{version.version} · {version.modelConfig.modelId}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="text-[11.5px] text-ink-muted">Executor: codex/v1 · cancel and bounded retry enabled · pause/resume unsupported</span>
          <Button size="sm" disabled={Boolean(pending)} onClick={save}>{pending === "save" ? "Saving…" : "Create configuration version"}</Button>
        </div>
      </div>

      {latestVersion ? (
        <div className="rounded-lg border border-line bg-surface-2 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[12.5px] font-medium text-ink">Version {latestVersion.version} · <code>{latestVersion.configurationDigest}</code></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={Boolean(pending)} onClick={runAssessment}>{pending === "assess" ? "Checking…" : "Run readiness"}</Button>
              <Button size="sm" disabled={Boolean(pending) || latestAssessment?.status !== "PASS"} onClick={activateVersion}>{pending === "activate" ? "Activating…" : "Activate"}</Button>
            </div>
          </div>
          {latestAssessment ? (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {latestAssessment.checks.map((check) => (
                <div key={check.id} className="rounded border border-line bg-surface-1 px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink">{check.status === "VERIFIED" ? <CheckCircle2 size={12} className="text-success" /> : <ShieldAlert size={12} className="text-warning" />}{check.label}</div>
                  {check.remediation ? <div className="mt-1 text-[10.5px] text-ink-muted">{check.remediation}</div> : null}
                </div>
              ))}
            </div>
          ) : <div className="mt-2 text-[11.5px] text-ink-muted">No readiness assessment exists for this version.</div>}
        </div>
      ) : null}
      {message ? <div role="status" className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-[12px] text-success">{message}</div> : null}
      {error ? <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">{error}</div> : null}
    </div>
  );
}
