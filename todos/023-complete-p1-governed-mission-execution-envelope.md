---
status: complete
priority: p1
issue_id: "023"
tags: [software-factory, mission, dispatch, preflight, lineage, concurrency]
dependencies: ["022"]
---

# Bind the Governed Mission Execution Envelope

## Problem Statement

Dispatch currently creates a WorkflowRun with WorkOrder and model context, but
does not atomically bind the active Factory version, exact repository, host,
executor adapter, policy/environment, branch, or approved tool boundary. It also
prevents concurrent mutation only inside one Mission, not across all Missions
targeting the same repository.

## Recommended Action

Require Mission-linked dispatch to name the active Factory version. Revalidate
its current passing evidence inside the dispatch mutation, create one immutable
execution binding on the WorkflowRun, and fail closed when another mutating
attempt is active for the repository. Preserve legacy non-Mission dispatch while
the governed UI path migrates.

## Acceptance Criteria

- [x] Mission dispatch requires the exact active Factory version.
- [x] Dispatch atomically revalidates the version digest, assessment freshness, repository/GitHub access, workflow, executor, policy, verifier, host, budget, and recovery posture.
- [x] The attempt stores exact Factory, repository, branch/worktree, host, executor, model route, allowed tools, policy, environment, and WorkOrder revision lineage.
- [x] One active mutating attempt per repository is enforced across Missions.
- [x] Idempotent replay returns the original exact binding.
- [x] Blocked dispatch returns a concise root cause and remediation without creating a run.
- [x] Focused/full tests, typechecks, and build pass.

## Work Log

### 2026-08-02 - Implementation started

**By:** Codex

**Actions:**

- Confirmed WorkflowRun is the existing attempt record and will be extended
  rather than introducing a parallel Agent Run lifecycle.
- Located the current human Task and WorkOrder dispatch surfaces and retained
  legacy non-Mission compatibility during the governed-path migration.

### 2026-08-02 - Governed execution envelope completed

**By:** Codex

**Actions:**

- Extended the existing WorkflowRun attempt record with immutable Factory,
  configuration digest, repository, host, executor, policy, environment, branch,
  worktree, allowed-tool, mutation, and existing revision/model lineage.
- Added atomic dispatch preflight that rechecks the active Factory version and
  current readiness evidence instead of trusting the earlier activation alone.
- Added a repository/status index and cross-Mission exclusion for active mutating
  attempts while allowing explicitly non-mutating attempts to coexist.
- Derived a server-owned attempt branch and worktree when the signed executor
  command does not provide an already allocated path.
- Changed the WorkOrder and Task dispatch UI to resolve the active Factory by the
  WorkOrder's exact repository, disable unsafe Mission dispatch, and explain the
  required remediation.
- Added the bound execution envelope to the run inspector; historical runs are
  truthfully labeled legacy/unbound.

**Verification:**

- Factory dispatch and WorkOrder policy tests pass: 26 focused tests.
- Full Convex suite passes: 57 files and 394 tests.
- Full UI suite passes: 46 files and 198 tests.
- Convex code generation, workspace lint/typecheck, and all skill lint checks pass.
- Production UI build passes.
- Browser verification at `http://localhost:5180/v2/control-work-orders` confirms
  exact-repository Factory lookup, disabled Mission dispatch, actionable missing
  Factory remediation, and zero console errors.
