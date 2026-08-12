# Browser-governed Factory dispatch evidence

Date: 2026-08-12

Environment: isolated local Research Lab at `http://127.0.0.1:5199`

Workspace: `Codex Queue Canary`

Repository: `jaydubya818/MissionControl`

## Outcome

The browser create → approve → dispatch → verified-pause path passed. The
existing repository-scoped GitHub App installation was reconnected, its live
repository selection and least-privilege readiness were revalidated, and the
orchestration worker reported a clean, current executor host. No App private
key or installation token was committed.

The browser then created a governed WorkOrder, recorded the ordinary
pre-dispatch `HUMAN_REVIEW` approval, dispatched the exact active Factory
version, and stopped the same Attempt at `AWAITING_HUMAN_REVIEW` after
independent verification passed. The publication checkpoint remains pending by
design. The remote branch does not exist and GitHub returned no pull request for
the attempt branch, proving that verified work did not publish before approval.

PR #72 separately proves the continuation beyond this boundary: the persisted
candidate survived an orchestration-process restart, resumed after approval,
consumed a candidate-bound publication permit, and created PR #73. See
[`../pr-72-human-review-resume/README.md`](../pr-72-human-review-resume/README.md).

## GitHub App and Factory authority

| Authority | Captured value |
|---|---|
| GitHub App | `mission-control-factory-jaywest` (`4543062`) |
| Installation | `152563527`, selected repository, unsuspended |
| Permissions | Metadata read, checks read, contents write, pull requests write |
| Events | `check_run`, `pull_request`, `pull_request_review` |
| Readiness | `VERIFIED` at `2026-08-12T04:04:30.045Z` |
| Factory version | `m97twn77fhkxknfr55624s6qsx8ca6er`, version `3` |
| Factory digest | `factory-v1-79fcad0b` |
| Workflow | `pr-72-human-review-live-20260811` |
| Code scope | `jx7s1q8z0v8byp9cm574qse9vs8castk` |
| Allowed path | `docs/testing/evidence/human-review-live-exercise-v2/**` |
| Host binding | `zs769yn2qk8hp522esqtd12z1x8bznn0` |

## Final verified-pause lineage

| Record | Captured value |
|---|---|
| WorkOrder | `yh70sbd8r69tqexav1cdfx7re58cb029` |
| Pre-dispatch approval | `ks71znzf7ewxwrc8vpp9rsty0n8cb46z` (`APPROVED`) |
| Attempt record | `ys76t2gsp7eqcgsvr30kbh7a5h8cbyt4` |
| Run | `gkymt1e0` (`PAUSED`) |
| Execution phase | `AWAITING_HUMAN_REVIEW` |
| Source revision | `55512d4c718e9bf5311931604279b3d87e785cbc` |
| Candidate | `14058c17c21e66c56bdb18c70dad7e043059fbd1` |
| Branch | `mc/fx7re58cb029` (local only) |
| Verification receipt | `xh7d8gngr6nv61mfp9zcx9xkcn8cb1p2` (`PASSED`) |
| Verification run | `nh7w3azxmyc89z8yk4a5mn5qcd8cbk7q` |
| Publication approval | `ks7dq9swgcb7bx3hg58m833qr58cb36s` (`PENDING`) |
| Changed file | `docs/testing/evidence/human-review-live-exercise-v2/pr-87-browser-governed-pause-v2.md` |
| Change budget | `1` file, `7` lines; passed |
| Remote publication | No branch and no pull request |

The run inspector showed the authoritative `REQUIRES_HUMAN_REVIEW` gate,
`PR AUTHORITY: CONTROL_PLANE_ONLY`, `PULL REQUEST: Not published`, three
evidence envelopes, and one passing receipt with none missing.

## Fail-closed recovery exercised

The first isolated run (`drrkn8qu`) correctly failed independent verification
because the form's former sample `pnpm --filter mission-control-ui typecheck`
command assumed `node_modules` existed in the clean worktree. It did not create
a branch or pull request. The recovered run used a dependency-free `node -e`
verifier and reached the verified pause above.

That observation also closed a product gap in PR #87: the form no longer
infers a repository-specific verification command. It starts with an empty
executable and exact `[]` argv, keeps Create disabled, and requires the operator
to enter a command valid for the frozen worktree.

## Captures

- [`pr-87-v2-create-form.png`](pr-87-v2-create-form.png) shows the governed
  WorkOrder and explicit dependency-free verifier before creation.
- [`pr-87-v2-pre-dispatch-approval.png`](pr-87-v2-pre-dispatch-approval.png)
  shows the generic pre-dispatch decision recorded in the browser.
- [`pr-87-v2-ready-to-dispatch.png`](pr-87-v2-ready-to-dispatch.png) shows the
  immutable Factory dispatch envelope after approval.
- [`pr-87-v2-workorder-paused.png`](pr-87-v2-workorder-paused.png) shows the
  WorkOrder awaiting publication review.
- [`pr-87-v2-run-paused.png`](pr-87-v2-run-paused.png) shows the final Attempt,
  candidate, receipt, gate, and no-PR state.
- [`pr-87-verifier-fail-closed-default.png`](pr-87-verifier-fail-closed-default.png)
  shows the repaired empty verifier default and disabled Create action.
- The `pr-87-*` captures without `v2` preserve the first fail-closed attempt.
- [`factory-readiness-blocked.png`](factory-readiness-blocked.png) and
  [`workorder-create-gate.png`](workorder-create-gate.png) preserve the earlier
  no-installation baseline.

## Deferred by this slice

Remote sandbox enforcement, provider CI ingestion, learning-ledger CRUD, trust
scoring, verified-throughput metrics, deployment, and production verification
were not changed or exercised.
