# Spec-Driven Mission Intake V1 qualification

Date: 2026-08-16

## Result

Spec-Driven Mission Intake V1 is qualified for a draft pull request and is
recommended to **MERGE** after required pull-request checks pass. The branch is
rebased on exact `origin/main`
`e2bec95c1665d7184e6d41e9178db42ee06ac5f3`, which includes PR #113. The
runtime contract advances exactly once from main's `v27` to `v28` for eight
intentional public Convex API changes.

This release adds immutable planning lineage before the existing authorization
boundary. It does not grant Spec Intake, Factory Memory, Factory Learning,
recipes, or harnesses execution, verification, publication, merge, routing, or
acceptance authority.

## Authority chain

The implemented canonical flow is:

`Project Constitution revision → Mission Spec revision → deterministic Spec
Quality evaluation → FINALIZED decision → Mission Plan revision → separate
human Plan approval → Quality Contract → WorkOrders → Attempts → independent
verification → publication → workOrders.accept`

`FINALIZED` means only that one exact immutable Spec revision has a passing
deterministic evaluation and is complete enough to propose for planning. It is
not delivery approval and cannot release a WorkOrder. The golden WorkOrder
correctly remains `AWAITING_APPROVAL` because Human Review is required; no
Attempt was dispatched.

## Domain model and behavior

### Project Constitution

- Revisions are immutable, attributable, digest-bound, and explicitly
  activated per project.
- Content is limited to authored planning principles, required Spec sections,
  and classified checklist items. Optional references point at existing
  governance policy, policy envelope, Quality Contract, or Verification Plan
  records instead of copying runtime policy.
- A newly activated Constitution never changes an existing Spec or Plan.

### Mission Spec

- Each save creates an immutable revision with a `baseRevisionId`, attribution,
  exact Constitution revision and digest, canonical content digest, and stable
  cross-artifact IDs.
- Finalized rows cannot be edited. Answering a clarification or revising scope
  creates another revision.
- Stable IDs are required for outcomes, personas, stories/scenarios,
  requirements, NFRs, acceptance and verification expectations, Definition of
  Done items, constraints, non-goals, risks, edge cases, sources, and
  clarifications. Array position and display text have no lineage authority.

### Deterministic Spec Quality and clarifications

Ruleset `v1` is deterministic, canonically sorted, and bounded. It checks
required sections; stable and unique IDs; placeholder text; measurable
outcomes; persona/story/scenario references; requirement testability;
acceptance and evidence-bearing verification coverage; checklist consistency;
Definition of Done links; repository scope; contradictions/non-goal conflicts;
and unresolved structured clarifications.

Clarifications are findings with stable IDs, explicit questions, status, and
attributable answers. Resolving one requires a new Spec revision. No chat or LLM
clarification authority was introduced.

Collection maxima are: 10 personas, 20 measurable outcomes, 30 stories, 20
scenarios per story, 50 requirements, 30 NFRs, 60 acceptance expectations, 60
verification expectations, 40 Definition of Done items, 40 constraints, 30
non-goals, 30 risks, 40 edge cases, 30 sources, 40 clarifications, 80 checklist
items, 100 findings, 40 Constitution principles, 20 required sections, 60
references per item, and 4,000 characters per bounded text value.

### Three check classes

Constitution checklist items are frozen as `REQUIREMENTS_QUALITY`,
`GOVERNANCE_CONSTRAINT`, or `EVIDENCE_BEARING_VERIFICATION`. Only the third
class may be referenced by a Spec verification expectation and compiled into a
WorkOrder verification/evidence requirement. Satisfying a quality or governance
check cannot satisfy delivery verification.

### Coverage matrix and frozen Plan binding

The deterministic analyzer projects every Spec requirement through Plan
assertion, WorkOrder blueprint, acceptance criterion, and verification check.
Incomplete or unknown references block Plan submission/approval. The readable
matrix is exposed only in Advanced mode and remains an explanation of canonical
artifacts, not another authority store.

Each new Spec-bound Plan persists the exact Spec revision ID/digest, Spec
Quality evaluation ID, and Constitution revision ID/digest. Both `submitPlan`
and `approvePlan` reload and transactionally revalidate those values, the
`FINALIZED` decision, passing evaluation, policy references, repository scope,
and coverage. A new Spec or Constitution cannot silently rebind a Plan; adoption
requires a new/forked Plan revision.

Quality Contracts and WorkOrders copy that frozen lineage and the exact coverage
projection. WorkOrder derivation compiles only evidence-bearing verification
expectations. Existing Plan approval, WorkOrder release, Attempt dispatch,
independent verification, publication, and acceptance controls remain the
authoritative boundaries.

## Advisory integrations

- Constitution and Spec revisions are indexed as provenance-bearing Factory
  Memory sources with `advisoryOnly: true`, `frozenLineageWins: true`, and
  `acceptanceAuthority: false`. Retrieval cannot replace or rebind a digest and
  cannot satisfy a requirement.
- Factory Learning can emit advisory signals for recurring Spec defects and
  suggest Constitution, recipe, clarification-rule, or template improvements.
  It cannot mutate them. Promotion remains Candidate → Experiment → Mission →
  submitted Plan → separate human approval.
- Recipes provide versioned Spec/checklist defaults only.
- Generic harness code has no Spec mutation API and receives frozen Spec context
  only through the existing approved Plan/Quality Contract/context lineage.

## Negative authority proof

The Spec authority profile is machine-asserted as false for WorkOrder release,
Attempt dispatch, verification establishment, authoritative evidence creation,
publication, merge, acceptance, worker-lease mutation, model/harness routing,
and Factory Version mutation. Source-contract tests also reject forbidden
canonical-store writes or execution functions in every Spec API and reject Spec
writes from generic harness and Attempt adapter code.

## Golden-path lineage proof

The seeded Software Factory Demo exercised this exact chain:

1. Mission `gs7hvwk9bx6yk3xh14mtsn3k7s8ck7ha` produced Spec r1
   `ss7ykezdhw5h0sbq1p8psead258cjvh2`, which failed on missing evidence-bearing
   verification, unresolved clarification, missing measurable outcome, and a
   missing required section.
2. Spec r2 `ss7t5avvnbrqkfmgff3s2v69d98ckmpd`, digest
   `sha256:d211d54c2dd6aea651e102c0a38bd57563c719c081609fb95add39967c20358e`,
   passed and was `FINALIZED` for planning only.
3. Plan `gn7zsa15fycsc8v61bmandwr7h8cj57g` was bound to r2, submitted,
   separately approved, and produced WorkOrder
   `yh78xkk0vf93ey58wcptav2ydd8cj1f3` with complete coverage and no dispatch.
4. Spec r3 `ss7k9nz7afc1e4d1ck9a11y09d8ck138`, digest
   `sha256:21d9d82c3b227d1d974998f7845e960ed07df96c596a3773fbb80f3f596cff53`,
   became current. The approved Plan, Quality Contract, and WorkOrder remained
   bound to r2 and its original Constitution revision/digest.

The frozen Constitution is `sx7z2d2a4xqmfca1d1wtqm1vp18ckf3a`, digest
`sha256:8916d7121dd4fdf0e6599724d083cd0b16774f9a65679bf9b4a963e35f868569`.
Machine-readable evidence is in
[`lineage-proof.json`](./evidence/spec-driven-mission-intake-v1/lineage-proof.json).

## Legacy compatibility and rollout

Historical records are not assigned synthetic provenance. A Plan without Spec
lineage stays readable and operational and is labeled `Legacy plan — no Mission
Spec lineage.`

The project-scoped flag `missions.spec-intake-v1` defaults off. It is enabled
only in the seeded demo qualification project. Disabling it blocks new
Constitution/Spec writes, evaluation, finalization, and new Spec-bound planning
while preserving immutable reads and existing bound Plan/WorkOrder lineage. Do
not delete immutable records during rollback. Ship runtime `v28`, backend, and
client atomically when production rollout is separately authorized.

## Public API and runtime result

Runtime guard result: PASS, `v27 → v28`, with exactly eight accepted changes:

- added `missionSpecs:activateConstitutionRevision`
- added `missionSpecs:createConstitutionRevision`
- added `missionSpecs:evaluateMissionSpecRevision`
- added `missionSpecs:finalizeMissionSpecRevision`
- added `missionSpecs:getMissionIntake`
- added `missionSpecs:getProjectConstitution`
- added `missionSpecs:saveMissionSpecRevision`
- changed arguments for `missions:savePlanDraft`

No second runtime version was consumed.

## Automated qualification

| Check | Result |
| --- | --- |
| Focused Spec/Plan/Quality Contract/WorkOrder suite | 61 passed |
| Complete Factory qualification | passed: composed 32, contracts 116, Verification Factory 44, Factory Memory 27, Progressive Factory/Learning UI 25 |
| Full repository tests | passed: UI 299, Convex 643, orchestration 112; all remaining workspace suites passed; one governed-context integration test intentionally skipped |
| Typecheck and lint | passed across all workspaces; 10 skills at 100/100 |
| Runtime contract | passed, eight intentional public changes, `v27 → v28` |
| Production build | passed across all buildable workspaces |
| Orchestration smoke | built Node ESM artifact loaded successfully |
| Repository integrity | `git diff --check` passed |

The default UI build still reports the repository's existing warning for the
657.69 kB minified vendor chunk. The build succeeds; this feature does not add a
new dependency or change chunking policy.

## Browser and accessibility evidence

The real seeded UI was exercised in Chromium at 1440 px and 390 px in light and
dark themes. Basic mode hides requirements/history/coverage, Intermediate shows
requirements without history, and Advanced shows requirements, revision history,
and the complete coverage matrix. Plan lineage, legacy messaging, failure,
success, loading, empty, and responsive states were reviewed. Browser error and
HTTP 4xx/5xx collections were empty. Axe reported zero violations after the
affected heading hierarchy and keyboard-focusable scroll-table regions were
corrected.

Screenshots are stored in
[`docs/validation/evidence/spec-driven-mission-intake-v1`](./evidence/spec-driven-mission-intake-v1/).

## Remaining limitations

- V1 clarification is deliberately deterministic; no conversational or model
  loop is included.
- The coverage projection supports the approved one-repository-per-Mission V1
  scope. Multi-repository planning needs an explicit future model.
- The Spec workspace is intentionally structured and dense in Advanced mode;
  broader user research may justify authoring shortcuts, but must not weaken
  stable IDs or frozen lineage.
- Production rollout remains separately gated. This draft does not deploy or
  enable the feature outside the seeded demo project.

## Recommendation

**MERGE** after CI and Vercel preview are green. Do not mark the pull request
ready, merge it, enable production, or deploy production as part of this work.
