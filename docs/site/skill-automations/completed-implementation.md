---
status: complete
priority: p1
issue_id: "011"
tags: [automations, context-registry, work-orders, execution, receipts, audit]
canonical_source: todos/011-complete-p1-deterministic-skill-automations.md
---

# Completed Implementation Record

## Problem statement

Mission Control needed to convert deterministic Context Registry skills into
repository-backed, executable, governed Automation Definitions with complete
WorkOrder, approval, run, independent receipt, and audit lineage.

## Decision

The implementation extends the existing governed Automation tables and
WorkOrder lifecycle. A separate skill-automation control plane was rejected
because it would duplicate governance, fragment metrics, and violate the
existing product architecture.

Evaluation remains separate from dispatch. Only approved repository artifacts
can execute through typed, bounded adapters. Verification remains logically
separate and creates integrity-bearing receipts with correlation and causation lineage.

## Completed acceptance criteria

- [x] All seven adapters have bounded validation and normalized execution.
- [x] Manual and scheduled evaluation is persisted, idempotent, and concurrency-safe.
- [x] Dispatch remains explicit and requires an approved governed WorkOrder.
- [x] Execution evidence is redacted and independent receipt creation is separate.
- [x] Definitions support edit, validate, review, approve, activate, pause, resume, suspend, disable, archive, clone, and new version.
- [x] Registry and Candidates expose filters, actions, states, and eligibility detail.
- [x] Runs, Receipts, and Decisions expose correlation lineage and evidence.
- [x] Demo data covers eligible, potential, ineligible, draft, verified, and rejected cases.
- [x] Unit, integration, browser, build, lint, and type checks passed.
- [x] Browser evidence covers primary success, rejection, and responsive paths.
- [x] Follow-on Software Factory enhancements are documented and prioritized.

## Core vertical slice

- Added Registry eligibility metadata and candidate evaluation.
- Added resumable conversion drafts and seven-step UI.
- Added generated artifacts, disabled Definitions, review and approval gates, and activation enforcement.
- Verified Playwright execution through WorkOrder approval, explicit dispatch, independent receipts, and final `DONE` state.

## Production completion

- Added bounded Playwright, API, TypeScript, Python, Shell, Workflow, and skill pipeline execution.
- Enforced fixed argv, timeouts, cancellation, repository roots, immutable hashes, environment filtering, secret redaction, and normalized results.
- Added persisted idempotent and concurrency-aware evaluations.
- Added explicit edit, validation, version, and full lifecycle controls.
- Added independent final verification and integrity-bearing receipts.
- Added realistic persisted demo draft, verified, rejected, potential, and ineligible scenarios.
- Restored schema compatibility for legacy factory and shadow release-gate consumers.
- Verified the live API adapter from manual evaluation through approval, dispatch, execution, independent receipts, `VERIFIED`, and WorkOrder `DONE`.
- Captured desktop and responsive browser evidence.
- Added the prioritized P0/P1/P2 factory roadmap.

## Validation record

| Check | Result |
| --- | --- |
| Root typecheck | Passed across all packages |
| Root lint | Passed; 0 errors, 0 warnings |
| Skill lint | 10 skills at 100/100 |
| Root tests | 994 passed |
| Convex tests | 298 passed as part of root suite |
| Adapter tests | 9/9 passed |
| Playwright reference Automation | 1/1 passed |
| Production UI build | Passed |
| Browser tabs | All seven verified |
| Responsive browser | 760×900 verified |
| Axe | No non-contrast WCAG A/AA critical/serious issues |

The production build retains the existing vendor chunk-size warning. The
shared `text-ink-muted` color token remains slightly below WCAG AA contrast on
some surfaces and should be corrected at the design-system level.

## Operational learning

- Generic execution belongs behind WorkOrder dispatch; schedulers must remain evaluation-only.
- A completed workflow run can clear the active-run pointer before verification, so independent verification resolves completed lineage from run history.
- Manual evaluation needs a distinct short idempotency window and must not be blocked by the next scheduled cadence.
- Shared schema extensions must retain compatibility fields and indexes used by legacy factory modules.

## Remaining boundaries

- V1 remains LEVEL_1 and read-only.
- Automatic dispatch is intentionally unavailable.
- Operator identities are trusted deployment assertions rather than authenticated identities.
- Secret references are supported, but a production secret broker is still P0.
- Artifact pull-request and commit-pinning workflow remains P0.

## Next recommendation

Implement authenticated operator identity, workspace authorization, and
separation of duties before expanding permissions or autonomy.
