---
date: 2026-07-31
topic: clerk-company-authorization
---

# Clerk company authorization

## What We're Building

Add Clerk as the production human identity provider for the React and Convex
application while keeping Mission Control's existing company, operator, role,
and assignment records authoritative for access. A signed-in Clerk user gains
no company access until an active operator record explicitly links that exact
Clerk user ID to a company account.

This slice also adds company-member administration and permission enforcement
to the human-facing company/workspace management contract. It preserves an
explicit local-demo mode for deterministic development and browser tests.

## Why This Approach

Clerk and Convex provide a supported React integration that validates Clerk
session tokens before `ctx.auth.getUserIdentity()` becomes available. Reusing
the current `tenants`, `operators`, `roles`, and `roleAssignments` tables avoids
a second organization model and keeps authorization decisions inside Mission
Control.

Clerk Organizations were considered and rejected for this phase because they
would duplicate company membership and policy state. Automatic email-based
membership claiming was also rejected: company authority must never depend on
an ambiguous or mutable email match.

## Key Decisions

- Use Clerk only for human authentication and session management.
- Use the Clerk subject/user ID as `operators.authId`; never persist tokens or
  secret keys.
- Keep Mission Control tenants and role assignments authoritative.
- Require explicit environment mode: `clerk`, `demo`, or `legacy`.
- Production Clerk mode fails closed when configuration or membership is
  missing.
- Demo mode remains explicit and visibly labeled; it is not a production
  fallback.
- Add exact-subject company membership administration for company owners.
- Keep service/agent/scheduler authority separate from human Clerk identity.
- Harden public human mutations incrementally; do not break internal overnight
  execution by assuming every call has a human session.
- Record successful membership and role changes in the audit activity stream.

## User Flows and Failure States

1. Signed out in Clerk mode: show a calm sign-in gate; no company queries run.
2. Signed in without membership: show No company access with the exact Clerk
   user ID needed by an administrator.
3. Signed in with one company: enter it automatically.
4. Signed in with multiple companies: select Company account above Workspace.
5. Company administrator: add/deactivate a member and assign company roles.
6. Non-administrator: inspect allowed company/workspace data but cannot mutate
   membership or company settings.
7. Expired/refreshing session: pause scoped Convex queries and show a stable
   authentication state instead of falling back to legacy data.
8. Missing Clerk/Convex configuration: show an operator-facing setup error and
   fail closed.

## Open Questions

- Development and production Clerk publishable keys and issuer domains must be
  supplied by the Product Owner's Clerk account before real sign-in can be
  browser-verified.
- Clerk invitations and email delivery are deferred; V1 membership uses an
  exact Clerk user ID to avoid unsafe identity linking.
- Agent/service identity enforcement across every execution endpoint remains a
  separate security phase after the human boundary is proven.

## Next Steps

Implement the Clerk/Convex provider boundary, authenticated application gate,
company member/role administration, focused permission guards, documentation,
and deterministic demo/auth tests. Then verify a real two-identity flow once
Clerk credentials are available.
