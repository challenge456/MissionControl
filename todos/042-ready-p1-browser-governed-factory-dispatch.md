---
status: ready
priority: p1
issue_id: "042"
tags: [software-factory, work-orders, dispatch, browser, authorization, v1]
dependencies: ["038", "041"]
---

# Complete browser-governed Factory dispatch

## Problem Statement

The browser can create and dispatch a WorkOrder, but creation does not persist
the stable repository, code scope, team, owner, or execution environment needed
by the governed dispatch contract. Verification arguments are whitespace-split,
and dispatch omits the exact local host and Factory-scope binding.

## Findings

- The backend creation engine already accepts and validates every stable scope
  field; the browser does not send them.
- The immutable Factory version already freezes workflow and approved code
  scopes; the browser currently treats workflow and scope independently.
- Local scope enforcement requires `executorHostId`, while the browser omits it.
- Free-form code-scope approval prose is promoted into required approval types.
- The existing Work Orders and Approvals surfaces can complete the flow without
  another product area.

## Proposed Solutions

### Option 1: Complete the existing WorkOrder and dispatch surfaces

**Pros:** One lifecycle and authority path; smallest safe V1 change.

**Cons:** Requires coordinated query, mutation-validation, UI, and schema-safe
documentation changes.

**Risk:** Medium.

### Option 2: Add a separate Factory launch wizard

**Pros:** Could optimize only for Factory inputs.

**Cons:** Duplicates WorkOrder creation and introduces competing authority.

**Risk:** High.

## Recommended Action

Implement Option 1 using
`docs/plans/2026-08-12-feat-browser-governed-factory-dispatch-plan.md`. Keep the
browser advisory and revalidate all immutable Factory, scope, host, workflow,
and operator authority in the canonical dispatch mutation.

## Acceptance Criteria

- [x] Stable repository, code scope, team, owner, and local environment persist
      from browser creation.
- [x] Exact verification argv persists without whitespace or shell parsing.
- [x] New code-scope approval gates use controlled identifiers and separate
      descriptive guidance.
- [x] Browser dispatch shows and revalidates the active Factory version,
      approved scope, workflow, and current clean host.
- [ ] Browser create → pre-dispatch approval → dispatch → verified pause succeeds
      in one isolated local exercise.
- [x] Focused and full validation gates pass; README and contracts are current.

## Work Log

### 2026-08-12 - Research and scope selection

**By:** Codex

**Actions:**

- Audited WorkOrder creation, immutable Factory configuration, dispatch scope,
  host binding, verification persistence, and existing operator surfaces.
- Read the North Star, verification-first, durable worker, design, and schema
  integrity contracts.
- Selected the existing Work Orders and Approvals path instead of a parallel
  launch wizard.

**Learnings:**

- The backend authority model is mostly complete; the primary gap is that the
  browser does not bind to it.
- Exact argv needs a structured representation. A human-entered shell-like
  string cannot preserve argument identity safely.

## Notes

- Stop the live proof at the durable publication checkpoint. No GitHub provider
  mutation is needed for this acceptance test.

### 2026-08-12 - Implementation and local browser verification

**By:** Codex

**Actions:**

- Bound browser creation to ready repository, immutable Factory, approved code
  scope, owning team, accountable owner, local host, and exact JSON argv.
- Added server-side scope/version/host revalidation and forwarded the same
  identities through signed orchestration dispatch.
- Added worker checkout attestation and made the existing orchestration tests
  part of the package test command.
- Created the local Factory baseline and immutable version through the browser,
  then recorded the legitimate readiness and create-form blocker in
  `docs/testing/evidence/browser-governed-factory-dispatch/`.

**Learnings:**

- The local environment has no GitHub App installation/private credentials, so
  readiness correctly blocks activation. The full browser create-to-pause
  acceptance item remains open until that external prerequisite is available.
- The PR #72 same-Attempt pause, process restart, approval, permit, and PR
  continuation has already been proven separately and is not being simulated
  again with fabricated provider state.

### 2026-08-12 - Rebased validation

**By:** Codex

**Actions:**

- Rebased the change onto current `origin/main`.
- Passed `ci:lint`, the complete workspace and Convex test suites, production
  build, runtime contract v17, built Node ESM orchestration startup smoke, and
  the nine-test critical accessibility/dashboard/v2-route browser pack.
- Kept the full create-to-pause browser exercise open because the required
  repository-scoped GitHub App installation is absent from the isolated local
  environment.

**Learnings:**

- The critical browser pack requires the live local Research Lab Convex URL;
  its default shell-only URL cannot load workspace data. Once pointed at the
  isolated backend, all nine tests passed.
