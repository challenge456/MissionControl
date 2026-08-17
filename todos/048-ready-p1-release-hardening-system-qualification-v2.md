---
status: in_progress
priority: p1
issue_id: "048"
tags: [release-hardening, dependency-security, system-qualification, e2e, accessibility]
dependencies: ["047"]
---

# Harden and qualify the governed Software Factory V2

## Problem Statement

The System Qualification V1 baseline is qualified with known limitations, including four moderate dependency advisories and no V2 composed proof covering Spec-driven Mission intake plus exact Generic Harness capability/configuration lineage. Mission Control needs the smallest justified release hardening changes and a durable V2 evidence packet before it can be treated as a coherent production-qualified software factory.

## Findings

- Exact fetched `origin/main` baseline is `ed2a8a9d686a7c1109aab381efa7eba369f8e996`.
- Runtime contract is v28.
- Merged PRs #111, #112, #113, and #114 are reachable from the baseline.
- This Codex worktree was clean, detached at the exact baseline, and is now isolated on `codex/release-dependency-hardening-v1`.
- The current dependency, credential, redaction, release-gate, routing, browser, and composed-qualification controls still require evidence-backed re-audit.

## Proposed Solutions

### Option 1: Evidence-only requalification

**Approach:** Re-run existing controls and document remaining advisories without changing gates or dependencies.

**Pros:** Smallest diff.

**Cons:** Insufficient if current advisories or missing deterministic release gates expose a production gap; V1 automation does not prove the newly merged Spec and Generic Harness lineage.

**Effort:** Medium

**Risk:** High false-confidence risk.

### Option 2: Minimal hardening plus V2 composed qualification

**Approach:** Reproduce actual risks, apply only safe compatible remediation and justified deterministic gates, extend the one canonical qualification entry point to V2, and capture complete browser/accessibility and authority evidence.

**Pros:** Directly proves release readiness without adding product scope or modernizing frameworks broadly.

**Cons:** Requires a full qualification and publication cycle.

**Effort:** High

**Risk:** Medium, bounded to release/security controls, tests, scripts, dependencies, and evidence unless a real production defect is proven.

## Recommended Action

Use Option 2. Stop before V2 if Hardening V1 leaves any high/critical advisory or release blocker. Keep runtime v28 unless a demonstrated public-contract defect requires explicit Product Owner review.

## Technical Details

Expected affected areas are dependency metadata, deterministic release/security scripts and CI, the canonical qualification orchestrator/composed tests, and the new `docs/testing/evidence/system-factory-e2e-v2/` packet. No new product navigation, feature domain, live provider integration, schema change, or public Convex API change is planned.

## Resources

- User-provided `Mission Control — Release & Dependency Hardening V1 → System Qualification V2`
- `docs/testing/evidence/system-factory-e2e-v1/`
- `scripts/system-factory-e2e-qualification.mjs`
- `todos/047-complete-p1-system-factory-e2e-qualification-v1.md`

## Acceptance Criteria

- [x] Exact baseline SHA, runtime, predecessor reachability, and existing-control inventory are recorded.
- [x] Current production and development advisories are reproduced, classified for actual Mission Control exposure, and minimally remediated or explicitly time-bounded.
- [x] Supply-chain, repository-integrity, credential, redaction, disclosure, web-security, and release-gate controls pass deterministically.
- [x] Hardening V1 records advisories before/after, accepted risks, dependency/config/gate changes, runtime/API impact, and returns `HARDENING PASS` before V2 begins.
- [x] The canonical golden path proves exact Constitution, Spec r1/r2/r3, Plan, Quality Contract, WorkOrder, Factory, Generic Harness, execution, independent verification, PR/currentness, acceptance, and Factory Learning lineage with no r3 rebinding.
- [x] The complete V2 failure matrix fails closed and preserves immutable historical evidence.
- [x] Security and canonical authority boundaries are machine/procedurally proved without credentials in outputs.
- [x] Browser qualification passes at 1440/1024/390, light/dark, Basic/Intermediate/Advanced, deep links, refresh/history, keyboard/focus, overflow, errors/requests, and targeted axe WCAG A/AA.
- [x] A new durable V2 evidence packet records exact lineage, security, failures, browser/accessibility, performance/cost, and full validation results without overwriting V1.
- [ ] Full tests, typecheck/lint/skill lint, runtime guard, production build, orchestration smoke, Git diff integrity, GitHub CI, and Vercel preview pass.
- [ ] A draft PR is created without auto-merge, production deployment, live exe.dev, PR #89, or other prohibited scope.
- [ ] Final report returns the required System Qualification V2 decision and `MERGE`, `PARTIALLY MERGE`, or `HOLD` recommendation.

## Work Log

### 2026-08-17 - Authoritative baseline established

**By:** Repository operator via Codex execution

**Actions:**

- Fetched `origin/main` and confirmed exact expected SHA `ed2a8a9d686a7c1109aab381efa7eba369f8e996`.
- Confirmed runtime v28 and predecessor merges #111–#114.
- Verified the provided Codex worktree was clean and isolated before creating `codex/release-dependency-hardening-v1`.
- Confirmed local execution environment Node v24.18.1 and pnpm 9.0.0.

**Learnings:**

- Main has not advanced from the expected qualification baseline.
- No runtime or public API delta is justified at baseline.

### 2026-08-17 - Hardening and local V2 qualification passed

**By:** Repository operator via Codex execution

**Actions:**

- Reduced the production audit from four to three moderate advisories and the complete graph from four low/nine moderate to two low/four moderate using six exact compatible overrides.
- Added exact, expiring advisory records; deterministic dependency and tracked-secret gates; pinned/frozen CI; scoped Vercel headers; orchestration path/error hardening; and docs XSS protections.
- Fixed a qualification-discovered Spec verification defect by binding Spec expectations to the real deterministic command verifier.
- Extended the canonical qualification composition to V2 and proved exact Spec r1/r2/r3, Plan, WorkOrder, harness, execution, verification, PR, acceptance, and learning lineage plus the complete failure matrix.
- Passed 1,727 repository tests with one intentional live-integration skip, TypeScript, skill lint, runtime guard, build, orchestration smoke, 9/9 independent browser gates, and the live responsive/accessibility matrix.

**Learnings:**

- React Router's remaining advisories require a separately qualified v7 migration; their current product preconditions are absent and the acceptance expires 2026-11-15.
- Browser qualification exposed nested main landmarks and loading states without stable page identity; both were minimally corrected before the final local pass.
- Live Remote Sandbox, PR #89 cross-company identity, Loom admission, and autonomous routing remain explicitly deferred boundaries.

## Notes

- Do not edit the attached governing plan.
- Do not weaken a gate for a passing result.
- Do not include credentials in evidence.
- Do not touch unrelated worktrees, branches, or stashes.
