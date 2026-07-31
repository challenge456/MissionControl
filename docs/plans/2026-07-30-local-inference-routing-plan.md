---
title: Local Inference Routing — First Shippable Slice
type: feat
status: completed
date: 2026-07-30
completed_at: 2026-07-31
---

# Local Inference Routing — First Shippable Slice

## Goal

Make a local LLM installation an observable, policy-eligible model provider
without pretending Convex can directly reach a developer workstation.

## Software Factory Operating Contract

- **Planning:** use the configured GPT-5.6 Sol frontier lane for architecture,
  decomposition, and difficult tradeoffs.
- **Execution:** use Composer for bounded implementation tasks with an explicit
  acceptance contract.
- **Review:** use Claude Opus for consequential code review, verification, and
  release gates.
- **Local lane:** use healthy local inference for QA, automation, documentation,
  classification, and small private tasks. It is not approved for high-risk
  changes by default.
- **Long-running lane:** night/weekend work runs through cloud agents with a
  complexity- and risk-selected model, checkpoints, evidence, budgets, and an
  escalation path. Local nodes are not an unattended fallback for this class.

These are operating roles, not implicit credentials or model provisioning.
Each provider must be discovered/configured and pass policy eligibility before
it is selected.

## Fleet Ownership and Cost/Quality Standard

Every developer is responsible for operating a fleet of agents. The routing
objective is not simply the lowest-cost model: it is the lowest-cost eligible
route that can meet the task's required quality, safety, capability, and
evidence standard.

- Start with local inference only for bounded, low-risk work with a clear
  acceptance contract.
- Escalate to a stronger cloud model after failed validation, missing tools or
  context, repeated retries, or a review-risk signal.
- Review fleet performance through cost, validation pass rate, retry rate,
  approval outcome, and latency—not raw agent activity.

## Scope

- Probe local Ollama, LM Studio, and OpenAI-compatible endpoints from the
  orchestration server only.
- Discover installed local models and their declared capabilities.
- Sync discovered models into the existing catalog as local, zero-cost routes.
- Keep all local routes unapproved for high-risk work by default and preserve
  the existing cloud fallback chain.
- Verify discovery against the running local Ollama installation.

## Non-goals

- Direct browser-to-local-model calls.
- Direct task-prompt execution through a local provider. This slice makes local
  routes discoverable, policy-eligible, selectable, and auditable; the executor
  bridge is a separate delivery slice.
- Network-exposed local endpoints or browser-stored credentials.

## Acceptance Criteria

- [x] Discovery identifies an available local provider and reports failures safely.
- [x] A sync creates/updates catalog entries without duplicating models.
- [x] Discovered tool/vision capability is represented in the catalog.
- [x] Local models remain ineligible for high-risk work unless explicitly approved.
- [x] The existing resolver selects a local model only when policy permits it.

## Verification — 2026-07-31

- Ollama discovery found six installed local models and identified tool and
  vision capabilities from the provider metadata.
- `qwen3:0.6b` completed a real local inference request successfully.
- Software Factory Demo policy v2 is enforced at 100%, but only the
  `LOW + SMALL` rule selects local Ollama; standard work resolved to the
  balanced cloud route in the same simulator.
- Model-router tests pass for local eligibility, risk rejection, fallback, and
  override behavior; orchestration-server type checking also passes.

## Post-deploy Monitoring and Validation

- Track local-node health, discovery failures, route-selection counts, retry
  rates, validation pass rate, escalation rate, latency, and avoided cloud cost.
- Alert fleet owners when a local node becomes unavailable, a local task retries
  repeatedly, or quality validation falls below the workspace policy threshold.
- Keep cloud fallback enabled and review the first 25 local routing decisions
  before expanding beyond `LOW + SMALL` tasks.
- Do not approve local routes for high-risk work until the executor bridge has
  signed receipts, sandboxing, timeout controls, and a documented rollback path.
