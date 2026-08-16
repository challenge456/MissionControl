# Factory Learning and continuous improvement

Factory Learning turns recurring delivery friction into governed improvement
work without giving the learning system authority over active configuration or
acceptance.

The V1 loop is:

`persisted evidence → deterministic signal → recurring cluster → Improvement Candidate → human review → canonical experiment → Mission → Plan → WorkOrder`

Factory Learning is a projection over Mission Control's existing records. It
does not introduce another Attempt, trace, eval, evidence, routing, memory, or
acceptance system.

## Open Factory Learning

Open **Delivery → Factory Board**, then use the Factory tabs.

| Experience level | Visible Factory Learning surfaces |
| --- | --- |
| Basic | Improvements |
| Intermediate | Improvements, Signals, Experiments |
| Advanced | Improvements, Signals, Experiments, Agent setup |

The experience level is presentation-only. Changing it does not change
permissions, learning policy, experiment state, or governance.

## Refresh learning evidence

Select **Refresh evidence** from any Factory Learning surface. The refresh:

1. selects at most 200 recent records from each supported source;
2. keeps records inside the 30-day window;
3. derives only explicit deterministic signals;
4. deduplicates source evidence by an immutable idempotency key;
5. clusters exact normalized signatures inside one workspace and repository;
6. creates one candidate after three distinct occurrences; and
7. appends an audit activity with the resulting counts.

V1 makes zero model calls during refresh. Semantic clustering is disabled.
Identifiers, revisions, line numbers, and other volatile fragments are
normalized, but unlike errors remain unlike.

Supported evidence includes failed verification receipts, ineligible quality
gates, recorded retries and recoveries, traces with explicit human
interventions, rejected or revision-requested approval decisions, exhausted
model routes, and explicit agent-configuration drift.

To opt a workspace into hourly refresh, schedule the existing workflow skill
name `factory-learning-scan` with a non-manual schedule. The cron ignores every
workspace that has not opted in.

## Review an Improvement Candidate

Open **Improvements**, then select a candidate. The review shows:

- problem statement and proposed change;
- expected benefit, risk, effort, confidence, and evidence count;
- observed model calls, tokens, or cost when the source recorded them;
- immutable evidence links and repository scope; and
- canonical experiment state.

Available human decisions are:

- **Approve experiment** — creates a two-variant Observability experiment
  against a frozen dataset version and enabled evaluator.
- **Snooze 7 days** — retains the candidate and records the reason.
- **Dismiss** — closes a non-actionable candidate with a reason.
- **Reject** — records that the proposed direction should not proceed.

Dismiss, reject, and snooze require a reason. All actions require the existing
Factory approval permission and append audit evidence.

## Compare baseline and candidate

An approved V1 experiment always contains exactly two variants:

1. **Current baseline**
2. **Proposed candidate**

The operator records bounded aggregate outcomes for both variants: sample size,
success count, and optional average duration and cost. Mission Control stores
the metrics on the canonical experiment variants and labels the result as a
human-recorded aggregate.

The comparison may recommend promotion, hold, or rejection. It never claims
statistical significance and never auto-promotes, including for large samples.
Small samples are explicitly labeled.

After the experiment is complete, **Create governed Mission plan** becomes
available. This action creates a canonical Mission, creates one bounded
implementation WorkOrder blueprint, and submits the Plan with candidate,
cluster, experiment, and evidence lineage. A separate operator must approve
the Plan before Mission Control releases the WorkOrder. Approval still does not
start execution, accept delivery, merge code, change routing, or change agent
configuration.

## Scan agent configuration

Advanced operators can publish a read-only repository projection from the
repository root:

```sh
node scripts/mc-context.mjs agent-config --sync \
  --project-id <convex-project-id> \
  --repository-id <convex-repository-id>
```

Omit `--sync`, `--project-id`, and `--repository-id` for a local-only report.
Add `--json` for machine-readable output.

The scanner reads only Git-tracked allowlisted sources, including scoped
`AGENTS.md` and `CLAUDE.md`, installed `SKILL.md` files, Codex/Cursor/Loom
configuration, Git hooks, ignore files, and permissions files. It caps scans at
200 files and 256 KiB per file, skips symlinks, retains the last-changing commit
for each source, and redacts credential-shaped values before emitting
directives.

Configuration findings are advisory:

- contradiction;
- coverage gap;
- duplicate intent; and
- precedence shadow.

The registry never edits a source file, chooses a winning rule, updates an
installed skill, changes tool permissions, or mutates a harness.

## Permissions and authority

| Operation | Permission | Authority boundary |
| --- | --- | --- |
| View learning evidence | `factory.read` | Advisory read only |
| Refresh evidence | `factory.improve` | Creates signals, clusters, and proposals only |
| Sync configuration projection | `factory.improve` | Read-only projection and drift signals only |
| Approve or review candidate | `factory.approve` | Human decision; no live configuration write |
| Record experiment outcome | `factory.improve` | Canonical eval metadata; no promotion |
| Create implementation WorkOrder | `factory.approve` | Governed work request; still awaiting approval |

Every Factory Learning signal, cluster, candidate, configuration scan, entry,
and finding carries `acceptanceAuthority: false`. WorkOrder acceptance remains
owned by the existing acceptance path.

## Failure and recovery

- **No candidates:** refresh after at least three matching source records exist.
- **No datasets or evaluators:** promote a reviewed trace to an eval dataset and
  enable an evaluator in Observability first.
- **Experiment stays Draft:** record observed outcomes for both variants.
- **Promotion is unavailable:** the candidate must be Accepted and its linked
  experiment must be Completed.
- **No Agent setup data:** run the repository scanner with `--sync` and the exact
  workspace/repository IDs shown in the UI.
- **Unauthorized:** confirm the operator has the existing Factory read,
  improve, or approve permission required by the operation.

Refresh and configuration sync are idempotent. Repeating either operation does
not duplicate source signals, clusters, candidates, or an unchanged scan.

## Rollout and monitoring

Monitor these audit actions during rollout:

- `FACTORY_LEARNING_REFRESHED`
- `FACTORY_LEARNING_EXPERIMENT_APPROVED`
- `EVAL_EXPERIMENT_OUTCOME_RECORDED`
- `AGENT_CONFIGURATION_REGISTRY_SYNCED`
- `META_LOOP_WORK_ORDERED`

Investigate unexpected candidate volume, clusters that join distinct failures,
cross-repository evidence, repeated authorization denials, source-cap
saturation, or a rising share of dismissed candidates. Disable the optional
`factory-learning-scan` schedule to stop automatic refreshes; manual review and
all canonical delivery records remain intact.
