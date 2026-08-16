# Security and isolation qualification

## Result

**PASS WITH DOCUMENTED MODERATE DEPENDENCY FOLLOW-UP**

No qualification change introduces a secret, unsafe frontend execution sink, cross-Attempt binding, expanded sandbox authority, public API, or acceptance-authority bypass. Production dependency audit reports zero high/critical and four moderate advisories; these are documented below and do not originate in this branch.

## Checks performed

| Boundary | Machine check/evidence | Result |
| --- | --- | --- |
| Added secrets | Scanned added diff lines for private keys, GitHub tokens, AWS access keys, and populated secret/password/token assignments without printing matched values | PASS — 0 findings |
| Frontend execution sinks | Scanned touched TS/TSX for `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`, raw `innerHTML`, JavaScript URLs, and new `postMessage` use | PASS — 0 findings |
| Sandbox credential persistence | Manifest declares `secretValueIncluded=false`; journal persists `Omit<SandboxCredentialGrant, "secret">`; composed test asserts no `secret` property | PASS |
| Sandbox authority | Profile grants inference only, repository snapshot access, `githubAuthority=NONE`, `providerAuthority=NONE`; source scan rejects GitHub token/private-key authority | PASS |
| Credential lifecycle | Fake provider credential is revoked on success and teardown failure; cleanup failure event records revocation truthfully | PASS |
| Resource absence | Failed teardown records `resourceAbsenceProven=false` and leaves provider resource non-terminated | PASS |
| Worker identity | Admission and lease bind server-issued worker ID/session/generation and repository/backend capabilities; stale generation fails closed | PASS |
| Attempt isolation | Candidate, execution manifest, Context Package, verifier tuple, evidence, and receipt bind exact source/verifier Attempt IDs | PASS |
| Repository/workspace learning isolation | Exact cluster key includes workspace and repository; second repository produces a distinct cluster; duplicate evidence is suppressed | PASS |
| Verification authority | Verification Subject/Plan/independence are derived by canonical server libraries; verifier checkout and identity differ from source | PASS |
| Observability/Memory/Learning authority | Static scan and composed assertions show no acceptance mutation; all carry explanatory/advisory authority only | PASS |
| Acceptance authority | Repository scan finds `WORK_ORDER_ACCEPTED` only in `workOrders.ts`; current eligible lineage and human action remain required | PASS |
| Runtime surface | Runtime-contract guard against exact base SHA | PASS — 0 public API changes |

## Redaction review

- Qualification JSON and Markdown contain IDs, hashes, fixture URLs, durations, states, and counts only.
- Local `.env.local` is ignored, remains outside the evidence packet, and is never printed or committed.
- Sandbox lifecycle errors pass through the existing `safeMessage` boundary before journaling.
- Secret values are destructured away before credential-issuance records are persisted.
- Screenshots contain seeded demo data and no provider keys, access tokens, or service credentials.

## Dependency audit

Command: `pnpm audit --prod --audit-level high`

- 371 production dependencies assessed
- 0 critical
- 0 high
- 4 moderate
- 0 low

Advisory paths observed on 2026-08-16:

1. `yaml@2.8.2`, patched in `>=2.8.3`, through workflow-engine/orchestration/runtime and Vite paths.
2. `react-router@6.30.4`, with two moderate advisories whose reported patched line is `>=7.18.0`.
3. `react-router-dom@6.30.4`, one moderate advisory with no patched version reported on its current major line.

These dependencies and versions are present on the exact baseline; the qualification branch adds no dependency or lockfile change. Upgrading YAML can be handled as a bounded dependency patch. React Router requires a separate compatibility and migration assessment and should not be silently bundled into this zero-new-scope qualification. Re-run the audit immediately before production release because advisory data is time-sensitive.

## Deferred proof

PR #89’s live two-company identity qualification remains deferred by instruction. This run proves deterministic workspace/repository isolation where the existing fixtures allow it, but does not claim the separate cross-company live gate.
