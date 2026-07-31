---
status: complete
priority: p1
issue_id: "011"
tags: [automations, context-registry, work-orders, execution, receipts, audit]
dependencies: []
---

# Complete governed deterministic skill Automations

## Problem Statement

Mission Control must convert deterministic Context Registry skills into
repository-backed, executable, governed Automation Definitions with complete
WorkOrder, approval, run, independent receipt, and audit lineage.

## Findings

- Candidate assessment, conversion drafts, artifact generation, Definition
  review/approval, Playwright reference execution, and core browser flow exist.
- Remaining work includes generic bounded adapter execution, evaluation
  persistence, full lifecycle/version controls, richer candidate controls,
  normalized receipt/audit finalization, and comprehensive regression coverage.
- The repository also contains unrelated in-progress model-routing and task
  changes. They must be preserved and excluded from this feature's edits.
- Root type checking currently exposes pre-existing schema drift in release-gate
  and legacy factory modules; feature-caused failures must still be eliminated.

## Proposed Solutions

1. Extend the existing governed Automation tables and WorkOrder lifecycle.
   - Pros: preserves one control plane and existing operator UI.
   - Cons: requires careful compatibility with older factory modules.
2. Add a separate skill-automation runtime and UI.
   - Pros: simpler isolation.
   - Cons: duplicates governance and violates the product architecture.

## Recommended Action

Use option 1. Keep evaluation separate from dispatch, execute only approved
repository artifacts through typed allowlisted adapters, normalize results,
create independent receipts, and record correlation/causation across every
transition.

## Acceptance Criteria

- [x] All seven adapters have bounded configuration validation and normalized execution.
- [x] Scheduler/manual evaluation persists checks and is idempotent and concurrency-safe.
- [x] Dispatch remains explicit and requires a governed approved WorkOrder.
- [x] Execution logs/evidence are stored without secrets and receipt creation is independent.
- [x] Definitions support validate, edit, review, approve, activate, pause, resume, suspend, disable, archive, clone, and new version.
- [x] Registry and Candidates surfaces expose required filters, actions, states, and eligibility detail.
- [x] Runs, Receipts, and Decisions show complete correlation lineage and evidence.
- [x] Demo data covers eligible, potential, ineligible, draft, active/verified, and failed/rejected cases.
- [x] Unit, integration, browser, build, lint, and type checks are run and feature-caused failures fixed.
- [x] Browser evidence covers primary success and failure paths.
- [x] Follow-on Software Factory enhancements are documented and prioritized.

## Work Log

### 2026-07-30 - Core vertical slice

**By:** Codex

**Actions:**
- Added Registry eligibility metadata and candidate evaluation.
- Added resumable conversion drafts and seven-step UI.
- Added generated artifacts, disabled Definitions, review/approval gates, and activation enforcement.
- Verified a Playwright adapter through WorkOrder approval, explicit dispatch,
  execution, independent receipts, and final `DONE` state.

**Learnings:**
- Local stale pre-Control-Plane Automation rows required a recoverable local DB reset.
- Generic execution must live behind WorkOrder dispatch; the scheduler must
  remain limited to evaluation and review-gate creation.

### 2026-07-30 - Production completion

**By:** Codex

**Actions:**
- Added bounded Playwright, API, TypeScript, Python, Shell, Workflow, and
  deterministic pipeline execution with fixed argv, timeouts, cancellation,
  repository-root enforcement, immutable hashes, secret filtering, and
  normalized results.
- Added persisted idempotent/concurrency-aware evaluations, explicit
  Definition edit/validate/version/lifecycle controls, and independent final
  verification with integrity-bearing receipts.
- Added realistic persisted demo draft, verified, rejected, potential, and
  ineligible scenarios.
- Restored shared schema compatibility for legacy factory and shadow release
  gate consumers; root typecheck is green.
- Verified the live API adapter flow from manual evaluation through approval,
  dispatch, execution, independent receipts, `VERIFIED`, and WorkOrder `DONE`.
- Captured seven desktop/responsive browser screenshots and documented the
  prioritized P0/P1/P2 factory roadmap.

**Validation:**
- Root typecheck: passed.
- Root lint: passed; 10 skills at 100/100, 0 errors, 0 warnings.
- Root tests: passed (all workspace suites plus 298 Convex tests).
- Adapter tests: 9/9 passed.
- Playwright reference automation: 1/1 passed.
- Production UI build: passed; existing vendor chunk warning only.
- Axe: no non-contrast WCAG A/AA critical/serious issues; the shared
  `text-ink-muted` contrast token remains the existing cross-shell limitation.
