# Close the Three Engineering Loops

## Status

**Complete, CI-verified, merged to `main`, and post-merge measured.**

Mission Control now connects completed research output, approved isolated
implementation, PR-head evaluation, and evidence-driven improvement proposals
through the canonical WorkOrder, Task, workflow run, approval, receipt, and
activity contracts.

## Live Finding

The selected Research Lab graph remains complete at 8/8 nodes with 3/3
independent verification. Its cycle now projects exactly once to `Ready For
Next Cycle` with 2 deduplicated accepted sources, 3 claims, 4 measurements, the
original approval ID and digest, and a truthful zero-recommendation clean stop.

| Loop | Current result |
| --- | --- |
| Inner edit/run/check | Implemented — separate fail-closed worktree worker and immutable retry contract |
| Outer CI/review/merge | Implemented — signed webhook, per-head history, correction block, explicit merge record |
| Meta quality feedback | Implemented — real deduplicated signals create approval-gated work |
| Research graph | Working |
| End-to-end closed loop | Verified — failed and passing heads retained, approved merge recorded, WorkOrder accepted, measurement met |

## Delivered Sequence

1. **Truthful projection:** idempotently project completed graph outputs into the
   Loop Engineering cycle and unify the approval authority.
2. **Governed inner worker:** execute approved edits in isolated worktrees with
   immutable Attempts and targeted checks.
3. **Outer PR/CI loop:** correlate GitHub checks by WorkOrder, Attempt, PR, and
   head SHA; return failures to bounded correction.
4. **Evidence-driven meta loop:** remove demo auto-seeding, fix proposal
   contracts, create governed work from real signals, and measure results.
5. **One operator surface:** present Inner Attempts, Outer PR/CI Gate, and Meta
   Improvements inside Loop Engineering.

The UI now uses one vocabulary throughout: the fast inner loop drives
automation, the governed outer loop drives autonomy, and the evidence-learning
meta loop drives quality.

## Verification Evidence

- Projection tests: 9 passed.
- Workflow engine and implementation-policy tests: 75 passed.
- Focused outer/meta/loop contract tests: 23 passed.
- UI typecheck and navigation/presentation tests: passed.
- Chromium refresh journey: passed with no page errors.
- Signed webhook boundary: missing configuration fails closed; invalid
  signature returned 401; valid signature returned 200.
- Live meta journey: failed run `a8a5m2hy` created one suggestion
  `zd792pzksd3mfwxncpf7xs0hq58bprxt`; duplicate delivery retained one item;
  acceptance created Task `wh7fazap3ct6hzfc12ttgmp1kd8bqe7f` and WorkOrder
  `yh7aygkkxryzj7ft65yq6czec58bq3ys`; the WorkOrder is now `DONE` after
  implementation and merge approvals, PRs #56/#57, 9/9 GitHub checks, and two
  passing post-merge receipts.
- Outer-loop recovery retained failed head `f954c57`, passed corrected head
  `b216428`, and recorded merge `0a4ebdb` without bypassing approval.
- Meta measurement: baseline 0, result 1, target 1 successful governed
  recovery; suggestion `zd792pzksd3mfwxncpf7xs0hq58bprxt` is `EFFECTIVE`.
- Screenshots:
  `docs/testing/evidence/three-loop-engineering-audit/phase-0/research-lab-projected-cycle.png`
  and
  `docs/testing/evidence/three-loop-engineering-audit/phase-4/unified-loop-engineering.png`.
- Final completed documentation screenshot:
  `docs/testing/evidence/three-loop-engineering-audit/phase-5/final-docs-and-measurement.png`.

## Critical Acceptance

- A completed graph updates its cycle exactly once.
- An approved recommendation creates isolated implementation work.
- A failing targeted check creates one retained correction Attempt.
- A real PR and CI result link to the current Attempt.
- Approval cannot be silently bypassed.
- A real failure creates one evidence-linked improvement proposal.
- Accepting the proposal creates governed work, not a direct policy mutation.
- Validation and measurement can create one bounded next cycle.
- Refresh and executor restart preserve the full lineage.
- No direct database manipulation is needed.

## Detailed Plan

The complete implementation sequence, risks, file-level scope, and acceptance
criteria are maintained in:

`docs/plans/2026-08-01-feat-close-loop-engineering-system-plan.md`

The evidence-backed audit is maintained in:

`docs/testing/three-loop-engineering-audit.md`

## Scope Boundary

Do not build a fourth loop engine, allow self-approval, auto-merge high-risk
changes, or run the full test suite on every correction Attempt. Reuse the
canonical Mission → WorkOrder → Task → Attempt → evidence → PR → release
hierarchy.
