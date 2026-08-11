---
status: complete
priority: p1
issue_id: "026"
tags: [software-factory, workflows, context, handoffs, completion-contracts]
dependencies: ["025"]
---

# Replace Heuristic Workflow Contracts With Bounded Structured Handoffs

## Problem Statement

Legacy workflows still treat a substring such as `STATUS: done` as completion,
allow agents to create or approve pull requests directly, and copy unbounded raw
step output into shared context. Those contracts are ambiguous, unsafe, and
expensive during long autonomous runs.

## Recommended Action

Require schema-validated completion for executable workflows, reserve GitHub PR
creation and approval authority for deterministic control-plane boundaries, and
pass compact structured handoffs with explicit context budgets between steps.

## Acceptance Criteria

- [x] Active mutating workflows cannot use heuristic string completion.
- [x] Workflow agents cannot create PRs, approve merge, or claim verification authority.
- [x] Step completion uses explicit schema-validated status and evidence fields.
- [x] Handoffs distinguish completed, incomplete, and unknown assertions plus risks and next action.
- [x] Shared context enforces per-step and per-run size budgets and stores large outputs as artifacts.
- [x] Crash/retry resumes from durable structured checkpoints rather than replaying full raw history.
- [x] Focused tests, typechecks, build, and representative workflow execution pass.

## Work Log

### 2026-08-08 - Implementation started

**By:** Codex

**Actions:**

- Identified `STATUS: done`, agent-owned `gh pr create`, agent merge approval,
  and whole-output context copying as the unsafe legacy contracts to retire.
- Kept deterministic authority and exact output validation in code while
  preserving agent judgment inside bounded prompts.

### 2026-08-08 - Complete

**By:** Codex

**Actions:**

- Rejected heuristic `STATUS: done` contracts and agent-owned PR creation,
  approval, review, merge, or deployment authority at workflow load/readiness.
- Migrated all six active YAML workflows to schema-validated `COMPLETED` output
  and structured evidence handoffs.
- Added 32 KB per-step and 128 KB per-run context budgets with explicit artifact
  references for large evidence.
- Persisted compact completed/incomplete/unknown assertions, risks, next action,
  and owner as durable workflow-run checkpoints used by retry/recovery.
- Validated all six workflow definitions, focused executor/loader/handoff tests,
  full typecheck/lint, and the production build.
