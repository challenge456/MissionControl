# Governed Hardening V2 reconciliation evidence

This directory records the current-main reconstruction and qualification of the
lost Governed Hardening V2 implementation. It does not rewrite the historical
V1 or V2 evidence directories.

## Recovery and baseline

- Historical target: `06a4fc6843a11b1cc6f65e421a0843054e26e027` on
  `codex/mission-control-governed-hardening-v2`.
- Recovery result: not recoverable after checking local refs and reflogs,
  dangling objects, alternate local object databases, bundles, patches,
  registered and archived worktrees, Codex backup refs, attachments, and
  origin/GitHub refs.
- Authoritative reconstruction sources: the final-reconciliation brief; the
  surviving reviewed hardening series ending at
  `ed504650b7c5d4b607ec75dadf6b416f40556782` and its
  `HARDENING_REPORT.md`; prior closeout evidence; then current-main source and
  tests.
- Exact baseline: `d902fae7032c0696b531c44ae88829c652516fc6`, runtime v31.
- Reconciliation branch started byte-for-byte from that `origin/main` commit.

The complete pre-port classification is in
`RECONCILIATION_MATRIX.md`: 5 `PRESERVED`, 10 `SUPERSEDED_STRONGER`, 4
`MISSING`, 3 `CONFLICTING`, and 0 `OBSOLETE` requirements.

## Current-architecture remediation

- Verification definition authority is an always-on system check. Candidate
  changes to manifests, lockfiles, build/test/runner/CI configuration, or
  deleted tests block verification unless the frozen contract contains an
  exact, reasoned allowance.
- Command evidence keeps separate lineage and definition-authority axes.
  Repository-defined commands cannot satisfy `INDEPENDENT_REQUIRED`; omission
  of the new field fails closed.
- Trusted verifier identity is explicit and limited to the three built-ins that
  inspect the candidate as data: change budget, negative constraints, and
  verification authority. Unknown identities and commands fail closed. No
  external verifier identity was fabricated.
- Local command verification uses a per-check scratch `HOME`, disables package
  lifecycle scripts, isolates npm configuration, disables Git prompts, redacts
  output, and deletes the scratch directory deterministically.
- Verification Attempts feed the server-derived authority result into Policy
  V2 independence. Invalid plans are compiled before the first write, and
  canceled/failed Verification Attempts are marked superseded so recovery does
  not strand admission.
- Workflow/CODEGEN completion remains an execution claim and is never projected
  as GitHub CI PASS. Merge recording requires a signed GitHub App attestation
  bound to the exact provider repository, producing Attempt head, source event,
  and unexpired currentness window.
- Automation verification cannot default a verdict or observation, cannot
  self-declare independence, and cannot accept a WorkOrder. The orchestration
  acceptance proxy is retired; canonical `workOrders.accept` requires a
  server-derived authenticated human with both Factory and delivery approval
  authority.
- Authorization now enforces as soon as an active operator exists, regardless
  of legacy flag state. Before provisioning, only reads remain compatible;
  writes fail closed. Production still needs the narrow legacy delivery aliases
  used by its assigned role, so they remain observable and tested.
- The public Convex authorization ratchet uses TypeScript syntax trees, not
  comment/string matching. Exact current-main movement is 641 unauthorized
  public functions to 637; no new unauthorized function is admitted.
- Stripe ingestion now fails closed without its webhook secret and rejects
  signatures outside a five-minute currentness window.

No worker, sandbox, model-route, Factory Version, structured-result, publication,
or routing framework was restored from the historical series.

## Authority invariants

Focused structural and behavioral tests re-prove:

- harness authority is `NONE`;
- Remote Sandbox is execution-only;
- a producer cannot establish verification success;
- current verification binds candidate, evidence, contract/plan, WorkOrder
  revision, Factory Version, Attempt, invocation, lease, and isolation lineage;
- publication authority remains separately permit-controlled;
- `workOrders.accept` is the only `WORK_ORDER_ACCEPTED` writer and is human-only;
- routing cannot grant eligibility;
- Factory Learning remains advisory; and
- Review Intelligence cannot accept, publish, or merge.

PR #128 admission remains authoritative: exact promoted model route, Sandbox
Profile, Factory Version, current workflow, worker attestation, and canonical
`factory-result/v1` are preserved. The runtime is v32 because the reconciliation
introduces genuine public verification and automation-mutation contract changes.

## Trusted verifier disposition

Repository-side classification, fail-closed registration, independent evidence
requirements, and built-in verifier execution are complete. There is no approved
external ecosystem verifier identity to provision, and none is needed by the
qualified contracts in this change. A future external verifier must be supplied
as an independently maintained immutable implementation, added to the explicit
trusted registry through reviewed code, bound to its digest/configuration, and
qualified before any contract can use it. There is intentionally no operator
toggle that can turn an arbitrary verifier ID into trusted evidence.

## Environment-dependent validation

- Convex codegen and Convex typechecking: PASS against the legitimate preserved
  local development deployment.
- Critical shell E2E: PASS, 9/9 Chromium tests, zero retries.
- Convex-backed browser read path: PASS with runtime bypass disabled. The real
  Research Lab workspace rendered seven workspace choices, 185 Tasks, governed
  state, Attempt history, agents, and live counts with no browser console error.
- The historical task-scheduler mutation fixture was attempted. It is not a
  current admission fixture: it has no active code scope, Factory Version, or
  current clean host. Dispatch correctly failed closed under PR #128. No gate or
  test was weakened to manufacture an Attempt.

The final clean `pnpm run qualify:factory` run completed 17/17 gates with no
failed check. It includes the full repository and Convex suites, TypeScript,
skill lint, runtime-contract guard, production build, orchestration startup
smoke, dependency/security audit, repository secret scan, and
`git diff --check`. Exact timestamps, commands, exit codes, and durations are
recorded in `automated-checks.json`.

## Sandbox and security

See `sandbox-regression.json` and `security-qualification.json`.

- Exact published image and local content ID:
  `sha256:41a66f1d6f7b90618a6c58fb9a1a336ef69ab2794fc1322233e4a5d9788782b8`.
- Fresh Syft 1.37.0 SBOM: 27 packages.
- Fresh Grype 0.117.0 scan using database v6.1.9 built
  `2026-08-22T06:14:16Z`: 0 Critical, 0 High, 2 Medium, 0 ignored.
- Both Medium records are CVE-2025-60876 BusyBox metadata (`busybox` and
  `busybox-binsh`). The exact image has neither the BusyBox `wget` applet nor
  `/usr/bin/wget`.
- Two sequential fresh containers passed non-root UID/GID 10001,
  `no_new_privs`, zero capabilities, firewall mutation denial, package-manager
  absence, protected-path denial, workspace write, process control, credential
  absence, and previous-Attempt isolation.
- Guest nftables blocked arbitrary public, RFC1918/private, link-local,
  metadata, and unauthorized DNS destinations while allowing the frozen
  OpenRouter destination.
- Provider-enforced egress remains unavailable. Guest nftables is defense in
  depth; this evidence does not claim RED-ready isolation.

`environment-audit.json` records the production read-only authorization audit.
No production data or configuration was changed during that audit.
