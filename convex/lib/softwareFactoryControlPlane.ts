export type OperatingLens = "MY" | "TEAM" | "WORKSPACE" | "COMPANY";

export type AttentionSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface AttentionCandidate {
  correlationKey: string;
  type: string;
  severity: AttentionSeverity;
  reason: string;
  ownerLabel: string;
  ownerMemberId?: string;
  requiredAction: string;
  createdAt: number;
  deadlineAt?: number;
  evidenceLabel: string;
  workspaceId: string;
  workspaceName: string;
  teamId?: string;
  teamName?: string;
  missionId?: string;
  missionTitle?: string;
  workOrderId?: string;
  workOrderTitle?: string;
}

const SEVERITY_WEIGHT: Record<AttentionSeverity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function rankAttentionItems<T extends AttentionCandidate>(items: T[], now: number): T[] {
  const deduplicated = new Map<string, T>();
  for (const item of items) {
    const current = deduplicated.get(item.correlationKey);
    if (!current) {
      deduplicated.set(item.correlationKey, item);
      continue;
    }
    const itemWeight = SEVERITY_WEIGHT[item.severity];
    const currentWeight = SEVERITY_WEIGHT[current.severity];
    if (itemWeight > currentWeight || (itemWeight === currentWeight && item.createdAt < current.createdAt)) {
      deduplicated.set(item.correlationKey, item);
    }
  }

  return [...deduplicated.values()].sort((left, right) => {
    const severity = SEVERITY_WEIGHT[right.severity] - SEVERITY_WEIGHT[left.severity];
    if (severity !== 0) return severity;
    const leftOverdue = left.deadlineAt !== undefined && left.deadlineAt < now ? 1 : 0;
    const rightOverdue = right.deadlineAt !== undefined && right.deadlineAt < now ? 1 : 0;
    if (leftOverdue !== rightOverdue) return rightOverdue - leftOverdue;
    if (left.createdAt !== right.createdAt) return left.createdAt - right.createdAt;
    return left.correlationKey.localeCompare(right.correlationKey);
  });
}

export function availableOperatingLenses(input: {
  companyManager: boolean;
  roleNames: string[];
  hasTeamMembership: boolean;
}): OperatingLens[] {
  const normalized = input.roleNames.map((name) => name.trim().toLowerCase());
  if (input.companyManager || normalized.some((name) => name === "company owner" || name === "owner" || name === "company admin" || name === "admin")) {
    return ["MY", "TEAM", "WORKSPACE", "COMPANY"];
  }
  if (normalized.some((name) => name === "workspace lead" || name === "product manager" || name === "pm")) {
    return ["MY", "TEAM", "WORKSPACE"];
  }
  if (input.hasTeamMembership) return ["MY", "TEAM"];
  return ["MY"];
}

export function defaultOperatingLens(input: {
  companyManager: boolean;
  roleNames: string[];
  hasTeamLeadMembership: boolean;
}): OperatingLens {
  const normalized = input.roleNames.map((name) => name.trim().toLowerCase());
  if (input.companyManager || normalized.some((name) => name === "company owner" || name === "owner")) return "COMPANY";
  if (normalized.some((name) => name === "workspace lead" || name === "product manager" || name === "pm")) return "WORKSPACE";
  return input.hasTeamLeadMembership ? "TEAM" : "MY";
}

export interface ScopeValidationInput {
  projectId: string;
  repository?: { id: string; projectId: string; status: string } | null;
  codeScopes: Array<{
    id: string;
    projectId: string;
    repositoryId: string;
    active: boolean;
    allowedEnvironments: string[];
  }>;
  team?: { id: string; projectId: string; status: string } | null;
  owner?: { id: string; projectId?: string; active: boolean } | null;
  executionEnvironment?: "LOCAL" | "CLOUD" | "REMOTE" | "POLICY_SELECTED";
  host?: { status: string; repository: string } | null;
}

export function validateDispatchScope(input: ScopeValidationInput): { allowed: boolean; reasonCodes: string[] } {
  const reasons: string[] = [];
  if (!input.repository) reasons.push("REPOSITORY_REQUIRED");
  else {
    if (input.repository.projectId !== input.projectId) reasons.push("REPOSITORY_OUTSIDE_WORKSPACE");
    if (input.repository.status !== "READY" && input.repository.status !== "CONFIGURED") reasons.push("REPOSITORY_NOT_READY");
  }
  if (input.team) {
    if (input.team.projectId !== input.projectId) reasons.push("TEAM_OUTSIDE_WORKSPACE");
    if (input.team.status !== "ACTIVE") reasons.push("TEAM_INACTIVE");
  } else {
    reasons.push("TEAM_REQUIRED");
  }
  if (!input.owner) reasons.push("HUMAN_OWNER_REQUIRED");
  else if (!input.owner.active) reasons.push("HUMAN_OWNER_INACTIVE");
  else if (input.owner.projectId && input.owner.projectId !== input.projectId) reasons.push("OWNER_OUTSIDE_WORKSPACE");

  for (const scope of input.codeScopes) {
    if (scope.projectId !== input.projectId) reasons.push("CODE_SCOPE_OUTSIDE_WORKSPACE");
    if (input.repository && scope.repositoryId !== input.repository.id) reasons.push("CODE_SCOPE_REPOSITORY_MISMATCH");
    if (!scope.active) reasons.push("CODE_SCOPE_ARCHIVED");
    if (
      input.executionEnvironment &&
      input.executionEnvironment !== "POLICY_SELECTED" &&
      !scope.allowedEnvironments.includes(input.executionEnvironment)
    ) reasons.push("EXECUTION_ENVIRONMENT_NOT_ALLOWED");
  }
  if (input.executionEnvironment === "LOCAL") {
    if (!input.host) reasons.push("APPROVED_HOST_BINDING_REQUIRED");
    else if (input.host.status !== "READY") reasons.push("HOST_NOT_READY");
  }
  return { allowed: reasons.length === 0, reasonCodes: [...new Set(reasons)] };
}

export interface OwnershipMemberCandidate {
  id: string;
  name: string;
  email?: string;
  active: boolean;
}

export interface OwnershipTeamCandidate {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface OwnershipMembershipCandidate {
  memberId: string;
  teamId: string;
  active: boolean;
}

export type OwnershipResolution =
  | { status: "MATCHED"; memberId: string; teamId: string; reasonCodes: string[] }
  | { status: "AMBIGUOUS" | "UNRESOLVED"; memberId?: string; teamId?: string; reasonCodes: string[]; candidateMemberIds: string[]; candidateTeamIds: string[] };

function normalizedIdentity(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

/**
 * Resolve legacy string ownership only when the result is unique. This helper
 * deliberately refuses fuzzy matches so a migration can never silently assign
 * work to the wrong person or team.
 */
export function resolveDeterministicOwnership(input: {
  ownerLabel?: string;
  squadLabel?: string;
  ownerMemberId?: string;
  owningTeamId?: string;
  members: OwnershipMemberCandidate[];
  teams: OwnershipTeamCandidate[];
  memberships: OwnershipMembershipCandidate[];
}): OwnershipResolution {
  const activeMembers = input.members.filter((member) => member.active);
  const activeTeams = input.teams.filter((team) => team.status === "ACTIVE");
  const ownerKey = normalizedIdentity(input.ownerLabel);
  const memberCandidates = input.ownerMemberId
    ? activeMembers.filter((member) => member.id === input.ownerMemberId)
    : activeMembers.filter((member) => {
        if (!ownerKey) return false;
        return normalizedIdentity(member.name) === ownerKey || normalizedIdentity(member.email) === ownerKey;
      });
  if (memberCandidates.length === 0) {
    return { status: "UNRESOLVED", reasonCodes: [input.ownerMemberId ? "OWNER_MEMBER_INACTIVE_OR_MISSING" : "OWNER_LABEL_NOT_UNIQUE_MEMBER"], candidateMemberIds: [], candidateTeamIds: [] };
  }
  if (memberCandidates.length > 1) {
    return { status: "AMBIGUOUS", reasonCodes: ["OWNER_LABEL_MATCHES_MULTIPLE_MEMBERS"], candidateMemberIds: memberCandidates.map((member) => member.id).sort(), candidateTeamIds: [] };
  }

  const member = memberCandidates[0];
  const squadKey = normalizedIdentity(input.squadLabel);
  let teamCandidates = input.owningTeamId
    ? activeTeams.filter((team) => team.id === input.owningTeamId)
    : activeTeams.filter((team) => squadKey && (normalizedIdentity(team.name) === squadKey || normalizedIdentity(team.slug) === squadKey));
  if (teamCandidates.length === 0) {
    const membershipTeamIds = new Set(input.memberships.filter((membership) => membership.active && membership.memberId === member.id).map((membership) => membership.teamId));
    teamCandidates = activeTeams.filter((team) => membershipTeamIds.has(team.id));
  }
  if (teamCandidates.length === 0) {
    return { status: "UNRESOLVED", memberId: member.id, reasonCodes: ["OWNER_HAS_NO_UNIQUE_ACTIVE_TEAM"], candidateMemberIds: [member.id], candidateTeamIds: [] };
  }
  if (teamCandidates.length > 1) {
    return { status: "AMBIGUOUS", memberId: member.id, reasonCodes: ["OWNER_HAS_MULTIPLE_ACTIVE_TEAMS"], candidateMemberIds: [member.id], candidateTeamIds: teamCandidates.map((team) => team.id).sort() };
  }
  const team = teamCandidates[0];
  const isMember = input.memberships.some((membership) => membership.active && membership.memberId === member.id && membership.teamId === team.id);
  if (!isMember) {
    return { status: "UNRESOLVED", memberId: member.id, teamId: team.id, reasonCodes: ["OWNER_NOT_ACTIVE_IN_TEAM"], candidateMemberIds: [member.id], candidateTeamIds: [team.id] };
  }
  return { status: "MATCHED", memberId: member.id, teamId: team.id, reasonCodes: [] };
}

export function combineCodeScopePolicies(scopes: Array<{
  owningTeamId?: string;
  requiredReviewers: string[];
  verificationPolicy?: string;
  approvalPolicy?: string;
}>): {
  owningTeamIds: string[];
  requiredReviewers: string[];
  verificationPolicies: string[];
  approvalPolicies: string[];
  requiresCrossTeamReview: boolean;
} {
  const uniqueSorted = (values: Array<string | undefined>) => [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].sort();
  const owningTeamIds = uniqueSorted(scopes.map((scope) => scope.owningTeamId));
  return {
    owningTeamIds,
    requiredReviewers: uniqueSorted(scopes.flatMap((scope) => scope.requiredReviewers)),
    verificationPolicies: uniqueSorted(scopes.map((scope) => scope.verificationPolicy)),
    approvalPolicies: uniqueSorted(scopes.map((scope) => scope.approvalPolicy)),
    requiresCrossTeamReview: owningTeamIds.length > 1,
  };
}

export function validateExecutorBindingPolicy(input: {
  expectedEnvironment?: "LOCAL" | "CLOUD" | "REMOTE" | "POLICY_SELECTED";
  requestedEnvironment: "LOCAL" | "CLOUD";
  runtime?: string;
  runModel?: string;
  routingDecision?: { projectId: string; workOrderId?: string; selectedModelId?: string; mode: string } | null;
  expectedRoutingDecision: boolean;
  projectId: string;
  workOrderId: string;
  activeTeamRuns: number;
  maxConcurrentRuns?: number;
  requestedBudgetUsd?: number;
  missionBudgetRemainingUsd?: number;
  checkpointSummary: string;
  stopCondition: string;
  escalationOwner: string;
}): string[] {
  const reasons: string[] = [];
  if (input.expectedEnvironment && input.expectedEnvironment !== "POLICY_SELECTED" && input.expectedEnvironment !== input.requestedEnvironment) reasons.push("EXECUTION_ENVIRONMENT_MISMATCH");
  if (!input.runtime?.trim()) reasons.push("RUNTIME_NOT_DECLARED");
  if (input.expectedRoutingDecision && !input.routingDecision) reasons.push("MODEL_ROUTING_DECISION_MISSING");
  if (input.routingDecision) {
    if (input.routingDecision.projectId !== input.projectId || input.routingDecision.workOrderId !== input.workOrderId) reasons.push("MODEL_ROUTING_DECISION_MISMATCH");
    if (input.routingDecision.selectedModelId && input.routingDecision.selectedModelId !== input.runModel) reasons.push("MODEL_SELECTION_MISMATCH");
    if (["KILLED", "EXHAUSTED"].includes(input.routingDecision.mode)) reasons.push("MODEL_ROUTE_NOT_EXECUTABLE");
  }
  if (input.maxConcurrentRuns !== undefined && input.activeTeamRuns > input.maxConcurrentRuns) reasons.push("TEAM_CONCURRENCY_LIMIT_REACHED");
  if (input.requestedBudgetUsd !== undefined && input.requestedBudgetUsd < 0) reasons.push("INVALID_RUN_BUDGET");
  if (input.requestedBudgetUsd !== undefined && input.missionBudgetRemainingUsd !== undefined && input.requestedBudgetUsd > input.missionBudgetRemainingUsd) reasons.push("MISSION_BUDGET_EXCEEDED");
  if (!input.checkpointSummary.trim()) reasons.push("CHECKPOINT_SUMMARY_REQUIRED");
  if (!input.stopCondition.trim()) reasons.push("STOP_CONDITION_REQUIRED");
  if (!input.escalationOwner.trim()) reasons.push("ESCALATION_OWNER_REQUIRED");
  return [...new Set(reasons)];
}

export function validateExecutorHostEligibility(input: {
  now: number;
  repositoryMatches?: boolean;
  runRuntime?: string;
  runModel?: string;
  host?: {
    repository: string;
    status: string;
    checkedAt: number;
    attestedAt?: number;
    runtime?: string;
    approvedModelIds?: string[];
    networkPolicyStatus?: string;
    secretPolicyStatus?: string;
    capacity?: { maxConcurrentRuns: number; currentRuns: number };
  } | null;
}): string[] {
  if (!input.host) return ["EXECUTOR_HOST_BINDING_REQUIRED"];
  const reasons: string[] = [];
  if (input.host.status !== "READY") reasons.push("HOST_NOT_READY");
  if (input.repositoryMatches === false) reasons.push("HOST_REPOSITORY_MISMATCH");
  if (input.now - (input.host.attestedAt ?? input.host.checkedAt) > 15 * 60_000) reasons.push("HOST_ATTESTATION_STALE");
  if (!input.host.runtime) reasons.push("RUNTIME_ATTESTATION_REQUIRED");
  else if (input.runRuntime && input.host.runtime !== input.runRuntime) reasons.push("HOST_RUNTIME_MISMATCH");
  if (input.host.networkPolicyStatus !== "READY") reasons.push("NETWORK_POLICY_NOT_ATTESTED");
  if (input.host.secretPolicyStatus !== "READY") reasons.push("SECRET_POLICY_NOT_ATTESTED");
  if (input.runModel) {
    if (!input.host.approvedModelIds) reasons.push("MODEL_ATTESTATION_REQUIRED");
    else if (!input.host.approvedModelIds.includes(input.runModel)) reasons.push("MODEL_NOT_APPROVED_FOR_HOST");
  }
  if (!input.host.capacity) reasons.push("HOST_CAPACITY_NOT_ATTESTED");
  else if (input.host.capacity.currentRuns >= input.host.capacity.maxConcurrentRuns) reasons.push("HOST_CAPACITY_EXHAUSTED");
  return reasons;
}

export function deliveryConfidence(input: {
  activeWorkOrders: number;
  blockedWorkOrders: number;
  pendingApprovals: number;
  failingEvidence: number;
  staleEvidence: number;
  missingOwnership: number;
}): { status: "HIGH" | "WATCH" | "AT_RISK" | "UNKNOWN"; score: number | null; formula: string } {
  if (input.activeWorkOrders === 0) {
    return { status: "UNKNOWN", score: null, formula: "Unknown until at least one active WorkOrder exists." };
  }
  const penalty =
    input.blockedWorkOrders * 18 +
    input.pendingApprovals * 8 +
    input.failingEvidence * 20 +
    input.staleEvidence * 10 +
    input.missingOwnership * 20;
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty / Math.max(1, input.activeWorkOrders))));
  return {
    status: score >= 80 ? "HIGH" : score >= 60 ? "WATCH" : "AT_RISK",
    score,
    formula: "100 − per-active-WorkOrder penalties (blocked 18, approval 8, failing evidence 20, stale evidence 10, missing owner 20).",
  };
}
