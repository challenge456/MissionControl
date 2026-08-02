---
status: in_progress
priority: p1
issue_id: "016"
tags: [loop-engineering, workflow, convex, github, evidence, ui]
dependencies: []
---

# Close the Three Engineering Loops

## Problem Statement

Mission Control contains working research graphs, WorkOrders, Tasks, approvals,
verification receipts, PR/CI ingestion, measurements, and improvement proposals,
but their handoffs do not form one truthful inner/outer/meta loop.

## Findings

- A completed 8/8 Research Lab graph remains in cycle phase `RESEARCH` with empty ledgers.
- The existing Codex factory worker is intentionally read-only.
- Research Lab has no configured GitHub webhook and its PR evidence is unrelated/stale.
- The meta-loop preview auto-seeds demo suggestions into an empty workspace.
- Repetitive proposal creation and acceptance use different payload discriminators.
- Existing loop diagram terminology reverses the supplied inner/outer semantics.

## Proposed Solutions

### Option 1: Add another loop engine

**Pros:** clean-room design.

**Cons:** duplicates canonical Task, WorkOrder, approval, and evidence state.

**Risk:** High.

### Option 2: Close existing handoffs

**Pros:** preserves proven state machines, minimizes migration, and improves truthfulness.

**Cons:** requires careful idempotent projection and legacy reconciliation.

**Risk:** Medium.

## Recommended Action

Execute the phased plan in `docs/plans/2026-08-01-feat-close-loop-engineering-system-plan.md`, beginning with graph-to-cycle projection and proceeding through governed implementation, PR/CI correction, evidence-driven meta learning, and a unified operator surface.

## Technical Details

Primary areas: `convex/loopEngineering.ts`, `convex/workflowRuns.ts`,
`convex/factory/metaLoop.ts`, `convex/factory/repetitiveTasks.ts`,
workflow runtime contracts, and Loop Engineering UI.

## Resources

- `docs/testing/three-loop-engineering-audit.md`
- `docs/plans/2026-08-01-feat-close-loop-engineering-system-plan.md`
- `docs/software-factory/LOOP_ENGINEERING.md`

## Acceptance Criteria

- [ ] Completed graphs project into cycles exactly once.
- [ ] Approved implementation work executes in an isolated worktree with immutable Attempts.
- [ ] PR/CI failures create bounded correction Attempts and preserve evidence.
- [ ] Meta suggestions originate from real evidence and create governed work when accepted.
- [ ] The unified UI displays inner, outer, and meta state truthfully.
- [ ] Refresh and process restart preserve lineage without duplicate events.
- [ ] Focused and release-gate tests pass.
- [ ] Browser journeys pass with screenshots and no critical console errors.
- [ ] Documentation is updated in repository and Mission Control Docs.
- [ ] Changes are committed, merged, and pushed to `main`.

## Work Log

### 2026-08-01 - Execution started

**By:** Codex

**Actions:**
- Confirmed product-owner approval to implement and ship the complete plan.
- Continued in isolated branch `codex/recover-software-factory-research-lab`.
- Prioritized truthful graph-to-cycle projection as the first bounded slice.

**Learnings:**
- Existing primitives are sufficient; the primary work is closing idempotent handoffs.

### 2026-08-01 - Phase 0 completed

**By:** Codex

**Actions:**
- Added additive cycle projection fields and indexes.
- Added a contract-validating, idempotent workflow-output projector with dry-run reconciliation.
- Bound projected implementation authority to the existing workflow gate approval and evidence digest.
- Automatically projects completed Loop Engineering runs and records actionable projection failures.
- Reconciled the selected Research Lab cycle through the public action after a dry run.
- Added projection status, evidence counts, clean-stop outcome, and manual recovery to the operator UI.

**Verification:**
- Convex projection/state tests: 9 passed.
- Workflow engine tests: 66 passed.
- UI and workflow engine typechecks: passed.
- Chromium refresh journey: passed; projected cycle displays 2 accepted sources, 3 claims,
  4 measurements, and `Ready For Next Cycle` with no page errors.
- Screenshot: `docs/testing/evidence/three-loop-engineering-audit/phase-0/research-lab-projected-cycle.png`.

**Learnings:**
- A completed graph can validly produce no accepted recommendation; that is a clean stop, not missing work.
- The browser exposed an old-backend/new-client contract mismatch, so projection failures now remain visible and recoverable.

### 2026-08-01 - Phases 1–4 implemented and locally verified

**By:** Codex

**Actions:**
- Added a fail-closed implementation worker and policy contract for approved,
  isolated, bounded repository changes.
- Made PR-head evaluation durable and idempotent, added signed webhook ingestion,
  bounded correction signals, explicit merge recording, and lineage across the
  WorkOrder, Task, workflow run, cycle, PR, and head SHA.
- Replaced automatic demo suggestions with evidence-driven, deduplicated meta
  signals whose acceptance creates governed work.
- Consolidated Inner Attempts, Outer PR/CI Gate, Meta Improvements, and Graph
  Engineering on one Loop Engineering surface.
- Updated Mission Control Docs and version-controlled implementation evidence.

**Verification:**
- Workflow engine: 75/75 tests passed.
- Focused Convex loop/CI/security contracts: 12/12 tests passed.
- Mission Control UI production build: passed.
- Repository typecheck and skill lint: passed.
- Chromium projection, persistence, meta-acceptance, and unified-loop journeys:
  passed with retained screenshots and no current page errors after clean reload.

**Reviews:**
- Simplicity review: no duplicate engine or lifecycle introduced.
- Security review: no embedded credentials; signed webhooks fail closed; external
  text is sanitized; worker environment, command, repository, worktree, and
  secret boundaries are enforced.

**Remaining release action:**
- Create and ingest the real GitHub PR, monitor CI, merge under explicit
  authority, record merge evidence, and verify remote `main`.

## Notes

- Full-suite execution is reserved for the final release gate.
- Production authorization and approval boundaries must remain fail-closed.
