---
title: Spec-Driven Mission Intake V1 Architecture Audit
status: proposed
date: 2026-08-16
baseline_commit: 6800ab39b09691c3b64b3f621d6d00be293e87c9
baseline_pr: 112
runtime_contract_baseline: 26
reference: https://github.com/github/spec-kit
---

# Spec-Driven Mission Intake V1 Architecture Audit

## Executive conclusion

Mission Control already owns the governed execution half of spec-driven
delivery. Its approved Mission Plan, Quality Contract projection, WorkOrder
materialization, Factory Versions, verification receipts, acceptance gates,
Factory Memory, Factory Learning, and generic harness contract are stronger
than the execution model in GitHub Spec Kit and must remain authoritative.

The missing V1 capability is a durable, inspectable intent contract before the
Plan: versioned project principles, immutable Mission Spec revisions, bounded
clarification, and deterministic spec-to-Plan consistency checks. This should
be added as Mission intake, not installed as a second orchestrator, task store,
template engine, planning authority, or acceptance path.

The required authority chain is:

```text
Project Constitution revision
  -> immutable Mission Spec revision
  -> deterministic Spec Quality evaluation
  -> exact Mission Plan revision
  -> human Plan approval
  -> immutable Quality Contract projection
  -> existing WorkOrders / Attempts / evidence / verification / acceptance
```

The approved Plan remains the only release of execution authority. The Mission
Spec explains intent and derivation; it never dispatches work, accepts a result,
publishes a candidate, or merges code.

## Phase 0 capability map

| Spec Kit concept | Existing MC primitive | Gap | Recommendation |
| --- | --- | --- | --- |
| Constitution | `governancePolicies`, `policyEnvelopes`, project policy defaults, immutable Factory Definition Versions | Existing policy records govern execution validity but do not preserve an authored, versioned project intent constitution or its planning rules | Add immutable per-project Constitution revisions linked to the existing active governance policy and optional policy envelope. Treat the Constitution as a planning source, not a second runtime policy evaluator |
| Specify | Mutable DRAFT Mission fields: objective, context, constraints, sources, ownership, repository/code scope, guardrails | No immutable attributable requirements/specification revision, persona/stories, measurable outcomes, non-goals, edge cases, or acceptance-criterion lineage | Add immutable Mission Spec revisions beneath the Mission. Keep the Mission as the stable aggregate and current-revision pointer |
| User stories and scenarios | Mission objective/context plus Plan assertions | Assertions are written late and do not retain actor/value/story/Given-When-Then intent | Add prioritized stories and scenarios to the Spec, then require Plan assertions and WorkOrder criteria to reference stable Spec IDs |
| Clarify | DRAFT Mission edits, free-form constraints/source references, Plan review/rejection | No bounded, explicit clarification record or deterministic list of unresolved ambiguities | Generate bounded deterministic clarification findings from the Spec. Answers create a new immutable Spec revision; no conversational agent or new chat store is required in V1 |
| Spec quality gate | Plan validation, WorkOrder specification validation, Quality Gate decisions | Current checks begin at Plan/WorkOrder execution contracts; there is no pre-Plan completeness, ambiguity, or constitution-alignment gate | Add a pure deterministic evaluator with immutable findings tied to exact Spec and Constitution revisions. Blocking findings stop Plan submission only |
| Analyze consistency | `validateMissionPlan`, Quality Contract compiler, WorkOrder contract compiler | No exact Spec-to-Plan coverage, contradiction, non-goal, or stale-lineage analysis | Add deterministic cross-artifact checks to Plan submission and repeat them defensively during approval |
| Plan | `missionPlans` with immutable submitted/approved revisions, assertions, blueprints, approval attribution, and digest | Plans do not bind an exact Spec or Constitution revision | Persist exact Spec revision/evaluation/Constitution IDs and digests on every Plan draft; never silently rebind them |
| Tasks | Plan `workOrderBlueprints`, materialized WorkOrders, Tasks, and Attempts | Importing Spec Kit tasks would create a competing task store | Compile only through existing Plan blueprints and existing WorkOrder/Task materialization |
| Checklist | Plan assertions; structured WorkOrder requirements, acceptance criteria, verification checks, evidence requirements | No versioned project/recipe requirements-quality checklist before Plan; a checked box can be mistaken for delivery evidence | Represent requirements-quality checks in Constitution/recipe inputs and Spec evaluations. Project only evidence-bearing items into existing Quality Contract and verification semantics; never treat checklist completion as proof |
| Templates and presets | Progressive Factory recipe catalog resolving to canonical workflows and Factory Versions | Recipes currently seed Plan shape but do not seed typed Spec sections/checks | Extend existing recipe metadata with Spec defaults/check references. Do not add an installer, template runtime, or second plugin system |
| Quality Contract | Pure `compileApprovedPlanQualityContract` projection tied to exact Plan revision | Projection has no Spec/Constitution lineage and cannot explain which approved requirement produced an assertion or WorkOrder | Extend the projection source and requirement mappings while keeping the approved Plan as its sole mutable source aggregate |
| Definition of Done | Mission stop condition, Plan assertions, WorkOrder acceptance criteria, verification contract, handoffs, Mission acceptance | Intent-level completion language is not normalized before Plan; implementation acceptance is already well governed | Capture measurable outcomes and acceptance expectations in the Spec, then map them through Plan assertions into existing WorkOrder verification and acceptance |
| Factory Memory | Advisory retrieval and frozen Attempt Context Packages with provenance | Specs and constitutions are not first-class retrievable sources | Index immutable revision content and digests as advisory memory sources. Never use retrieval output as acceptance authority or silently replace exact Plan lineage |
| Factory Learning | Advisory deterministic signals/clusters/candidates with `acceptanceAuthority: false` | No explicit correlation between recurring spec defects and later retries/review failures | Add spec-quality lineage to advisory signals and only suggest template/clarification improvements after repeated evidence; no automatic mutation |
| Harness compatibility | Generic five-stage executor contract with explicit zero authority | A new spec tool could accidentally gain dispatch, verification, publication, or acceptance capabilities | Expose scoped read-only spec context to harnesses; keep spec writes in authenticated control-plane mutations and add negative authority tests |
| Progressive disclosure | Existing Basic/Intermediate/Advanced experience selector and Mission detail tabs | Mission intake has no integrated specification workspace | Add one Specification tab inside Mission detail and reuse the existing experience level preference. Do not add top-level navigation |

## Existing Mission and Plan lifecycle

### Mission draft

`convex/schema.ts` and `convex/missions.ts` already make the Mission the stable
outcome aggregate. `createDraft` and `updateDraft` capture objective, context,
constraints, source references, ownership, repository/code scope, budgets,
concurrency, and stop condition with attribution and audit events. Draft fields
can change only while the Mission is in `DRAFT`.

This is a good intake shell but not an immutable specification. Reusing the
Mission row for version history would erase attribution and make exact Plan
lineage impossible.

### Plan revisions

`missionPlans` already provide revision number, draft version, lifecycle,
attribution, approval/rejection data, assertions, ordered WorkOrder blueprints,
workflow version binding, and a deterministic Quality Contract projection.
`submitPlan` validates and freezes the proposed Plan. `approvePlan` enforces
separation of duties, compiles the Quality Contract, creates validation
assertions, and atomically materializes WorkOrders without dispatching them.

The missing link is explicit: a Plan can currently be created and approved
without naming the exact Mission Spec revision it implements.

### WorkOrder derivation and acceptance

`convex/lib/missionWorkOrderContract.ts` compiles approved Plan assertions and
blueprints into existing structured requirements, acceptance criteria, change
budgets, and verification contracts. `convex/lib/workOrderSpecification.ts`
already validates identifier uniqueness, requirement-to-criterion mapping,
criterion-to-check coverage, evidence minimums, scope conflicts, and mandatory
checks.

`convex/lib/missionGovernance.ts` and WorkOrder governance remain the only
acceptance path. Mission completion depends on accepted WorkOrders, exact
validation assertions, and complete handoffs. Spec quality must not modify
these semantics.

## Existing adjacent systems

### Progressive Factory recipes

`apps/mission-control-ui/src/factoryExperience/recipeCatalog.ts` is a typed
presentation catalog. It recommends an existing active workflow and seeds an
editable Plan. Canonical workflows and immutable Factory Definition Versions
remain execution truth. Spec templates should extend this catalog with
structured defaults and checklist references rather than create recipe runs.

### Factory Memory

Factory Memory is an additive, advisory projection. Frozen Context Packages are
bound to Attempts and quality digests but do not decide acceptance. A Mission
Spec and Constitution can become provenance-bearing sources, while the Plan and
Quality Contract retain the exact authority chain.

### Factory Learning

Factory Learning is deterministic and advisory in V1. Its signals, clusters,
and suggestions cannot mutate routing, policy, Factory Versions, verification,
publication, or acceptance. Spec-quality outcome correlation belongs here only
as evidence for a human-reviewed improvement candidate.

### Generic harness contract

PR #112 made harness execution provider-neutral while explicitly denying
canonical authority to adapters. Spec intake should not change the manifest,
lease, executor, verification, publication, or acceptance contracts. A harness
may receive the approved Spec lineage through an existing frozen context packet
but may not create, approve, rebind, or waive it.

## Proposed durable model

### Project Constitution revisions

Add an immutable authored artifact for project planning principles:

- stable project ownership and monotonically increasing revision;
- principles, required Spec sections, non-negotiable constraints, and required
  requirements-quality checks for coding/testing, security, UX/accessibility,
  architecture, performance, dependencies, documentation, release readiness,
  and verification;
- exact `governancePolicyId` and optional `policyEnvelopeId` references for
  current enforceable policy;
- content digest, author, source, and creation time;
- one project pointer to the current revision.

Activating a new Constitution changes only the pointer. Older Specs and Plans
retain their exact revision/digest. The existing governance policy and policy
envelope continue to govern runtime behavior.

### Mission Spec revisions

Add immutable revisions with stable identifiers for:

- objective and measurable outcomes;
- target personas and prioritized user stories;
- functional and non-functional requirements;
- acceptance expectations and verification expectations;
- an explicit Definition of Done;
- constraints, non-goals, assumptions, dependencies, risks, and edge cases;
- source references and repository/code scope;
- clarification questions and resolved answers;
- exact Constitution revision and digest;
- author/source/timestamps and a canonical content digest.

Saving changes inserts a new revision and updates the Mission's current pointer.
It never edits a prior revision. An explicit Finalize action records an
append-only approval decision after the deterministic gate passes. Finalization
does not grant execution authority.

### Spec Quality evaluations

Store immutable evaluation snapshots with:

- exact Spec and Constitution revision IDs/digests;
- evaluator ruleset version;
- `PASS` or `FAIL` result;
- structured findings with stable code, severity, blocking flag, field/ID,
  explanation, and suggested next action;
- actor/source and evaluation timestamp.

V1 checks are deterministic and bounded. They cover required sections,
ambiguous placeholders, stable-ID uniqueness, scenario completeness,
testability, repository/scope completeness, contradictory constraints,
Constitution inheritance, and unresolved clarifications. Style suggestions can
be advisory; missing authority, lineage, coverage, or testability is blocking.

### Exact Plan binding

Every Plan draft records:

- `missionSpecRevisionId` and `missionSpecDigest`;
- `missionSpecEvaluationId`;
- `projectConstitutionRevisionId` and Constitution digest.

`submitPlan` reloads and verifies this lineage, requires an effective finalized
Spec decision and passing evaluation, and runs Spec-to-Plan consistency checks.
`approvePlan` repeats the check defensively before atomically compiling the
Quality Contract and WorkOrders. A later Spec or Constitution revision never
silently changes an existing Plan.

## Deterministic consistency rules

The minimum blocking rule set is:

1. Every MUST Spec requirement maps to at least one Plan assertion.
2. Every Spec acceptance expectation maps to an assertion with a pass condition
   and evidence expectation.
3. Every Plan assertion maps to at least one WorkOrder blueprint, preserving the
   current coverage invariant.
4. Every mutating scope in a blueprint is within Spec repository/code scope and
   outside explicit non-goals and denied constraints.
5. Plan summary, rollback, repository, and branch do not contradict the Spec or
   Constitution.
6. Required Constitution and recipe checklist items are present or explicitly
   inapplicable with an attributable reason.
7. The Plan's stored IDs and digests match the current records it claims to
   reference.
8. No unresolved blocking clarification remains.

Findings explain the exact source and target IDs. They never mark a criterion
verified, create evidence, waive a gate, dispatch a WorkOrder, or accept work.

## Product surface

Add a `Specification` tab to the existing Mission detail route between Overview
and Plan. Reuse the existing Basic/Intermediate/Advanced preference:

- **Basic:** outcome, personas/stories, measurable completion, missing answers,
  and one clear next action.
- **Intermediate:** requirements, acceptance and verification expectations,
  constraints, non-goals, edge cases, checklist results, and clarification.
- **Advanced:** revision history, exact IDs/digests, Constitution lineage,
  coverage mapping, and raw deterministic findings.

The Plan tab shows its immutable Spec/Constitution binding and any submission
blockers. Required states are loading, empty, unsaved client edits, save
success, concurrent/stale revision conflict, failed evaluation, advisory-only
findings, finalized/read-only, superseded, unauthorized, and retryable backend
error.

## Migration and rollout

- Do not synthesize Specs for historical Missions.
- Existing approved/in-progress/complete Missions retain their current lineage
  and behavior.
- New spec enforcement is feature-flagged and applies to new Mission Plan
  creation/submission after activation.
- Legacy Plan views show `Legacy plan — no Mission Spec lineage` honestly.
- A DRAFT legacy Mission may create its first immutable Spec explicitly; no
  background backfill invents requirements or approval.
- Rollout fails closed for newly bound Plans and remains read-compatible for
  legacy records.

## Runtime contract decision

Baseline is runtime contract `v26`. The proposed schema fields, tables, and
public Convex queries/mutations are real client/backend contract changes. The
implementation must ship schema, indexes, validators, generated types,
functions, UI consumers, and tests atomically, run the extractor, and increment
the runtime version exactly once if the guard confirms the public delta. No
version is reserved or bumped during planning.

## Decision required before implementation

Recommended V1 decision:

1. Constitution revisions are immutable planning artifacts linked to existing
   governance policy records; they do not replace or duplicate runtime policy.
2. Mission Spec revisions are immutable content; approval is an append-only
   Finalize decision after a passing gate.
3. Creating or forking a Plan binds the current finalized Spec. Later Spec
   changes require an explicit new Plan revision; silent rebinding is forbidden.

The rejected alternative is adding Constitution content directly to mutable
`governancePolicies`/`policyEnvelopes`. Their activation and execution-validity
lifecycles are different, and combining them would weaken historical intent
lineage.

## References

- [GitHub Spec Kit](https://github.com/github/spec-kit)
- [Spec template](https://github.com/github/spec-kit/blob/main/templates/spec-template.md)
- [Constitution template](https://github.com/github/spec-kit/blob/main/templates/constitution-template.md)
- [Clarification workflow](https://github.com/github/spec-kit/blob/main/templates/commands/clarify.md)
- [Cross-artifact analysis](https://github.com/github/spec-kit/blob/main/templates/commands/analyze.md)
- [Requirements checklist workflow](https://github.com/github/spec-kit/blob/main/templates/commands/checklist.md)
- `docs/software-factory/governed-missions-contract.md`
- `docs/software-factory/verification-first-domain-contracts.md`
- `docs/software-factory/verification-and-gate-state-machines.md`
- `docs/architecture/2026-08-15-progressive-factory-experience-audit.md`
- `docs/architecture/factory-memory-context-intelligence.md`
- `docs/architecture/factory-learning-continuous-improvement.md`
