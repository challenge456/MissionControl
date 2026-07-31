# Task Attempt Scheduler browser and test results

Date: 2026-07-30
Browser: Playwright Chromium
Workspace: Software Factory Research Lab (`sn71gskbdemgf4z1trt9zdmm5h8bde69`)
Work Order: `yh72sn2jp02by6b2zr23pr01dh8bd4nb`
Branch: `codex/task-attempt-scheduler-pr2`

## Result

PASS for the bounded feature contract. The final traced browser journey
completed in 8.3 seconds (10.5 seconds including runner setup). It created and
assigned a governed Task, required explicit Task selection, created Attempt 1,
recorded a deterministic executor failure, required a recovery reason, created
Attempt 2 under the same Task, retained Attempt 1, reloaded, and verified one
Kanban card and persisted history.

Final evidence entities:

- Task SFRL-098: `wh75srcdxxc8n8mhbjncrsnqpd8bkark`
- Attempt 1: `ys77b6z7zq8rfjn6kffa3a00mh8bjvza`
- Attempt 2: `ys7c36xcqhke79kb71762mg6fh8bj9g2`

Cleanup status: retained as labeled audit evidence. The local executor later
failed the pending fixture run because no real executor was attached; both
Attempt records and their recovery relationship remain intact.

## Acceptance coverage

| Area | Evidence | Result |
|---|---|---|
| Explicit selection | Dispatch disabled until an eligible Child Task was selected | PASS |
| Governed start | Selected Task created Attempt 1 with canonical parent identity | PASS |
| Invalid targets | Focused policy tests rejected missing, foreign, cross-workspace, Inbox, Review, Done, and Canceled targets | PASS |
| Active collision | Policy blocked Pending, Running, and Paused Attempt collisions | PASS |
| Reasoned retry | Latest failed Attempt required a ten-character recovery reason | PASS |
| Stale/non-failed retry | Focused tests rejected older, other-Task, and completed runs | PASS |
| Immutable history | Attempt 1 remained Failed when Attempt 2 was created | PASS |
| Counts and one-card behavior | UI showed two total, one retry, and exactly one Task card | PASS |
| Persistence | Refresh retained both Attempts and the Task/Work Order relationship | PASS |
| Navigation | Task → Work Order, Back, and Forward restored the correct views | PASS |
| Accessibility | Axe reported zero critical violations | PASS |
| Runtime errors | Zero page errors and zero browser console errors | PASS |
| Network | Zero feature-relevant failed requests | PASS |

## Automated results

- Scheduler, Work Order dispatch, and projection: 46 focused tests passed.
- Browser acceptance: 1 passed.
- Root TypeScript gate: PASS after the independent schema repair in PR #49.
- Root production build: PASS.
- Diff whitespace validation: PASS.
- Skill validation: 10 skills, 0 errors, 0 warnings, average score 100.
- Full repository test suite: intentionally not run; this cycle uses bounded
  evidence to control cost.

The first scheduler CI run correctly exposed a pre-existing `main` regression:
release-gate tables/fields and automation-definition fields were used by
existing code but absent from `convex/schema.ts`. The independent repair was
documented, verified across all CI jobs, and merged as PR #49. This branch was
then rebased onto that repair; the combined root TypeScript and build gates
pass. The temporary local validator shim used during early evidence capture
was removed before the scheduler diff.

## Evidence files

- `01-explicit-task-selection.png`
- `02-first-attempt.png`
- `03-retry-preserves-history.png`
- `task-attempt-scheduler-trace.zip`

All files are under
`docs/testing/evidence/task-attempt-scheduler/`.

## Browser-environment finding

The first browser attempt found more than 300 abandoned automation browser
roots consuming the local backend's 16 concurrent-query allowance. Stale
automation roots older than one hour were stopped. After cleanup, application
queries recovered and the deterministic feature journey passed. This was an
environment leak, not a scheduler defect; automation sessions should close
their browser contexts after evidence capture.
