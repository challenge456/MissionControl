---
date: 2026-07-28
topic: trustworthy-factory-architecture-map
---

# Trustworthy Factory Architecture Map

## What We're Building

Keep the Factory Overview diagram as a fast navigation map, while making its
language honest about what Mission Control currently measures. It must not
present inferred counts or future automation as live operational behavior.

## Why This Approach

Two alternatives were considered: fully implement the context, consolidation,
trace, evaluation, and release pipeline now; or hide the diagram. Full
implementation is a separate product initiative with persistent runtime
records, jobs, and deployment enforcement. Hiding the diagram loses useful
orientation and navigation. The smallest shippable correction is to retain the
map, show only measured records, and label the offline improvement loop as a
planned operating model.

## Key Decisions

- The diagram remains clickable and workspace-scoped where its source data is
  workspace-scoped.
- Counts show their actual backing records: context packages, knowledge nodes,
  completed runs, approval state, and recorded runs.
- Consolidation is explicitly planned until a scheduled worker and durable
  output records exist.
- The offline improvement loop is explicitly planned; quality and deployment
  views remain drill-down destinations, not proof of a release gate.

## Next Steps

Implement the wording and data-contract changes, then verify the rendered map
and a representative drill-down in the local demo.
