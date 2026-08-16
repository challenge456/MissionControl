# Factory Learning and Continuous Improvement V1 qualification

Date: 2026-08-16

## Result

Factory Learning V1 is qualified for a draft pull request. It converts bounded,
deterministic repository evidence into advisory signals, recurring clusters,
reviewable Improvement Candidates, human-approved canonical experiments, and
approval-gated implementation WorkOrders. No learning record has acceptance or
verification authority.

The isolated worktree was created at exact then-current `origin/main`
`d0e5ff2ff57da7e5037da6f6ee8083ed275d911f`. While implementation was in
progress, main advanced to
`e32444a2aecb67bfcb050cd4a92d11d8de650db8`; the feature commit was rebased
without conflict so the draft preserves the merged OpenSandbox provider work.

## Automated evidence

| Check | Command | Result |
| --- | --- | --- |
| Factory Learning domain and authorization | `pnpm exec vitest run convex/__tests__/factoryLearning.test.ts` | 11 passed |
| Canonical experiment golden path | `pnpm exec vitest run convex/__tests__/observabilityGoldenPath.test.ts` | 6 passed |
| Agent configuration scanner | `node --test scripts/lib/agent-config-registry.test.mjs` | 6 passed |
| UI disclosure and promotion rules | `pnpm --filter mission-control-ui test -- factoryExperience/factoryLearningModel.test.ts` | 4 passed |
| Full repository tests | `pnpm test` | 89 Convex files / 623 tests and 65 UI files / 291 tests passed; all workspace suites passed; 1 pre-existing integration test skipped |
| Full typecheck | `pnpm run typecheck` | passed across 19 workspace projects and Convex |
| Lint | `pnpm run lint` | passed; 10 skills at 100/100 |
| Production build | `pnpm run build` | passed across all buildable workspaces |
| Runtime contract | `node scripts/check-runtime-contract.mjs` | passed; 9 intended public changes, v25 → v26 |
| Live browser flow | `MISSION_CONTROL_URL=http://127.0.0.1:5199 FACTORY_LEARNING_WORKSPACE_ID=<seed-id> pnpm exec playwright test tests/e2e/factory-learning.e2e.spec.ts --project=chromium` | 2 passed |

## Browser evidence

The browser suite used the seeded Software Factory Demo against the real local
Convex backend and port 5199. It verified Factory Board reachability, Basic /
Intermediate / Advanced disclosure, an authorized on-demand refresh, truthful
empty states, responsive navigation, the populated read-only Agent
Configuration registry, the in-app operator guide, dark and light themes, and
zero relevant page errors or failed requests. Axe reported no critical-impact
WCAG 2 A/AA, 2.1 A/AA, or 2.2 AA violations inside `main`.

- [Advanced Agent setup, dark theme](./evidence/2026-08-16-factory-learning-agent-setup.png)
- [Advanced Agent setup, light theme](./evidence/2026-08-16-factory-learning-light.png)
- [Mobile Factory Learning](./evidence/2026-08-16-factory-learning-mobile.png)
- [In-app operator documentation](./evidence/2026-08-16-factory-learning-docs.png)

## Functional qualification

| Requirement | Evidence | Result |
| --- | --- | --- |
| Signals → clusters → candidate | Three distinct matching signals create one exact-signature cluster and one candidate | Pass |
| Duplicate suppression | Repeated source fingerprint remains one occurrence and produces no candidate storm | Pass |
| Workspace/repository isolation | Cluster key and source selection include workspace and repository; ambiguous project-level records are accepted only by the default repository | Pass |
| Deterministic-first | Extractor uses explicit verification, gate, retry, recovery, intervention, human-decision, routing, and configuration records | Pass |
| Zero model calls | Refresh policy and audit metadata report zero; no model API exists in the path | Pass |
| Candidate review | Dismiss, reject, snooze, and experiment approval require existing Factory permissions and append activities | Pass |
| Canonical experiment | Existing eval datasets, definitions, experiments, and exactly two variants are reused | Pass |
| Outcome comparison | Bounded aggregate sample/success/duration/cost metrics are recorded without a significance claim | Pass |
| No auto-promotion | Recommendation always reports `autoPromote: false`; UI exposes promotion only after Accepted + Completed | Pass |
| Governed change | Promotion submits a canonical Mission Plan with cluster/experiment/evidence lineage; separate Plan approval releases the WorkOrder | Pass |
| Configuration registry | Bounded tracked-file inventory records harness, scope, digest, precedence, last commit, overlaps, contradiction, coverage, duplicate, and shadow findings | Pass |

## Authority and security review

- Public reads require `factory.read`; refresh/config sync/outcome recording
  require `factory.improve`; candidate decisions and WorkOrder promotion require
  `factory.approve`.
- Anonymous access fails closed outside the explicit local demo adapter.
- Every new persisted learning/configuration record sets
  `acceptanceAuthority: false`.
- Factory Learning has no mutation path to verification receipts, evidence
  envelopes, WorkOrder acceptance, Factory Versions, routing policy,
  publication, merge, credentials, or worker fencing.
- Ambiguous project-level evidence is not projected into non-default
  repositories.
- Configuration scanning uses `git ls-files`, a source allowlist, repository
  path checks, 200-file and 256 KiB-per-file caps, symlink rejection, missing
  file recovery, bounded directives, and credential-shaped redaction.
- React renders all evidence and finding text through escaped text nodes; no raw
  HTML path was introduced.
- No dependency or lockfile changes were required.

Security finding count: Critical 0, High 0, Medium 0. The remaining product
risk is evidence interpretation: deterministic co-occurrence is not causality.
The UI mitigates this by showing lineage, confidence, sample size, and human
decision gates.

## Cost and performance posture

- 30-day evidence window.
- At most 200 records per source and 500 signals per repository refresh.
- At most 50 recent traces and 50 observations per trace for deterministic
  operation/context extraction.
- At most 40 evidence items retained per cluster.
- Candidate threshold: three distinct occurrences.
- At most 200 configuration sources/findings and 256 KiB per file.
- No semantic clustering, embeddings, or LLM calls in V1.
- Scheduled refresh runs hourly only for workspaces that explicitly schedule
  `factory-learning-scan` with a non-manual cadence.

## Rollback and monitoring

Disable or remove the optional schedule to stop background refresh. The UI can
be rolled back independently because all learning/configuration tables are
advisory projections. Do not delete canonical experiments or governed
WorkOrders during rollback.

Monitor `FACTORY_LEARNING_REFRESHED`,
`FACTORY_LEARNING_EXPERIMENT_APPROVED`,
`EVAL_EXPERIMENT_OUTCOME_RECORDED`,
`AGENT_CONFIGURATION_REGISTRY_SYNCED`, authorization denials, candidate
dismissal rate, source-cap saturation, and cross-repository anomalies. Any path
from learning to acceptance, verification, live policy, publication, or
credentials is a release blocker.

## Remaining scope

P1 after production evidence:

- execute experiment datasets through a dedicated governed runner instead of
  entering bounded aggregate outcomes;
- expose per-source scan saturation and duration telemetry;
- add explicit candidate rollback/effectiveness measurement UI over existing
  meta-loop measurement records.

P2 only if volume proves the need:

- budgeted semantic clustering inside an already deterministic repository
  partition;
- a human-owned Canonical Agent Intent model with preview-only projections;
- statistical analysis for adequately powered experiments.

None of these are required to ship the V1 advisory golden path.
