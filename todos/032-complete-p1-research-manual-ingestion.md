---
status: complete
priority: p1
issue_id: "032"
tags: [software-factory, research-lab, continuous-learning, convex, evidence]
dependencies: ["031"]
---

# Atomic Manual Research Ingestion and Verification

## Problem Statement

The approved source registry and bounded Web/RSS adapter can retrieve evidence,
but Mission Control cannot yet persist a manual collection attempt. Artifact,
observation, and cursor writes must succeed or roll back together, and a
distinct verifier must reopen the committed evidence before the run completes.

## Findings

- `workflowRuns`, `runArtifacts`, WorkOrders, and verification receipts already
  provide the canonical execution and evidence lineage.
- `researchObservations` already requires a workflow run and artifact, but no
  source-run attempt record or atomic persistence function exists.
- The adapter is Node-only because its production transport pins DNS-approved
  IP addresses while retaining TLS hostname verification.
- Convex schema and consumers must ship as one atomic contract; the documented
  schema-drift incident explicitly warns against partial delivery.

## Proposed Solutions

### Option 1: Persist each item from the browser

**Pros:** Small UI change.

**Cons:** Exposes authority to the client, cannot guarantee atomic cursor
checkpointing, and cannot independently verify evidence.

**Risk:** Critical.

### Option 2: Orchestration-server endpoint

**Pros:** Natural Node runtime for the adapter.

**Cons:** Adds another signed dispatch surface and makes browser/server
availability part of a manual evidence commit.

**Risk:** Medium.

### Option 3: Convex Node action plus atomic internal mutations

**Pros:** Reuses authenticated workspace authority, keeps one transactional
database boundary, supports idempotent recovery, and schedules nothing.

**Cons:** Requires a focused source-run schema and split Node/non-Node modules.

**Risk:** Low.

## Recommended Action

Implement Option 3. An explicit operator action creates one read-only WorkOrder,
workflow run, and leased source-run attempt. The Node action fetches bounded
evidence, one internal mutation atomically creates the artifact/observations and
checkpoints the cursor, and a distinct verifier reopens the committed records
before recording the verification receipt and completing the WorkOrder.

## Acceptance Criteria

- [x] Add a tenant-scoped `researchSourceRuns` attempt/lease contract with
  project, source, WorkOrder, workflow run, artifact, observations, receipt,
  failure, retry, idempotency, and audit indexes.
- [x] Only an authorized operator can run an `ACTIVE`, approved, exact-host
  Web/RSS source; concurrent claims and cross-workspace access fail closed.
- [x] One explicit click creates one read-only WorkOrder and workflow run with
  frozen source version, cursor, caps, policy, and adapter identity.
- [x] Artifact insertion, new/superseding observations, duplicate decisions,
  cursor checkpoint, source health, and run events commit in one mutation.
- [x] Failure before commit creates no artifact, observation, or cursor change.
- [x] Idempotent replay creates no duplicate WorkOrder, run, artifact, receipt,
  or observation; expired/retryable attempts recover with a new lease.
- [x] A distinct verifier reopens persisted evidence, validates hashes and
  lineage, and records a generic verification receipt before completion.
- [x] Quarantined observations remain visible and cannot become verified claims.
- [x] Research Watchlist adds a manual `Run once` control plus loading, success,
  no-change, quarantined, failed, retry, and verified evidence states.
- [x] Continuous scheduling, claim extraction, recommendation creation, model
  invocation, messaging, and repository writes remain off.
- [x] Focused policy/persistence/UI tests, full typecheck/build, and an isolated
  browser proof pass.

## Work Log

### 2026-08-11 - Authorized Start

**By:** Codex

- Published source authority and adapter-core PRs #65 and #66.
- Selected the Convex Node action plus atomic mutation design because it keeps
  authority and persistence inside the existing workspace transaction boundary.
- Applied the schema-contract learning: schema, generated types, action,
  mutations, UI, and tests will ship together.

### 2026-08-11 - Implementation and Independent Proof

**By:** Codex

- Added tenant-scoped source-run leases with a three-attempt retry ceiling,
  backoff, stale-lease recovery, per-source exclusion, and a workspace cap of
  three active manual runs.
- Added an explicit public action backed by internal authority and persistence
  functions. The collector can only read an active approved RSS/Atom source
  through the exact-host Web/RSS adapter; no scheduler or agent dispatcher was
  added.
- Added one atomic commit for the bounded artifact manifest, new or
  superseding observations, duplicate decisions, cursor checkpoint, source
  health, WorkOrder, workflow, and run events.
- Added a distinct verifier identity that reopens persisted records, recomputes
  the artifact digest, validates observation manifest hashes and full lineage,
  and only then completes the WorkOrder and receipt. Quarantined observations
  are rejected rather than accepted as verified claims.
- Added `Run once`, retry, resume-verification, no-change, quarantined, failed,
  and verified evidence states to the shared Research Watchlist surface. The
  same Convex actions and queries remain machine-callable and use the same
  reactive workspace data as the UI.
- Focused automated verification passed: 5 ingestion-policy tests and 8
  Research Watchlist UI tests, plus Convex and UI TypeScript checks.
- Live Research Lab happy path passed against `https://openai.com/news/rss.xml`:
  one run persisted 20 observations, one artifact, one cursor checkpoint, one
  independent receipt, and a completed WorkOrder. A later run using the final
  manifest contract persisted 20 bounded excerpts while the generic artifact
  manifest exposed hashes but no raw excerpt.
- Idempotent replay passed: run, WorkOrder, artifact, receipt, and observation
  counts were unchanged.
- Atomic failure proof passed against a retired `example.com` test source: the
  provider returned `NOT_FOUND`; the failed run contained zero artifacts, zero
  observations, and no cursor checkpoint.
- Browser reload persistence, zero page errors, zero axe violations, and the
  visible `Scheduling off` posture passed. Screenshot evidence:
  `/tmp/research-manual-ingestion-evidence.png`.
- The complete repository gate passed: all package tests, 48 UI test files
  (209 tests), 64 Convex test files (429 tests), Convex TypeScript, workspace
  typecheck, production build, lint, and `git diff --check`.
- Security review passed for exact-host SSRF controls, authorization,
  untrusted-content quarantine, input bounds, and excerpt minimization. Data
  review passed for atomic writes, migration-safe optional excerpt backfill,
  idempotency indexes, project/status concurrency indexing, and audit lineage.

## Notes

- Do not edit the approved continuous-learning plan.
- Do not enable automatic or recurring scheduling in this todo.
- Do not store a raw feed response or more than the bounded normalized excerpt.
