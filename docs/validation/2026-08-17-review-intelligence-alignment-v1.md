# Review Intelligence & Alignment V1 qualification

Date: 2026-08-17

## Result

Review Intelligence & Alignment V1 is locally qualified for a draft pull
request. It turns the existing WorkOrder Review Package into an evidence-first,
exact-lineage projection without creating a second verifier, acceptance store,
publication path, merge action, or top-level review product. Raw source review
remains available.

Draft pull request: https://github.com/jaydubya818/MissionControl/pull/119

The isolated branch starts from exact then-current `origin/main`
`e9d6b93e2edd5cf81beddd627abfbb67e7f85086`. The runtime contract started at
v29. The public-change extractor found exactly seven new Review Intelligence and
signed service-command functions, so it advanced once to v30.

## Starting baselines

| System | Exact baseline |
| --- | --- |
| System Qualification | V2 packet at `docs/testing/evidence/system-factory-e2e-v2/`; qualifying source `fda98924eb0ad4ab3b95cab16c8049e9df804d29`; result `SYSTEM QUALIFIED V2 WITH KNOWN LIMITATIONS` |
| Generic Harness | `generic-harness-contract/v1`, PRs #112/#113, runtime v27, authority `NONE` |
| Spec-Driven Mission Intake | PR #114, merge `ed2a8a9d686a7c1109aab381efa7eba369f8e996`, runtime v28 |
| Factory Learning | PR #110, merge `3de80b97c7272f64586e5d08bc7c73fcd2114faa`, runtime v26 |
| Autonomous Execution Routing | PR #117, merge/base `e9d6b93e2edd5cf81beddd627abfbb67e7f85086`, runtime v29, Guarded Auto off |

The full architecture audit and primitive matrix are in
`docs/architecture/2026-08-17-review-intelligence-alignment-v1-audit.md`.

## Review Package model

The package remains a derived read model over canonical Mission, frozen Spec,
approved Plan, Quality Contract, WorkOrder, Attempt, Verification Subject,
Verification Plan, Evidence Envelopes, receipts, Quality Gate projection, and
GitHub App/PR state. No Review Package table was added.

Its criterion matrix preserves the exact chain:

`Spec requirement → Plan assertion → WorkOrder criterion → verification check → Evidence Envelope → result`

Each row retains source IDs, method, verifier, receipt, envelope IDs/references,
candidate revision, currentness, and integrity issue. `UNKNOWN`, `MISSING`,
`PENDING`, and `STALE` remain non-success. Requirements-quality checklist state
is not accepted as delivery evidence.

Changed paths are grouped deterministically into Authentication, Persistence,
Verification, UI, Configuration, Migration, Tests, Documentation, Dependencies,
or Other. Every group retains exact file/diff lineage. The raw PR diff is always
available.

## Advisory records

Three narrow tables store facts not present in the canonical delivery model:

- `decisionCandidates`: attributable, bounded implementation-time proposals
  with exact Attempt/candidate lineage and a proposed governed target;
- `reviewJudgments`: human comments, clarification/change requests, risk
  acknowledgments, architecture concerns, corrections, or package approvals;
- `residualReviewAnalyses`: optional model/provider/provenance/cost records and
  findings, all hard-coded `ADVISORY` with `acceptanceAuthority: false`.

Decision acceptance means accepted for a future revision. It cannot mutate an
approved Spec, Plan, Quality Contract, or historical WorkOrder. A separately
created governed revision or ADR must be linked afterward.

Residual analysis requires the default-off feature flag, exact-current
deterministic `VERIFIED` evidence, complete Verification Subject/Plan/evidence
digests, a signed service caller, and a reviewer identity distinct from the
executor. It cannot create/fail verification, affect Quality Gate eligibility,
accept, publish, or merge. Null token/cost telemetry stays absent rather than
becoming zero.

## Human correction to Factory Learning

A typed human correction projects into the existing Factory Learning signal
path. Duplicate normalized corrections on the same WorkOrder count once. Three
distinct WorkOrders are required before the existing cluster can create an
advisory Improvement Candidate. Missing deterministic gates and post-verification
defects can propose `ADD_DETERMINISTIC_GATE`; architecture patterns can propose
documentation/intent changes. Existing human experiment approval, experiment
completion, Mission creation, submitted Plan, and separate Plan approval remain
mandatory. No candidate can self-promote.

## Authority and security audit

| Component | Authority after V1 |
| --- | --- |
| Spec Finalize | Planning-ready only |
| Plan approval | WorkOrder release |
| Harness | None |
| Worker / Remote Sandbox | Execution only |
| Memory / Factory Learning | Advisory |
| Observability / Evals | Diagnostic |
| Decision Candidate / residual analysis | Advisory |
| Review Package | Projection |
| Independent Verification | Canonical verification |
| GitHub App | Controlled publication |
| Review-package approval | Non-accepting acknowledgment |
| `workOrders.accept` | Canonical acceptance |
| GitHub merge | Separate provider action |

Reads and writes reuse delivery-scope authorization. Human identity is derived
from the authenticated workspace membership. Agent inputs enter through signed,
replay-resistant, exact-scope service commands. Cross-workspace and lineage
mismatches fail closed. Text is control-character stripped, capped, and redacts
GitHub/OpenAI-style tokens, API keys, Bearer credentials, passwords/secrets, and
private keys. Raw prompts and terminal histories have no persistence field.
External links are scheme-checked and text renders through escaped React nodes.

Release security reported zero critical and zero high advisories. Existing
accepted moderate advisories remain governed by the repository release gate.

## Golden path and failure matrix

The deterministic golden path proves Mission/Spec/Plan/Quality Contract lineage,
a WorkOrder/Attempt decision, exact candidate, independent criterion evidence,
advisory residual finding, human correction, accepted WorkOrder lineage, three
independent learning signals, and one non-authoritative Improvement Candidate.
The frozen accepted lineage is unchanged by correction or candidate creation.

Focused tests cover stale candidates and PR heads, failed verification, missing
evidence, `UNKNOWN`, self-verification, untrusted/rejected/unauthorized decision
candidates, cross-workspace denial, duplicate corrections, contradictory
advisory findings, learning duplicate suppression/self-promotion, secret-shaped
text, invalid external links, long identifiers/files, and missing/blocked UI
states. Deterministic verification always wins over advisory model output.

## Automated and browser evidence

| Check | Result |
| --- | --- |
| Extended `pnpm run qualify:factory` in new evidence area | 17/17 checks PASS |
| Review Intelligence backend, authority, and golden path | PASS |
| Review Package component | 8/8 PASS |
| Full repository tests | 674 Convex, 303 UI, 121 orchestration passed; one pre-existing orchestration integration test skipped; all other workspace suites passed |
| TypeScript/lint/skill lint | PASS |
| Runtime guard | PASS, seven public additions, v29 → v30 |
| Production build | PASS; existing large-chunk warnings only |
| Orchestration startup smoke | PASS |
| `git diff --check` | PASS |
| Frozen System Qualification V2 diff | 0 bytes |
| Real-browser focused E2E | 1/1 PASS at port 5180 |
| Targeted axe | zero violations on Basic desktop, Advanced tablet, and Basic mobile package surfaces |

Browser coverage includes Basic/Intermediate/Advanced, 1440×900/1024×768/
390×844, light/dark, direct URL, refresh, back/forward, keyboard and visible
focus, no page/package horizontal overflow, no console/page/request errors, exact
evidence drill-through into Run Inspector, and raw-diff navigation.

Durable evidence: `docs/testing/evidence/review-intelligence-v1/`.

## Remaining limitations

- Residual AI V1 is a secure, default-off ingestion and projection boundary. It
  does not schedule or invoke an LLM provider from the UI.
- Semantic grouping is intentionally path/artifact based; rename/copy-aware
  semantic reconstruction is deferred unless repository data proves the need.
- Review-package approval remains intentionally non-accepting. Operators still
  perform separate source review, `workOrders.accept`, and governed merge.
- The preserved PR #84 browser fixture is intentionally stale. It proves that a
  previously verified candidate becomes blocked rather than being presented as
  current success.

## Recommendation

Local recommendation: **MERGE**, subject to draft-PR GitHub CI and Vercel reaching
terminal success. Keep `review-intelligence.residual-ai` disabled in production.
