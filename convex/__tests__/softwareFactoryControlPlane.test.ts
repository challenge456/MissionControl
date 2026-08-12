import { describe, expect, it } from "vitest";
import {
  availableOperatingLenses,
  combineCodeScopePolicies,
  defaultOperatingLens,
  deliveryConfidence,
  rankAttentionItems,
  resolveDeterministicOwnership,
  validateDispatchScope,
  validateExecutorBindingPolicy,
  validateExecutorHostEligibility,
} from "../lib/softwareFactoryControlPlane";

describe("software factory control plane", () => {
  it("exposes role-appropriate lenses and defaults", () => {
    expect(availableOperatingLenses({ companyManager: true, roleNames: ["Owner"], hasTeamMembership: false })).toEqual(["MY", "TEAM", "WORKSPACE", "COMPANY"]);
    expect(availableOperatingLenses({ companyManager: false, roleNames: ["Developer"], hasTeamMembership: true })).toEqual(["MY", "TEAM"]);
    expect(defaultOperatingLens({ companyManager: false, roleNames: ["Workspace Lead"], hasTeamLeadMembership: false })).toBe("WORKSPACE");
    expect(defaultOperatingLens({ companyManager: false, roleNames: ["Developer"], hasTeamLeadMembership: false })).toBe("MY");
  });

  it("ranks deterministically and deduplicates correlated symptoms", () => {
    const rows = rankAttentionItems([
      { correlationKey: "wo:1", type: "BLOCKED", severity: "HIGH" as const, reason: "old", ownerLabel: "A", requiredAction: "Fix", createdAt: 10, evidenceLabel: "WorkOrder", workspaceId: "p", workspaceName: "P" },
      { correlationKey: "wo:1", type: "BLOCKED", severity: "CRITICAL" as const, reason: "new", ownerLabel: "A", requiredAction: "Fix", createdAt: 20, evidenceLabel: "WorkOrder", workspaceId: "p", workspaceName: "P" },
      { correlationKey: "wo:2", type: "APPROVAL", severity: "HIGH" as const, reason: "wait", ownerLabel: "B", requiredAction: "Decide", createdAt: 5, evidenceLabel: "Approval", workspaceId: "p", workspaceName: "P" },
    ], 100);
    expect(rows.map((row) => row.correlationKey)).toEqual(["wo:1", "wo:2"]);
    expect(rows[0].reason).toBe("new");
  });

  it("fails closed for cross-workspace scopes and unbound local execution", () => {
    const result = validateDispatchScope({
      projectId: "workspace-a",
      repository: { id: "repo-a", projectId: "workspace-b", status: "READY" },
      codeScopes: [{ id: "scope-a", projectId: "workspace-a", repositoryId: "repo-a", active: true, allowedEnvironments: ["CLOUD"] }],
      team: { id: "team-a", projectId: "workspace-a", status: "ACTIVE" },
      owner: { id: "member-a", projectId: "workspace-a", active: true },
      executionEnvironment: "LOCAL",
      host: null,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toEqual(expect.arrayContaining(["REPOSITORY_OUTSIDE_WORKSPACE", "EXECUTION_ENVIRONMENT_NOT_ALLOWED", "APPROVED_HOST_BINDING_REQUIRED"]));
  });

  it("never fabricates confidence when no active WorkOrders exist", () => {
    expect(deliveryConfidence({ activeWorkOrders: 0, blockedWorkOrders: 0, pendingApprovals: 0, failingEvidence: 0, staleEvidence: 0, missingOwnership: 0 })).toMatchObject({ status: "UNKNOWN", score: null });
    expect(deliveryConfidence({ activeWorkOrders: 5, blockedWorkOrders: 1, pendingApprovals: 0, failingEvidence: 0, staleEvidence: 0, missingOwnership: 0 }).score).toBe(96);
  });

  it("backfills ownership only from a unique exact member and active team match", () => {
    const base = {
      ownerLabel: "dev@sellerfi.com",
      members: [{ id: "member-1", name: "Developer One", email: "dev@sellerfi.com", active: true }],
      teams: [{ id: "team-1", name: "Checkout", slug: "checkout", status: "ACTIVE" }],
      memberships: [{ memberId: "member-1", teamId: "team-1", active: true }],
    };
    expect(resolveDeterministicOwnership(base)).toEqual({ status: "MATCHED", memberId: "member-1", teamId: "team-1", reasonCodes: [] });
    expect(resolveDeterministicOwnership({
      ...base,
      members: [...base.members, { id: "member-2", name: "Developer Two", email: "dev@sellerfi.com", active: true }],
    })).toMatchObject({ status: "AMBIGUOUS", reasonCodes: ["OWNER_LABEL_MATCHES_MULTIPLE_MEMBERS"] });
    expect(resolveDeterministicOwnership({ ...base, ownerLabel: "Dev" })).toMatchObject({ status: "UNRESOLVED" });
  });

  it("unions cross-scope review, verification, and approval policies", () => {
    expect(combineCodeScopePolicies([
      { owningTeamId: "team-a", requiredReviewers: ["Platform", "Security"], verificationPolicy: "Unit", approvalPolicy: "Lead" },
      { owningTeamId: "team-b", requiredReviewers: ["Security", "Payments"], verificationPolicy: "Browser", approvalPolicy: "Risk" },
    ])).toEqual({
      owningTeamIds: ["team-a", "team-b"],
      requiredReviewers: ["Payments", "Platform", "Security"],
      verificationPolicies: ["Browser", "Unit"],
      approvalPolicies: ["Lead", "Risk"],
      requiresCrossTeamReview: true,
    });
  });

  it("revalidates executor environment, model route, runtime, capacity, and budget", () => {
    expect(validateExecutorBindingPolicy({
      expectedEnvironment: "LOCAL",
      requestedEnvironment: "CLOUD",
      runtime: "",
      runModel: "model-b",
      routingDecision: { projectId: "workspace-a", workOrderId: "wo-a", selectedModelId: "model-a", mode: "ENFORCED" },
      expectedRoutingDecision: true,
      projectId: "workspace-a",
      workOrderId: "wo-a",
      activeTeamRuns: 4,
      maxConcurrentRuns: 3,
      requestedBudgetUsd: 20,
      missionBudgetRemainingUsd: 10,
      checkpointSummary: "",
      stopCondition: "",
      escalationOwner: "",
    })).toEqual(expect.arrayContaining([
      "EXECUTION_ENVIRONMENT_MISMATCH",
      "RUNTIME_NOT_DECLARED",
      "MODEL_SELECTION_MISMATCH",
      "TEAM_CONCURRENCY_LIMIT_REACHED",
      "MISSION_BUDGET_EXCEEDED",
      "CHECKPOINT_SUMMARY_REQUIRED",
      "STOP_CONDITION_REQUIRED",
      "ESCALATION_OWNER_REQUIRED",
    ]));
  });

  it("fails closed when host runtime, model, network, secret, or capacity attestation is stale", () => {
    expect(validateExecutorHostEligibility({
      now: 2_000_000,
      repositoryMatches: true,
      runRuntime: "node-22",
      runModel: "composer",
      host: {
        repository: "sellerfi/marketplace",
        status: "READY",
        checkedAt: 1,
        runtime: "node-20",
        approvedModelIds: ["local-qa"],
        networkPolicyStatus: "UNKNOWN",
        secretPolicyStatus: "BLOCKED",
        capacity: { maxConcurrentRuns: 4, currentRuns: 4 },
      },
    })).toEqual(expect.arrayContaining([
      "HOST_ATTESTATION_STALE",
      "HOST_RUNTIME_MISMATCH",
      "MODEL_NOT_APPROVED_FOR_HOST",
      "NETWORK_POLICY_NOT_ATTESTED",
      "SECRET_POLICY_NOT_ATTESTED",
      "HOST_CAPACITY_EXHAUSTED",
    ]));
  });
});
