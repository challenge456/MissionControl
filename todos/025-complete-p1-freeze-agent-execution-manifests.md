---
status: complete
priority: p1
issue_id: "025"
tags: [software-factory, agents, manifests, reproducibility, readiness]
dependencies: ["023"]
---

# Freeze Complete Agent Execution Manifests

## Problem Statement

Factory versions freeze the workflow, executor, policy, budget, and verifiers,
but agent versions and repository code scopes are still resolved after version
creation. A run therefore cannot prove the exact prompt, tool manifest, model
route, harness, context, and causation contract that governed each step.

## Recommended Action

Bind approved agent versions and active repository code scopes into every new
Factory version. Compile and persist an immutable per-step execution manifest on
the attempt before execution, and make readiness fail closed when any referenced
capability is missing, inactive, incompatible, or stale.

## Acceptance Criteria

- [x] Every workflow agent in a new Factory version maps to one approved agent version.
- [x] Every mutating Factory version freezes at least one active repository code scope.
- [x] Factory digests change when an agent or code-scope binding changes.
- [x] Readiness validates agent status, prompt/tool hashes, model route, executor capability, and code-scope availability.
- [x] Dispatch persists an immutable per-step manifest with agent version, compiled prompt, tools, model, harness, context hash, and causation IDs.
- [x] The run inspector exposes the manifest without exposing secrets or unbounded prompt content.
- [x] Focused tests, typechecks, build, and browser states pass.

## Work Log

### 2026-08-08 - Implementation started

**By:** Codex

**Actions:**

- Began alongside todo 024 because the real worker must not execute against
  runtime-resolved agent or path authority.
- Chose Factory-version bindings and an attempt snapshot rather than mutable
  lookups during execution.

### 2026-08-08 - Complete

**By:** Codex

**Actions:**

- Added immutable code-scope and approved agent-version bindings to Factory
  versions and their canonical configuration digest.
- Added fail-closed readiness checks for workflow contracts, active scopes,
  approved agent versions, model/prompt/tool hashes, and executor recovery.
- Compiled and persisted a per-step execution manifest at dispatch, including
  causation, harness, compiled prompt hash, model, tools, timeout, context hash,
  and repository/worktree authority.
- Redacted compiled prompt content from public run queries while exposing hashes,
  bindings, lease state, and causation in the run inspector.
- Verified the new editor controls and corrected recovery contract in the live
  main-repo browser UI with no console warnings or errors.
