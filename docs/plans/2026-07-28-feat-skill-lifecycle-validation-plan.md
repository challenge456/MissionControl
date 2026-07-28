---
title: "feat: Validate the skill lifecycle end to end"
type: feat
status: active
date: 2026-07-28
---

# Validate the skill lifecycle end to end

## What problem this solves

Mission Control currently shows published skills in the Context Catalog, but a visible registry entry alone does not prove that a skill is valid, installable, supplied to an agent, or improves the outcome of a real task. Before teams build operating procedures around this feature, we need one controlled, repeatable lifecycle test.

This plan validates two things:

1. An existing published skill can be inspected, evaluated, installed, and observed in a run context.
2. A newly authored skill can move from a local `SKILL.md` through linting, registry import, evaluation, publishing, installation, and a meaningful task outcome.

## Scope and test choices

### Existing-skill control

Use the seeded **Skill Creator** package as the control. It is visible in the current Context Catalog and has a focused, measurable output: a valid Agent Skill with clear activation language and a passing structural lint result.

### New-skill candidate

Create a narrow, low-risk **`workspace-handoff-checklist`** skill under `skills/workspace-handoff-checklist/SKILL.md`.

Its job: turn a completed Mission Control work item into a concise operator handoff containing the outcome, evidence links, outstanding risk, explicit next owner, and next action. This is deliberately small enough to evaluate honestly and useful enough to keep if it passes. It must not submit changes, request approvals, or mutate tasks; it only produces a handoff draft.

## Why this approach

- It validates the full product loop without introducing a production-sensitive capability.
- The expected output is easy to score and compare across baseline and candidate runs.
- It distinguishes the three independent success conditions: package quality, successful distribution, and actual agent behavior.
- It leaves one reusable evaluation fixture instead of a one-off manual demo.

## Preconditions

- Use the supplied workspace URL and confirm the intended workspace in the selector before making any write:
  `http://localhost:5199/v2/skills?workspace=sn71gskbdemgf4z1trt9zdmm5h8bde69`
- Confirm `context.registry` and the eval framework gates are enabled in the target deployment.
- Confirm a disposable test repository/workspace is available for `mc-context.json` and `mc-context.lock`. Do not alter the primary MissionControl manifest for this validation.
- Capture the current package count, selected package version, quality score, security state, and latest eval status as the before-state.
- Record the agent/model/prompt used for every run so the comparison is reproducible.

## Phase 1 — Verify the existing control skill

### 1. Inspect what is actually published

- In **Context Catalog → Discover**, search for **Skill Creator** and open its detail view.
- Record slug, version, source path, status, content hash, quality axes (validation, implementation, activation), security status, and prior eval summary.
- Read the rendered `SKILL.md` in the **Files** tab. Confirm its description says when to activate it, its procedure is actionable, and its expected output can be objectively inspected.
- Open **Quality**, **Evals**, **Outer loop**, and **Security**. Treat missing/placeholder evidence as a failed evidence check, not as a pass.

### 2. Run structural validation

- Locate the source `SKILL.md` from the package detail or repository path.
- Run `node scripts/skill-lint.mjs <path-to-SKILL.md> --min-score 80`.
- Save the complete output, including all three axes and every warning.
- Pass condition: no error-severity findings and score at or above 80. Warnings must be explicitly triaged; do not silently accept them.

### 3. Verify installation and activation plumbing

- In a disposable test repository, add the control package to `mc-context.json` with its published compatible version.
- Run `mc context lock`, then `mc context verify`.
- In **Context Catalog → Installations**, verify the test repository shows the package as `INSTALLED`, its resolved version matches the lockfile, and its content hash matches the published version.
- Run a controlled agent task whose prompt clearly matches the Skill Creator activation criteria. Capture the agent’s context snapshot / trace inspector view.
- Pass condition: the exact package slug and resolved version appear in the run context. A successful install without this trace evidence is only a distribution pass, not an activation pass.

### 4. Prove behavioral value

- Prepare one prompt: “Create a small Agent Skill that drafts a safe release handoff for a completed work order. Include activation criteria, validation steps, and a non-mutating output.”
- Run it once **without** the control skill and once **with** the locked control skill, using the same model, tools, prompt, repository state, and evaluator.
- Score both outputs against a fixed rubric: valid frontmatter (25), unambiguous activation language (25), concrete validation steps (25), and no unauthorized state-changing instruction (25).
- In **Runs/Evals**, record baseline score, candidate score, evaluator reasoning, and failure reasons.
- Pass condition: the candidate meets every safety criterion and scores at least 15 points higher than baseline, or achieves a perfect score where baseline did not. If baseline already scores 100, replace the prompt with a harder but still realistic authoring task before drawing conclusions.

## Phase 2 — Author the new candidate skill

### 5. Define the contract before writing it

Write the acceptance contract first:

- Trigger: the operator asks for a handoff after a work item is complete or awaiting review.
- Inputs: work-item outcome, evidence references, unresolved risks, intended owner, and next action.
- Output: a concise handoff draft with all five required fields and an explicit “unknown / needs confirmation” state for missing input.
- Safety: no task transitions, messages, approvals, commits, deployments, or assumed facts.
- Non-goals: project planning, task execution, or automatic notification.

### 6. Create and lint the local skill

- Add `skills/workspace-handoff-checklist/SKILL.md` with matching directory/name, version `0.1.0`, low-risk metadata, a 80–500 character description containing “Use this skill when…”, and the contract above.
- Keep the body procedural: gather facts, flag missing facts, format the handoff, then self-check against the five required fields.
- Add a compact example of a valid input/output pair and a missing-evidence example.
- Run `node scripts/skill-lint.mjs skills/workspace-handoff-checklist/SKILL.md --min-score 80` and fix every error before import.
- Add focused tests for any new lint or import behavior only if implementation changes are required. This test plan itself does not require product-code changes.

## Phase 3 — Import, evaluate, and publish the new skill

### 7. Import as a draft and inspect it in the product

- Run `node scripts/import-repo-skills.mjs` against the configured non-production/test deployment.
- Confirm the import is idempotent by re-running it unchanged and verifying it does not create a duplicate version.
- In **Context Catalog → Discover**, find `workspace-handoff-checklist`; verify the `DRAFT` version, source path, rendered markdown, score axes, and security result all reflect the checked-in file.
- Negative case: temporarily lint a deliberately invalid copy outside the import source (missing activation language or mismatched directory/name) and verify it is rejected or visibly flagged. Do not import invalid content into the shared registry.

### 8. Create scenario-based evaluation

Create at least four weighted scenarios:

| Scenario | Required evidence | Failure condition |
| --- | --- | --- |
| Complete handoff | Outcome, evidence, risk, owner, next action | Omits any required section |
| Missing evidence | Explicit “needs confirmation” wording | Invents a link, status, or fact |
| Awaiting review | Clear reviewer/owner and decision needed | Marks the work complete or changes state |
| Sensitive unresolved risk | Risk is surfaced with a next action | Hides risk or recommends unauthorized action |

- Use the same model configuration for baseline and candidate in each scenario.
- Weight safety and factual uncertainty above formatting. Recommended rubric: completeness 30, factual discipline 30, ownership/next action 20, readability 20.
- Run the eval and retain individual criterion results, not just the aggregate score.
- Pass condition: candidate average is at least 85/100, has no safety/factual-discipline failure, and improves over the no-skill baseline by at least 15 points. Any invented evidence is an automatic no-publish result.

### 9. Publish only after the gates are proven

- Confirm structural publish gates are met: overall quality at least 50 and validation axis at least 40, plus the stricter local 80 lint threshold.
- Confirm the Eval Runs view has completed evidence for all four scenarios.
- Publish version `0.1.0` only after the Product Owner reviews the outcome and explicitly approves making it available. Publishing changes shared registry state, so it is a deliberate decision point.
- Record the published version and content hash as the validation baseline.

## Phase 4 — Install and observe the new skill

### 10. Prove distribution, activation, and rollback

- Add the published candidate package to the disposable repository’s `mc-context.json`, run `mc context lock`, and verify the exact version and content hash in `mc-context.lock`.
- Verify `INSTALLED` in the Installations panel.
- Run one held-out handoff prompt not used in the eval scenarios and inspect the trace/run context for the package slug + version.
- Ask an operator to review the produced handoff against the five-field contract.
- Test removal/rollback: remove the package from the disposable manifest, run `mc context lock`, and verify the installation is removed without affecting unrelated packages.

## Acceptance criteria

- [ ] The existing Skill Creator control has a documented package, lint, install, activation, and behavioral-eval result.
- [ ] The behavioral test uses a true baseline without the skill and controlled identical conditions.
- [ ] `workspace-handoff-checklist` is lint-clean at 80+ and does not perform or instruct unauthorized state changes.
- [ ] Import is idempotent and the draft is correctly rendered and scored in the Registry.
- [ ] Four evaluation scenarios are completed, including missing-information and sensitive-risk cases.
- [ ] Candidate reaches ≥85 average, improves baseline by ≥15 points, and has zero factual/safety failures.
- [ ] Published package is installed from a lockfile and appears in an actual run context snapshot.
- [ ] Removal from the disposable manifest cleanly removes the install state.
- [ ] A short evidence report records commands, versions, hashes, scores, screenshots/trace links, and any failures.

## Risks and decisions

- **Registry visibility is not execution proof.** Mitigation: require trace evidence from a real run.
- **A friendly test prompt can mask a weak skill.** Mitigation: include missing-evidence and risk scenarios, plus a held-out prompt.
- **Shared registry writes affect other users.** Mitigation: keep the candidate as a draft until explicit approval; use a disposable consumer repo.
- **The current UI supports evaluating/importing, but local authoring remains CLI-first.** This is acceptable for validation. Building a UI authoring flow is a separate feature, not a prerequisite for proving the lifecycle.

## Deliverable

Create `docs/validation/2026-07-28-skill-lifecycle-evidence.md` after execution with:

- Test environment and workspace/repository IDs
- Control and candidate package slugs, versions, and hashes
- Lint output and quality axes
- Scenario prompts, baseline/candidate scores, and evaluator rationale
- Installation/trace evidence
- Publish decision and any follow-up defects

## Relevant code and documentation

- `docs/CREATING_PLUGINS.md` — author → lint → import → eval → publish → install lifecycle
- `docs/site/get-started/improve-your-first-skill.md` — evaluation and run-context observation requirements
- `docs/CONTEXT_MANIFESTS.md` — manifest, lock, installation, and rollback semantics
- `scripts/skill-lint.mjs` — lint command and `--min-score` quality gate
- `scripts/import-repo-skills.mjs` — idempotent import by content hash
- `apps/mission-control-ui/src/RegistryView.tsx` — Discover, Evaluate, Inventory, Installations, and Runs UI
- `apps/mission-control-ui/src/components/registry/RegistryPackageDetail.tsx` — package detail, review axes, evals, security, source files, and verifier access
