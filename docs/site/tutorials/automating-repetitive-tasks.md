# Automating repetitive tasks

Turn recurring operator work into governed factory automation.

## Workflows

Define multi-step workflows in `workflows` table:

- Step agents (Hermes operator, Pi bounded runtime)
- Retry limits and timeouts
- Expected outputs per step

Seed demo includes `mc-demo-delivery` workflow for WorkOrders.

## Scheduled jobs

`scheduledJobs` drive cron-like execution:

- Daily CEO brief (`mission_prompt`)
- Nightly QC run
- Smoke test suite

View upcoming runs in Command Center.

## Product model

- **Skill** — reusable reasoning or capability.
- **Tool** — deterministic action interface.
- **Workflow** — versioned orchestration of deterministic steps, Tools, and bounded Skills.
- **Automation** — activated, governed trigger that repeatedly invokes a versioned Workflow.
- **Automation Run** — one durable execution attempt.
- **Receipt** — evidence showing what ran, what happened, and whether it passed.
- **Policy** — activation, dispatch, permission, mutation, limit, and promotion rules.

Skills reason. Tools act. Workflows orchestrate. Automations repeat. Receipts
prove. Policies control.

An Automation references a versioned Workflow, not an arbitrary Skill. A Skill
may be a dependency of that Workflow.

Classify existing Skills and reusable capabilities in the Context Registry
without creating duplicate Skill records:

- `capabilityType`: `REASONING`, `DETERMINISTIC`, or `HYBRID`
- `recommendedExecution`: `LLM`, `SCRIPT`, `CLI`, `SERVICE`, or `WORKFLOW`
- `automationEligibility`: `UNASSESSED`, `CANDIDATE`, `VALIDATED`, `PROMOTED`, or `REJECTED`
- `deterministicReplacementId`: optional link to a deterministic replacement

These fields describe suitability; retrieved content or Skill text never grants
activation, dispatch, mutation, or approval authority.

## Candidate lifecycle

**Repetition may create an Automation Candidate, but only an explicit governed
decision can activate or increase its autonomy.**

1. Completed WorkOrders are grouped by Workflow, with repository fallback only
   when no Workflow is assigned.
2. At least two completed occurrences and one fresh, passing receipt are
   required for a LEVEL_1 recommendation.
3. The operator reviews occurrences, receipts, scope, cadence, risk, expected
   benefit, and the named Workflow.
4. Accepting the candidate creates a `DISABLED` Automation Definition.
5. Activation is a separate decision recording actor, reason, policy version,
   definition version, and time.
6. An active LEVEL_1 definition creates one idempotent, read-only WorkOrder in
   `AWAITING_APPROVAL` per cadence.
7. The operator approves and dispatches through normal WorkOrder governance.
8. The run produces an independently validated receipt. Reliability changes may
   be recommended, but are never automatic.

## Autonomy levels

- **LEVEL_0 — SUGGEST_ONLY:** detect and propose; do not create WorkOrders.
- **LEVEL_1 — CREATE_REVIEW_GATE:** create a read-only approval-gated WorkOrder.
- **LEVEL_2 — AUTO_DISPATCH_READ_ONLY:** schema-compatible future state; disabled in V1.
- **LEVEL_3 — AUTO_PROPOSE_CHANGE:** future isolated branch or pull request.
- **LEVEL_4 — AUTO_APPLY_LOW_RISK:** future allowlisted deterministic change.
- **LEVEL_5 — POLICY_GOVERNED_PRODUCTION_ACTION:** future restricted production action.

V1 scheduled Automations are restricted to read-only WorkOrders. Mutating
automation requires a higher autonomy level, isolated change environment,
explicit allowlist, independent verification, and separate product approval.

## Idempotency and dispatch boundaries

- Candidate acceptance cannot activate an Automation.
- Activation cannot approve or dispatch a WorkOrder.
- The Automation and its executing agent cannot approve or independently
  validate their own WorkOrder.
- Cadence retries reuse a definition-and-window idempotency key.
- Disabling or pausing stops future gates and leaves existing WorkOrders intact.

## Suspension and reliability

Verification failure, a missing required receipt, workflow-version drift, cost
or runtime limits, authorization changes, policy invalidation, or a linked
security incident pauses or suspends future work. Resume requires an explicit
authorized decision.

Reliability states are `PROBATION`, `SUPERVISED`, `TRUSTED_READ_ONLY`,
`TRUSTED_LOW_RISK`, and `SUSPENDED`. Promotion is always operator-approved.

## Metrics

Track success and verification pass rates, failures, missing receipts, human
touches and cost per accepted outcome, time saved, idempotent skips,
policy-blocked runs, recovery time, overrides, approval rejections, no-op runs,
receipt completeness, suspensions, promotion recommendations, and p50/p95 run
and approval duration.

Human touches should decrease only while accepted-outcome quality remains stable
or improves.

## Operator checklist

Before activation or dispatch, confirm:

- The Workflow and version are named and current.
- Scope, repository, environment, cadence, overlap, and catch-up rules are bounded.
- The Automation is non-mutating and LEVEL_1.
- Cost, runtime, retry, and concurrency limits are acceptable.
- Operator approval and independent receipt requirements are explicit.
- The decision reason and policy version are accurate.
