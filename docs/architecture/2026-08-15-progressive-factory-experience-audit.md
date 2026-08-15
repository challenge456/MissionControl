---
title: Progressive Software Factory Reference Audit
status: completed
date: 2026-08-15
baseline_commit: 78a090b576810748676336a2afe5cdc19eccc42d
runtime_contract_baseline: 21
reference: https://github.com/disler/super-simple-software-factory
---

# Progressive Software Factory Reference Audit

## Executive conclusion

Mission Control already has the stronger factory architecture. The missing V1
value is workflow accessibility and execution comprehension, not a new agent
framework, trace store, persistence model, or acceptance mechanism.

The reference project is useful for four operator-facing ideas: named workflow
recipes, explicit Human/Agent/Code phase ownership, compact run cards, and a
phase-oriented trace inspector. Mission Control should harvest those concepts
while retaining Convex persistence, canonical Attempts, immutable Factory
Versions, Verification-First policy, exact subjects and plans, GitHub lineage,
independent evidence, and `workOrders.accept` as the only WorkOrder acceptance
authority.

## Capability audit

| Reference capability         | Existing Mission Control capability                                                                                                        | UX gap                                                                                                                                 | Backend gap                                                                                                         | Recommendation                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Sessions landing page        | EOS Command Center and `workOrders.factoryOverview` already prioritize blocked work, approvals, stale evidence, and runs needing attention | The operator cannot start with a plain-language request or understand the suggested delivery shape                                     | None for V1                                                                                                         | Keep Command Center exception-first; make Factory Board the guided launch-and-observe surface                      |
| Run-card grid                | Factory Board currently shows scheduled jobs; Observability lists traces in a dense master/detail view                                     | No high-signal recent Attempt cards with recipe, human touch, cost, verification, and a compact lane                                   | Trace summaries already include status, timing, cost, tokens, intervention count, WorkOrder, and observation counts | Build cards from `observability.getWorkspaceDashboard`; show unknown data honestly                                 |
| Named ADW recipes            | Active workflows, immutable Factory Versions, Mission plan blueprints, and workflow snapshots already exist                                | Workflow IDs and Factory Versions are too technical for early selection                                                                | No new engine needed; Mission metadata can retain recommendation provenance                                         | Add a typed UI recipe catalog that resolves to active canonical workflows                                          |
| Rule-based workflow choice   | Mission creation and plan authoring exist                                                                                                  | Creation is a minimal title/objective dialog with no workflow recommendation                                                           | Mission metadata is already extensible                                                                              | Add deterministic recommendation and persist recommendation, rationale, selection, and override                    |
| Engineer/agent/code lanes    | Run events, trace observations, actor types, model/tool metadata, and human-intervention counts exist                                      | Current tree/timeline groups by observation hierarchy, not attention type                                                              | Observation types are sufficient for a derived V1 projection; explicit canonical phase kind can wait                | Derive and label Human, Agent, and Code lanes in presentation only                                                 |
| Phase waterfall and tree     | Observability & Evals already provides tree and timeline tabs                                                                              | Timeline is observation-centric and does not surface recipe or operator attention at a glance                                          | None for V1                                                                                                         | Reuse `getTraceDetail`; add a recipe-aware lane view on Factory Board and retain full trace view                   |
| Phase detail                 | Observation inspector exposes input, output, metadata, model, provider, tokens, cost, evidence count, errors, and evals                    | Prompt identity, typed handoff, gates, artifacts, harness, tools, and write scope are not organized into a readable execution contract | Some fields exist only when an adapter records them                                                                 | Add a structured inspector that renders available fields and explicitly marks unavailable sections                 |
| Typed envelopes              | Mission handoffs, run artifacts, evidence envelopes, plan blueprints, verification receipts, and structured workflow schemas exist         | Equivalent artifacts are spread across surfaces                                                                                        | Canonical generic `ScoutResult`/`BuildResult` envelopes are not uniformly modeled                                   | Reuse existing records in V1; audit canonical typed handoffs as P1 rather than add redundant tables                |
| Gates as first-class objects | Implementation policy commands, workflow Gate steps, QC rulesets, eval definitions, Verification Plans, and receipts exist                 | Operators cannot discover all deterministic checks as one registry                                                                     | A unified deterministic Gate Registry is partial, not absent capability                                             | Present recipe gate intent in V1; design a canonical registry only after contract audit in P1                      |
| Bounded repair loops         | Attempt retry budgets, corrective-iteration limits, workflow convergence, recovery policy, and immutable run lineage exist                 | Retry rationale and loop shape are hard to see                                                                                         | Existing semantics cover bounds; correction placement needs governance review                                       | Visualize retries from trace metadata now; standardize reusable loop patterns in P1                                |
| Model roster                 | Model-routing policies and decisions, model catalog, evals, cost, latency, provider, and data classification already exist                 | Current Model Routing is power-user oriented and disconnected from recipe intent                                                       | Intent-to-policy mapping exists conceptually but is not a recipe field                                              | Add `economy`, `balanced`, and `high confidence` intent in recipe metadata; canonical router remains authoritative |
| Live SQLite trace            | Convex traces and observations are OTel-compatible, workspace-scoped, and linked to Attempts, Factory Versions, evidence, and evals        | Factory Board does not reuse that live data                                                                                            | None                                                                                                                | Never add another trace store; query current Observability data                                                    |
| Agent-operable skill         | Convex service-command boundaries, workflow dispatch, WorkOrder APIs, CLI/context tools, and capability-scoped identities exist            | Operator workflows are distributed and not summarized as one safe agent contract                                                       | Agent acceptance and merge are already forbidden by authority design                                                | Document allowed agent operations and keep accept/approve/merge human or policy authorized                         |

## Surface-by-surface assessment

### Command Center

Live, exception-first, and aligned with the North Star. It should remain the
cross-factory attention view. Do not turn it into an agent activity feed.

### Factory Board

The largest P0 UX gap. The current route is a scheduled-job inventory and does
not explain Missions, recipes, Attempts, or verification. Replace its content,
not its navigation identity.

### Work Orders and Tasks

Work Orders already expose governed state, risk, approvals, exact verification,
linked runs, and acceptance. Tasks remain bounded operational units under
WorkOrders. Recipes must compile into these records rather than create recipe
runs.

### Run Inspector and Observability & Evals

The data path is already suitable: Attempts remain authoritative; traces
explain execution; evals measure quality; verification evidence decides
eligibility. The existing tree, timeline, input/output, cost, tokens, errors,
and eval scores should be reused. The gap is progressive presentation and
phase-contract organization.

### Model Routing

Mission Control already records provider/model decisions and supports policies,
capabilities, observed outcomes, and cost. Recipes should express intent, not
hard-code providers or upstream benchmark claims.

### Factory configuration

`factoryDefinitions`, immutable `factoryDefinitionVersions`, readiness
assessments, policy envelopes, executor snapshots, agent bindings, budgets,
verifiers, and activation already exist. Basic and Intermediate should link to
or summarize them; Advanced preserves the full editor.

### Mission creation and Plan compilation

Creation currently captures title, objective, and stop condition. The detailed
Mission editor adds repository scope, ownership, constraints, sources, budget,
and corrective limits. Mission Plans already materialize ordered, governed
WorkOrders after human approval. V1 should store recipe provenance on the
Mission and use it to select the initial active workflow for a new Plan.

### Attempt lifecycle

Attempts already support immutable run identity, leases, retries, pause/cancel,
failure reason, recovery, evidence, and verification lineage. A presentation
mode must never mutate this lifecycle.

### Cost, tokens, prompt, configuration, and context

Trace and observation records support duration, token usage, estimated cost,
model/provider, prompt version, input, output, and metadata. Agent Registry,
Factory Versions, Context Packages, Memory, and model routing hold the broader
configuration. The V1 inspector should assemble available facts without
pretending missing adapter telemetry exists.

## Upstream concepts adopted

- Workflow recipes as an operator vocabulary.
- Human/Agent/Code as an immediate cost-and-attention explanation.
- Compact run cards with a small execution lane.
- Expandable phase details organized around input, configuration, execution,
  output, and gates.
- Deterministic rules for cheap workflow recommendation.
- The principle that agents exercise judgment while code performs known work.

## Upstream concepts rejected

- Python-owned orchestration graph and retry semantics.
- SQLite persistence or a second trace store.
- Running against `main` and local-only isolation assumptions.
- Agent-owned acceptance or review-as-authority.
- Pi-specific coupling, model roster, benchmark claims, and prices.
- Skill stamping/installation as Mission Control configuration.
- Single-repository runtime assumptions and provider-key conventions.

## P0 / P1 / P2

### P0 — usability leverage

- Experience level selector with non-mutating local preference.
- Recipe catalog and deterministic recommendation.
- Recipe provenance persisted on Mission metadata.
- Recipe-to-active-workflow projection in new Plan drafts.
- Recent canonical trace cards with truthful time/cost/token/human-touch data.
- Human/Agent/Code lane and phase inspector using existing observations.

### P1 — workflow quality

- Canonical typed handoff gap analysis and targeted artifact adapters.
- Discoverable deterministic Gate Registry over existing commands, workflow
  gates, QC rules, evals, and verification adapters.
- Standard bounded repair/review patterns with explicit lineage.
- Explain Run packet assembled deterministically from structured telemetry.
- Complete role configuration view for Context/Model/Prompt/Tools/Harness.

### P2 — optimization

- Model-stack portfolio visualization based on local catalog/evals.
- Cost per accepted WorkOrder and retry cost by recipe/model.
- Recommendation tuning from comparable accepted-work telemetry.
- Reusable recipe/Factory templates across repositories.

## Runtime decision

Runtime contract baseline is `21`. The V1 is additive UI composition plus
Mission metadata already allowed by the current contract. It does not add or
change a Convex schema field, function signature, workflow execution primitive,
or acceptance API. No runtime-contract bump is expected; the extractor/guard
must confirm that before the PR is opened.
