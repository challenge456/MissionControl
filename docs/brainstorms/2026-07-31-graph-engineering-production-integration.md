---
date: 2026-07-31
topic: graph-engineering-production-integration
---

# Graph Engineering Production Integration

## What We're Building

Make Mission Control's existing multi-agent workflow graph a complete operator
flow. An operator starts a bounded Loop Engineering cycle, reviews the generated
WorkOrder, explicitly dispatches its dependency graph, watches fan-out/fan-in
node progress and evidence, and retains the existing approval gate before any
implementation work is authorized.

## Why This Approach

The repository already contains the hard graph primitives: DAG validation,
parallel scheduling, specialized research and verification nodes, retries,
failure containment, structured outputs, and evidence-bound gates. The missing
work is production integration, not another orchestration subsystem.

Keeping dispatch explicit preserves the WorkOrder as the operator's control
boundary. Pinning the workflow definition to each run makes long-running graphs
deterministic even when the installed workflow is later updated.

## Key Decisions

- Preserve the existing `Start cycle -> review WorkOrder -> Dispatch graph`
  sequence; cycle creation does not silently execute agents.
- Promote the existing Loop Engineering surface as **Graph Engineering** in the
  live EOS navigation.
- Put graph status, exceptions, evidence progress, and run inspection on the
  cycle itself instead of adding another disconnected dashboard.
- Snapshot the complete workflow definition and version at dispatch time.
- Start the workflow executor as part of the standard demo runtime so queued
  graph runs do not remain inert.
- Keep explicit evidence-linked human approval as the terminal graph gate.
- Reuse the existing Task lifecycle for node execution and recovery.

## Deliberate V1 Boundaries

- Graph outputs remain operator-reviewed evidence; they do not automatically
  rewrite the Loop Engineering evidence ledger.
- Model routing continues through the existing deterministic WorkOrder routing
  policy. Per-node learned routing is deferred until node-level quality receipts
  are available.
- The graph runtime does not become a general-purpose autonomous agent platform.
  V1 is the governed research, verification, synthesis, and approval workflow.

## Next Steps

Implement version-pinned runs, the cycle dispatch/status card, live navigation,
executor startup, focused tests, and browser evidence in the demo workspace.
