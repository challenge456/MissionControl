---
title: "feat: Close the inner, outer, and meta engineering loops"
type: feat
status: active
date: 2026-08-01
---

# Close the Inner, Outer, and Meta Engineering Loops

## Overview

Mission Control already has durable Tasks, Attempts, WorkOrders, workflow DAGs,
approvals, verification receipts, PR/CI ingestion, evidence lineage,
measurements, and improvement suggestions. The next release should connect
those existing primitives into one bounded learning system:

`recommendation -> approved implementation -> edit/run/check -> PR -> CI/review -> merge -> validate -> measure -> improvement proposal -> next bounded cycle`

This is integration work, not a reason to build another orchestration platform.

## Problem Statement

The current Graph Engineering run can reach 8/8 complete while its linked Loop
Engineering cycle remains in Research with empty ledgers. Repository-changing
execution is described by workflow prompts but has no connected mutating worker.
The outer-loop primitives are real but are not configured for the Research Lab
repository. The Improvement Loop is Preview, seeds demo content into empty
workspaces, and does not consistently turn accepted suggestions into governed
implementation and measurement work.

The UI therefore overstates end-to-end completion.

## Product Outcome

An operator can approve one evidence-linked recommendation and observe a
bounded change move through all three loops without direct database edits,
silent approval, fabricated completion, or loss of failed attempts.

## Canonical Ownership

| Concern | Source of truth |
| --- | --- |
| Intent and scope | Mission / WorkOrder |
| Executable unit | Task |
| One execution or correction | Attempt / workflow run |
| Repository isolation | WorkOrder branch strategy + Attempt worktree |
| Change artifact | Run artifact + PR URL + head SHA |
| CI and review | GitHub check ingestion + PR checks |
| Authorization | Approval decision |
| Acceptance | Verification receipts + WorkOrder acceptance |
| Learning | Loop Engineering cycle + meta-loop suggestion |
| Audit | Activity, run events, phase history, and evidence lineage |

## Architecture

### One loop, three operating horizons

- **Inner loop:** fastest bounded Attempts inside an approved implementation
  WorkOrder. It may edit only the approved repository and worktree.
- **Outer loop:** pull-request, CI, verifier, policy, and approval feedback. It
  can request another inner Attempt but cannot silently merge.
- **Meta loop:** slower evidence aggregation across accepted and failed work. It
  proposes changes to skills, verifiers, evals, policies, workflows, or factory
  code; accepted proposals become normal governed WorkOrders.

### Idempotent handoffs

Every handoff must carry:

- workspace/project ID;
- cycle ID;
- WorkOrder ID and revision;
- Task and Attempt/run ID;
- repository, branch/worktree, PR URL, and head SHA when applicable;
- source event ID and idempotency key;
- evidence digest and actor for governed decisions.

## Implementation Phases

### Phase 0 — Truthful cycle projection

**Goal:** make completed graph output and cycle state agree before adding more
automation.

- [x] Add optional linkage/projection fields to
  `loopEngineeringCycles` and required indexes in `convex/schema.ts`.
- [x] Add an internal idempotent projection that imports workflow context into
  the cycle source, claim, recommendation, conflict, limitation, approval, and
  measurement ledgers.
- [x] Validate every imported output against the workflow snapshot contract.
- [x] Deduplicate sources by normalized URL and claims by stable digest.
- [x] Preserve rejected evidence and unsupported claims.
- [x] Make workflow gate approval the single operator decision that authorizes
  `approveRecommendations`; do not maintain two independent approvals.
- [x] Represent zero accepted recommendations as a valid clean stop.
- [x] Add a preview-only reconciliation report for the two legacy Research Lab
  cycles; require explicit confirmation before backfilling their projection.
- [x] Show projection status and actionable errors in Graph Engineering.

**Primary files:** `convex/schema.ts`, `convex/loopEngineering.ts`,
`convex/workflowRuns.ts`,
`apps/mission-control-ui/src/harness/components/LoopEngineeringWorkspace.tsx`.

**Exit criteria:** the selected completed Research Lab graph no longer appears
as empty Research; its evidence, measurements, approval, and clean-stop outcome
are visible after refresh.

### Phase 1 — Governed inner-loop execution

**Goal:** implement real `edit -> run -> check -> repeat` behavior without
weakening repository safety.

- [x] Create a separate implementation-capable worker; keep the existing Codex
  research worker read-only.
- [x] Require an approved implementation WorkOrder, explicit repository,
  isolated worktree, branch strategy, allowed commands, cost limit, timeout,
  maximum Attempts, and stop condition before claim.
- [x] Start each correction as an immutable Attempt linked to the prior failure.
- [x] Record file changes, commands, exit codes, targeted test results, console
  output summaries, token/cost use, and artifacts as run evidence.
- [x] Default to affected unit/type/browser checks; reserve the full suite for a
  release gate or explicit operator request.
- [x] Fail closed on repository escape, secrets, destructive commands, missing
  worktree, cancellation, or stale WorkOrder revision.
- [x] Produce a PR-ready packet; do not claim a PR exists until GitHub returns a
  URL and head SHA.
- [x] Resume safely after worker restart without replaying completed commands.

**Primary files:** new implementation worker under `apps/` or `scripts/`,
`convex/workflowRuns.ts`, `convex/workOrders.ts`, `convex/tasks.ts`,
`packages/workflow-engine/`, and `workflows/feature-dev.yaml`.

**Exit criteria:** a deterministic fixture change fails one targeted check,
creates a correction Attempt, passes on retry, and produces a real linked PR
without modifying the main checkout.

### Phase 2 — Close the outer PR/CI/review loop

**Goal:** make PR feedback drive governed correction until merge or stop.

- [x] Configure signed GitHub webhook handling and document the deployed-secret boundary.
- [x] Correlate PR and check-run events to cycle, WorkOrder, Task, Attempt, head
  SHA, and workflow snapshot.
- [x] Treat every new head SHA as a new outer-loop evaluation.
- [x] Convert failed required checks or verified review findings into a bounded
  correction request on the existing WorkOrder.
- [x] Preserve the failed outer evaluation and link the replacement Attempt.
- [x] Require CI, review lenses, security policy, verification receipts, and
  explicit approval appropriate to risk before merge eligibility.
- [x] Record merge actor, timestamp, commit SHA, and PR URL.
- [x] Never auto-merge high-risk, production, authorization, migration, or
  destructive changes.
- [x] Make duplicate webhooks idempotent and observable.

**Primary files:** `convex/http.ts`, `convex/factory/prChecks.ts`,
`convex/lib/githubCiIngest.ts`, `convex/workOrders.ts`, change-review UI,
and repository connection settings.

**Exit criteria:** a failed CI check returns the WorkOrder to correction; the
updated PR passes, retains both evaluations, satisfies its gate, merges under
the configured authority, and survives refresh.

### Phase 3 — Make the meta loop evidence-driven

**Goal:** turn real outcomes into governed quality improvements.

- [x] Remove automatic demo seeding from
  `HarnessMetaLoopView`; expose demo seeding only behind an explicit
  development-only action.
- [x] Fix the automation proposal payload contract so proposal creation and
  acceptance use the same discriminator.
- [x] Add schema-contract tests before adding new consumers.
- [x] Ingest real signals from failed Attempts, repeated retries, CI failures,
  recurring review comments, rejected approvals, waived receipts, performance
  regressions, and repeated WorkOrders.
- [x] Deduplicate suggestions by workspace, signal class, target, and evidence
  window.
- [x] Require evidence count, confidence, impact, affected surface, and source
  links for every suggestion.
- [x] On acceptance, create a governed WorkOrder and Task. Do not directly
  enable repository policy, skills, verifiers, or automation.
- [x] Support suggestion lifecycle:
  `OPEN -> ACCEPTED -> WORK_ORDERED -> IMPLEMENTED -> VERIFIED -> EFFECTIVE`
  with `DISMISSED`, `ROLLED_BACK`, and `RETIRED` outcomes.
- [x] Measure the post-change result against its baseline.
- [x] Feed unmet targets or remaining gaps into one idempotent next cycle.

**Primary files:** `convex/factory/metaLoop.ts`,
`convex/factory/repetitiveTasks.ts`, `convex/automations.ts`,
`convex/schema.ts`, and `HarnessMetaLoopView.tsx`.

**Exit criteria:** one real failed workflow creates one suggestion; acceptance
creates governed work; implementation traverses inner and outer loops; a
measurement records whether quality improved; refresh shows the full lineage.

### Phase 4 — Consolidate the operator experience

**Goal:** show one truthful loop instead of disconnected control panels.

- [x] Rename the primary surface **Loop Engineering**.
- [x] Present three connected sections: Inner Attempts, Outer PR/CI Gate, and
  Meta Improvements.
- [x] Standardize the supplied vocabulary: inner drives automation, outer
  drives autonomy, and meta drives quality; remove the currently reversed
  labels from `HarnessLoopsDiagram.tsx`.
- [x] Keep Graph Engineering as the execution visualization inside Loop
  Engineering, not a competing product concept.
- [x] Fold Improvement Loop into this surface or retain its old route as a
  redirect/detail view.
- [x] Use real scoped data only; label unavailable runtimes and Preview
  capabilities explicitly.
- [x] Prioritize current exception, required operator decision, evidence, cost,
  and stop condition over agent activity.
- [x] Link every card to its Task, WorkOrder, Attempt, PR, receipt, measurement,
  or suggestion.
- [x] Provide loading, empty, error, blocked, recovery, success, and narrow
  viewport states.
- [x] Ensure keyboard operation, visible focus, accessible names, dialog focus
  containment, and text-based status.

**Exit criteria:** an operator can understand and control the full loop from one
page without visiting the database or interpreting contradictory states.

## Acceptance Criteria

### Inner loop

- [ ] Valid approved work creates an isolated implementation Attempt.
- [ ] Unapproved, stale, cross-workspace, or repository-escaping work is denied.
- [ ] A failed check is retained and produces at most one bounded correction
  Attempt.
- [ ] File changes and targeted checks are visible as evidence.
- [ ] Cancellation, timeout, cost limit, and max-attempt stop conditions work.
- [ ] Refresh and worker restart do not duplicate execution.

### Outer loop

- [ ] A real PR is linked to its WorkOrder and current Attempt.
- [ ] Signed PR and check-run webhooks update the correct head SHA.
- [ ] Failed CI or verified review findings prevent merge and request correction.
- [ ] Passing checks do not bypass required human approval.
- [ ] Merge actor, commit, PR, timestamp, and verification receipts persist.
- [ ] Duplicate webhooks display one evaluation/event.

### Meta loop

- [ ] Empty production workspaces remain truthfully empty.
- [ ] One real failure produces at most one evidence-linked suggestion.
- [ ] Rejection requires and retains a reason.
- [ ] Acceptance creates governed work rather than direct policy activation.
- [ ] Applied improvements have baseline, result, target, evidence, and verdict.
- [ ] A failed measurement can create one bounded next cycle.
- [ ] Rules and automations can be rolled back or retired without erasing history.

### End-to-end

- [ ] A completed research graph projects into its Loop cycle exactly once.
- [ ] One approved recommendation traverses inner, outer, and meta loops.
- [ ] Invalid state transitions are blocked.
- [ ] Counts, progress, cost, and evidence lineage update reactively.
- [ ] State persists after browser refresh and process restart.
- [ ] No direct database step is required.
- [ ] No major finding exists only in chat.

## Focused Verification Strategy

Run cost-conscious checks per phase:

1. Relevant Convex contract and state-machine unit tests.
2. Workflow-engine executor and graph tests.
3. Focused UI component tests.
4. One deterministic Chromium journey for the changed handoff.
5. `git diff --check` and affected typecheck.

Run the full repository suite only at the final release gate or when a shared
contract change makes focused coverage insufficient.

Required evidence for each critical journey:

- test name and requirement;
- browser and timestamps;
- result and screenshot;
- trace on failure;
- console errors and failed network calls;
- created entity IDs and cleanup status;
- git commit and CI reference when available.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Two approval systems diverge | Make one approval record authoritative and project it idempotently |
| Agent edits outside scope | Approved repo/worktree allowlist and fail-closed command policy |
| Infinite repair loop | Max Attempts, time, cost, and explicit stop condition |
| Duplicate webhooks or suggestions | Stable source-event idempotency keys and unique indexes |
| Historical cycle corruption | Preview reconciliation and explicit backfill confirmation |
| Demo data presented as production | Remove mount-time seeding and label fixtures explicitly |
| Schema drift | Add optional schema/index contract first and run generated type validation |
| Excessive test cost | Targeted checks per slice; full suite at release boundary |
| Silent auto-merge | Risk-based authority plus explicit protected-path rules |

## Deliberate Exclusions

- No unbounded autonomous loop.
- No self-approval.
- No direct writes to the main checkout.
- No second Task or WorkOrder lifecycle.
- No new primary navigation domain.
- No automatic activation of skills, verifiers, policies, or automations from a
  suggestion.
- No full-suite run on every inner-loop Attempt.

## Success Metrics

- 100% of completed graph outputs projected to their cycles.
- 100% of repository changes linked to an approved WorkOrder and isolated
  Attempt.
- 100% of material PR decisions linked to current head-SHA evidence.
- Zero silent approval or merge bypasses.
- Zero duplicate execution or suggestion events.
- Zero demo suggestions in non-demo workspaces.
- Median correction Attempts per accepted change.
- Time from approved recommendation to PR.
- Time from PR to accepted merge.
- Percentage of meta suggestions with measured post-change results.
- Cost per accepted change and per effective factory improvement.

## Documentation Plan

Update:

- `docs/software-factory/LOOP_ENGINEERING.md`
- `docs/software-factory/GRAPH_ENGINEERING.md`
- Mission Control Documentation under Software Factory Enhancement
- browser evidence under `docs/testing/evidence/three-loop-engineering/`
- operational startup and GitHub webhook runbooks
- the completed delivery record after each bounded phase

## References

- `workflows/loop-engineering.yaml`
- `workflows/feature-dev.yaml`
- `packages/workflow-engine/src/executor.ts`
- `scripts/codex-factory-worker.ts`
- `convex/loopEngineering.ts`
- `convex/factory/metaLoop.ts`
- `convex/factory/repetitiveTasks.ts`
- `convex/factory/prChecks.ts`
- `convex/lib/githubCiIngest.ts`
- `apps/mission-control-ui/src/harness/components/LoopEngineeringWorkspace.tsx`
- `apps/mission-control-ui/src/harness/views/HarnessMetaLoopView.tsx`
- `docs/testing/three-loop-engineering-audit.md`
