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

## Gates not yet run

| Gate | Status | Reason |
| --- | --- | --- |
| Product Owner publish approval | pending | Publishing changes shared Registry state; not performed silently. |
| Publish v0.1.0 | blocked | Requires approval. |
| Disposable `mc-context.json` / lock install | blocked | Resolver only installs published versions. |
| Run-context activation trace | blocked | No external agent runner/context injection path is wired for this draft. |
| Lockfile removal / rollback | blocked | Depends on a published/installable package. |
| Security pass | failed/pending review | Registry detail reports 50% and “Review before production rollout.” |

## Decision needed

Do not publish yet. The candidate itself is structurally sound, but the remaining lifecycle proof is currently blocked by two product gaps: import is not idempotent and evaluation is proxy-based rather than an external/live agent run. Approving publication now would permit lockfile/rollback testing, but would not close the live-agent evidence gap.
