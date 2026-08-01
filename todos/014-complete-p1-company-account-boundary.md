---
status: complete
priority: p1
issue_id: "014"
tags: [company, tenant, workspace, authorization, ui, migration]
dependencies: []
---

# Add the company account boundary

## Problem Statement

Mission Control has tenant records but the UI lists every workspace globally
and has no company context. A second business would make saved workspace state,
workspace administration, and aggregate counts ambiguous. A client-selected
tenant ID cannot be treated as authorization.

## Findings

- `tenants`, `operators`, roles, and role assignments already exist.
- Operators can be associated with multiple tenants through separate operator
  records sharing one authenticated `authId`.
- The UI has no configured authentication provider today.
- `projects.list` is global and the workspace selector has no company filter.
- Existing `?workspace=<projectId>` and `mc.last_project` recovery behavior must
  remain intact.
- The source SDD is
  `docs/plans/2026-07-31-feat-company-workspace-repository-control-plane-plan.md`.

## Proposed Solutions

### Option 1: Add a cosmetic client-side company filter

**Pros:** Small and fast.

**Cons:** Leaks counts and records and provides no authorization boundary.

**Risk:** Unacceptable.

### Option 2: Add an auth-resolved server context with an explicit demo adapter

**Pros:** Provider-agnostic, fail-closed by default, testable locally, and
compatible with the current workspace model.

**Cons:** Full delivery-object authorization remains a follow-on enforcement
pass.

**Risk:** Controlled when rollout remains flagged and limitations are explicit.

## Recommended Action

Implement Option 2. Add company-access helpers and scoped APIs, persist/recover
company selection, clear workspace state on account change, evolve the existing
settings page for company profile and workspace administration, and preserve
legacy behavior when the rollout flag is disabled.

## Acceptance Criteria

- [x] A single accessible company is entered automatically without a selector prompt.
- [x] Multiple accessible companies render a selector above Workspace.
- [x] Company selection persists in URL and local storage.
- [x] Changing company clears inaccessible workspace state before recovery.
- [x] Workspace lists and company counts do not include other companies.
- [x] Server company/workspace administration resolves access from auth identity.
- [x] Anonymous access fails closed unless the explicit demo environment flag is enabled.
- [x] Authorized admins can update company profile fields.
- [x] New workspaces are created inside the selected company.
- [x] Existing workspace URLs and single-company behavior remain compatible.
- [x] Loading, no-membership, unauthorized, inactive-company, recovery, error, and success states are explicit.
- [x] Automated tests, typecheck, build, and browser verification pass.

## Work Log

### 2026-07-31 - Started isolated implementation

**By:** Codex

**Actions:**

- Created `codex/company-account-boundary` from published `main` in an isolated
  worktree.
- Confirmed the provider-agnostic, environment-gated demo approach.

**Learnings:**

- Existing identity data is sufficient for the company context, but the app
  still needs a production authentication-provider decision before enforcement
  can be enabled outside controlled environments.

### 2026-07-31 - Completed company boundary slice

**By:** Codex

**Actions:**

- Added auth-resolved company membership helpers and company-scoped workspace,
  summary, profile-edit, and workspace-create APIs.
- Added Company account above Workspace with URL/local recovery and safe
  cross-account switching.
- Added fail-closed loading/access states, explicit local-demo access, stale
  profile edit detection, audit activity, and bounded server inputs.
- Updated the Workspaces & Repositories page, rollout docs, and operator docs.
- Browser-tested two companies, isolated workspace fleets, company profile
  editing, workspace creation, invalid-link recovery, and switch persistence.

**Verification:**

- Full repository test suite passed after building internal workspace packages.
- Mission Control UI typecheck and production build passed.
- Convex function compilation and focused access tests passed.

**Boundary:**

- This completes company selection and company/workspace administration.
  Production identity-provider configuration and authorization enforcement for
  every delivery object remain the next controlled rollout phase.
