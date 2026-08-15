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
  repositoryId: "repository-1",
  repository: "sellerfi/sandbox",
  defaultBranch: "main",
  branch: "mc/work-order-1",
  worktree: "/tmp/worktrees/work-order-1",
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
      allowedPaths: ["apps/ui/**"],
      excludedPaths: ["apps/ui/generated/**"],
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
});
