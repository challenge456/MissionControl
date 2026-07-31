# Deterministic Skill Automations

| Field | Value |
| --- | --- |
| Status | Complete and locally verified |
| Safety boundary | LEVEL_1, read-only |
| Primary route | `/v2/automations?workspace=<workspace-id>` |
| Navigation | Operations → Automations |
| Owner | Mission Control Software Factory |
| Completed | 2026-07-30 |

## Purpose

Mission Control converts eligible deterministic Context Registry skills into
repository-backed Automation Definitions without weakening the existing
WorkOrder, approval, dispatch, verification, receipt, or audit boundaries.

## Governed lifecycle

```text
Deterministic Skill
  → Automation Candidate
  → Resumable Conversion Draft
  → Generated or Linked Artifact
  → Disabled Automation Definition
  → Review and Approval
  → Explicit Activation
  → Manual or Scheduled Evaluation
  → AWAITING_APPROVAL WorkOrder
  → Explicit Dispatch
  → Bounded Adapter Execution
  → Independent Verification
  → Integrity-bearing Receipt
  → VERIFIED or REJECTED Decision
```

Evaluation never dispatches work. Execution success never completes a
WorkOrder without an independent passing receipt.

## Delivered capabilities

- Eligibility assessment keeps eligible, potential, and ineligible skills visible.
- Candidate decisions—defer, dismiss, restore, and conversion—are persisted.
- A seven-step wizard covers source, adapter, artifact, trigger, governance, validation, and explicit creation.
- Seven adapters are supported: Playwright, API, TypeScript, Python, Shell, Mission Control Workflow, and deterministic skill pipeline.
- Definition controls include edit, validate, submit, approve, activate, pause, resume, suspend, disable, archive, clone, new version, and evaluate now.
- Manual and scheduled evaluations are idempotent and concurrency-aware.
- Runtime execution enforces repository roots, immutable hashes, fixed argv, allowlisted commands, environment filtering, redaction, timeouts, and cancellation.
- Runs, receipts, and decisions preserve Definition, WorkOrder, workflow run, actor, correlation, causation, and evidence lineage.

## Operator surfaces

The Automation workspace contains seven URL-backed tabs:

1. **Overview** — metrics, next evaluation, safety boundary, and exception-first attention.
2. **Candidates** — Registry eligibility, filters, decisions, dependencies, and conversion.
3. **Definitions** — lifecycle, governance, trigger, artifact, metrics, and audit history.
4. **Runs** — WorkOrder, dispatch, runtime, cost, evidence, logs, and required action.
5. **Schedule** — authoritative cadence, time zone, next five projections, and evaluation.
6. **Receipts** — fresh, missing, rejected, inconclusive, stale, expired, and waived evidence.
7. **Decisions** — actor, rationale, policy, version, state, correlation, and causation.

## Production boundary

- LEVEL_1 only.
- Read-only by default and enforced at execution.
- Operator approval required.
- No automatic dispatch.
- Explicit activation required.
- Independent receipt required.
- Current actor labels are trusted deployment assertions, not authenticated identities.

## Validation summary

- Root typecheck passed across every workspace package.
- Root lint passed with 0 errors and 0 warnings; 10 skills scored 100/100.
- Root tests passed: 994 tests.
- Bounded adapter tests passed: 9/9.
- Playwright reference Automation passed: 1/1.
- Production UI build passed; only the existing vendor chunk-size warning remains.
- Browser verification covered all seven tabs and the 760×900 responsive layout.

## Collection

- [Implementation Design](./implementation-design.md)
- [Browser and E2E Evidence](./browser-evidence.md)
- [Factory Enhancement Roadmap](./factory-roadmap.md)
- [Bounded Adapter Runtime](./bounded-adapter-runtime.md)
- [Automation Backend Reference](./automation-backend.md)
- [Completed Implementation Record](./completed-implementation.md)

## Canonical repository sources

- `docs/brainstorms/2026-07-30-deterministic-skill-automations.md`
- `docs/testing/evidence/deterministic-skill-automations/README.md`
- `docs/plans/2026-07-30-agentic-software-factory-enhancements.md`
- `apps/orchestration-server/src/automationAdapter.ts`
- `convex/skillAutomations.ts`
- `todos/011-complete-p1-deterministic-skill-automations.md`
