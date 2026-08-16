# Factory Learning & Continuous Improvement architecture

Date: 2026-08-16

## Purpose

Factory Learning is a bounded advisory projection over governed execution. It
helps an operator recognize recurring, evidenced waste or failure and test a
specific improvement without granting the learning subsystem authority over
execution, verification, governance, publication, or acceptance.

```text
Attempts / Verification / Traces / Human decisions / Configuration scans
  -> immutable Learning Signals
  -> deterministic repository-scoped clusters
  -> existing meta-loop Improvement Candidates
  -> human-approved canonical Evals experiment
  -> before/after comparison
  -> human promotion to a submitted Mission Plan, rejection, or rollback
  -> separate human Plan approval releases governed WorkOrders
```

## Data ownership

### Learning Signals

`learningSignals` is a rebuildable projection, not a source of truth. Each row
contains workspace/repository scope, optional WorkOrder/Attempt/trace/eval
lineage, a bounded reason, evidence references, severity, confidence, affected
Factory/recipe/role/model metadata, an idempotency key, and
`acceptanceAuthority: false`.

Signal types are intentionally finite:

- `HUMAN_CORRECTION`, `REPEATED_INSTRUCTION`, `HUMAN_INTERVENTION`,
  `REPEATED_REVIEW_FINDING`;
- `VERIFICATION_FAILURE`, `DETERMINISTIC_GATE_FAILURE`, `RETRY_REQUIRED`,
  `RECOVERY_REQUIRED`;
- `CONTEXT_MISS`, `CONTEXT_OVERLOAD`;
- `MODEL_ROUTING_MISMATCH`, `TOOL_SELECTION_MISMATCH`, `RECIPE_MISMATCH`,
  `PROMPT_AMBIGUITY`, `AGENT_CONFIG_DRIFT`, `UNNECESSARY_AGENT_USAGE`,
  `TOKEN_WASTE`.

V1 extractors emit only signals supported by explicit deterministic evidence.
Absence of data is not converted into a negative finding.

### Clusters

`learningSignalClusters` is an incremental aggregate keyed by:

```text
projectId + repositoryKey + signalType + normalized deterministic identity
```

The identity is a failed gate/check ID, normalized error signature, explicit
human-decision category, recipe+phase, context source, tool, or model route.
Clusters have a bounded time window, minimum occurrence threshold, evidence
cap, status, and optional candidate linkage. A signal ID may contribute once.

Semantic clustering is disabled in V1. The model/token budget is therefore
zero. A future semantic pass must be batch-only, budgeted, and unable to merge
across workspace or repository scope.

### Improvement Candidates

The existing `metaLoopSuggestions` table remains the candidate store. Additive
fields describe candidate type, cluster, problem, proposed change, expected
benefit, risk, effort, observed cost/token impact, experiment, and explicit
non-authority. Existing status maps to the V1 lifecycle:

| Existing status | Learning meaning |
| --- | --- |
| `OPEN` | Awaiting operator review |
| `ACCEPTED` | Approved for experiment |
| `WORK_ORDERED` | Governed implementation WorkOrder created |
| `IMPLEMENTED` | WorkOrder accepted; change exists |
| `VERIFIED` / `EFFECTIVE` | Measured outcome retained |
| `DISMISSED` / `REJECTED` / `SNOOZED` | No active action |
| `ROLLED_BACK` / `RETIRED` | Change withdrawn or no longer relevant |

No automatic promotion exists.

The V1 candidate classes are intentionally bounded to:

- `ADD_DETERMINISTIC_GATE`, `MODIFY_GATE`, `UPDATE_PROMPT`,
  `UPDATE_AGENT_RULE`, `ADD_OR_UPDATE_SKILL`, `UPDATE_CONTEXT_POLICY`;
- `CHANGE_RECIPE`, `CHANGE_RETRY_POLICY`, `CHANGE_MODEL_ROUTING`,
  `CHANGE_TOOL_CONFIG`, `REPLACE_AGENT_WITH_CODE`, and
  `ADD_DOCUMENTATION`.

Promotion creates and submits a canonical Mission Plan containing one bounded
implementation WorkOrder blueprint. It does not release that WorkOrder. A
separate operator must use ordinary Mission Plan approval, which atomically
releases the WorkOrder without starting execution. This preserves the existing
rule that a submitted plan cannot be approved by its author.

### Experiments

Experiments reuse `evalDatasets`, `evalDefinitions`, `experiments`, and
`experimentVariants`. Approval freezes:

- dataset ID and current dataset version;
- evaluator definition IDs and versions;
- baseline configuration;
- candidate configuration;
- optional Factory Definition Version/model/executor references.

Comparison reports only observed sample count, success, verification score,
duration, cost, and other metrics actually present. Fewer than 30 samples is
labelled low-sample; no significance claim is made.

### Agent Configuration Registry

The local scanner identifies tracked repository configuration files, computes
SHA-256 digests, determines harness and directory scope, records precedence,
and obtains the last changed commit. It extracts bounded deterministic intent
for verification commands and other explicit MUST/NEVER directives.

The synchronized read model stores metadata and normalized directives, not an
opaque new DSL and not unbounded file contents. Drift findings retain both
source paths and exact bounded directive excerpts. The UI is read-only.

Potential future architecture:

```text
Canonical Agent Intent (optional, human-owned)
  -> preview projection to AGENTS.md
  -> preview projection to CLAUDE.md
  -> preview projection to Cursor rules
  -> preview projection to Codex/Claude skills
```

V1 stops at inventory, normalization, and projection preview. It never writes
those files.

## Processing contract

- Manual refresh is always available to an authorized operator.
- Scheduled processing is opt-in through the existing Factory workflow
  scheduler and hourly scan cron.
- Each refresh scans bounded recent rows, inserts idempotently, aggregates
  incrementally, and caps cluster evidence.
- No LLM is called in V1; token and semantic-analysis budgets are both zero.
- Existing observability redaction and bounded-text rules apply.

## UI contract

Factory remains the navigation home. Tabs expose:

- `Overview`: existing mission, recipe, run, and evidence surface;
- `Improvements`: high-confidence candidates and required decisions;
- `Signals`: deterministic evidence and clusters;
- `Experiments`: linked baseline/candidate comparisons;
- `Agent Setup`: read-only configuration inventory and drift.

Basic mode shows actionable high-confidence candidates, plain evidence counts,
risk, and one Review action. Intermediate adds cluster frequency, recipe/model
context, and experiment design. Advanced adds source IDs, trace/eval lineage,
config digests, normalized directives, and full promotion history.

All modes must provide loading, empty, error, success, disabled, and recovery
states. Presentation level never changes authority.

## Failure and rollback

- Failed extraction leaves source records untouched and records no partial
  authority.
- Duplicate evidence is ignored through idempotency and cluster membership.
- Cross-scope references are rejected.
- Removing the UI leaves advisory data inert.
- Rolling back additive schema/functions requires no source-data restoration;
  projections may be retained or rebuilt.
- Any evidence of acceptance, verification, routing, Factory Version, or
  repository mutation from the learning subsystem is a release blocker.
