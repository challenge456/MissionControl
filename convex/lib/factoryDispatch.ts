export interface FactoryDispatchPreflightInput {
  missionLinked: boolean;
  versionProvided: boolean;
  definitionActive: boolean;
  versionIsActive: boolean;
  assessmentPasses: boolean;
  assessmentCurrent: boolean;
  digestMatches: boolean;
  repositoryReady: boolean;
  githubReady: boolean;
  workflowMatches: boolean;
  executorReady: boolean;
  policyReady: boolean;
  verifiersReady: boolean;
  hostReady: boolean;
  budgetReady: boolean;
  recoveryReady: boolean;
  worktreeProvided: boolean;
  mutating: boolean;
  activeRepositoryMutation: boolean;
}

export interface FactoryDispatchPreflightResult {
  ok: boolean;
  blocker?: string;
  remediation?: string;
}

const checks: Array<{
  key: keyof FactoryDispatchPreflightInput;
  blocker: string;
  remediation: string;
}> = [
  { key: "versionProvided", blocker: "factory-version-required", remediation: "Select the active Factory version before dispatch." },
  { key: "definitionActive", blocker: "factory-not-active", remediation: "Activate a passing Factory version." },
  { key: "versionIsActive", blocker: "factory-version-not-active", remediation: "Dispatch the exact active Factory version." },
  { key: "assessmentPasses", blocker: "factory-readiness-blocked", remediation: "Resolve the Factory readiness blockers and reassess." },
  { key: "assessmentCurrent", blocker: "factory-readiness-stale", remediation: "Run a current Factory readiness assessment." },
  { key: "digestMatches", blocker: "factory-digest-mismatch", remediation: "Reassess the immutable Factory version." },
  { key: "repositoryReady", blocker: "repository-not-ready", remediation: "Repair repository access before dispatch." },
  { key: "githubReady", blocker: "github-app-not-ready", remediation: "Repair and reverify the GitHub App installation." },
  { key: "workflowMatches", blocker: "workflow-version-mismatch", remediation: "Use the workflow frozen in the Factory version." },
  { key: "executorReady", blocker: "executor-not-ready", remediation: "Use the approved codex/v1 executor." },
  { key: "policyReady", blocker: "policy-not-ready", remediation: "Activate the Factory policy envelope." },
  { key: "verifiersReady", blocker: "verifiers-not-ready", remediation: "Restore every independent verifier frozen in the Factory version." },
  { key: "hostReady", blocker: "host-not-ready", remediation: "Report a clean, current READY repository host binding." },
  { key: "budgetReady", blocker: "budget-not-ready", remediation: "Use bounded positive V1 cost, runtime, and attempt limits." },
  { key: "recoveryReady", blocker: "recovery-not-ready", remediation: "Enable pause, resume, cancel, and bounded retry." },
  { key: "worktreeProvided", blocker: "worktree-required", remediation: "Allocate an attempt-specific repository worktree." },
];

export function evaluateFactoryDispatchPreflight(input: FactoryDispatchPreflightInput): FactoryDispatchPreflightResult {
  if (!input.missionLinked && !input.versionProvided) return { ok: true };
  for (const check of checks) {
    if (!input[check.key]) return { ok: false, blocker: check.blocker, remediation: check.remediation };
  }
  if (input.mutating && input.activeRepositoryMutation) {
    return {
      ok: false,
      blocker: "repository-mutation-already-active",
      remediation: "Wait for, cancel, or reconcile the active mutating attempt for this repository.",
    };
  }
  return { ok: true };
}
