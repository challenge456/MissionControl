# Automation Backend Reference

Canonical source: `convex/skillAutomations.ts`

## Responsibility

The Convex module owns deterministic skill candidate assessment, persisted
candidate decisions, resumable conversion drafts, artifact preview and
validation, Definition creation and lifecycle, execution-manifest issuance,
execution result recording, and final independent verification.

It extends existing Automation, WorkOrder, workflow-run, receipt, and audit
records instead of creating a parallel control plane.

## Candidate operations

### `listCandidates`

Loads active Context Registry skills and their current published versions,
evaluates deterministic eligibility, and joins persisted disposition,
conversion draft, and Definition state.

### `getAssessment`

Returns the complete skill candidate record and eligibility findings for a
specific package within the selected workspace.

### `decideCandidate`

Persists `DEFER`, `DISMISS`, or `RESTORE`, requires a reason, updates the
meta-loop suggestion, and writes a correlated Automation decision.

## Conversion operations

### `startDraft`

Requires an eligible candidate. Creates or resumes a seven-step draft with
source version, recommended adapter, repository defaults, LEVEL_1 governance,
and a new correlation ID.

### `updateDraft`

Persists the current step, selected adapter, and operator configuration while
the draft remains in progress.

### `previewArtifact`

Generates deterministic content or uses edited content, persists the preview
and structured diff, and records `ARTIFACT_GENERATED`.

### `validateDraft`

Checks adapter configuration, path, cron, commands, secret references,
repository scope, duplicate paths, mutation policy, approval, automatic
dispatch, independent receipts, content syntax, and unsafe interpolation.

### `createDefinition`

Requires a passing draft and a reason. Persists an immutable artifact and
disabled Definition, completes the draft, accepts the source candidate, and
records the correlated creation decision. Creation never activates the Definition.

## Definition lifecycle

| Operation | Server-enforced rule |
| --- | --- |
| `updateDefinition` | Only non-approved draft or rejected Definitions; resets validation |
| `validateDefinition` | Artifact, LEVEL_1, read-only, approval, independent verification, evidence, runtime |
| `submitForReview` | Validation must pass |
| `approve` | Definition must be ready for review; approval remains separate from activation |
| `transitionDefinition` | Reason-gated state machine for pause, resume, suspend, disable, and archive |
| `cloneDefinition` | Creates a disabled draft clone or next version without copying approval/run state |

Activation and manual evaluation remain in the existing canonical Automation
modules. Activation requires passed validation and explicit approval.

## Lifecycle states

```text
DISABLED + DRAFT
  → READY_FOR_REVIEW
  → APPROVED
  → ACTIVE
  ↔ PAUSED
  → SUSPENDED
  → DISABLED
  → ARCHIVED
```

Clone and new-version operations always return to disabled draft state.

## Execution boundary

### `getExecutionManifest`

Returns a manifest only when all conditions pass:

- WorkOrder exists and contains an Automation Definition ID.
- Definition is active, approved, and validated.
- Definition is LEVEL_1 and non-mutating.
- WorkOrder has a dispatch-created pending/running run, or a completed run for verification.
- Approved artifact exists and passed validation.
- Repository, working directory, path, content, and content hash are pinned.

The query also returns Definition, evaluation, WorkOrder, workflow run,
acceptance criteria, required permissions, secret references, correlation, and
runtime-limit lineage.

### `recordExecutionResult`

Validates WorkOrder/run lineage, updates the evaluation and Definition health,
keeps passing execution in `AWAITING_VERIFICATION`, and records either
`EXECUTION_COMPLETED` or `EXECUTION_FAILED` with normalized result metadata.

Execution success is never treated as final verification.

### `finalizeVerification`

Requires a completed run belonging to the WorkOrder. Updates evaluation and
Definition posture to `VERIFIED`, `REJECTED`, or `AWAITING_VERIFICATION`, then
records the final correlated decision. The orchestration verifier creates
receipts and accepts the WorkOrder separately before finalization.

## Audited decisions

Candidate review, deferral, dismissal, restore, conversion start, artifact
generation and validation, Definition creation/update/validation/review/
approval/lifecycle/versioning, evaluation, execution, receipt creation, and
final verification are represented in `automationDecisions`.

Each decision can include:

- actor and identity source;
- timestamp and policy version;
- Definition and candidate IDs;
- Definition version;
- previous and next state;
- entity type and entity ID;
- correlation and causation IDs;
- operation-specific metadata.

## Related backend modules

- `convex/lib/skillAutomation.ts` — eligibility, adapter recommendation, validation, generation, and receipt-decision policy.
- `convex/automationScheduler.ts` — manual and scheduled idempotent evaluations.
- `convex/automations.ts` — control-plane projections, activation, metrics, and schedules.
- `convex/workOrders.ts` — approval, dispatch, run synchronization, receipts, and acceptance.
- `apps/orchestration-server/src/index.ts` — separated execution and verifier HTTP boundaries.
