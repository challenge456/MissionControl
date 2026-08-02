# Company Control Plane Verification — 2026-08-01

## Outcome

PASS. The company → workspace → repository → code-scope hierarchy is operational in the v2 shell, role lenses are server-scoped, the two-business scale fixture is idempotent, repository parity is clean, dispatch fails closed with persistent evidence, and the UI is usable at desktop and compact widths.

## Release receipt

- Feature PR: [#59 — Complete company workspace repository control plane](https://github.com/jaydubya818/MissionControl/pull/59).
- Feature commit: `bf268d647f9728a1d8b3316a93555edfcf41bf3f`.
- Verified `main` merge commit: `2de2b26b5917ba9a15242dfd500ada5fb8743fb9`.
- GitHub checks: Smoke Test, TypeScript Type Check, Lint, Unit Tests, Build, E2E Tests, and both Vercel deployments passed.
- PR rollout contract: Engineering/company administrator owner, one workspace at a time, 24-hour validation window, explicit monitoring and rollback triggers.

## Automated evidence

| Check | Result |
|---|---|
| `pnpm run ci:test` | PASS — 1,145 tests across UI, packages, and Convex |
| `pnpm run ci:lint` | PASS — all TypeScript workspaces and 10 Mission Control skills; 0 warnings/errors from skill lint |
| `pnpm run build` | PASS — production UI and all buildable workspaces |
| Focused control-plane backend tests | PASS — 43 assertions |
| Focused control-plane UI tests | PASS — 7 tests, including stale-scope recovery, Company drill-down, and the five-member Team lens |
| `pnpm exec convex codegen` | PASS — schema and functions accepted by the local deployment |
| Runtime contract guard | PASS — public Convex contract advanced atomically from version 3 to version 4 |

React Router emitted its existing v7 future-flag notices during UI tests; they are informational and are not test failures.

## Scale and migration evidence

- Fixture key: `company-control-plane-scale-v1`.
- Initial fixture: 2 business workspaces, 10 Scrum teams, 50 developers, 250 Missions, 250 Mission assignments, 250 WorkOrders, 50 representative runs, and 50 approvals.
- Second seed: `created: false`, proving idempotency.
- Each fixture workspace displays 5 teams, 25 people, and 125 active epics.
- Repository parity: 3/3 accessible workspaces match their legacy default-repository projection; zero mismatches.
- Deterministic ownership dry-run on SellerFi Marketplace scanned 125 Missions and 125 WorkOrders: 250 already scoped, 0 updates, 0 ambiguous, and 0 unresolved.
- Scale query wall time, including Convex CLI startup: Company lens 0.92s; Workspace lens 0.77s.
- Fixture removal is implemented but was not run after verification so the local URLs remain populated for product review.

## Rollback rehearsal

`control-plane.role-lenses` was disabled for the SellerFi Marketplace workspace. The server returned a recoverable `SCOPE_ERROR` instead of the new projection. Re-enabling the same workspace-scoped flag immediately restored the Workspace lens and its authorized data. No records were deleted or rewritten during the rehearsal.

## Dispatch enforcement evidence

A WorkOrder-scoped dispatch was deliberately sent with a repository from another workspace. Result:

- No workflow run was created.
- Enforcement receipt: `kd7vyp3csn5ynx7tpc9x6p6pkx8bqkp9`.
- Reasons: `REPOSITORY_OUTSIDE_WORKSPACE`, `CODE_SCOPE_REPOSITORY_MISMATCH`, `APPROVED_HOST_BINDING_REQUIRED`, and `WORK_ORDER_REPOSITORY_MISMATCH`.

Earlier local-host validation also produced receipt `kd7zpkzycqteq8qbgt5r2sgfxn8bp0qt` with `APPROVED_HOST_BINDING_REQUIRED`. These checks prove both the workspace boundary and host-binding boundary fail closed before run creation.

Executor binding additionally fails closed unless the host report is company-authorized and carries fresh runtime, approved-model, network-policy, secret-policy, and capacity attestations. These are status/identifier fields only; no secret material enters the receipt.

## Browser evidence

Validated with a clean browser session against `http://localhost:5210`:

- Company selector precedes workspace selection in the v2 sidebar.
- Company lens displays all accessible workspaces and their team/member/epic totals.
- Company remains read-oriented; selecting another business visibly enters its Workspace lens before mutation controls become available.
- Workspace lens displays five teams; Team lens displays one team's five developers and twenty-five epics.
- My Work is truthfully empty for the local demo administrator because that identity has no personal member mapping.
- Repository and code-scope filters persist in the URL and constrain canonical Missions and WorkOrders.
- A cross-workspace repository ID produces `Operating scope unavailable`; Reset operating scope removes the invalid parameters.
- Workspaces & Repositories displays the connected repository, five governed monorepo scopes, five teams, and twenty-five members.
- WorkOrder inspection exposes the combined owning-team, reviewer, approval, and verification requirements produced by cross-scope dispatch.
- Compact viewport `390×844` remains operable; desktop was also inspected at 200% zoom.
- Browser console errors: none.

Screenshots:

- [Company lens](evidence/company-control-plane-company.png)
- [Team member capacity, proof, and epic ownership](evidence/company-control-plane-team.png)
- [Compact company lens](evidence/company-control-plane-compact.png)
- [Workspace and repository administration](evidence/company-control-plane-settings.png)

## Local review URLs

- Command Center: `http://localhost:5210/v2/command-center?company=wx74rg6ftfvzpq8hhtcjh4qve58b64w8&workspace=sn76tcw5pptbpp95bqkgamgf8h8bqpvg&lens=company`
- Administration: `http://localhost:5210/v2/projects?company=wx74rg6ftfvzpq8hhtcjh4qve58b64w8&workspace=sn76tcw5pptbpp95bqkgamgf8h8bqpvg`

The IDs above belong to the local Convex fixture and are not production identifiers.
