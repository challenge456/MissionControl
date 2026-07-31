---
date: 2026-07-28
topic: automated-shadow-release-evidence
---

# Automated Shadow Release Evidence

## What We're Building

Completed QC and context-evaluation runs can explicitly name the pending deployment they evaluate. On completion, each linked run records an immutable shadow release assessment against that deployment. Unlinked runs never get guessed onto a release.

## Why This Approach

Project, repository, and time-window matching are ambiguous and could attach evidence to the wrong release. An explicit deployment ID is small, auditable, and makes external runners and future UI workflows deterministic.

## Key Decisions

- Evaluation/QC run linkage: optional `releaseDeploymentId`; validate it when the run is created.
- QC grading: green plus passed gate is PASS; red, failed, or an explicit failed gate is FAIL; incomplete/yellow evidence is WARN.
- Context-eval grading: PASS requires complete criteria, no regression from baseline, and candidate score at least 80; failed execution is FAIL; all other completed evaluations are WARN.
- Enforcement: shadow-only. Automation records evidence but never blocks activation.

## Next Steps

Implement the linkage, completion hooks, and auditable derived gate records; observe results before proposing enforcement.
