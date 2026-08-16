# Generic Harness Contract V1 qualification

Date: 2026-08-16

## Result

Generic Harness Contract V1 is qualified for a draft pull request on exact
`origin/main` `6800ab39b09691c3b64b3f621d6d00be293e87c9`. Mission Control now admits
Codex and DeepSeek Harness through one execution-only lifecycle and one normalized
untrusted result. Canonical worker leases, sandbox policy, independent verification,
evidence, publication, and human acceptance remain outside both harnesses.

The standalone Harness Lab was read only as architectural evidence. It was not
modified, vendored, linked, or made a runtime dependency.

The worktree was initially created from then-current `origin/main`
`3de80b97c7272f64586e5d08bc7c73fcd2114faa` and was refreshed before publication.
Current main includes PR #112's smaller generic lifecycle seam. This branch preserves
that authoritative interface and adds exact capability admission, normalized
untrusted results, the real adapters, observability, progressive disclosure, and
runbooks beneath it. The separately completed Full-System E2E qualification remains
independent and passes with the exact frozen Codex capability manifest.

## Exact adapters qualified

| Adapter | Harness pin | Effective route | Local health |
| --- | --- | --- | --- |
| `codex/v1` | Codex CLI `0.146.0`, source `e363b08c9175ac1cbe5893615dd2cb9ddf95043b` | existing authenticated Codex CLI; persistent worker and existing remote-sandbox admission | `READY` |
| `deepseek-harness/0.2.0` | DeepSeek Harness `0.1.0-rc.5`, source `47f943859bef60e4160492346772ded9b24f765a` | Ollama `0.32.6`, `qwen3.5:35b-a3b-q8_0`; persistent worker only; disabled by default | `READY` when explicitly enabled |

Codex keeps Mission Control's existing `codex/v1` identity. The lab's adapter
version namespace is not imported.

## Automated evidence

| Check | Command | Result |
| --- | --- | --- |
| Full Factory qualification | `pnpm qualify:factory` | passed through system, Factory, Mission, WorkOrder, memory, observability, GitHub, learning, progressive UI, repository, runtime, build, smoke, and whitespace gates |
| Full repository tests | `pnpm test` | 1,700 passed; one pre-existing governed-context integration test skipped |
| Typecheck and lint | `pnpm lint` | passed across all workspaces; 10 skills at 100/100 |
| Production build | `pnpm build` | passed across all buildable workspaces |
| Convex deployment bundle | `CONVEX_DEPLOYMENT=<preserved-local> pnpm exec convex dev --once --codegen disable --typecheck disable --tail-logs disable` | functions prepared successfully |
| Runtime contract | `pnpm ci:runtime-contract` | passed; one intended public change, `workspaceHostBindings.report`, runtime `v26 -> v27` |
| Orchestration artifact | `pnpm smoke:orchestration-start` | built Node ESM artifact loaded successfully |
| Repository patch hygiene | `git diff --check` | passed |
| Artifact and credential audit | tracked/ignored/untracked inventory plus diff-only secret-pattern scan | no generated evidence, environment file, credential, cache, log, build output, or temporary artifact enters the patch; existing `.gitignore` coverage is sufficient |
| Real local adapter health | built adapter `health()` calls against the exact local pins | Codex `READY`; DeepSeek `READY` |

The adapter suites include real child-process-group cancellation and idempotent
cleanup checks. They prove canonical `CANCELED` results and no surviving owned child
processes. Factory worker tests preserve independent verification and publication
gates and reject harness completion as acceptance evidence.

## Browser evidence

The affected flow was exercised in Chromium against the preserved Research Lab on
port 5199 after deploying the current runtime `v27` bundle locally. The page produced
no browser errors.

- Basic hides harness selection and implementation detail.
- Intermediate shows only the selected harness strategy.
- Advanced shows exact harness/adapter identity, source pin, supported backends,
  cancellation mode, telemetry availability, and a concrete limitation.
- DeepSeek Harness is visible but disabled because no eligible canonical worker in
  that deployment advertises the exact capability and configuration digests.
- The existing Workspaces & Repositories surface contains the control; no new
  top-level navigation domain was added.
- Existing historical runs remain readable as legacy/unbound rather than receiving
  fabricated harness provenance.

## Authority and security review

- Capability declarations are adapter-effective, immutable at Factory Version and
  Attempt boundaries, and matched inside canonical worker admission.
- Provider state remains opaque; provider metadata is scalar-only, bounded, and
  redacted before persistence.
- Child environments are allowlisted. Adapters do not receive Mission Control service
  secrets, GitHub App credentials, publication permits, or acceptance authority.
- Harness status, output, events, changed-file claims, and telemetry are persisted as
  diagnostics only. Missing telemetry remains `null`.
- Repository scope is reconciled outside the harness before independent verification.
- Cancellation targets the worker-owned process group and cleanup is idempotent.
- The result validator rejects identity, provenance, event, changed-file, process,
  cancellation, output, and metadata violations before downstream use.

Security finding count: Critical 0, High 0, Medium 0.

## Deliberate V1 limitations

- The existing remote-sandbox supervisor retains its frozen Codex wire protocol;
  generic Factory snapshots and admission do not yet make that supervisor
  provider-neutral.
- Historical Factory versions fall back to the known `codex/v1` manifest so old runs
  remain operable.
- The exact Codex executable artifact digest currently admits Darwin arm64 only.
- Loom remains audit-only because no exact real Loom artifact was exercised.

These limitations do not weaken the V1 authority boundary. They are follow-up
compatibility work, not reasons to add provider-specific fields to the generic
contract.

## Monitoring and rollback

No deployment or merge is authorized by the draft. After any later deployment,
monitor worker registration/admission mismatch rates, process-termination receipts,
cleanup failures, normalized-result validation failures, scope violations, canceled
Attempt history, and any divergence between harness completion and independent
verification. Disable the selected adapter on an orphan process, credential-redaction
failure, manifest mismatch, lease-fence anomaly, or evidence-authority regression.

DeepSeek can be rolled back independently by clearing
`DEEPSEEK_HARNESS_EXECUTOR_ENABLED`; Codex remains the default path.
