---
title: "Software Factory Research Lab Phase 0 queue-hygiene decision packet"
date: 2026-08-08
workspace_id: sn71gskbdemgf4z1trt9zdmm5h8bde69
status: review-required
owner: product
---

# Research Lab Phase 0 Queue-Hygiene Decision Packet

## Decision Needed

Approve an audited cleanup of synthetic browser-evidence records and quarantine
legacy Loop Engineering records. Until that decision is recorded, none of the
48 Inbox Tasks below should be scheduled, linked to new WorkOrders, or silently
canceled.

## Current Canonical Counts

The preserved Research Lab database was inspected read-only on 2026-08-08. The
canonical `tasks.status` counts are:

| Status | Count |
| --- | ---: |
| Inbox | 48 |
| Ready | 5 |
| Assigned | 20 |
| In progress | 2 |
| Review | 35 |
| Done | 15 |
| Canceled | 34 |
| **Total** | **159** |

These are database status counts, not UI presentation groupings. Any board KPI
that reports a different number must label the transformation it applies.

## Inbox Inventory

| Category | Count | Evidence | Risk | Recommended disposition |
| --- | ---: | --- | --- | --- |
| Synthetic browser-evidence roots | 8 | Seven `PR1 governed browser evidence` Tasks and one `PR1 ungoverned browser evidence` Task, identifiers `SFRL-077` through `SFRL-087` with gaps | Test fixtures can be mistaken for operator intent | Exclude from scheduling now. After Product Owner approval, transition them through one audited fixture-cleanup batch with an immutable manifest. |
| Synthetic browser-evidence derivatives | 32 | `Research`, `Implement`, `Test`, and `Document` children for the same eight PR1 fixture labels; source `AGENT`; no identifier or WorkOrder | Duplicates fixture activity and has no authoritative scope | Quarantine with the eight roots. Do not promote or relink. |
| Legacy Loop Engineering roots | 2 | `SFRL-106 researchArchitecture` and `SFRL-107 researchGovernance`; source references `workflow-run:v33htr95`; no WorkOrder | Research may be useful, but execution authority is absent | Preserve as historical evidence. Supersede only after useful artifacts are linked to the new retry-research WorkOrder by explicit reference. |
| Legacy Loop Engineering derivatives | 6 | `Research`, `Execute`, and `Review` children for architecture and governance; source `AGENT`; no identifier or WorkOrder | Stage records can look executable even though lineage is incomplete | Quarantine as historical workflow output. Do not execute or use as retry targets. |
| **Total** | **48** |  |  |  |

## Ready-Queue Exceptions

Five Tasks are canonically Ready and require separate treatment:

- `SFRL-089` and `SFRL-091` are PR1 browser-evidence fixtures linked to the
  fixture WorkOrder. Exclude them from continuous scheduling and include them
  in the same reviewed fixture-cleanup manifest.
- `SFRL-111`, `SFRL-112`, and `SFRL-113` concern retry research and independent
  verification, but they are linked to the accessibility-audit WorkOrder
  `yh72sn2jp02by6b2zr23pr01dh8bd4nb`. Preserve the records and do not dispatch
  them. Restart the work under a separate WorkOrder with frozen scope
  provenance.

## Protected Record

The accessibility-audit WorkOrder is protected from cleanup:

- WorkOrder: `yh72sn2jp02by6b2zr23pr01dh8bd4nb`
- State at audit: `IN_PROGRESS`
- Revision: `1`
- Desired outcome: “Run an evidence-backed accessibility audit of the Software
  Factory critical journey and create actionable follow-up work.”

Its title, desired outcome, repository, revision, state, acceptance criteria,
and source-of-truth references must not be rewritten to authorize retry
research.

## Separate Retry-Research WorkOrder

The approved authority split was applied on 2026-08-09 without changing the
protected accessibility audit:

- WorkOrder: `yh7f82jncj56gbe2fxsdr44w6s8c56vc`
- State: `DISPATCHED`
- Workflow run: `ys79vm5y2hgdszy2f7sah20dbn8c55t9` (`k18vfqxy`)
- Run state: `PENDING`
- Repository: `jaydubya818/MissionControl`
- Execution scope: read-only research with four required verification receipts
  and a stop condition that forbids repository, policy, or automation changes

No autonomous executor or continuous scheduler was enabled. The run remains
pending while Phase 0 operational controls and independent verification are
proved.

## Proposed Audited Cleanup

1. Add a scheduling exclusion for Tasks classified as synthetic or legacy
   quarantine; this is reversible and must precede terminal transitions.
2. Produce an immutable cleanup manifest containing every exact Task ID,
   category, current status, WorkOrder link, reason, and proposed transition.
3. Require Product Owner approval of that manifest.
4. Transition approved synthetic fixtures through the normal audited Task state
   machine. Do not delete database rows or perform direct database repair.
5. Preserve legacy research artifacts and reference useful evidence from the
   new WorkOrder without reusing the ungoverned Tasks as Attempts.
6. Recount the canonical queue and browser-verify the result after refresh and
   process restart.

## Recommendation

Approve the reversible scheduling exclusion now. Defer terminal cancellation
of the 40 synthetic Inbox records, the two Ready synthetic records, and any
legacy records until the exact cleanup manifest is reviewed. This removes them
from autonomous eligibility without destroying evidence or silently rewriting
history.

## Evidence Method

The audit used read-only SQL over the preserved local Convex SQLite store. It
selected the latest non-deleted document revision per Task ID and grouped only
records whose `projectId` equals the Research Lab workspace ID. No Task,
WorkOrder, workflow run, or database row was changed during this inventory.
