# PR 72 durable human-review restart proof

Date: 2026-08-11 PDT (2026-08-12 UTC)

This evidence records one isolated, real pause → orchestration restart →
browser approval → GitHub pull-request publication exercise against the local
Codex Queue Canary workspace. It is a control-plane continuation of a verified
candidate; `codex/v1` did not resume in process and did not execute again.

## Result

- WorkOrder: `yh74xc477nwt1vrgeyz4cpb88h8cbccf`
- Attempt document: `ys7363fwft31qa5ab47rmtbeth8cb8x9`
- Stable run ID: `2ohutx2v`
- Source revision: `6c5b07784b4bae1e80d642782b6e7eebd858fbf1`
- Verified candidate: `4cd5b80f076977ac3507d238ef3574c35721d245`
- Exact review approval: `ks72e9xtvgfq791pkqdtjss4x98cbswz`
- Publication permit: `factory-publication:2ohutx2v:502949f5-face-47ef-97e7-01fe60e1ca4a:1786508798018`
- GitHub result: [PR #73](https://github.com/jaydubya818/MissionControl/pull/73), opened by `mission-control-factory-jaywest[bot]`
- Final Attempt state: `COMPLETED / TERMINAL`, continuation `PUBLISHED`

PR #73 targets `main`, contains candidate `4cd5b80f0769`, and changes exactly
one approved file with seven added lines and no deletions:
`docs/testing/evidence/human-review-live-exercise-v2/pr-72-live-proof.md`.

## Sequence and assertions

1. The Factory ran one bounded agent step and the frozen verification contract.
2. Candidate `4cd5b80f0769` reached `PAUSED / AWAITING_HUMAN_REVIEW` with a pending approval linked to Attempt `ys7363…b8x9`.
3. GitHub had neither the branch nor a pull request at the checkpoint.
4. The orchestration process was stopped. Convex still reported the same paused Attempt, candidate, and pending approval.
5. A new built-artifact server process started. The run remained paused and the Decision Center rendered **Approve & resume publish**.
6. Browser approval moved the same Attempt to publication. A short-lived permit was bound to the new lease and exact candidate immediately before provider writes.
7. The GitHub App pushed the server-owned branch and created PR #73. The Attempt finished `COMPLETED / TERMINAL` with a `PUBLISHED` continuation.

The final 30-event audit contains exactly one each of `RUN_STARTED`,
`STEP_STARTED`, `STEP_COMPLETED`, `VERIFICATION_STARTED`, `RUN_PAUSED`,
`RUN_RESUMED`, `PULL_REQUEST_CREATED`, and `RUN_COMPLETED`. There is no second
agent step or verification sequence after approval. There are three
`VERIFICATION_CHECK_STARTED` and three matching pass events, one per frozen
check: negative-space constraints, change budget, and the independent command.

## Screenshots

- [`01-restarted-pending-approval.png`](01-restarted-pending-approval.png) — the preflight checkpoint that later failed closed on the mis-typed approval policy.
- [`02-clean-restarted-pending-approval.png`](02-clean-restarted-pending-approval.png) — the restarted Decision Center with the exact resume action.
- [`03-completed-work-order.png`](03-completed-work-order.png) — the WorkOrder after publication, with all three frozen checks passing.
- [`04-completed-run-inspector.png`](04-completed-run-inspector.png) — the completed run inspector and verification timings.
- [`05-github-app-pr-73.png`](05-github-app-pr-73.png) — the real GitHub App-authored pull request.

## Preflight correction

An earlier setup-only canary used a full policy sentence as the free-form code
scope approval type. Governance correctly failed closed because no approval of
that literal type existed; no remote branch or pull request was created. The
successful exercise used a newly versioned, readiness-assessed Factory with the
typed approval value `HUMAN_REVIEW`. The failed setup Attempt was not retried or
rewritten.

This proof does not cover remote sandbox enforcement, provider CI ingestion,
learning-ledger CRUD, trust scoring, verified-throughput metrics, deployment,
or production verification. Those remain explicitly deferred.
