# Three-Loop Engineering Implementation Results

**Date:** 2026-08-01  
**Research workspace:** Software Factory Research Lab (`sn71gskbdemgf4z1trt9zdmm5h8bde69`)  
**Verification workspace:** Software Factory Demo (`sn7dtgyn9pt0gq43x2wpw5mwxn8b7adt`)  
**Branch:** `codex/recover-software-factory-research-lab`  
**Result:** Local release gate passed; GitHub PR/CI/merge pending at time of this record.

## Product Result

Mission Control now operates one governed system across three horizons:

1. Inner Attempts automate bounded edit, targeted check, and correction work.
2. Outer PR-head evaluations preserve CI/review failures and require explicit
   merge authority.
3. Meta improvements aggregate real signals and create approval-gated WorkOrders
   and Tasks instead of directly mutating policy.

Graph Engineering remains the execution visualization inside the primary Loop
Engineering surface. The separate Improvement History route remains a detail
view, not a competing primary product.

## Implemented Contracts

### Truthful projection

- Additive cycle linkage, projection status, summary, conflict, limitation,
  measurement, and approval fields.
- Idempotent parser and projector for completed `loop-engineering` workflow runs.
- Contract validation, normalized-source and stable-claim deduplication, rejected
  evidence retention, approval/digest binding, dry-run reconciliation, and
  recoverable failure state.
- Automatic completion handoff from the workflow executor.
- Manual UI reconciliation for completed legacy runs.

### Governed implementation

- Separate `scripts/codex-implementation-worker.ts`; the research worker now
  ignores non-read-only Tasks.
- Claim denial for missing approval, stale revision, cross-workspace scope,
  repository mismatch, main-checkout use, missing policy, exceeded Attempts,
  timeout, or cost limit.
- Workspace-write execution is limited to the approved isolated worktree.
- Explicit allowlisted checks; destructive shell composition is denied.
- Secret-pattern diff scan, file-change events, command/exit evidence, token and
  cost estimate, diff artifact, stable Attempt keys, and replay skip.
- `feature-dev.yaml` declares read-only versus worktree isolation per step.

### Outer PR and CI

- GitHub webhook fails closed when its secret is absent and validates HMAC before parsing.
- Pull request, check-run, and review events map to a PR and source delivery ID.
- PR checks retain one evaluation per head SHA and link prior evaluation,
  workspace, WorkOrder, Task, workflow run, and Loop cycle when discoverable.
- Duplicate source deliveries and repeated head evaluations are idempotent.
- Failed CI blocks the WorkOrder, retains the failed evaluation, requests bounded
  correction, and creates a real meta signal.
- Merge recording requires passing configured gates, WorkOrder approval, explicit
  human confirmation, actor, timestamp, PR, and commit SHA.

### Evidence-driven quality

- Removed mount-time and chat-triggered demo suggestion seeding. Demo seeding
  now requires a development environment flag and exact confirmation phrase.
- Fixed repetitive-work discriminator to `REPETITIVE_TASK_AUTOMATION`.
- Real failed workflows, CI failures, review corrections, approval rejections,
  failed/waived receipts, missed measurements, and repeated WorkOrders feed the inbox.
- Suggestions carry evidence count, confidence, impact, surface, source links,
  and a stable dedupe key.
- Acceptance creates an approval-gated WorkOrder and linked Task.
- Measurement retains baseline, result, target, evidence, and verdict; a miss
  creates at most one bounded follow-up.

## Deterministic Evidence

| Test | Requirement | Result | Evidence |
| --- | --- | --- | --- |
| Completed graph projection | Completed output updates cycle once | Pass | Cycle `zn7ba4hw0b68z4gpp168hnkzn58bdps6` is `READY_FOR_NEXT_CYCLE`, projection `PROJECTED` |
| Clean stop | Zero recommendations are truthful | Pass | 2 sources, 3 claims, 0 recommendations, 4 measurements |
| Projection refresh | State persists after refresh | Pass | Chromium screenshot `phase-0/research-lab-projected-cycle.png` |
| Implementation policy | Invalid scope and destructive commands denied | Pass | 8 policy tests |
| Workflow runtime | Retry, gate, projection handoff | Pass | 75 workflow-engine tests total |
| Meta signal dedupe | Duplicate failed-run signal renders once | Pass | Suggestion `zd792pzksd3mfwxncpf7xs0hq58bprxt`, evidence count 1 |
| Meta acceptance | Accepted proposal creates governed work | Pass | Task `wh7fazap3ct6hzfc12ttgmp1kd8bqe7f`; WorkOrder `yh7aygkkxryzj7ft65yq6czec58bq3ys` |
| Signed webhook | Invalid request denied; valid signature accepted | Pass | HTTP 401 / 200; local test secret removed after test |
| Unified UI | One Inner/Outer/Meta surface | Pass | Chromium screenshot `phase-4/unified-loop-engineering.png`; no page errors |

## Failure Found During Verification

The first live meta acceptance used unsupported Task source `META_LOOP` and was
rejected by the Convex schema. The action had already created its WorkOrder, so
the retry exercised idempotency. The source was corrected to the existing
governed `MISSION_PROMPT` provenance; replay created one Task and reused the one
WorkOrder. This failure and correction are retained here rather than hidden.

The first real GitHub PR ingest also classified the head as passing when one
completed check had succeeded but required jobs were still queued or running.
The reducer now prioritizes blocking conclusions, then any pending job, and only
reports `PASS` after every observed job has a successful, skipped, or neutral
terminal conclusion. A regression test retains this release-gate finding.

## Runtime Configuration Boundary

The signed webhook implementation is complete and locally verified. A durable
GitHub webhook must point at the deployed Convex HTTP site and use a deployment
secret. The local HMAC secret was intentionally removed after the test; a
temporary localhost tunnel is not treated as durable release configuration.

## Final Engineering Reviews

The simplicity review found no competing engine or lifecycle. The implementation
closes handoffs between the canonical WorkOrder, Task, workflow run, approval,
evidence, PR-check, and suggestion records. The read-only research worker remains
separate from the implementation worker, and development-only seed behavior is
explicitly gated.

The security review found no hardcoded credential or unbounded repository
execution path in the change. External webhook and review text is sanitized,
GitHub signatures fail closed, implementation workers receive a filtered
environment, commands are allowlisted, worktrees are verified, and generated
diffs are scanned for secret-like values. The temporary local webhook secret was
removed after verification. A durable deployed webhook URL and deployment secret
remain an environment configuration responsibility; the local implementation
does not claim that external configuration exists.

## Local Release Verification

- Mission Control UI production build: passed (3,549 modules transformed).
- Workflow engine: 75/75 tests passed.
- Focused projection, meta-signal, PR-evaluation, and GitHub-ingest tests: 12/12 passed.
- Repository typecheck: passed.
- Skill contract lint: 10/10 skills scored 100 with no errors or warnings.
- `git diff --check`: passed.
- Chromium persistence and unified-loop journeys: passed with screenshots and no
  current page errors after a clean reload.

## Release Gate

The remaining external release sequence is deliberately performed after this
record is committed so its identifiers are real:

- run repository typecheck/build and the focused release suite;
- create the GitHub PR and ingest its real head SHA;
- wait for required GitHub checks;
- address only real regressions;
- merge explicitly, record the merge evidence, and verify `main` remotely.
