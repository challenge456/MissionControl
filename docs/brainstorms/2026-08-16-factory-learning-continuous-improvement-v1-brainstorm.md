---
date: 2026-08-16
topic: factory-learning-continuous-improvement-v1
---

# Factory Learning & Continuous Improvement V1

## What We're Building

Add a governed learning loop to the existing Software Factory. Deterministic
evidence from Attempts, verification, quality gates, approvals, traces, and
configuration scans becomes immutable advisory Learning Signals. Repeated
signals aggregate into repository-scoped clusters and then into structured
improvement proposals in the existing meta-loop inbox.

An operator reviews the evidence, may approve a two-variant experiment in the
canonical Observability/Evals system, and may later create a governed WorkOrder
for implementation. The learning system never edits repository configuration,
changes routing, publishes code, creates verification truth, or accepts work.

V1 also expands the current skill-only repository scan into a bounded,
read-only Agent Configuration Registry covering common harness instructions,
skills, hooks, permissions, and ignore files. It reports deterministic overlap
and contradiction findings; it does not introduce or require a canonical DSL.

## Why This Approach

The repository already contains canonical Attempts, traces, eval datasets and
experiments, verification evidence, WorkOrder governance, Factory Memory,
model-routing decisions, context packages, and `metaLoopSuggestions`. Creating
parallel experiment, proposal, or governance frameworks would fragment
authority. The narrow missing seam is a structured signal/cluster projection.

Blume is used only as a product reference for detecting repeated steering and
showing evidence plus a proposed change before an operator acts. Mission
Control keeps its own authoritative hierarchy, storage, governance, and UI.

## Key Decisions

- Add only `learningSignals`, `learningSignalClusters`, and an agent-config
  projection; reuse `metaLoopSuggestions`, `experiments`, and
  `experimentVariants`.
- Require `projectId + repositoryKey` on every signal and cluster identity.
- Start with deterministic extraction and clustering. Semantic clustering is
  a documented future option and has a V1 model budget of zero.
- Treat signal, cluster, candidate, score, and experiment data as
  `acceptanceAuthority: false`.
- Make experiment approval explicit and require a frozen existing dataset,
  enabled evaluators, baseline configuration, and candidate configuration.
- Require a governed WorkOrder for every repository or configuration change.
- Add Factory tabs instead of a new top-level product domain.
- Keep Basic calm and actionable; reveal lineage and raw diagnostics only at
  Intermediate and Advanced levels.

## Open Questions

No implementation-blocking product questions remain. P1 must decide whether a
canonical Agent Intent definition is valuable after read-only drift evidence
exists; V1 must not force that migration.

## Next Steps

Proceed with the repository-grounded implementation plan in
`docs/plans/2026-08-16-feat-factory-learning-continuous-improvement-v1-plan.md`.
