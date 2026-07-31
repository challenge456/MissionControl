---
date: 2026-07-30
topic: deterministic-skill-automations
canonical_source: docs/brainstorms/2026-07-30-deterministic-skill-automations.md
---

# Implementation Design

## What was built

The existing Automation Control Plane was extended so a published Context
Registry skill can be assessed, converted through a resumable seven-step
wizard, linked to a deterministic repository artifact, reviewed, activated,
evaluated into a governed WorkOrder, dispatched only after approval, and
independently verified through the existing receipt boundary.

## Why this architecture

Mission Control already owns canonical Context Registry packages, Automation
Definitions, WorkOrders, approval decisions, workflow runs, verification
receipts, and Automation decisions. Reusing those records keeps operator
views, governance, metrics, and audit lineage coherent. Only conversion
drafts, execution-artifact metadata, and evaluation records were added.

## Key decisions

- Skill candidates are derived from published Context Registry package versions and a deterministic eligibility evaluator. Ineligible skills remain visible.
- Candidate defer, dismiss, and restore decisions use persisted meta-loop suggestions and Automation decisions rather than a duplicate candidate table.
- Definitions gain additive source-skill, adapter, artifact, validation, review, repository, version, and correlation fields.
- Generated artifacts are previewed and validated before persistence. Existing files are link-only; no file is silently overwritten.
- All seven adapters share one strict manifest. Commands use adapter-specific allowlisted shapes and are never passed to a shell interpreter as constructed text.
- Scheduled and manual triggers create evaluation requests only. The scheduler cannot approve, dispatch, or invoke an adapter.
- WorkOrders remain the governed request and approval boundary.
- Workflow runs remain the execution record.
- Verification receipts remain logically separate from execution.
- Final success requires both a passed run and independently verified receipts.
- V1 remains LEVEL_1, read-only, approval-required, explicitly activated, automatically non-dispatching, and independently verified.

## Data relationships

```text
ContextPackage ── ContextPackageVersion
       │
       └── AutomationConversionDraft
                 │
                 ├── AutomationArtifact
                 └── AutomationDefinition
                           │
                           ├── AutomationEvaluation
                           ├── WorkOrder ── WorkflowRun
                           │                    │
                           │                    └── VerificationReceipt
                           └── AutomationDecision
```

Every material transition carries an actor, reason, policy version, entity,
previous and next state, correlation ID, causation ID, and relevant metadata.

## Extension points

| Concern | Implementation |
| --- | --- |
| Schema | `convex/schema.ts` |
| Eligibility and artifact policy | `convex/lib/skillAutomation.ts` |
| Candidate and Definition lifecycle | `convex/skillAutomations.ts` |
| Evaluation policy | `convex/automationScheduler.ts` |
| Existing Automation projections | `convex/automations.ts` |
| WorkOrder governance | `convex/workOrders.ts` |
| Registry entry | `RegistryPackageDetail.tsx` |
| Operator workflow | `apps/mission-control-ui/src/automations/` |
| Bounded runtime | `apps/orchestration-server/src/automationAdapter.ts` |
| Runtime HTTP boundary | `apps/orchestration-server/src/index.ts` |
| Unit tests | `convex/__tests__/skillAutomation.test.ts` |
| Runtime tests | `apps/orchestration-server/src/__tests__/automationAdapter.test.ts` |
| Browser Automation | `tests/automations/` |

## Safety invariants

Activation and execution reject missing validation, missing approval, mutation,
non-LEVEL_1 autonomy, unavailable artifacts, content-hash drift, missing secret
references, path traversal, unsafe commands, unsupported HTTP methods, and
invalid run lineage.

## Remaining platform question

Authenticated operator identity is the main platform-wide follow-up. Until it
is implemented, the UI and audit history disclose that operator identities are
asserted by the trusted deployment.
