# Complexity-Based Model Routing

## Decision

Route each Work Order through an explicit workspace policy using complexity,
risk, task type, capabilities, availability, and budget. Complexity is either
operator-declared (`SMALL`, `STANDARD`, `LARGE`) or deterministically derived
at dispatch from risk, workflow topology, and step count.

## Precedence

1. Explicit authorized per-run override
2. Matching workspace policy rule (including complexity)
3. Workflow tier default
4. Agent override
5. Workspace and system fallbacks

Hard safety checks for risk approval, required capabilities, provider health,
and budget apply to every candidate.

## Default Complexity

- `LARGE`: high/critical risk, DAG workflow, or four or more workflow steps
- `SMALL`: low risk with one or two steps
- `STANDARD`: all remaining work

## Rollout

Keep `model-routing.enabled` off while validating shadow decisions. Seed rules
for small/low-risk fast work, standard balanced work, and large/high-risk
powerful work. Enable only a low-risk canary after three representative
dispatches record the expected decision evidence.
