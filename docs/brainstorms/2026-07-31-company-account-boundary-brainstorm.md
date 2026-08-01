---
date: 2026-07-31
topic: company-account-boundary
---

# Company account boundary

## What We're Building

Add a durable company context above the existing workspace context. An operator
with one accessible company enters it automatically; an operator with multiple
companies can switch accounts above the workspace selector. Changing company
clears incompatible workspace state, reloads only authorized workspaces, and
preserves the existing `?workspace=<projectId>` contract inside the account.

This slice also adds company-profile administration and ensures newly created
workspaces belong to the active company. It does not introduce teams or the
role-aware Command Center lenses yet.

## Why This Approach

The repository already has `tenants`, `operators`, roles, and scoped role
assignments. Reusing them is safer than adding a parallel organization model.
The server will resolve company access from Convex authentication identity. An
explicit environment-gated demo adapter supports local verification because no
application authentication provider is configured today. Client-provided
company IDs are never treated as proof of membership.

## Key Decisions

- Keep `tenants` as company accounts and `projects` as workspaces.
- Add provider-agnostic company-access helpers around `ctx.auth`.
- Permit anonymous local/demo access only when a backend environment flag is
  explicitly enabled; the default is fail-closed.
- Hide the selector for a single account and show the company name instead.
- Encode company selection in URL and local storage, but authorize it again on
  the server.
- On account change, clear workspace query state before selecting an accessible
  workspace from the new company.
- Put company profile and workspace creation on the existing
  **Workspaces & Repositories** page.
- Preserve legacy workspace APIs behind the rollout flag; do not claim that all
  delivery functions are tenant-enforced in this slice.

## Open Questions

- Which production authentication provider should supply Convex identity?
  This implementation intentionally does not choose one.
- Full authorization of every Mission, WorkOrder, run, approval, and evidence
  function remains a separate enforcement pass before production rollout.

## Next Steps

Implement the company context and guarded workspace-administration boundary,
then verify single-account, multi-account, invalid-account, and cross-account
workspace recovery paths.
