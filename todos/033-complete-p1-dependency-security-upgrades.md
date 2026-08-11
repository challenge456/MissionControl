---
status: complete
priority: p1
issue_id: "033"
tags: [security, dependencies, compatibility, software-factory]
dependencies: []
---

# Compatibility-Tested Dependency Security Upgrade

## Problem Statement

The dependency lockfile on `main` contains known security advisories that are
independent of the Research Lab adapter. The earlier audit recorded 12 high
findings; the current 2026-08-11 registry snapshot has expanded to 3 critical,
38 high, 75 moderate, and 10 low affected dependency instances. Critical and
high findings block safe continuous scheduling.

## Findings

- Direct vulnerable surfaces include Vitest 1, Vite 5, Hono 4.11,
  `@hono/node-server` 1.19, and `ws` 8.19.
- The root `@taskmasterai/cli` and `concurrently` development trees contribute
  vulnerable transitive packages including `undici`, `axios`, `fast-uri`,
  `form-data`, `lodash`, and `shell-quote`.
- The audit snapshot changed after the original 12-high report because new
  advisories were published against the existing lockfile. The remediation
  must use the current registry result as its acceptance baseline.
- Vite and Vitest require tested major upgrades for their 2026 advisories.
  Runtime packages should remain on the smallest secure compatible major when
  a patched release exists.

## Recommended Action

Upgrade direct dependencies to the smallest maintained secure versions, refresh
safe transitive ranges, and add only narrowly justified overrides where an
upstream range cannot otherwise select a patched release. Do not mix application
feature changes into this pull request.

## Acceptance Criteria

- [x] Remove all critical and high audit findings, or document an upstream-only
  exception with exploitability analysis and a concrete follow-up.
- [x] Upgrade Vitest and Vite together and prove every existing test suite and
  production UI build remain compatible.
- [x] Upgrade Hono, the Hono Node server, and `ws` without changing application
  behavior or the declared Node support floor unnecessarily.
- [x] Refresh the Taskmaster and concurrently transitive trees, using targeted
  overrides only when required for a patched version.
- [x] Run the full repository tests, typecheck, lint, production build, audit,
  and runtime contract checks.
- [x] Keep continuous scheduling disabled and make no Research Lab behavior
  changes in this pull request.

## Work Log

### 2026-08-11 - Audit and Isolation

**By:** Codex

- Created an independent worktree from `main` so dependency remediation is not
  coupled to the Research Lab PR stack.
- Re-ran the live registry audit and found 3 critical, 38 high, 75 moderate,
  and 10 low affected instances across 30 vulnerable modules.
- Selected compatibility-bounded upgrades rather than a blanket latest-major
  update of the full application stack.

### 2026-08-11 - Remediation and Compatibility Proof

**By:** Codex

- Upgraded Vitest from 1.x to 3.2.7 and Vite from 5.x to 6.4.3, the smallest
  maintained majors that clear their critical/high advisories on Node 18+.
- Upgraded Taskmaster to 1.1.4 and declared secure floors of Hono 4.12.34,
  `@hono/node-server` 1.19.13, and `ws` 8.21.3. The lockfile resolves Hono
  4.13.1 and the Hono server 1.19.17. Kept the Hono server on major 1 to
  preserve the declared Node 18 floor.
- Rejected the package manager's generated 49-override fix because it would
  have forced React Router, Turbo, and the Hono server across unrelated major
  versions. Retained 14 exact same-major overrides only for transitive
  critical/high packages.
- Added `ci:prepare` to the root test gate after the first fresh-worktree run
  exposed strict Vite 6 package-export resolution before workspace build
  artifacts existed.
- The final audit reports 0 critical and 0 high affected instances, down from
  3 critical and 38 high. Ten moderate and four low instances remain; clearing
  all of those requires separate major upgrades or addresses lower-severity
  upstream-only issues and is intentionally outside this high-severity slice.
- Full tests passed under Vitest 3: 48 UI files (205 tests), all workspace
  package tests, and 63 Convex files (433 tests).
- Frozen install, typecheck, lint, production Vite 6 build, runtime-contract
  guard, Taskmaster CLI load, and orchestration runtime imports all passed.
- Browser smoke passed on the upgraded Vite 6 dev server: the v2 Tasks surface
  rendered real workspace data with zero page errors and only Vite/React
  informational console messages. Screenshot evidence:
  `/tmp/dependency-upgrades-vite6-smoke.png`.
- Continuous scheduling remained disabled and no Research Lab product behavior
  changed.

## Notes

- This todo records the current audit truth even though it exceeds the earlier
  12-high snapshot.
- Do not enable automatic scheduling in this slice.
