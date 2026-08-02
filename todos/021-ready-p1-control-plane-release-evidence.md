---
status: ready
priority: p1
issue_id: "021"
tags: [control-plane, testing, security, documentation, release]
dependencies: ["016", "017", "018", "019", "020"]
---

# Produce release evidence and ship the control plane

## Problem Statement

The SDD is not complete until compatibility, authorization, scale, UI, dispatch enforcement, rollback, and operational monitoring are proven together and the verified commit is merged to `main`.

## Findings

- The SDD requires automated results, role browser traces, denied-request evidence, parity/performance reports, screenshots, and rollback rehearsal.
- UI changes must be verified in a real browser before merge.

## Proposed Solutions

### Option 1: Rely on unit tests and visual inspection

Fast but insufficient for authorization, routing, responsive layout, and migration confidence. Risk: high.

### Option 2: Layered release gate

Run focused tests during development, then full type/lint/unit/build/E2E, security/data reviews, deterministic browser journeys, rollback rehearsal, and CI. Risk: low.

## Recommended Action

Use the layered release gate; merge only after every required signal passes and the PR includes monitoring and rollback criteria.

## Technical Details

- Automated test suites and CI workflows
- Browser screenshots/traces and verification report
- Migration, parity, denial, performance, and rollback evidence
- Operational docs and user/admin documentation

## Resources

- SDD sections 14–17

## Acceptance Criteria

- [ ] All dependent todos are complete with checked acceptance criteria.
- [ ] Typecheck, lint, unit, integration, build, and relevant E2E suites pass.
- [ ] Security, authorization, data-integrity, and code-simplicity reviews have no unresolved blockers.
- [ ] Primary role and compatibility browser journeys pass with screenshots/traces.
- [ ] Migration, parity, denial, performance, and rollback reports are captured.
- [ ] Product, administration, operations, and rollback documentation is current.
- [ ] PR includes monitoring signals, failure triggers, validation window, and owner.
- [ ] CI passes, PR is merged to `main`, remote merge commit is verified, and a test URL is provided.

## Work Log

### 2026-08-01 - Execution queued

**By:** Codex

**Actions:**
- Created the final evidence and shipping gate from the SDD verification plan.

**Learnings:**
- Completion is defined by reproducible proof, not by the presence of UI cards or schema tables.

