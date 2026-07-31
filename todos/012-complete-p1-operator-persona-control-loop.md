---
status: complete
priority: p1
issue_id: "012"
tags: [operator, personas, governance, evaluations, software-factory]
dependencies: []
---

# Implement Persona-Tested Operator Control Loop

## Problem Statement

Mission Control has real WorkOrder approvals, dispatch, and proof records, but
the operator must still reconstruct the complete decision from multiple
surfaces. There is also no calibrated persona-engineering harness that tests
whether the workflow remains understandable under missing, reordered, or
adversarial context.

## Findings

- The correct operational foundation is `approvalDecisions`, not legacy
  `approvals`.
- Approval, dispatch, and acceptance are intentionally separate server actions.
- Existing receipt and governance records can supply a truthful proof packet.
- Synthetic persona claims need grounding, durability tests, provenance, and
  later human calibration.

## Proposed Solutions

### Option 1: UI-only persona simulation

Small, but produces no durable run history and risks demo behavior.

### Option 2: Separate persona application

Flexible, but duplicates workspace, governance, and evidence context.

### Option 3: Integrated operator workflow plus eval harness

Reuses the real control plane and evaluates the same workflow operators use.
This has the largest initial slice but the lowest long-term ambiguity.

## Recommended Action

Implement Option 3 in two vertical slices: upgrade the live Approval Center,
then add additive Operator Eval contracts and an Intelligence surface. Keep
proxy, model, and human result provenance explicit.

## Acceptance Criteria

- [x] Complete operator decision packet and guarded actions are live.
- [x] Approved work links to explicit dispatch and proof inspection.
- [x] Command Center no longer performs context-free quick decisions.
- [x] Grounded persona, eight scenarios, durability variants, and rubrics exist.
- [x] Durable proxy/model/human run contracts and scoring are implemented.
- [x] Operator Evals is left-nav reachable and project scoped.
- [x] Tests, build, and browser verification pass.

## Work Log

### 2026-07-31 - Product boundary and implementation plan

**By:** Codex

**Actions:**
- Re-reviewed the synthetic-persona transcript against Mission Control.
- Mapped the existing approval, dispatch, receipt, mission, and eval contracts.
- Chose the existing WorkOrder control plane as the sole operational truth.
- Created the brainstorm and phased implementation plan.

**Learnings:**
- The four-step operator statement is the job-to-be-done. Persona engineering
  adds authority, pressures, evidence thresholds, a fixed world, perturbation
  tests, and calibration.

### 2026-07-31 - Implementation and verification

**By:** Codex

**Actions:**
- Built an exception-first Decision Center on the existing WorkOrder governance
  model and removed context-free approve/unblock shortcuts.
- Added reasoned, workspace-scoped decisions, explicit dispatch separation,
  and full evidence and proof context.
- Added durable Fleet Operator persona, scenario, run, and human-observation
  records with proxy/model/human provenance and strict external result checks.
- Added the Operator Evals Intelligence page and responsive navigation.
- Codified the product North Star and grounded the persona in approved plans,
  risk-proportional autonomy, bounded recovery, and review-ready pull requests.
- Verified desktop and narrow layouts in the main repository UI.

**Verification:**
- Mission Control UI: 154 tests passed.
- Focused Convex governance/eval suite: 21 tests passed.
- Convex code generation, TypeScript checking, and production build passed.
