---
date: 2026-08-12
topic: browser-governed-factory-dispatch
---

# Browser-Governed Factory Dispatch

## What We're Building

Mission Control will make the existing Work Orders screen the complete operator
entry point for a governed Factory Attempt. A browser-created WorkOrder will
persist its workspace repository, approved code scope, accountable team and
owner, local execution environment, and exact independent-verification argv.
Its dispatch gate will resolve and display the exact active Factory version and
current clean host binding before creating an Attempt.

The target journey is:

`create scoped WorkOrder → request and approve pre-dispatch review → dispatch
through active Factory → independently verify → pause before GitHub publication`

The existing Approvals screen remains the authority for both the ordinary
pre-dispatch decision and the later Factory-owned publication checkpoint.

## Why This Approach

### Recommended: complete the existing WorkOrder contract and dispatch gate

Use the repository registry, organization structure, immutable Factory version,
and host binding records that already exist. Creation stores stable IDs rather
than browser-authored labels. Dispatch sends the selected immutable Factory
version and current host identity, while the server revalidates every binding
and rejects a scope not approved by that Factory version.

This is the smallest path to the North Star because it removes CLI and direct
database setup from the operator journey without creating another dispatch API,
another lifecycle, or another navigation domain.

### Rejected: keep free-form repository, workflow, and argument fields

Free-form labels cannot establish workspace authority. Whitespace parsing also
changes commands such as `node -e "..."` by turning one argument into several.
Keeping those fields would preserve the exact defects this slice must close.

### Rejected: add a separate Factory launch wizard

A second wizard would duplicate WorkOrder creation and make it unclear whether
the WorkOrder or wizard owns execution scope. The existing Work Orders detail is
already the authoritative dispatch surface.

## Key Decisions

- WorkOrder creation selects one ready workspace repository and one active code
  scope approved by that repository's active Factory version.
- The selected scope determines the owning-team default; the operator must pick
  one active accountable member of that team.
- V1 browser Factory execution is explicitly `LOCAL` and requires a current,
  clean, `READY` host binding for the exact repository.
- The workflow is inherited from the active Factory version rather than typed
  by the operator.
- Verification arguments are entered as a JSON string array and persisted
  without shell parsing or whitespace splitting.
- A single human-review policy creates the ordinary pre-dispatch
  `HUMAN_REVIEW` requirement and reserves publication for the separate
  Factory-owned human-review checkpoint.
- Code-scope approval policy is a controlled gate identifier. Descriptive
  guidance is stored separately and never becomes an approval type.
- Browser state is advisory. Dispatch revalidates the exact active version,
  assessment, repository, scope, workflow, host, policy, and authority in one
  server transaction and fails closed if anything changed.

## Required States

- Loading repository, organization, Factory, scope, and host configuration.
- Configuration missing: no ready repository, active Factory, approved scope,
  active team/owner, or clean current host.
- Awaiting the ordinary pre-dispatch approval.
- Ready to dispatch with a visible frozen-binding summary.
- Dispatch rejected because a binding changed after the browser loaded it.
- Attempt running, failed, or durably paused for publication review.
- Refresh-safe redisplay of the same WorkOrder, Attempt, and approval lineage.

## Deferred

Remote sandbox enforcement, learning-ledger CRUD, trust scoring,
verified-throughput metrics, fleet scheduling, and any additional deployment or
production-verification expansion are outside this slice. Existing CI, release,
and production records are not redesigned here.

## Next Step

Implement
`docs/plans/2026-08-12-feat-browser-governed-factory-dispatch-plan.md`.
