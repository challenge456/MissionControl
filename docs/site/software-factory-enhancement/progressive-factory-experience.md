# Progressive Factory Experience

The Factory page is the guided entry point for governed software delivery. It
helps an operator choose an appropriate workflow without replacing Mission
Control's canonical hierarchy:

`Mission → approved Plan → WorkOrder → Attempt → evidence → pull request → release`

## Start governed work

1. Open **Delivery → Factory Board**.
2. Describe the desired outcome, constraints, and definition of success.
3. Review the rule-based recipe recommendation and rationale.
4. Override the recipe only when the displayed tradeoff is intentional.
5. Select **Review Mission draft**, confirm the repository intent and stop
   condition, then create the draft.
6. Review and edit the compiled Plan. Saving a Plan does not approve it;
   approval releases WorkOrders but does not start execution.

The recommendation and any override are retained in Mission metadata as
composition provenance. They are not authorization inputs. Active Factory
Versions, policy, scoped identities, the validation contract, and server-side
permission checks remain authoritative.

## Experience levels

| Level        | Intended operator                    | Visible information                                                                                                  |
| ------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Basic        | Product owner or occasional operator | Outcome, recommendation, run status, progress, verification, pull request, and approvals                             |
| Intermediate | Delivery operator                    | Recipe catalog, roles, routing intent, executor posture, context, tests, review, gates, and retry bounds             |
| Advanced     | Factory engineer                     | Raw recipes and observations, Factory Version status, exact diagnostic routes, policies, evidence, and model routing |

Changing level writes only the browser-local presentation preference. It does
not mutate a Mission, Plan, WorkOrder, Attempt, policy, evidence record, or
acceptance decision, and it is not copied into Mission metadata.

## Recipe catalog

| Recipe              | Use when                                                           | Default posture                                                                 |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Scout               | Facts or root-cause context are needed before deciding             | Read-only investigation                                                         |
| Plan                | The required result is an approval-ready plan or design            | Read-only planning                                                              |
| Build               | A small implementation is obvious and narrowly scoped              | One builder plus baseline checks                                                |
| Quality             | Existing code only needs known deterministic checks                | Deterministic-first, no model on a passing run                                  |
| Build + Test        | A known change needs explicit regression evidence                  | Builder, tests, bounded repair                                                  |
| Build + Review      | Requirement fidelity needs independent review                      | Builder, reviewer, bounded revision                                             |
| Plan + Build + Test | A normal moderate product change                                   | Standard governed delivery                                                      |
| Full SDLC           | Work is broad, ambiguous, high-risk, or security/runtime sensitive | Research, planning, build, review, exact-subject verification, human acceptance |

Policy may always require stricter gates than the recipe proposes. A recipe
never lowers an active requirement.

## Reading recent runs

Recent-run cards come from the canonical Observability trace store. Human,
Agent, and Code counts summarize recorded interventions, model generations,
and tool calls. Selecting a run opens an expanded swimlane over its recorded
observations and a phase inspector for inputs, prompts, configuration,
execution, outputs, and gates.

`Not recorded` means the trace did not contain that fact. It does not mean zero
or successful. Use **Open full Observability** for the complete tree, timeline,
eval, and dataset surfaces.

## Safety boundary

- Mission creation does not dispatch, approve, accept, or merge work.
- Plan approval remains a human decision and only releases WorkOrders.
- Execution remains an explicit governed action.
- `workOrders.accept` remains the sole WorkOrder acceptance authority.
- Basic mode hides advanced controls; it does not weaken permission checks on
  their direct routes.
- Factory Memory retrieval and frozen Context Package evidence remain in
  **Knowledge → Memory** and full Observability. Advanced Factory Board links
  to those canonical surfaces instead of duplicating them.

## Known follow-up work

V1 intentionally does not add a second execution graph, trace store, recipe
schema, or executor. Future work can add richer run-to-PR filtering, observed
phase-to-recipe comparison, and server-managed organization defaults after the
golden path has production evidence.
