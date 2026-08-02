---
status: ready
priority: p1
issue_id: "015"
tags: [authentication, authorization, clerk, convex, company, rbac]
dependencies: ["014"]
---

# Add Clerk company authorization

## Problem Statement

Mission Control has company-scoped APIs but no production human identity
provider. Local demo access cannot establish production authority, and company
membership/roles cannot yet be managed safely from the product.

## Findings

- Convex already resolves identity through `ctx.auth.getUserIdentity()`.
- `operators.authId`, tenant roles, and scoped assignments already exist.
- The React entry point uses unauthenticated `ConvexProvider`.
- No Clerk configuration or credentials are present in the repository.
- Human and service mutations are currently interleaved, so blanket Clerk
  enforcement would break automation.
- Source SDD:
  `docs/plans/2026-07-31-feat-clerk-company-authorization-plan.md`.

## Proposed Solutions

### Option 1: Clerk Organizations as company accounts

**Pros:** Hosted membership and invitations.

**Cons:** Duplicates Mission Control tenants, roles, policy, and audit state.

**Risk:** High synchronization and authority ambiguity.

### Option 2: Clerk identity with Mission Control authorization

**Pros:** Supported Convex integration, one authoritative company model,
explicit role policy, and deterministic local demo support.

**Cons:** Mission Control must own membership administration and service
identity remains a separate phase.

**Risk:** Controlled with fail-closed modes and incremental endpoint hardening.

## Recommended Action

Implement Option 2. Clerk authenticates humans; existing tenants, operators,
roles, and assignments authorize actions. Use exact Clerk subjects only and
keep demo, legacy, and Clerk modes explicit.

## Acceptance Criteria

- [x] Clerk/Convex provider integration is implemented without committed keys.
- [x] Signed-out/loading/no-membership/configuration-error states fail closed.
- [x] Company membership and role administration is server-authorized.
- [x] Last-owner, duplicate membership, tenant-role, and inactive-member
  invariants are enforced.
- [x] Company/workspace administration uses named permission checks.
- [x] Demo mode remains explicit and browser-operable.
- [x] Human versus service endpoint enforcement inventory is documented.
- [x] Automated tests, typecheck, build, and browser verification pass.
- [ ] Real Clerk login is verified after credentials are provided.

## Work Log

### 2026-07-31 - Started implementation

**By:** Codex

**Actions:**

- Confirmed Clerk as the approved provider from the Product Owner's direction.
- Researched current official Clerk/Convex integration guidance.
- Chose Mission Control tenants and roles as the sole authorization authority.
- Created an isolated branch from current `main`.

**Learnings:**

- Clerk credentials are not present, so real login verification requires
  Product Owner input after code and deterministic demo paths are ready.
- Service authority cannot safely be replaced by a fabricated human session.

### 2026-07-31 - Implementation and deterministic verification complete

**By:** Codex

**Actions:**

- Added staged Clerk/Convex providers with explicit legacy, demo, and Clerk modes.
- Added exact-subject company membership, governed roles, one-time owner
  bootstrap, last-owner protection, audits, and the Company access UI.
- Hardened company/workspace, tenant/operator, role, and assignment APIs.
- Documented the human-versus-service authorization boundary for delivery APIs.
- Passed Convex compilation, repository typecheck, 50 Convex test files (353
  tests), all workspace test suites, the production UI build, and browser flows.

**Remaining external verification:**

- Supply the Clerk publishable key, public issuer, and two test identities.
- Verify real sign-in, sign-out, session refresh, and cross-company isolation
  before changing a deployed UI to `VITE_AUTH_MODE=clerk`.
