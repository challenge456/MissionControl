# Factory Learning architecture-gap analysis

Date: 2026-08-16
Baseline: `origin/main` at `e32444a2aecb67bfcb050cd4a92d11d8de650db8`
Runtime contract baseline: `25`

The baseline includes merged Remote Sandbox N=1 reconciliation. Factory
Learning adds no executor, lease, fencing, sandbox, receipt, or publication
path, so no additional reconciliation is required.

## External reference boundary

[Blume](https://blume.codes/) demonstrates a useful product loop: observe
repeated steering, show the exact evidence and proposed change, then let a
human preview, dismiss, or apply it. Mission Control adopts that loop shape,
not Blume's UI, local storage model, product architecture, or implementation.

## Institutional learning

`docs/solutions/` contains one relevant record:
`build-errors/missing-convex-schema-contracts-ci-20260730.md`. Its applicable
lesson is that a Convex consumer, table, indexes, generated types, and tests
must ship as one atomic schema contract. No `critical-patterns.md` exists in
the current repository.

## Capability map

| Desired learning capability | Existing MC primitive | Gap | Recommendation |
| --- | --- | --- | --- |
| Attempt lineage | `workflowRuns`, WorkOrders, run events | None | Keep `workflowRuns` authoritative; reference IDs only. |
| Traces and observations | `traces`, `traceObservations`, observability persistence | No learning projection | Extract bounded, redacted signal references; never copy trace payloads wholesale. |
| Evals and scores | `evalDefinitions`, `evalScores`, datasets | No candidate linkage | Link candidates to canonical experiments and evaluators. |
| Before/after experiments | `experiments`, `experimentVariants`, deterministic comparison | No improvement-candidate workflow | Reuse these tables; add candidate link and recommendation projection only. |
| Verification failures | `verificationRuns`, `verificationReceipts`, evidence envelopes | No normalized recurring signature | Create deterministic signals keyed by method/check/error identity. |
| Quality gate decisions | `qualityGateDecisions` | No learning extraction | Project INELIGIBLE/WAIVER findings into advisory signals. |
| WorkOrder retries | `workflowRuns`, `runEvents`, attempt retry lineage | No aggregate learning view | Extract retry/recovery signals without changing retry policy. |
| Worker recovery | attempt lease/runtime disposition and recovery events | No recurring-pattern view | Cluster by recovery disposition and executor adapter. |
| Model routing | `modelRoutingPolicies`, `modelRoutingDecisions` | No outcome feedback join | Join decision lineage to failure/retry clusters; proposals remain advisory. |
| Recipe selection | Factory experience metadata and recipe catalog | UI catalog is not a stored authority | Read recipe metadata from traces/runs; propose changes without mutating recipes. |
| Context Packages | `factoryContextPackages`, context registry, Factory Memory | No recurring context-miss projection | Extract misses/overload when explicit evidence exists; never infer missing facts. |
| Human decisions | approval decisions, reviews, activities | Rejection/correction categories are not normalized | Add deterministic human-correction/intervention signals with retained reason refs. |
| Improvement proposals | `metaLoopSuggestions` and governed WorkOrder creation | Candidate fields are unstructured | Extend the existing proposal model; do not add a second candidate store. |
| Automated opportunities | repetitive-task detector, automation control plane | Does not measure repeated agent use for deterministic work | Detect tool/command patterns and create `REPLACE_AGENT_WITH_CODE` candidates. |
| Factory Memory | provenance-backed advisory documents/chunks/graph | Not connected to learning signals | Link source IDs and expose context-related candidates; keep memory advisory. |
| Agent/skill/rule inventory | context registry, `mc-context scan`, skill linter | Scan covers only SKILL.md and lacks precedence/drift | Add bounded agent-config inventory and deterministic drift findings. |
| Canonical Agent Intent | No canonical definition | Premature without drift data | Document a future projection architecture; implement preview-only normalization in V1. |
| Experience levels | Basic/Intermediate/Advanced Factory state | Improvement UI not integrated | Add Factory tabs and progressively reveal lineage/diagnostics. |

## Authority findings

The following remain authoritative and are not replaced or loosened:

- Mission → WorkOrder → Task → Attempt hierarchy;
- Factory Definitions and immutable Versions;
- worker leases, fencing, recovery, and publication lineage;
- Verification Subjects, Plans, Results, evidence envelopes, and independence;
- Quality Contracts and exact-current acceptance eligibility;
- GitHub App publication and `workOrders.accept`;
- Factory Memory's advisory-only contract;
- canonical Observability/Evals datasets, scores, and experiments;
- Model Routing policies and decisions.

Learning projections cannot satisfy acceptance, manufacture evidence, establish
independence, mutate historical Attempts, change a Factory Version, edit
governance, dispatch agents, publish code, merge a PR, or accept a WorkOrder.

## V1 gaps to close

1. Structured, repository-scoped Learning Signal projection with idempotency.
2. Incremental deterministic clustering with thresholds and evidence caps.
3. Structured candidate fields on the existing meta-loop proposal.
4. Human-approved linkage to canonical two-variant experiments.
5. Read-only configuration inventory, precedence, overlap, and drift findings.
6. Factory UI that prioritizes actionable evidence and respects experience
   levels.

## Explicitly deferred

- semantic clustering or LLM analysis of every trace;
- autonomous prompt, rule, skill, recipe, routing, or policy mutation;
- statistical significance claims;
- a mandatory canonical Agent Intent DSL;
- automatic experiment execution or promotion;
- automatic repository edits or PR merge.
