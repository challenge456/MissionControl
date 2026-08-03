---
status: complete
priority: p1
issue_id: "019"
tags: [software-factory, assessment, decisions, executor, documentation]
dependencies: ["018"]
---

# Publish Current Software Factory Assessment and Decisions

## Problem Statement

The V1 program plan is based on a reviewed design specification, but the
repository still lacks one current-branch assessment that consolidates the
capability map, canonical hierarchy, route maturity, authorization boundaries,
and Product Owner decisions. Starting later runtime phases without that baseline
would risk duplicating existing contracts or implementing the executor out of
sequence.

## Findings

- The July capability map and earlier UI assessment contain useful evidence but
  predate the current authority, Mission, WorkOrder, and Loop Engineering work.
- The canonical hierarchy and Hono orchestration architecture already have
  accepted decision records.
- The Product Owner approved Codex as the one production executor, with a
  simulated adapter retained only for deterministic tests.
- Seven other V1 decisions remain proposed or require later customer/operations
  input; they must not be silently treated as approved.

## Proposed Solutions

### Option 1: Start the Codex adapter immediately

**Pros:** Visible runtime progress.

**Cons:** Violates the approved PR dependency order and would design against an
unfrozen Factory/readiness contract.

**Effort:** Medium.

**Risk:** High.

### Option 2: Consolidate the current assessment and decision log first

**Pros:** Establishes the authoritative baseline, records the approved executor
choice, identifies remaining decisions, and prevents duplicate contracts.

**Cons:** Documentation-first work precedes the next runtime feature.

**Effort:** Small to medium.

**Risk:** Low.

## Recommended Action

Publish the consolidated assessment and V1 decision log on the current branch.
Reference existing records rather than copying large historical audits. Keep
unresolved Product Owner choices explicit. Do not edit the approved program
plan or begin the executor adapter ahead of GitHub readiness and Factory
configuration.

## Technical Details

**Primary files:**

- `docs/mission-control-existing-system-assessment.md`
- `docs/decisions/ai-software-factory-v1-decisions.md`
- Existing capability, authorization, glossary, and architecture documents

**Database changes:** None.

## Acceptance Criteria

- [x] Assessment reflects the current branch and cites repository evidence.
- [x] Routes, domain records, public/service boundaries, workflows, CLI/runtime,
  integrations, tests, and the current golden path are inventoried.
- [x] Each major capability is classified as Complete, Partial, Missing,
  Duplicated, Obsolete, or Preview/Demo-only.
- [x] Canonical glossary and lifecycle mapping are consolidated without adding
  a duplicate hierarchy.
- [x] Codex executor decision is recorded as approved with simulated-test-only
  fallback and sequencing constraints.
- [x] Remaining Product Owner decisions stay visibly unresolved or proposed.
- [x] Documentation validation and repository checks pass.

## Work Log

### 2026-08-02 - Assessment started

**By:** Codex

**Actions:**

- Confirmed continued work on `codex/AI_FDE` after Product Owner approval.
- Re-read the full V1 program plan and its current-system references.
- Selected documentation-first Option 2 to preserve the approved PR sequence.

**Learnings:**

- The existing Codex implementation worker is an execution prototype, not yet a
  versioned production adapter.
- GitHub readiness and Factory configuration must freeze authority and
  capability requirements before the adapter contract is implemented.

### 2026-08-02 - Assessment completed

**By:** Codex

**Actions:**

- Published `docs/mission-control-existing-system-assessment.md` with current
  route, schema, function, workflow, CLI/runtime, integration, test, authority,
  lifecycle, and golden-path inventories.
- Published `docs/decisions/ai-software-factory-v1-decisions.md`, recording
  Codex as the approved production executor and simulation as test-only while
  leaving the other seven decisions explicitly proposed, open, or deferred.
- Expanded the canonical glossary and refreshed the human/service
  authorization matrix to reflect the completed Loop/Harness boundary work.
- Preserved the approved program plan unchanged and did not implement the
  executor ahead of GitHub readiness and Factory configuration.

**Verification:**

- `git diff --check` passes.
- All local Markdown links in the new/updated documents resolve.
- `pnpm run lint` passes: all workspace TypeScript checks and ten skill lint
  checks at 100/100.

**Learnings:**

- Mission Control has broad real primitives; the remaining V1 risk is contract
  and authority integration, not lack of tables or screens.
- The next runtime slice remains GitHub App readiness and signed ingress. The
  Codex adapter belongs after the versioned Factory contract is frozen.
