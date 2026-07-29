# Task-to-Work-Order browser and test results

Date: 2026-07-28
Browser: Playwright Chromium
Workspace: Software Factory Research Lab (`sn71gskbdemgf4z1trt9zdmm5h8bde69`)
Work Order: `yh720mxa1zg8bb1r23ye0twxzs8bdbx8`
Git commit: pending publication
CI run: pending draft PR

## Result

PASS. The final deterministic browser journey completed in 9.4 seconds (11.6 seconds including runner setup). It verified governed creation, Ungoverned intake, blocked execution, linking, active transition, child rollup, Attempt projection, refresh persistence, routed Back/Forward behavior, workspace scoping, and zero critical accessibility violations.

Final evidence entities:

- Governed Task: SFRL-087, `wh77ey42w2d9hjqem9bkem81dn8berry`
- Ungoverned-then-linked Task: SFRL-088, `wh70gwea5ppa78gs6z7dhs5gb98bezqk`
- Both resolve to Work Order `yh720mxa1zg8bb1r23ye0twxzs8bdbx8`.
- SFRL-088 persisted as `ASSIGNED` after refresh.

Cleanup status: retained as labeled audit evidence. Earlier failed-test entities were also retained rather than deleted so their Activity and Task Event history remains reviewable.

## Acceptance coverage

| Area | Evidence | Result |
|---|---|---|
| Work Order preselection | New Task dialog opened from Work Order detail | PASS |
| Mission and delivery preview | Dialog showed Mission, repository, risk, and state | PASS |
| Governed creation | Task created through UI and rendered once | PASS |
| Kanban context | Card showed Work Order, Mission, and `GOVERNED` | PASS |
| Parent navigation | Task Parent Delivery navigated to exact Work Order | PASS |
| Child Tasks | Work Order detail showed Task plus separate progress/readiness | PASS |
| Ungoverned intake | Global dialog created parentless Inbox Task | PASS |
| Invalid transition | Assign returned the required actionable error; state stayed Inbox | PASS |
| Linking | Operator selected same-workspace Work Order and received confirmation | PASS |
| Allowed transition | Linked Task moved Inbox → Assigned | PASS |
| Attempt projection | Existing Task with two WorkflowRuns rendered one card, Attempt 2, one retry | PASS |
| Persistence | Reload preserved Work Order linkage, governance, and Assigned state | PASS |
| Browser history | Task → Work Order was one route entry; Back and Forward restored views | PASS |
| Workspace isolation | Selectors were queried by workspace; backend helper rejected cross-workspace parents | PASS |
| Accessibility | Axe reported zero critical violations | PASS |
| Runtime errors | Zero page errors and zero browser console errors | PASS |
| Network | Zero feature-relevant failed requests | PASS |

## Automated results

- Focused backend/UI contract suite: 47 tests passed.
- Browser acceptance: 1 passed.
- Root typecheck: PASS.
- Root lint and skill validation: PASS (10 skills, 0 errors, 0 warnings, average score 100).
- Full repository test suite: PASS (926 tests).
- Production build: PASS.

## Evidence files

- `01-new-task-preselected.png`
- `02-work-order-child-task.png`
- `03-governed-kanban-card.png`
- `04-task-parent-delivery.png`
- `05-ungoverned-kanban-card.png`
- `06-linked-parent-delivery.png`
- `07-attempt-projection.png`
- `task-workorder-linkage-trace.zip`

All files are under `docs/testing/evidence/task-workorder-linkage/`.

## Findings during verification

The first browser pass found that the Task header action could sit beneath the agent rail at a 1280-pixel viewport because the shared header switched to a horizontal layout based on viewport width while the three-column shell left a narrow content container. The shared PageHeader breakpoint now remains stacked until `2xl`. The rerun confirmed the visible New Task control is pointer-operable.

The local Convex dataset also contained `contextEvalRuns.releaseDeploymentId` from unrelated newer main-worktree work. A temporary local validator shim allowed the clean origin/main branch to load the existing dataset for browser validation. The shim was removed before the PR diff. This branch does not include that unrelated schema change.
