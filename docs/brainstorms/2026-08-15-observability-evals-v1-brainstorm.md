---
date: 2026-08-15
topic: observability-evals-v1
status: accepted
source: /Users/jaywest/.codex/attachments/b3733632-a89d-4eb6-8bb7-c87eb122cce8/pasted-text.txt
---

# Observability, Traces & Evals V1

## What We're Building

Mission Control will gain a first-class, workspace-scoped execution trace model
for governed Factory Attempts. Each trace owns a nested observation tree and is
linked to the existing WorkOrder, workflow run (Attempt), Factory version,
verification records, evidence, and immutable eval scores.

The first operator surface remains inside the existing Execution Inspector. It
will expose trace filtering and aggregate metrics, a hierarchical trace tree, a
timeline for parallel work, observation details, eval results, and trace-to-
dataset promotion without introducing another primary navigation domain.

## Why This Approach

Three approaches were considered:

1. Project the existing `runEvents` stream into a prettier viewer. This is the
   smallest change, but cannot represent nested model/tool calls, evaluator
   executions, per-observation usage, or durable external trace identity.
2. Adopt a Langfuse SDK and data model directly. This accelerates export but
   gives an integration vendor authority over Mission Control's core lineage.
3. Add a canonical Mission Control model and dual-write from governed executor
   boundaries. This preserves existing audit events, keeps verification and
   evals distinct, and supports later OpenTelemetry/Langfuse exporters.

Approach 3 is selected.

## Key Decisions

- `workflowRuns` remains the authoritative Attempt model; traces reference it
  rather than creating a competing Attempt lifecycle.
- `runEvents` remains the immutable governance/audit stream; trace observations
  explain execution structure and performance.
- Verification evidence and eval scores use separate tables and UI sections.
- Trace inputs, outputs, arguments, and errors pass through a bounded recursive
  redactor before persistence.
- Eval definitions are versioned records. Updating a rubric creates a new
  version; historical scores are never overwritten.
- The first deterministic evaluator measures execution duration against a
  threshold. A fixture LLM-judge adapter validates rubric/result contracts in
  CI without a network model call.
- Datasets store sanitized, reproducible trace context and source lineage.
- Experiments compare fixed variants over fixed dataset versions; V1 computes
  transparent fixture aggregates and does not auto-promote Factory versions.
- Loom has no runtime adapter in this repository. V1 provides the same typed
  instrumentation boundary for `codex` and `loom`, proves Loom with the
  deterministic golden fixture, and wires the live Codex Factory reporter.

## Deferred

- External exporters, semantic failure clustering, natural-language analysis,
  trace comparison, sessions, online sampling, evaluator calibration, and
  automated regression gates.
- Any new primary navigation item.

## Success Criteria

The deterministic golden path proves that an Attempt creates a trace, nested
observations preserve hierarchy, tool/model/verification metadata is captured,
eval scores stay separate from evidence, a trace can become a dataset case, an
experiment compares two variants, and analytics aggregate multiple traces.
