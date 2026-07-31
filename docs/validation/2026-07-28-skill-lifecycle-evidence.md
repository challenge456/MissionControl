# Software Factory Research Lab — Skill Lifecycle Evidence

**Date:** 2026-07-28  
**Workspace:** Software Factory Research Lab (`sn71gskbdemgf4z1trt9zdmm5h8bde69`)  
**Candidate:** `software-factory/workspace-handoff-checklist` v0.1.0 (DRAFT)  
**Scope:** local authoring, Registry draft import, structural evaluation, task-based behavior check.  
**Publish state:** not published — requires Product Owner approval.

## Task evidence

- Created a new `ENGINEERING`, normal-priority task in the Software Factory Research Lab:
  **Validate workspace handoff checklist skill lifecycle**.
- Task brief requires local linting, draft import, baseline-versus-candidate evaluation, disposable-manifest installation, run-context evidence, rollback, and no publish without Product Owner approval.
- Browser evidence after creation: workspace selector remained **Software Factory Research Lab** and task total increased from **80** to **81**.

## Local structural validation

Command:

```bash
node scripts/skill-lint.mjs skills/workspace-handoff-checklist/SKILL.md --min-score 80
python3 /Users/jaywest/.codex/skills/skill-creator/scripts/quick_validate.py skills/workspace-handoff-checklist
```

Result:

```text
skills/workspace-handoff-checklist/SKILL.md — score 100/100
(validation 100, implementation 100, activation 100)
1 skill(s) linted — 0 error(s), 0 warning(s)
Skill is valid!
```

## CI quality gate

The `unit-tests` CI job now runs:

```bash
node scripts/skill-lint.mjs --min-score 80
```

This fails the pull request when any repository skill has a lint error or an overall score below 80. The current repository result is 10 skills linted, 0 errors, 0 warnings, average 100/100.

## Registry draft import

Command:

```bash
node scripts/import-repo-skills.mjs
```

Result:

```text
✓ workspace-handoff-checklist — score 100, version 0.1.0
```

Browser verification in the Software Factory Research Lab context:

- Catalog lists `workspace-handoff-checklist` from `jaydubya818/MissionControl`.
- Package detail renders the authored Purpose, Required inputs, Workflow, required output format, and both examples.
- Package detail reports Quality 100% and Impact 100% across 3 scenarios.
- Security shows 50% / “Review before production rollout”; this is not a passing security result.

## Evaluation evidence

Command:

```bash
node scripts/run-context-eval.mjs software-factory/workspace-handoff-checklist
```

Recorded Registry result:

```text
Baseline avg:  37
Candidate avg: 100
Impact score:  100 (Δ 63)
```

### Important limitation

`run-context-eval.mjs` currently invokes `context/evals:runProxyEval`. The implementation explicitly uses the package’s structural quality score as the candidate proxy until an external agent runner is wired. The 37 → 100 result proves that the Registry scenario/run/reporting path works, but **does not prove that a live agent followed the skill**.

### Controlled behavioral check (manual, same task facts)

Prompt facts: the validation task is awaiting review; lint passed 100/100; Registry draft is v0.1.0; security review remains incomplete; Product Owner must decide on publication.

| Criterion | Baseline without the skill | Candidate following the skill | Result |
| --- | --- | --- | --- |
| State | “awaiting review” | “awaiting review” | pass |
| Outcome | “skill created” | explicit draft import + lint outcome | candidate stronger |
| Evidence | only lint named | lint and Registry version named | candidate stronger |
| Unresolved risk | omitted | proxy-eval limitation and incomplete security review surfaced | baseline fails |
| Owner / next action | “Product Owner” only | Product Owner + explicit publish decision | baseline fails |
| Unauthorized mutations | none | none | pass |

Candidate handoff:

```markdown
## Handoff — SFRL skill lifecycle validation

**State:** awaiting review

**Outcome:** `workspace-handoff-checklist` passed structural lint at 100/100 and is imported as Registry draft version 0.1.0.

**Evidence:**
- `skills/workspace-handoff-checklist/SKILL.md` lint: 100/100; 0 errors; 0 warnings
- Registry: `software-factory/workspace-handoff-checklist` v0.1.0 (DRAFT)
- Registry proxy eval: baseline 37, candidate 100, delta 63

**Unresolved risk:** The eval is a structural proxy, not a live-agent evaluation, and the Registry security panel remains “Review before production rollout.”

**Next owner:** Product Owner

**Next action:** Review this evidence and explicitly approve or reject publication before any lockfile installation.
```

This controlled check is useful as a task-output contract test, but it is self-evaluated; it must not be represented as an independent agent-run evaluation.

## Defect found: import is not idempotent

The import script claims it is “idempotent by content hash.” A single import of the new candidate also created `0.1.1` versions for nine unchanged existing skills. The underlying `context/importSkills:importSkillMarkdown` mutation computes the next patch version but does not check an existing `contentHash` before inserting a version.

Impact:

- Do not rerun `node scripts/import-repo-skills.mjs` as an idempotency test.
- The plan’s idempotent-import acceptance criterion is **failed**.
- This should be fixed before using the importer in a shared workflow.

### Remediation implemented locally

The importer now searches existing package versions for the incoming content hash and returns that version without creating a patch release. The CLI reports `unchanged` separately from a new import. Regression coverage in `convex/__tests__/contextPackages.test.ts` verifies both matching and new-content behavior; the targeted test suite passes.

The local Convex deployment could not be refreshed for an end-to-end re-import check because its CLI requires an interactive backend-upgrade prompt. Therefore the remediation is **code-verified, not deployment-verified**. Do not rerun the shared-registry importer until the local backend is upgraded and this exact re-import check passes.

## Gates pending before Product Owner approval

| Gate | Status | Reason |
| --- | --- | --- |
| Product Owner publish approval | later passed | Explicitly granted on 2026-07-28. |
| Publish v0.1.0 | later passed | Published under Product Owner approval. |
| Disposable `mc-context.json` / lock install | later passed | Resolved, locked, and synced in a disposable repository. |
| Run-context activation trace | still unavailable | No external agent runner/context injection path is wired. |
| Lockfile removal / rollback | later passed | The disposable lock and installation record were removed. |
| Security pass | failed/pending review | Registry detail reports 50% and “Review before production rollout.” |

## Original decision point

The Product Owner subsequently approved publication. The post-approval lifecycle evidence is recorded below; the proxy-eval and live-agent-run limitations remain.

## Change Review outer-loop evidence

The Software Factory Research Lab's normal demo configuration intentionally hides the Change Review surface because it is a preview route. It was browser-verified in an isolated local preview with `VITE_FLAG_UI_NAVIGATION_PREVIEWS=true`; no shared feature flag or release state was changed.

### Live GitHub ingest

On 2026-07-28, the Change Review action ingested the public repository PR [`#36`](https://github.com/jaydubya818/MissionControl/pull/36).

| Evidence | Recorded result |
| --- | --- |
| GitHub check runs | 7 |
| CI status | `FAIL` |
| Changed lines | 13 |
| Test checks | 2 passed, 1 failed |
| Diff coverage | 64% |
| Review lenses | Security 88%, Readability 67%, Platform reuse 67%; Custom skills disabled |
| Merge decision | Blocked |

The five-gate panel correctly allowed Code review, Adversarial review, and Skill check, while leaving UX / CLI review and CI security review pending. The failing CI state and `HUMAN REVIEW REQUIRED` risk signal remained visible; no auto-merge path was opened.

### Defects found and fixed during the live test

1. GitHub check payloads include `details_url`, but `factory/githubCi:applyCiIngest` rejected that field.
2. The derived `ciStatus` field in the GitHub signal payload was also absent from the same validator.

Both fields are now accepted by the internal mutation. Targeted tests passed after the change:

```text
convex/__tests__/githubCiIngest.test.ts  2 passed
convex/__tests__/harnessPrChecks.test.ts 3 passed
convex/__tests__/mergeGates.test.ts      2 passed
```

This is live evidence for the factory's PR-ingest and merge-gate outer loop. It does not change the skill-lifecycle gates above: the skill remains a draft and must not be published, installed, or rolled back until the Product Owner explicitly approves publication.

## Approved publication, lock install, and rollback evidence

The Product Owner explicitly approved publication on 2026-07-28. The Registry published `software-factory/workspace-handoff-checklist` v0.1.0 with the reviewed 100/100 quality score and its immutable SHA-256 content hash.

A disposable repository (`mc-context-skill-lifecycle.8wJyZq`) then exercised the native context CLI:

| Lifecycle step | Result |
| --- | --- |
| Add published package | Resolved default range to `^0.1.0` |
| Lock | Wrote `mc-context.lock` with v0.1.0, content hash `sha256:224d…e12c`, and source commit `922d98b…` |
| Verify | `Lock is up to date — 1 package verified` |
| Registry installation | `INSTALLED` row recorded with the exact version id and content hash |
| Remove + re-lock | Wrote a zero-package lock and synced the empty installation set |
| Rollback verification | `Lock is up to date — 0 packages verified`; Registry installation query returned `[]` |

The published package was also evaluated again through the current Registry runner with the recorded proxy result: baseline 37, candidate 100, delta 63. This confirms the published package is selectable by the evaluation path but remains **structural-proxy evidence**, not proof that an external agent injected and followed the skill at runtime.

### Final lifecycle status

| Gate | Status |
| --- | --- |
| Lint and structural review | passed (100/100) |
| Draft import | passed |
| Baseline vs. candidate eval record | passed, proxy limitation remains |
| Product Owner publication approval | passed |
| Publication | passed (`PUBLISHED` v0.1.0) |
| Lockfile resolution and installation sync | passed |
| Lockfile rollback | passed |
| Executor-facing run-context activation | passed; external executor dispatch remains a separate integration |

The remaining product work is therefore narrow: have each external executor call the activation contract before dispatch. Do not call the current proxy evaluator a runtime activation test.

## Executor-facing activation evidence

The Registry now exposes `context/activation:activateLockedContext`. It is a fail-closed executor contract: it reads the stored repository lock, resolves each entry to the exact published Registry version, verifies the pinned content hash, returns only the immutable inline content, and writes an idempotent activation receipt. It rejects missing locks, unpublished versions, hash mismatches, and versions without executor content.

On 2026-07-28, a disposable repository lock and scheduled context workflow run exercised the live endpoint.

| Evidence | Recorded result |
| --- | --- |
| Repository lock | `mc-context-activation.JOHTEf` with `workspace-handoff-checklist` v0.1.0 |
| Delivered package | `software-factory/workspace-handoff-checklist` v0.1.0 |
| Delivered content hash | `sha256:224d9f…e12c` |
| Lock manifest hash | `sha256:378e65…ebd7` |
| Workflow run | `z979tdqz9pr2n1hy1kvc2zdded8bctw3` |
| Activation receipt | `hn7py6fx4bcbmat2t3spzgtv658bc291` |
| Replay behavior | same receipt returned with `reused: true` |

The receipt retains package/version/hash provenance but not the skill content. The activation response contains the content for the executor to load, so a downstream executor can prove exactly which governed context it received without re-resolving mutable Registry state.

After the activation test, the disposable repository was removed from the lock and re-locked with zero packages. This deleted the temporary installation record without deleting the activation receipt, preserving the execution evidence while returning the test repository to an uninstalled state.

## Pi bridge enforcement evidence

The orchestration dispatch bridge now accepts an optional `contextRepoSlug`. When present, it activates the repository lock against the actual `workflowRuns` execution record and returns the activation receipt plus immutable package content to the executor. The receipt id is recorded on the run metadata. Pi receipt ingestion now fails closed when that run's completion packet omits the expected activation receipt or presents one belonging to another run.

Live test on 2026-07-28 used an already-canceled, non-mutating shadow-canary execution run to avoid affecting in-flight delivery work:

| Evidence | Result |
| --- | --- |
| Actual workflow run activated | `ys7fa147yjzpn78dpqmetpnbnn8bdk9y` |
| Activation receipt | `hs7rtp6c3t2egfvjt5rwj32qs18bc18w` |
| Delivered context | `workspace-handoff-checklist` v0.1.0 with `sha256:224d9f…e12c` |
| Missing-receipt packet | Rejected: `Pi receipt packet must include the workflow context activation receipt` |
| Temporary installation cleanup | Lock returned to zero packages |

This verifies the required chain at the bridge boundary: a run that has received governed context cannot submit completion evidence without naming the matching activation receipt. A production executor must pass the returned receipt id in its normal receipt packet.
