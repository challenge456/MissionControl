---
status: complete
priority: p1
issue_id: "021"
tags: [software-factory, configuration, readiness, activation, convex, ui]
dependencies: ["020"]
---

# Add Versioned Factory Configuration and Activation

## Problem Statement

Mission Control has repository, workflow, policy, verifier, environment, host,
and executor primitives, but no immutable aggregate that freezes which exact
versions are allowed for one repository. Existing readiness displays are
projections and cannot safely gate dispatch.

## Recommended Action

Add a thin Factory identity, immutable configuration versions, and immutable
readiness assessments. Activation updates only the Factory's active-version
pointer and must fail closed unless a current passing assessment exists for the
exact configuration digest.

## Acceptance Criteria

- [x] A Factory is bound to one workspace repository.
- [x] Configuration versions reference existing workflow, policy, environment, and verifier records.
- [x] Version content is immutable after creation.
- [x] Readiness checks use explicit status, evidence, time, expiry, remediation, and root blocker.
- [x] Repository/App, workflow, executor, policy, budget, verifier, host, and recovery checks are deterministic.
- [x] Activation requires current passing evidence for the exact version digest.
- [x] Material changes create a new version and leave the prior active version auditable.
- [x] The guided UI is reachable from existing navigation and covers loading, empty, error, blocked, and success states.
- [x] Focused/full tests, typechecks, build, and browser journeys pass.

## Work Log

### 2026-08-02 - Versioned Factory configuration completed

**By:** Codex

**Actions:**

- Added repository-bound Factory definitions, immutable configuration versions,
  and immutable readiness assessments with deterministic configuration digests.
- Added scope validation for workflow, policy, environment, and verifier records
  plus strict V1 cost, runtime, and retry limits before version creation.
- Added fail-closed activation requiring a current passing assessment for the
  exact version digest and recorded the human activation in the activity ledger.
- Added the guided Factory configuration panel to Settings → Workspaces &
  Repositories without creating another primary navigation domain.
- Verified the live empty, draft, version-created, blocked-readiness, remediation,
  and disabled-activation states in the browser against the local Convex deployment.

**Verification:**

- Focused Factory and workspace UI tests pass: 8 tests.
- Full UI suite passes: 46 files and 198 tests.
- Full Convex suite passes: 55 files and 382 tests.
- Workspace lint/typecheck and all skill lint checks pass.
- Production UI build passes.
- Browser verification at `http://localhost:5180/v2/projects` records a real
  assessment, shows the exact GitHub/repository/host remediation, keeps activation
  disabled, and reports no console errors.
