---
date: 2026-07-31
topic: release-to-evidence-golden-path
---

# Release-to-Evidence Golden Path

## What We're Building

Complete the first browser-operable Mission execution path after plan release: approve a released WorkOrder, create and assign its canonical Task, dispatch an immutable Attempt, collect evidence, accept the WorkOrder, record a structured handoff, run an independent Validator WorkOrder, and accept the Mission only when every assertion and delivery record is complete.

The slice stops at Mission acceptance. Pull-request creation, merge, deployment, and production verification remain separate future gates. No action in this slice may merge or deploy automatically.

## Why This Approach

Three approaches were considered:

1. Build a new Mission-specific executor. Rejected because it would duplicate the WorkOrder, Task, Attempt, receipt, retry, and audit engines.
2. Treat WorkOrder completion as Mission completion. Rejected because it collapses distinct lifecycle and evidence states.
3. Reuse the existing WorkOrder control plane and add a narrow Mission coordination layer. Chosen because it preserves one authoritative hierarchy and closes only the missing transitions and browser guidance.

## Key Decisions

- Existing WorkOrder approval, dispatch, Task Attempt, receipt, acceptance, and recovery mutations remain authoritative.
- The first Mission WorkOrder dispatch starts the Mission atomically; the UI does not maintain a shadow execution state.
- Validator dispatch remains blocked until predecessor WorkOrders are accepted and have complete structured handoffs.
- A complete handoff requires a completed run, accepted WorkOrder, valid assertion coverage, and artifacts owned by that run.
- Validator receipts automatically update their linked Mission assertions; operators do not duplicate evidence entry.
- Mission acceptance requires passing assertions, every released WorkOrder accepted, and complete handoffs.
- Task creation with an assignee must finish in an execution-ready state so browser dispatch never depends on a hidden CLI transition.
- The Mission Detail execution surface explains the next governed action and links to the existing WorkOrder and Decision Center controls.
- The existing `missions.plan-release-v1` gate remains the local/verified rollout boundary for the released-plan golden path.

## Open Questions

None blocking this slice. Authenticated production identity and author/approver/validator separation remain required before enabling the rollout flag broadly.

## Next Steps

Implement the bounded plan in `docs/plans/2026-07-31-feat-release-to-evidence-golden-path-plan.md` and track completion in todo 015.
