---
status: ready
priority: p0
issue_id: "050"
tags: [factory, remote-sandbox, codex, structured-output, retry, exe-dev, qualification]
dependencies: []
---

# Qualify remote Codex structured output and bounded retry

## Problem Statement

Production Factory Pilot V1 is blocked. Thirteen of fifteen governed executions
were independently verified and accepted, but the `bug-fix-3` and
`data-migration-3` live exe.dev workloads exhausted bounded recovery without a
valid, reviewable `factory-result/v1` result. Process exit zero was observed in
the final Attempts, but exit zero is not a successful Factory result.

This work must classify and close the remote result boundary without expanding
Factory authority, adding a second result format, enabling Guarded Auto, or
adding unrelated features.

## Findings

- The authoritative pilot evidence lives on PR #120 at commit `604e2c4`; this
  qualification began in a new worktree from exact `origin/main` commit
  `75981d8ae1bd49e235cc1478bac3d0f853fc717f`.
- Pilot evidence preserves 16 failed Attempts across the two blocked workloads,
  their retry parents, source SHAs, lifecycle events, cleanup, credential
  revocation, and final zero-VM inventory.
- The final eight Attempts preserve exit code `0`, distinct stdout digests, a
  common stderr digest/tail, and a fail-closed supervisor result, but not the raw
  result file or raw Codex JSONL.
- PR #120's JSONL fallback treats the last schema-valid Codex agent message as a
  reconstruction input. It does not preserve why the primary result file was
  absent/invalid, terminal JSONL state, candidate multiplicity, or
  reconstruction provenance.
- The standalone supervisor writes the outer result directly to its final path;
  host polling may therefore observe a partial file. Output-file state and
  diagnostics are not persisted before teardown.
- Pilot retry behavior is generic and repeatedly reruns deterministic result
  failures. Retry classification, total budget, result provenance, and cost
  telemetry are not frozen as one explicit policy.

## Proposed Solutions

### Option 1: Harden the existing canonical boundary

**Approach:** Preserve `factory-result/v1`, add strict contextual acceptance,
bounded JSONL reconstruction, atomic result persistence, explicit failure
taxonomy, frozen retry budgets, observability, and fault-injection tests.

**Pros:** Smallest correct scope; preserves authority and compatibility; fails
closed; directly addresses the pilot blocker.

**Cons:** Requires careful contract migration and live provider qualification.

**Effort:** Multi-session qualification.

**Risk:** Medium.

### Option 2: Replace the remote result protocol

**Approach:** Introduce a new transport or result format.

**Pros:** Could redesign the boundary from scratch.

**Cons:** Violates the requested single canonical contract, expands blast
radius, and would require requalifying established authority boundaries.

**Effort:** Large.

**Risk:** High.

## Recommended Action

Use Option 1. First preserve and classify the pilot failures. Then harden the
existing remote Codex path with the smallest deterministic changes, prove it
with fake-provider/fault-injection coverage, run the requested compatibility
matrix, and only then run a maximum-one-VM live exe.dev qualification and the
three pilot remote regressions. Any unclassified outcome fails closed.

## Technical Details

**Expected affected areas:**

- `apps/orchestration-server/src/sandboxSupervisor.ts`
- `apps/orchestration-server/src/sandboxResultBundle.ts`
- `apps/orchestration-server/src/remoteSandboxRuntime.ts`
- `apps/orchestration-server/src/exeDevSandboxProvider.ts`
- `apps/orchestration-server/src/codexExecutorAdapter.ts`
- Factory retry/Attempt policy code only if the current canonical scheduler
  does not already freeze and enforce the required bounds
- Focused orchestration tests and qualification scripts
- `docs/testing/evidence/remote-codex-structured-output-v1/`

**Database changes:** None assumed. If durable Attempt fields require schema
changes, document the authority and migration impact before implementing them.

## Resources

- PR #120 / commit `604e2c4` Production Factory Pilot V1 evidence
- `docs/architecture/executor-adapter-contract.md`
- `docs/architecture/remote-sandbox-execution.md`
- `docs/software-factory/remote-sandbox-runtime.md`
- Attached Remote Codex Structured Output & Retry Qualification V1 request

## Acceptance Criteria

- [ ] The exact two failed remote workloads and all 16 failed Attempts are
  reconstructed in an evidence-backed failure table.
- [ ] Observed evidence is distinguished from reconstructed or unavailable
  evidence; raw stdout/stderr/JSONL is never invented.
- [ ] Exactly one canonical `factory-result/v1` contract has deterministic
  acceptance rules for Attempt, manifest, source, harness/model, candidate,
  terminal status, and bounded diagnostics.
- [ ] Process exit zero without an accepted result fails closed.
- [ ] JSONL recovery is deterministic, bounded, terminal-state aware,
  context-bound, ambiguity rejecting, and provenance preserving.
- [ ] Result persistence cannot expose partial output as complete.
- [ ] Failure taxonomy distinguishes `RETRYABLE_INFRA`,
  `RETRYABLE_EXECUTION`, `NON_RETRYABLE_RESULT`, and `UNKNOWN`; `UNKNOWN` fails
  closed.
- [ ] Retry limits freeze max Attempts, wall clock, model spend where observed,
  and provider resources; every retry creates a fresh Attempt identity.
- [ ] Fault injection proves missing/truncated/invalid output, JSONL recovery,
  transport interruption, supervisor crash, stale Attempt, wrong candidate,
  timeout, and cancellation behavior with exact cleanup and revocation.
- [ ] Idempotency tests prove no stale candidate, verification, credential,
  lease, or evidence reuse/overwrite.
- [ ] Focused and compatibility suites requested by the qualification pass.
- [ ] A bounded live exe.dev run reaches 5/5 valid outputs across at least two
  materially different workloads with max concurrency one.
- [ ] The three pilot remote workloads reach 3/3 valid outputs and continue
  through independent verification and acceptance when expected to succeed.
- [ ] Every live scenario revokes its Attempt credential, removes its VM, and
  final exe.dev inventory is zero.
- [ ] Token, cost, retry, and timing evidence preserves unknown costs as `null`.
- [ ] Fresh GitHub CI and Vercel results are recorded for durable changes.
- [ ] A draft PR is opened only if durable changes are justified; it is not
  merged and Guarded Auto remains disabled.

## Work Log

### 2026-08-18 - Isolation and preservation

**By:** Codex

**Actions:**

- Fetched exact latest `origin/main` and created isolated branch/worktree
  `codex/remote-codex-structured-output-v1` at `75981d8a`.
- Kept PR #120's pilot worktree read-only.
- Read the complete attached qualification request and the pilot README,
  defect log, lineage, result data, workload fixtures, supervisor, provider,
  runtime, adapter, and focused tests.
- Identified the blocked WorkOrders as `work-order-bug-fix-3` and
  `work-order-data-migration-3`, both using Factory Version
  `factory-codex-exedev-certified-v1`.
- Confirmed that pilot evidence does not retain raw result-file bytes or raw
  Codex JSONL for the final failures; exact sub-classification within the
  structured-output failure is therefore unavailable from the pilot packet.

**Learnings:**

- PR #120's fail-closed behavior prevented false success, but its diagnostics
  collapse several result failure modes and its generic retries reran outcomes
  that should not automatically retry.
- Atomic persistence and reconstruction provenance are prerequisites for a
  trustworthy live qualification, not optional polish.

## Notes

- Do not edit or overwrite Production Factory Pilot V1 evidence.
- Do not enable Guarded Auto, publish a candidate automatically, merge a PR, or
  broaden Factory architecture.
- Final decision must be exactly one of: `REMOTE CODEX STRUCTURED OUTPUT
  QUALIFIED`, `QUALIFIED WITH LIMITATIONS`, or `BLOCKED`.
