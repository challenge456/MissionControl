# Browser-governed Factory dispatch evidence

Date: 2026-08-12

Environment: isolated local Research Lab at `http://127.0.0.1:5199`

Workspace: `Mission Control Factory`

Repository: `jaydubya818/MissionControl`

## Outcome

The browser can define the repository code scope, select a versioned workflow,
create the local human-review governance baseline, bind an independent verifier
and approved agent version, and create an immutable Factory version. The
WorkOrder form then resolves only active Factory-owned scopes and presents exact
JSON argv rather than shell-like text.

The isolated exercise stopped fail-closed before Factory activation. The local
environment has no repository-scoped GitHub App installation or private App
credentials, so the readiness assessment correctly reported `BLOCKED` and the
WorkOrder form disabled creation with `Factory: Unavailable`. No installation,
host identity, approval, run, branch, or pull request was fabricated to make the
exercise appear complete.

This is an external test-environment prerequisite, not an unresolved fallback
in the application. The orchestration runtime now reports its real checkout at
startup; a clean post-commit worker can satisfy the host check. A real GitHub App
installation is still required to repeat the full browser create → approve →
dispatch → verified pause exercise.

The separate PR #72 proof already covers the worker portion that follows
dispatch: one Attempt paused after verification, survived a full orchestration
restart, resumed after unconditional human approval, consumed a candidate-bound
publication permit, and created PR #73. See
[`../pr-72-human-review-resume/README.md`](../pr-72-human-review-resume/README.md).

## Captures

- [`factory-readiness-blocked.png`](factory-readiness-blocked.png) shows the
  immutable Factory version, approved scope, verifier, runner, GitHub App
  blocker, and missing host report.
- [`workorder-create-gate.png`](workorder-create-gate.png) shows the governed
  create form with stable repository selection, Factory-owned scope gating,
  exact JSON argv, and human review before dispatch and publication.

## Deferred by this slice

Remote sandbox enforcement, provider CI ingestion, learning-ledger CRUD, trust
scoring, verified-throughput metrics, deployment, and production verification
were not changed or exercised.
