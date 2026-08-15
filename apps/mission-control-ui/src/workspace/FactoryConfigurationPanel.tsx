import { useEffect, useMemo, useState } from "react";
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
  const agentTemplates = useQuery(api["registry/agentTemplates"].listTemplates, { projectId, activeOnly: true });
  const versionOptions = useQuery(api["factory/configuration"].getVersionOptions, { projectId, repositoryId });
  const createVersion = useMutation(api["factory/configuration"].createVersion);
  const assess = useMutation(api["factory/configuration"].assessReadiness);
  const activate = useMutation(api["factory/configuration"].activate);
  const createPolicy = useMutation(api["governance/policyEnvelopes"].createPolicyEnvelope);
  const createVerifier = useMutation(api["context/verifiers"].create);
  const createAgentTemplate = useMutation(api["registry/agentTemplates"].createTemplate);
  const createAgentVersion = useMutation(api["registry/agentVersions"].createVersion);
  const upsertWorkflow = useMutation(api.workflows.upsert);
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

  const createVerificationPolicy = async () => {
    setPending("policy");
    setError("");
    setMessage("");
    try {
      const policy = await createPolicy({
        projectId,
        name: "Verification-First V1 Factory Envelope",
        priority: 100,
        rules: {
          defaultDecision: "ALLOW",
          autonomyTier: 2,
          requireApprovalOnRisk: ["YELLOW", "RED"],
          toolPolicies: {
            shell: "ALLOW",
            exec: "ALLOW",
            write_file: "ALLOW",
            delete_file: "DENY",
            git_push: "NEEDS_APPROVAL",
            github_pull_request: "NEEDS_APPROVAL",
          },
        },
        metadata: { source: "factory-configuration", profile: "verification-first-v1" },
      });
      if (policy?._id) setPolicyId(policy._id);
      setMessage("Verification-First V1 policy envelope created and selected.");
    } catch {
      setError("The policy envelope could not be created. Confirm governance authority and try again.");
    } finally {
      setPending("");
    }
  };

  const createIndependentVerifier = async () => {
    setPending("verifier");
    setError("");
    setMessage("");
    try {
      const verifierId = await createVerifier({
        projectId,
        label: "Verification-First Independent Validator",
        invariant: "The candidate revision must satisfy every mandatory quality-contract assertion through execution independent from the implementation agent.",
        globPatterns: ["**/*"],
        idempotencyKey: `verification-first-v1-${projectId}`,
      });
      setVerifierIds([verifierId]);
      setMessage("Independent verifier created and selected.");
    } catch {
      setError("The independent verifier could not be created. Confirm Factory improvement authority and try again.");
    } finally {
      setPending("");
    }
  };

  const createApprovedAgentVersion = async () => {
    const workflow = workflows?.find((item) => item._id === workflowId);
    if (!workflow) return;
    setPending("agent");
    setError("");
    setMessage("");
    try {
      const template = agentTemplates.find((item) => item.slug === "verification-first-delivery-agent") ?? await createAgentTemplate({
          projectId,
          name: "Verification-First Delivery Agent",
          slug: "verification-first-delivery-agent",
          description: "Approved bounded implementation agent for the Verification-First V1 Factory profile.",
          metadata: { source: "factory-configuration", profile: "verification-first-v1" },
        });
      if (!template?._id) throw new Error("Agent template was not created");
      const now = Date.now();
      const version = await createAgentVersion({
        projectId,
        templateId: template._id,
        status: "APPROVED",
        genome: {
          modelConfig: { provider: "openai", modelId: "gpt-5.6-sol", temperature: 0 },
          promptBundleHash: "verification-first-v1-prompt-bundle",
          toolManifestHash: "verification-first-v1-bounded-tools",
          provenance: { createdBy: "operator", source: "factory-configuration", createdAt: now },
        },
        notes: "Approved explicitly for the governed Verification-First V1 delivery profile.",
        metadata: { profile: "verification-first-v1" },
      });
      if (!version?._id) throw new Error("Agent version was not created");
      setAgentBindings(Object.fromEntries(workflow.agents.map((agent) => [agent.id, version._id])));
      setMessage("Approved V1 agent version created and bound to the selected workflow.");
    } catch {
      setError("The approved agent version could not be created. Confirm registry authority and unique template scope.");
    } finally {
      setPending("");
    }
  };

  const createVerificationWorkflow = async () => {
    setPending("workflow");
    setError("");
    setMessage("");
    try {
      const objectSchema = (properties: Record<string, unknown>, required: string[]) => ({
        type: "object",
        properties: { status: { type: "string" }, ...properties },
        required: ["status", ...required],
        additionalProperties: false,
      });
      const id = await upsertWorkflow({
        workflowId: `verification-first-v1-${projectId}`,
        name: "Verification-First V1 Delivery",
        description: "Structured planning, bounded implementation, independent verification, and policy gating for governed V1 delivery.",
        topology: "LINEAR",
        maxConcurrency: 1,
        agents: [
          { id: "builder", persona: "Bounded implementation agent" },
          { id: "independent-verifier", persona: "Independent validation agent" },
        ],
        steps: [
          {
            id: "plan",
            agent: "builder",
            input: "Produce a bounded implementation plan that maps every acceptance criterion to a deterministic check.",
            expects: "A schema-valid plan and explicit status.",
            retryLimit: 1,
            timeoutMinutes: 10,
            kind: "AGENT",
            isolation: "READ_ONLY",
            failurePolicy: "BLOCK",
            outputSchema: objectSchema({ plan: { type: "array", items: { type: "string" } } }, ["plan"]),
          },
          {
            id: "implement",
            agent: "builder",
            input: "Implement only the approved plan inside the frozen repository scope and report the exact candidate revision.",
            expects: "A schema-valid candidate revision and explicit status.",
            retryLimit: 1,
            timeoutMinutes: 60,
            dependsOn: ["plan"],
            kind: "AGENT",
            isolation: "WORKTREE",
            failurePolicy: "BLOCK",
            outputSchema: objectSchema({ candidateRevision: { type: "string" } }, ["candidateRevision"]),
          },
          {
            id: "verify",
            agent: "independent-verifier",
            input: "Validate the exact candidate revision independently and produce requirement-linked receipts.",
            expects: "Schema-valid verification receipts bound to the candidate revision.",
            retryLimit: 1,
            timeoutMinutes: 30,
            dependsOn: ["implement"],
            kind: "VERIFY",
            isolation: "READ_ONLY",
            failurePolicy: "BLOCK",
            outputSchema: objectSchema({ candidateRevision: { type: "string" }, receipts: { type: "array", items: { type: "object" } } }, ["candidateRevision", "receipts"]),
          },
          {
            id: "gate",
            agent: "independent-verifier",
            input: "Evaluate immutable verification receipts against the frozen policy envelope and report the governed decision.",
            expects: "A policy-derived gate decision; publication remains separately authorized.",
            retryLimit: 0,
            timeoutMinutes: 5,
            dependsOn: ["verify"],
            kind: "GATE",
            isolation: "READ_ONLY",
            failurePolicy: "BLOCK",
          },
        ],
        active: true,
        createdBy: "operator",
      });
      setWorkflowId(id);
      setMessage("Structured Verification-First V1 workflow created and selected.");
    } catch {
      setError("The Verification-First workflow could not be created. Confirm automation authority and try again.");
    } finally {
      setPending("");
    }
  };

  const latestVersion = detail?.versions[0];
  const latestAssessment = useMemo(
    () => latestVersion
      ? detail?.assessments.find((item) => item.factoryDefinitionVersionId === latestVersion._id)
      : undefined,
    [detail, latestVersion]
  );
  const selectedWorkflow = workflows?.find((item) => item._id === workflowId);
  const defaultAgentVersionId = versionOptions?.agentVersions[0]?._id;
  const selectedWorkflowAgentKey = selectedWorkflow?.agents.map((agent) => agent.id).join(":") ?? "";

  useEffect(() => {
    if (!selectedWorkflow || !defaultAgentVersionId || selectedWorkflow.agents.length === 0) return;
    setAgentBindings((current) => {
      let changed = false;
      const next = { ...current };
      for (const agent of selectedWorkflow.agents) {
        if (!next[agent.id]) {
          next[agent.id] = defaultAgentVersionId;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [defaultAgentVersionId, selectedWorkflowAgentKey]);

  if (!detail || !workflows || !policies || !verifiers || !agentTemplates || !versionOptions) {
    return <div className="mt-3 h-28 animate-pulse rounded-lg bg-surface-2" aria-label="Loading Factory version editor" />;
  }

  const createLocalGovernanceBaseline = async () => {
    setPending("baseline");
    setError("");
    setMessage("");
    try {
      let nextPolicyId = policies.find((item) => item.name === "Local human-review Factory baseline")?._id;
      if (!nextPolicyId) {
        const policy = await createPolicy({
          projectId,
          name: "Local human-review Factory baseline",
          priority: 100,
          rules: {
            defaultDecision: "NEEDS_APPROVAL",
            requireApprovalOnRisk: ["GREEN", "YELLOW", "RED"],
            toolPolicies: {
              shell: "NEEDS_APPROVAL",
              exec: "NEEDS_APPROVAL",
              write_file: "NEEDS_APPROVAL",
              delete_file: "DENY",
            },
            autonomyTier: 1,
            executionEnvironments: ["LOCAL"],
          },
          metadata: { source: "factory.configuration.browser-baseline" },
        });
        nextPolicyId = policy?._id;
      }

      let nextVerifierId = verifiers.find((item) => item.label === "Factory path and verification guard")?._id;
      if (!nextVerifierId) {
        nextVerifierId = await createVerifier({
          projectId,
          label: "Factory path and verification guard",
          invariant: "Changes remain inside the approved repository scope and satisfy every declared verification command before publication.",
          globPatterns: versionOptions.codeScopes.flatMap((scope) => scope.includePaths),
          idempotencyKey: `factory-browser-baseline:${repositoryId}`,
        });
      }

      if (!nextPolicyId || !nextVerifierId) {
        throw new Error("The governance baseline did not return complete records.");
      }
      let nextAgentVersionId = versionOptions.agentVersions.find((version) => version.template.slug === "factory-local-codex-runner")?._id;
      if (!nextAgentVersionId) {
        let template = agentTemplates.find((item) => item.slug === "factory-local-codex-runner");
        if (!template) {
          template = await createAgentTemplate({
            projectId,
            name: "Factory local Codex runner",
            slug: "factory-local-codex-runner",
            description: "LOCAL-only agent version for browser-governed Factory WorkOrders.",
            metadata: { source: "factory.configuration.browser-baseline" },
          });
        }
        if (!template) throw new Error("The local runner template was not created.");
        const version = await createAgentVersion({
          projectId,
          templateId: template._id,
          status: "APPROVED",
          notes: "Authorized through the browser-governed local Factory baseline.",
          genome: {
            modelConfig: { provider: "openai", modelId: "gpt-5" },
            promptBundleHash: "factory-local-human-review-v1",
            toolManifestHash: "factory-local-bounded-tools-v1",
            provenance: {
              createdBy: "browser-governed-factory-setup",
              source: "factory.configuration.browser-baseline",
              createdAt: Date.now(),
            },
          },
          metadata: { executionEnvironments: ["LOCAL"], requireHumanReview: true },
        });
        nextAgentVersionId = version?._id;
      }
      if (!nextAgentVersionId) throw new Error("The local runner version was not created.");
      if (selectedWorkflow) {
        setAgentBindings(Object.fromEntries(selectedWorkflow.agents.map((agent) => [agent.id, nextAgentVersionId])));
      }
      setPolicyId(nextPolicyId);
      setVerifierIds([nextVerifierId]);
      setMessage("Local human-review policy, path-bound verifier, and approved LOCAL runner are ready. Review them before creating the immutable Factory version.");
    } catch {
      setError("The local governance baseline could not be created. Confirm Factory improvement authority and try again.");
    } finally {
      setPending("");
    }
  };

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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Factory version could not be created. Check record scope and numeric limits.");
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
        {policies.length === 0 || verifiers.length === 0 || versionOptions.agentVersions.length === 0 ? (
          <div className="md:col-span-2 flex flex-wrap items-start justify-between gap-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-3">
            <div className="max-w-2xl">
              <div className="text-[12.5px] font-medium text-ink">Governance records required</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
                Create a LOCAL-only, human-review-first policy, a verifier bound to the repository scopes below, and an approved bounded Codex runner. This action does not activate the Factory or dispatch work.
              </div>
            </div>
            <Button variant="outline" size="sm" disabled={Boolean(pending)} onClick={createLocalGovernanceBaseline}>
              {pending === "baseline" ? "Creating baseline…" : "Create local governance baseline"}
            </Button>
          </div>
        ) : null}
        <label className="text-[11.5px] text-ink-muted">Workflow
          <select className="mt-1 w-full rounded-md border border-line bg-surface-1 px-2 py-2 text-[12px] text-ink" value={workflowId} onChange={(event) => setWorkflowId(event.target.value)}>
            <option value="">Select workflow</option>
            {workflows.map((item) => <option key={item._id} value={item._id}>{item.name} · v{item.version}</option>)}
          </select>
          <Button className="mt-2" type="button" variant="outline" size="sm" disabled={Boolean(pending)} onClick={createVerificationWorkflow}>
            {pending === "workflow" ? "Creating workflow…" : "Create Verification-First workflow"}
          </Button>
        </label>
        <label className="text-[11.5px] text-ink-muted">Governance policy
          <select className="mt-1 w-full rounded-md border border-line bg-surface-1 px-2 py-2 text-[12px] text-ink" value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
            <option value="">Select policy</option>
            {policies.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
          {policies.length === 0 ? (
            <Button className="mt-2" type="button" variant="outline" size="sm" disabled={Boolean(pending)} onClick={createVerificationPolicy}>
              {pending === "policy" ? "Creating policy…" : "Create Verification-First policy"}
            </Button>
          ) : null}
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
            {verifiers.length === 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-warning">No active verifiers available.</span>
                <Button type="button" variant="outline" size="sm" disabled={Boolean(pending)} onClick={createIndependentVerifier}>
                  {pending === "verifier" ? "Creating verifier…" : "Create independent verifier"}
                </Button>
              </div>
            ) : verifiers.map((item) => (
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
        {selectedWorkflow?.agents.length ? (
          <fieldset className="md:col-span-2">
            <legend className="text-[11.5px] text-ink-muted">Frozen workflow agent versions</legend>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {versionOptions.agentVersions.length === 0 ? <span className="text-[12px] text-warning">No approved workspace agent versions available.</span> : null}
              <Button type="button" variant="outline" size="sm" disabled={Boolean(pending)} onClick={createApprovedAgentVersion}>
                {pending === "agent" ? "Creating agent version…" : "Create approved agent version"}
              </Button>
            </div>
            <div className="mt-1 grid gap-2 md:grid-cols-2">
              {selectedWorkflow.agents.map((agent) => (
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
