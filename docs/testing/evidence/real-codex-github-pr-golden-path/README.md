# Real Codex-to-GitHub PR Golden Path — Browser Evidence

Date: 2026-08-09 PDT

Status: complete

Mission Control produced two real, review-ready pull requests in the existing
private `jaydubya818/MissionControl` repository. No additional repository was
created. Both pull requests were authored by the private Mission Control GitHub
App, remain open and unmerged, and have all nine repository checks passing.

## Governed GitHub App boundary

- The private App is installed only on `jaydubya818/MissionControl`.
- Its repository permission envelope is Metadata read, Checks read, Contents
  write, and Pull requests write.
- The durable worker reaches GitHub through a just-in-time installation token.
  Tokens and private key material are not persisted in Mission Control records,
  execution events, artifacts, or logs.
- Worker claims, heartbeats, ordered events, artifacts, and finalization cross
  the signed service-command boundary.
- Changed files are evaluated against the frozen approved scope before staging,
  push, or pull-request publication. A violation fails closed and produces an
  inspectable policy deviation.

## Clean recovered Mission — PR #61

This is the authoritative completed Mission proof.

| Lineage field | Persisted value |
| --- | --- |
| Mission | `vn71r4fwfze37ke4scakt5xt8s8c7eg2` — Complete governed GitHub App delivery proof |
| Approved plan | `vh7a7dxeds8p8nxw7c70rjj19s8c7a88` |
| WorkOrder | `kx7sm5meb0d1n9frm3v28aw15s8c7z3d` — Publish recovered governed GitHub App proof document |
| Task | `hn7p4kczscg86e0k6bc8p9n94n8c6zxq` |
| Attempt | Attempt 2, run `81n37kb5`, record `m97skgb9r5rgc013rgdkph1gv58c728q` |
| Branch | `mc/8aw15s8c7z3d` |
| Commit | `2fd0a5a0773560b05174776857545d7cd3bc5f95` |
| Changed file | `docs/software-factory/live-github-app-proof-recovery.md` |
| Pull request | [#61](https://github.com/jaydubya818/MissionControl/pull/61) |

The Task and WorkOrder are `DONE`. The linked worker receipt satisfied the
non-independent Mission assertion, the assertion count reached 1/1, and browser
operator acceptance moved the Mission to `DONE` with the presentation state
`Validated`. The structured handoff points the operator to PR #61 and explicitly
keeps it unmerged for review.

## Cancel, retry, error, and success — PR #62

The second chain proves immutable recovery history around the same production
worker and publisher.

| Lineage field | Persisted value |
| --- | --- |
| Mission | `vn75pnb8105dx5nvh4mz42sb9d8c3eh4` |
| Approved plan | `vh79c0dgqrkx5ezsvaqgy419nh8c2tmg` |
| WorkOrder | `kx7xc9qznqznh0njwbwdw7n6sx8c2zew` |
| Task | `hn7g3p6xc2fe5wxrepe96q59xx8c3hq7` |
| Attempt 1 | run `uz2zfs2y` — `CANCELED` before claim |
| Attempt 2 | run `hj8fvx2k` — `FAILED`, retry branch/worktree mismatch preserved |
| Attempt 3 | run `tq3574qq` — `FAILED`, missing approved verification command preserved |
| Attempt 4 | run `d4zexeg5` — `COMPLETED` |
| Branch | `codex/live-github-app-proof` |
| Commit | `53aadd7f91d100bc7cc6333ac8f81619b1958879` |
| Changed file | `docs/software-factory/live-github-app-proof.md` |
| Pull request | [#62](https://github.com/jaydubya818/MissionControl/pull/62) |

The successful attempt records the approved `git diff --check` command as
`PASS`, the exact changed file, commit, branch, pull-request event, and PR
artifact. The browser then recorded the verification receipt and accepted the
WorkOrder.

## Restart and idempotency proof

- The orchestration process was restarted after the real push/publication
  boundary.
- The completed run, exact commit, branch, changed-file list, and PR identity
  remained present after restart and browser refresh.
- Reconciliation found the existing pull request for each branch; it did not
  create a duplicate PR.
- Graceful worker shutdown now leaves an in-flight lease and durable worktree
  non-terminal so another worker can resume or reconcile it. Explicit operator
  cancellation still finalizes the run as `CANCELED`.
- Retries inherit the root attempt's branch/worktree binding instead of
  allocating a conflicting branch.

## Browser state coverage

All lifecycle mutations in the completed proof—dispatch/retry, verification
receipt, WorkOrder acceptance, and Mission acceptance—were performed through
the browser. Command-line access was limited to running services, tests, and
read-only verification.

- Loading: readiness and run projections render stable skeletons while Convex
  data resolves.
- Empty: WorkOrders with no canonical Tasks state exactly what is missing.
- Blocked/error: runtime-contract mismatch, failed attempts, missing execution
  policy, and GitHub readiness problems fail closed with operator remediation.
- Retry: every failed or canceled attempt remains immutable and linked to its
  successor.
- Cancel: the browser captures an operator reason and preserves the cancellation
  event after refresh.
- Success: the run shows execution binding, approved command result, file,
  commit, branch, PR artifact, and complete lineage.
- Refresh/restart: selection, terminal state, audit history, and PR identity are
  preserved.
- Responsive: completed, failed, canceled, and empty states were inspected on
  desktop and at 760 × 900.

## Screenshots

Live proof:

- `recovered-completed-attempt-pr-61.png` — recovered completed attempt and PR
  #61 execution evidence.
- `github-pr-61-lineage.png` — PR #61 in GitHub, App author, lineage body, and
  nine passing checks.
- `mission-validated-pr-61.png` — completed Mission, 1/1 assertion coverage, and
  `Validated` acceptance state.
- `completed-attempt-pr-62.png` — successful fourth attempt, approved command,
  exact file, commit, and PR #62.
- `accepted-work-order-pr-62.png` — browser-accepted WorkOrder and retained run
  evidence.
- `github-pr-62-lineage.png` — PR #62 in GitHub, App author, lineage body, and
  nine passing checks.

State matrix:

- `completed-run-desktop.png` and `completed-run-narrow.png` — stable completed
  run layouts.
- `failed-run-desktop.png` and `failed-retry-desktop.png` — failure detail and
  immutable retry history.
- `canceled-run-desktop.png` — durable cancellation and operator reason.
- `empty-task-canceled-workorder.png` — explicit no-Task state.
- `runtime-mismatch-error.png` — fail-closed runtime contract mismatch.
- `mission-draft-created.png`, `mission-plan-empty.png`,
  `mission-plan-draft-complete.png`, `mission-plan-awaiting-approval.png`, and
  `mission-plan-approved.png` — Mission planning states.
- `work-order-awaiting-approval.png`, `work-order-approvals-requested.png`,
  `work-order-approvals-approved.png`, and
  `work-order-factory-blocked-with-scope.png` — governed release and Factory
  gate states.
- `task-inbox.png`, `task-ready.png`, and `task-drawer.png` — Task intake,
  readiness, and execution detail.

## Deterministic verification

The following commands passed from the implementation worktree on 2026-08-09:

```text
pnpm run ci:typecheck
pnpm run build
pnpm run test
pnpm run ci:runtime-contract
pnpm exec vitest --config apps/orchestration-server/vitest.config.ts run \
  src/__tests__/durableCodexWorker.test.ts \
  src/__tests__/githubAppPublisher.test.ts \
  src/__tests__/serviceCommandClient.test.ts \
  src/__tests__/codexExecutorAdapter.test.ts
```

The repository test command passed all workspace suites, including 203 UI tests
and 421 Convex tests. The focused orchestration suite passed 16 tests. The
runtime-contract guard accepted the intentional public-contract increment from
v4 to v5. Production build output contains the existing large-chunk warning but
no errors.

## Deliberate stopping point

PRs #61 and #62 remain open and unmerged. This golden path proves governed work
through review-ready pull request and evidence-backed Mission acceptance; merge
and deployment remain explicit human decisions outside this scope.
