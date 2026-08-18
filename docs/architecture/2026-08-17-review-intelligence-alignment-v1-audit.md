---
title: Review Intelligence & Alignment V1 Architecture Audit
status: accepted-for-implementation
date: 2026-08-17
base_sha: e9d6b93e2edd5cf81beddd627abfbb67e7f85086
runtime_contract: 29
---

# Review Intelligence & Alignment V1 Architecture Audit

## Decision

Extend Mission Control's existing review-package read model and exact-current
verification lineage. Do not add another verification engine, acceptance store,
review control plane, or top-level Code Review product.

The V1 review surface will project canonical Mission, Spec, Plan, WorkOrder,
Attempt, candidate, Verification Subject, Verification Plan, Evidence Envelope,
Quality Gate, GitHub App, and acceptance records. New durable records are limited
to non-authoritative implementation Decision Candidates, human review judgments,
and optional residual AI findings. Factory Learning remains the only path from
repeated review correction to a governed improvement proposal.

## Exact starting baseline

| Baseline | Exact record | Current result / boundary |
| --- | --- | --- |
| Latest `origin/main` | `e9d6b93e2edd5cf81beddd627abfbb67e7f85086`; merge of PR #117 | Fresh branch `codex/review-intelligence-alignment-v1-20260817` starts at the same SHA |
| Runtime contract | `RUNTIME_CONTRACT_VERSION = 29` | No runtime version is preselected for this initiative |
| System Qualification | `docs/testing/evidence/system-factory-e2e-v2/`; qualifying source `fda98924eb0ad4ab3b95cab16c8049e9df804d29`; base `ed2a8a9d686a7c1109aab381efa7eba369f8e996` | `SYSTEM QUALIFIED V2 WITH KNOWN LIMITATIONS`; frozen packet predates and explicitly excludes autonomous routing |
| Current-main qualification compatibility | PR #117 final feature head `ab985ba3e504076eccff6829b7a24cfd2fc74be6`; merge `e9d6b93e2edd5cf81beddd627abfbb67e7f85086`; `docs/plans/2026-08-17-feat-autonomous-execution-routing-v1-plan.md` | The routing delivery record reports all 12 existing qualification gates passing on runtime v29. It is not a replacement V2 evidence packet |
| Generic Harness | `generic-harness-contract/v1`; PRs #112/#113; `docs/validation/2026-08-16-generic-harness-contract-v1.md` | Codex and exact DeepSeek tuples are execution-only; harness authority remains `NONE`; runtime advanced v26 to v27 |
| Spec-Driven Mission Intake | PR #114, merge `ed2a8a9d686a7c1109aab381efa7eba369f8e996`; `docs/validation/2026-08-16-spec-driven-mission-intake-v1.md` | Immutable Spec revisions/digests, planning-only finalization, frozen Plan/Quality Contract/WorkOrder lineage; runtime advanced v27 to v28 |
| Factory Learning | PR #110, merge `3de80b97c7272f64586e5d08bc7c73fcd2114faa`; `docs/validation/2026-08-16-factory-learning-v1.md` | Deterministic advisory Signal → Cluster → Improvement Candidate → human-approved Experiment → submitted Plan; threshold is three distinct occurrences; runtime advanced v25 to v26 |
| Autonomous Execution Routing | PR #117, merge `e9d6b93e2edd5cf81beddd627abfbb67e7f85086`; `docs/architecture/execution-routing-v1.md` | Exact eligible Factory Version tuple selection; Guarded Auto default-off; frozen decision digest; unknown telemetry remains absent; runtime v29 |

The current System Qualification V2 evidence contains exact durable fixture IDs
and digests. In particular, it freezes Spec r2
`mission-spec-system-factory-e2e-v2-r2` at
`sha256:3187eba71569bb50e9893bd14eeb59d80929476bae7b10d56ca5af78e348b3dc`,
Quality Contract
`sha256:244de22b4a25143e45a8753ec7fbc291d660b5ec2e7e2c1c6baf76cc38f5151c`,
Verification Subject
`verification-subject:3c09429b8a87ce4b3e748d185b1b1417cf1397e7a6e178c991d2e6c2bb40f4be`,
Verification Plan
`verification-plan:b821ce55b9523c9f15f6cf7be550746853da86ca755557bd2a401d379638171f`,
and candidate `9ba871d9efad9b224b2f2cd432fbfb5cfbc9d461`. Those historical
records must remain byte-for-byte unchanged.

## External product references

These are product references, not dependencies.

- [Devin Review](https://docs.devin.ai/work-with-devin/devin-review) demonstrates
  logical diff organization, copy/move-aware presentation, focused findings,
  codebase-aware explanation, and a raw diff that remains available. Mission
  Control should adopt the reviewer-comprehension pattern, not Devin's combined
  review/merge/auto-fix authority model.
- [Aviator Verify](https://www.aviator.co/verify) demonstrates intent-first,
  criterion-level evidence and method selection. Its strongest applicable idea
  is that a reviewer sees the agreed criterion, the verification method, the
  verdict, and the exact proof together.
- Aviator's [verification architecture explanation](https://www.aviator.co/blog/how-verify-checks-code-semantic-analysis-runtime-previews-and-why-its-not-just-another-ai-review-tool/)
  explicitly separates deterministic checks from advisory AI judgment and warns
  against the same model manufacturing confidence in its own output. Mission
  Control already has the stronger canonical primitives and should project
  them, not import a second verification lifecycle.

## Capability matrix

| Capability | Existing MC primitive | Gap | Recommendation |
| --- | --- | --- | --- |
| Mission intent | `missions` plus exact `missionSpecRevisions` | Intent is visible on Mission/Spec pages but absent from the current review package | Project Mission objective, exact Spec revision/digest, relevant requirements, Definition of Done, constraints, risks, and sources |
| Spec lineage | Insert-only Spec revisions, quality evaluations, finalization decisions, Constitution digest | Reviewers cannot see the exact frozen Spec beside candidate evidence | Resolve only the WorkOrder's frozen `missionSpecLineage`; never substitute the latest Spec |
| Plan assertions | Approved `missionPlans.assertions` and immutable revision | Current review package starts at WorkOrder criteria and drops assertion provenance | Map requirement → assertion → criterion using exact IDs already compiled at Plan release |
| Quality Contract | `qualityContractProjection` and `qualityContractDigest` compiled from approved Plan | Digest is retained on WorkOrder/Attempt but not explained in review UI | Surface exact digest and relevant projection; keep it read-only and revision-bound |
| WorkOrder requirements and criteria | Structured `requirements`, `acceptanceCriteria`, verification contract, change budget, risk, approvals | Criterion cards show receipt status but not full lineage or required evidence | Build a criterion matrix without mutating WorkOrder status fields |
| Verification Subject | Exact immutable subject on source/verification Attempt and `verificationRuns` | Current package shows base/head but not subject ID/digest, tree SHA, provider PR identity | Add Advanced identity projection and currentness status |
| Verification Plan | Frozen plan ID/digest, requirements, risks, evidence requirements, adversarial scenarios | Only verifier/result is summarized today | Show plan/check IDs and map checks to criteria/evidence |
| Evidence Envelopes | Canonical envelopes with producer, independence, artifact IDs, hashes, criterion/requirement/check lineage | Current package reduces evidence to one receipt location and hides envelope IDs | Project all exact relevant envelope IDs and references; missing stays `MISSING`/`UNKNOWN` |
| Quality Gate Decisions | Append-only non-authoritative audit projection over canonical currentness | Returned separately on WorkOrder detail and not reconciled into the review story | Show gate state, reasons, input/evidence digests, and label it as a projection; acceptance continues to recompute canonical eligibility |
| Exact-current PR lineage | Verification Subject plus GitHub-sourced `harnessPrChecks`, connected installation, provider IDs, head SHA | Current UI lacks tree SHA/provider IDs and semantic groups; raw diff is only an external PR link/artifact | Add candidate/tree/PR identity, currentness, exact file lineage, grouped navigation, and direct raw-diff drill-through |
| Failed/recovered work | immutable Attempts, run events, retry timeline, handoff risks, recovery summary | Review package displays aggregate attempt/recovery counts only | Project failed Attempts, verification failures, stale-candidate events, retry lineage, and recovery path |
| Implementation decisions | scattered command summaries, checkpoints, handoffs, approvals, and plan decisions | No bounded, attributable implementation-time decision record; raw prompts are unsuitable | Add advisory Decision Candidates with source Attempt/session reference, origin, bounded redacted summary, target, and explicit human disposition |
| Run Inspector | Exact Attempt inspector with artifacts, verification, recovery, routing, observability | Evidence package is not ordered around human intent and advanced lineage is scattered below it | Make Review Package the ordered entry point while preserving full inspector details |
| Observability / Evals | traces, observations, evals, experiments, cost/latency diagnostics | Diagnostic results can look authoritative when displayed without labels | Include only as diagnostic/advisory context; never convert them to criterion success |
| Factory Memory | provenance-backed, invalidatable advisory projections | Context may explain decisions but is not evidence | Link relevant context provenance only in Advanced detail and label it advisory |
| Factory Learning | deterministic signals, isolated clusters, reviewable candidates, canonical experiments, governed Plan promotion | Generic rejected/revision approval ingestion cannot represent specific human review corrections or post-verification defects | Ingest bounded review judgments into existing learning signals with minimal taxonomy, exact fingerprints, threshold ≥3, and existing promotion gates |
| GitHub App publication | repository-scoped installation, publication permit, exact candidate/PR artifact, GitHub-sourced head projection | Publication evidence is visible but not integrated with intent/criterion lineage | Keep publication unchanged; project its exact IDs and state; no review component may publish or merge |
| Legacy peer review UI/store | `reviews` task/agent CRUD | It is task-centric, lacks the delivery authorization/currentness model, and conflates agent review types with human governance | Do not adopt it as Review Intelligence authority or data owner |
| Residual AI review | no canonical residual finding model | No place for optional post-verification architectural/maintainability analysis with provenance and cache identity | Add a bounded advisory projection only after deterministic verification exists; default off; cache by exact candidate/context digest |

## Answers to the audit questions

### Where is reviewer intent visible today?

It is split across Mission, Specification, approved Plan, Quality Contract, and
WorkOrder surfaces. The current Review Evidence Package does not include Mission,
Spec, Plan, Definition of Done, or Plan assertion lineage, so a reviewer must
reconstruct intent across pages.

### Where are implementation-time decisions preserved?

Only indirectly in run events, command/checkpoint summaries, handoffs, approval
decisions, and occasional documentation. There is no bounded, attributable,
reviewable Decision Candidate that can propose a governed revision without
mutating the approved lineage.

### Can reviewers see acceptance criteria mapped directly to evidence?

Partially. The current package maps an acceptance criterion to its latest exact
Attempt receipt and refuses to turn malformed or self-produced proof into PASS.
It does not show the complete requirement → Plan assertion → criterion →
verification check → Evidence Envelope chain or preserve every exact ID/digest
in the row.

### Can human review corrections feed Factory Learning?

Only coarsely. Factory Learning currently derives `HUMAN_CORRECTION` or
`REPEATED_REVIEW_FINDING` from rejected/revision-requested approval decisions.
It cannot ingest a typed, exact-candidate review correction, architecture pattern,
missing criterion, or post-verification human defect with direct review lineage.

### Can the UI distinguish verified facts from advisory AI findings?

There is no residual AI finding surface today. Existing deterministic evidence
states are explicit, but diagnostic Observability/Memory/Learning data live on
nearby surfaces. V1 needs a hard presentation contract: canonical verification
uses `VERIFIED`/failure/currentness semantics; all residual model output is
visibly `ADVISORY`, has model/provenance/candidate digests, and cannot affect
gate eligibility or acceptance.

## Architecture constraints for implementation

1. `buildReviewPackage` remains the single review read model. It may grow into
   `review-package/v2`, but no persisted Review Package table is introduced.
2. Verification truth remains in Verification Subject, Plan, Run, Envelope,
   Receipt, and exact-currentness evaluation records.
3. Unknown, missing, stale, contradictory, or advisory information never becomes
   success. Requirements-quality checklist completion is planning quality, not
   delivery evidence.
4. Decision Candidates and review judgments are attributable advisory records.
   Accepting a Decision Candidate can only create a new governed Spec/Plan
   revision request or explicit documentation path; it cannot rebind history.
5. Review-package approval is an acknowledgment only. Canonical acceptance is
   still `workOrders.accept`; merge and publication remain separately governed.
6. Deterministic semantic grouping uses repository/domain paths and artifact
   types. Any future model classification is advisory and optional.
7. Residual analysis runs only for an exact candidate with deterministic
   verification evidence, is default-off, redacted, bounded, and cached by exact
   candidate/context digest.
8. Review correction promotion reuses Factory Learning's repository-isolated,
   idempotent threshold, Cluster, Improvement Candidate, Experiment, Mission,
   submitted Plan, and separate human approval flow.
9. The existing System Qualification V2 evidence directory is immutable. Review
   Intelligence qualification writes to a new durable evidence area and does not
   claim System Qualification V3 unless the complete composed lifecycle is
   genuinely re-proved.

## Authority re-proof target

| Component | Authority after V1 |
| --- | --- |
| Spec Finalize | Planning-ready only |
| Plan approval | WorkOrder release |
| Harness | None |
| Worker / Remote Sandbox | Execution orchestration only |
| Factory Memory | Advisory |
| Observability / Evals | Diagnostic |
| Factory Learning | Advisory proposal and governed experiment only |
| Decision Candidate | Advisory proposal only |
| Residual AI Review | Advisory only |
| Review Package | Projection only |
| Independent Verification | Canonical verification |
| GitHub App | Controlled publication only |
| Review-package approval | Review acknowledgment only |
| `workOrders.accept` | Canonical WorkOrder acceptance |
| GitHub merge | Separately governed provider action |

## Implementation recommendation

Proceed with an additive V1 in the existing WorkOrder and Run Inspector surfaces:

1. enrich the read model with exact frozen intent, criterion lineage, attempts,
   semantic groups, decisions, residual findings, and complete identity;
2. add tightly scoped advisory persistence and authorized mutations for Decision
   Candidates and human review judgments;
3. extend Factory Learning ingestion and taxonomy without a new registry;
4. add an optional, default-off residual-analysis ingestion boundary with no
   acceptance path;
5. implement Basic/Intermediate/Advanced disclosure in the order required by the
   product brief and retain the raw GitHub diff link;
6. extend the existing composed qualification into a new Review Intelligence V1
   evidence area while preserving all V2 bytes.
