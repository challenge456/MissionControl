import { describe, expect, it } from "vitest";
import { buildFactoryExecutionManifest, type FactoryExecutionManifestInput } from "../lib/executionManifest";

const input: FactoryExecutionManifestInput = {
  runId: "run-1",
  missionId: "mission-1",
  missionPlanId: "plan-1",
  missionPlanVersion: 2,
  qualityContractDigest: "sha256:quality-contract",
  workOrderId: "work-order-1",
  workOrderRevisionNumber: 3,
  taskId: "task-1",
  factoryDefinitionVersionId: "factory-version-1",
  factoryConfigurationDigest: "factory-v1-test",
  factoryPurpose: "SOFTWARE",
  repositoryId: "repository-1",
  repository: "sellerfi/sandbox",
  defaultBranch: "main",
  baseSha: "a".repeat(40),
  branch: "mc/work-order-1",
  worktree: "/tmp/worktrees/work-order-1",
  executor: { adapter: "codex", version: "v1" },
  executionBackend: "persistent-worker",
  sandboxProfile: { isolation: "WORKSPACE_WRITE", requiredCapabilities: ["workspace-write", "git-worktree"] },
  workflow: {
    workflowId: "implementation",
    version: 4,
    name: "Implementation",
    description: "Implement and verify",
    agents: [{ id: "implementer", persona: "Implementer" }],
    steps: [{ id: "implement", agent: "implementer", input: "Implement {{task}}", timeoutMinutes: 30 }],
  },
  workOrder: {
    title: "Add the buyer gate",
    desiredOutcome: "Buyers see a trusted decision gate",
    riskLevel: "MEDIUM",
    acceptanceCriteria: [{ id: "ac-1", title: "Gate is visible" }],
    constraints: ["No schema changes"],
  },
  agentBindings: [{
    workflowAgentId: "implementer",
    agentVersionId: "agent-version-1",
    agentVersion: 2,
    genomeHash: "genome-1",
    promptBundleHash: "prompt-1",
    toolManifestHash: "tools-1",
    model: { provider: "openai", modelId: "gpt-5" },
  }],
  codeScopes: [{ id: "scope-1", slug: "ui", includePaths: ["apps/ui/**"], excludePaths: ["apps/ui/generated/**"] }],
  allowedTools: ["apply_patch", "exec_command"],
  routedModel: "gpt-5",
  maxRuntimeMinutes: 60,
  initialContext: { task: "Add the buyer gate" },
};

describe("Factory execution manifest", () => {
  it("freezes causation, agent, model, harness, prompt, and path authority", () => {
    const result = buildFactoryExecutionManifest(input);
    expect(result.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.manifest.causation).toMatchObject({
      missionId: "mission-1",
      taskId: "task-1",
      qualityContractDigest: "sha256:quality-contract",
    });
    expect(result.manifest.workflow.steps[0]).toMatchObject({
      agentVersionId: "agent-version-1",
      promptBundleHash: "prompt-1",
      toolManifestHash: "tools-1",
      modelRoute: "gpt-5",
    });
    expect(result.manifest.repository).toMatchObject({
      baseSha: "a".repeat(40),
      allowedPaths: ["apps/ui/**"],
      excludedPaths: ["apps/ui/generated/**"],
    });
    expect(result.manifest.harness).toMatchObject({
      adapter: "codex",
      version: "v1",
      executionBackend: "persistent-worker",
      requiredCapabilities: ["git-worktree", "workspace-write"],
    });
    expect(result.manifest.intent).toMatchObject({ title: "Add the buyer gate", acceptanceCriterionIds: ["ac-1"] });
    expect(result.manifest.workOrderSpecification).toMatchObject({ riskLevel: "MEDIUM", acceptanceCriteria: [{ id: "ac-1" }] });
    expect(result.manifest.compiledPrompt).toContain("The control plane owns those actions.");
    expect(result.manifest.compiledPromptHash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("changes its digest when execution authority changes", () => {
    const first = buildFactoryExecutionManifest(input).digest;
    const second = buildFactoryExecutionManifest({
      ...input,
      codeScopes: [{ ...input.codeScopes[0], includePaths: ["apps/admin/**"] }],
    }).digest;
    expect(second).not.toBe(first);
  });

  it("changes its digest when the verification contract changes", () => {
    const first = buildFactoryExecutionManifest(input).digest;
    const second = buildFactoryExecutionManifest({
      ...input,
      workOrder: { ...input.workOrder, verificationContract: { schemaVersion: 1, enforcementMode: "ENFORCED", requireHumanReview: false, checks: [] } },
    }).digest;
    expect(second).not.toBe(first);
  });

  it("fails closed when a workflow agent has no approved binding", () => {
    expect(() => buildFactoryExecutionManifest({ ...input, agentBindings: [] })).toThrow(/missing agent binding/);
  });

  it("fails closed when a mutable branch is supplied instead of an exact base SHA", () => {
    expect(() => buildFactoryExecutionManifest({ ...input, baseSha: "origin/main" })).toThrow(/immutable full base SHA/);
  });

  it("freezes remote sandbox execution into the existing v1 manifest", () => {
    const sandbox = {
      resourceName: "mc-attempt-0123456789abcdef",
      profileId: "profile-1",
      profileDigest: "sha256:profile",
      profileSnapshot: { schema: "factory-sandbox-profile/v1", provider: "EXE_DEV" },
      supervisorVersion: "mission-control-supervisor/v1" as const,
      resultContract: { schema: "factory-sandbox-result/v1" as const, independentHostValidationRequired: true as const },
      credentialGrants: [{ kind: "INFERENCE" as const, secretValueIncluded: false as const, githubAuthority: "NONE" as const, providerAuthority: "NONE" as const }],
      teardown: { credentialsRevokedBeforePublication: true as const, resourceAbsenceRequiredBeforePublication: true as const },
    };
    const result = buildFactoryExecutionManifest({
      ...input,
      executionBackend: "remote-sandbox",
      sandboxProfile: { isolation: "WORKSPACE_WRITE", requiredCapabilities: ["remote-sandbox", "git-worktree"] },
      sandbox,
    });

    expect(result.manifest.version).toBe("factory-execution-manifest/v1");
    expect(result.manifest.harness.executionBackend).toBe("remote-sandbox");
    expect(result.manifest.sandbox).toEqual(sandbox);
    expect(result.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("rejects a remote backend without a frozen Sandbox Profile contract", () => {
    expect(() => buildFactoryExecutionManifest({ ...input, executionBackend: "remote-sandbox" })).toThrow(/frozen Sandbox Profile/);
  });
});
