# Clerk company authorization browser evidence

Verified on 2026-07-31 against the isolated local Convex deployment and UI.

| Flow | Result |
| --- | --- |
| Demo company/workspace context loads | Pass |
| Company members and governed roles render | Pass |
| Exact Clerk user ID member creation | Pass |
| Duplicate Clerk user ID | Pass; inline server error shown |
| Final active owner deactivation | Pass; server denied and inline error shown |
| Explicit Clerk mode without publishable key | Pass; fail-closed configuration screen |
| Browser page errors | None |

Evidence:

- `company-access-demo.png`
- `auth-configuration-error.png`

Real Clerk sign-in and cross-company isolation remain credential-dependent and
must be verified with two Product Owner supplied Clerk test identities before
the production auth mode is changed to `clerk`.
