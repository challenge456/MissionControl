# V1 Operational Hardening Evidence

Verified on 2026-08-11 against the candidate worktree at
`http://localhost:5199/v2/control-work-orders` and the Convex development
deployment `tidy-perch-446`.

## Outcome

The Execution Run Inspector now derives one fail-closed review package from the
authoritative Attempt, WorkOrder revision, verification receipts, exact pull
request head, GitHub CI evaluation, file lineage, risks, deviations, and
rollback guidance. It also exposes bounded lease recovery and checkpoint state.

The historical browser proof is correctly `BLOCKED`: its receipt was signed by
the execution worker, and its older GitHub CI record has no persisted open-PR
state. Mission Control does not manufacture a green state for a closed audit
artifact.

## Browser state matrix

| State | Evidence | Result |
| --- | --- | --- |
| Completed but conflicting evidence | Run `05xd3s0o`, PR #63 lineage | `BLOCKED`; requires an independent verifier and current open-PR evidence |
| Completed with missing publication evidence | Run `auto-demo-2` | `INCOMPLETE`; missing PR/head, exact-head CI, file lineage, and rollback guidance |
| Failed | Run `lymckbzi` | `BLOCKED`; failed Attempt and stale evidence are explicit |
| Canceled | Run `uz2zfs2y` | `BLOCKED`; canceled Attempt is the first next action |
| Missing/deauthorized deep link | Invalid `run` query value | `Run unavailable` alert with a close action; no invalid Convex ID is queried |
| Refresh | WorkOrder and `run` query values | Inspector, recovery state, and review package reopen after reload |
| Narrow viewport | 390 × 844 | No root or inspector horizontal overflow; dialog remains keyboard operable |
| Keyboard | Inspector dialog | Focus lands on the named Close button; Escape closes and removes the run deep link |
| Console | Full state pass | No browser warnings or errors |

The deterministic component and model suites cover `READY`, `RECOVERABLE`,
`RECOVERED`, `EXHAUSTED`, loading, and missing-data rendering. A live `READY`
receipt was intentionally not fabricated after proof PRs #61–#63 were closed;
a future real candidate becomes ready only after GitHub reports `OPEN`, exact-head
CI passes, and an independent verifier records criterion evidence.

## Screenshots

- [Desktop review package](./review-package-desktop.png)
- [Narrow review package](./review-package-narrow.png)

## Automated verification

- Node.js `v20.20.2`
- UI: 50 files, 213 tests passed
- Convex: 67 files, 463 tests passed
- All workspace package tests passed
- Full typecheck passed
- Runtime contract guard passed across 811 public Convex functions
- Lint and skill validation passed with zero warnings or errors
- Production build passed

The existing Vite bundle-size advisory remains unchanged and is not introduced
by this hardening work.
