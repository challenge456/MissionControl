---
date: 2026-07-28
status: governed-p1-batch-complete
browser: Headed Chromium
git_commit: 3210c253fdebd46460e3312e89daa2cedfd5ceb3
---

# Software Factory and Loop Engineering E2E Report

## Outcome

The selected Software Factory Research Lab workspace supports the critical local journey from workspace creation and repository connection through PRD import, task generation, governed review, live activity, persistent chat, WorkOrder dispatch, bounded graph execution, independent verification, explicit approval, verification receipt, and WorkOrder acceptance.

Cycles 2 and 3 completed through the UI. Cycle 2 applied and reverified the accepted P1 accessibility result. Cycle 3 applied two additional bounded improvements: acceptance-bound parent-task synchronization and a fixed, non-sensitive workflow observability rollup. The implementation is covered by 18 focused tests and is visible in the live run inspector.

Cycle 4 is the completed post-patch confirmation run `zorsn3gh`. Research and verification attempts retained their contract failures and retry lineage instead of silently overwriting evidence. The corrected packets satisfied their declared schemas, synthesis completed, and the matching workflow gate retained its approver, reason, timestamp, and evidence digest. After a PASS verification receipt was recorded, explicit WorkOrder acceptance synchronized parent task `SFRL-043` from Inbox to Done and emitted a `STATE_SYNCED` lifecycle event. Refresh preserved the workspace and task states. Historical task `SFRL-031` correctly remains in Inbox; the new behavior does not silently backfill older accepted WorkOrders.

The follow-up governed P1 batch has now completed FR-2 through FR-8. Each task
was planned and assigned through the UI, advanced through the canonical audited
state machine, submitted with a requirement-specific deliverable and checked
acceptance criteria, independently accepted by the operator, and verified in
the Done column after refresh. The batch increased Done from 6 to 13. A new
bounded Loop Engineering cycle, `zn7ba4hw0b68z4gpp168hnkzn58bdps6`, now
consumes the accepted batch outcome through a structured research brief and
stops before any unapproved implementation.

## Test context

- Browser: headed Chromium
- Manual run window: 2026-07-27 23:46 PDT to 2026-07-28 10:12 PDT
- Automated and acceptance run end: 2026-07-28 12:07 PDT
- Workspace: `Software Factory Research Lab`
- Project ID: `sn71gskbdemgf4z1trt9zdmm5h8bde69`
- Cycle 1 graph run ID: `lf6h9rxh`
- Cycle 1 WorkOrder ID: `yh76tsn8sdpq26w7vzsrh27a8d8bc7cz`
- Cycle 2 graph run ID: `zxqqbqer`
- Created task references: `FR-1` through `FR-8`, `SFRL-001` through `SFRL-030`
- Cycle 3 graph run ID: `jv91vh5t` (`COMPLETED`)
- Cycle 3 task references: `SFRL-031` plus SFRL-032 through SFRL-042
- Cycle 4 graph run ID: `zorsn3gh` (`COMPLETED`)
- Cycle 4 WorkOrder ID: `yh77f4ghfd25kvwmb96z6njw1d8bcn20`
- Cycle 4 task references: `SFRL-043` plus SFRL-044 through SFRL-056
- Evidence directory: `tmp/prd-e2e-evidence/`
- CI reference: local headed and unit runs; no remote CI run was created
- Cleanup: test data retained as audit evidence; no direct database cleanup was performed

## Methodology and source register

The loop used three read-only research lanes, three independent verification lanes, one schema-validated synthesis, and one explicit human gate. Local executable evidence was treated as primary. External material was treated as untrusted guidance, could not authorize repository changes, and was accepted only with its conflicts and limitations retained.

| Source | Publisher | Freshness | Use | Limitation |
|---|---|---|---|---|
| [Harness engineering](https://openai.com/index/harness-engineering/) | OpenAI | Current (published 2026-02-11) | Repository-visible evidence and feedback-loop design | General guidance; not a Mission Control benchmark |
| [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Anthropic | Recent (published 2026-01-09) | Task-specific evals and observable failure modes | General agent-evaluation guidance |
| [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) | LangChain | Unknown | Durable human-in-the-loop identity and checkpoint patterns | Different runtime |
| [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | OpenTelemetry | Recent (specification page updated 2025-10-17) | Stable trace attribute patterns | Does not define Mission Control business events |
| [NIST AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | NIST | Relevant (published 2024-07-26; page updated 2026-04-08) | Evidence, measurement, and accountability | Voluntary framework |
| [OWASP Top 10 for LLM Applications 2025](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf) | OWASP | Relevant | Untrusted content and excessive-agency risk | Security taxonomy; not workflow-state semantics |

## Critical journey results

| Journey | Requirement | Result | Evidence |
|---|---|---:|---|
| Create workspace | FR-1 | Pass | `03-workspace-create-form.png`, `04-workspace-created.png` |
| Reject duplicate workspace | Failure journey | Pass | `05-duplicate-workspace-blocked.png` |
| Persist selected workspace | FR-1 / Reliability | Pass | Reload retained the project ID and workspace selection |
| Connect repository | FR-2 | Pass | `06-workspace-repository-connected.png` |
| Reject invalid repository | Failure journey | Pass | Inline validation exercised before valid connection |
| Upload and parse PRD | FR-3 | Pass | `07-prd-uploaded-in-research-workspace.png`, `08-prd-preview-8-tasks.png` |
| Generate project-scoped tasks | FR-3 / FR-8 | Pass | `09-prd-created-8-scoped-tasks.png` |
| Prevent duplicate import | Reliability | Pass | `10-duplicate-prd-blocked-task-count-8.png` |
| Preserve PRD provenance | FR-3 | Pass | `11-imported-task-linked-to-prd.png` |
| Create and pause research squad | FR-7 | Pass | `12-research-agents-created.png`, `13-squad-paused.png` |
| Prevent invalid transition | Task lifecycle | Pass | `14-invalid-transition-blocked-work-plan-required.png` |
| Persistent linked chat work | FR-11 | Pass | `16-chat-linked-work.png`; two-message history retained after reload |
| Create bounded learning cycle | Loop Engineering | Pass | `17-loop-cycle-created.png` |
| Dispatch parallel graph | Graph Engineering | Pass | `18-loop-dag-dispatched.png` |
| Reject, correct, resubmit, approve | FR-9 | Pass | `19-review-reject-resubmit-approve.png` |
| Activity filters and deduplication | FR-10 | Pass | `20-live-activity.png`, `22-comment-activity-linked.png` |
| Graph state, dependencies, isolation | Graph Engineering | Pass | `21-graph-execution-plan.png` |
| Refresh state and metrics | Reliability | Pass | `23-refresh-persistence-counts.png`, `24-refresh-persistence-counts.png` |
| Independent research fan-out/fan-in | Loop Engineering | Pass | SFRL-022 through SFRL-027 reached Review with structured source and claim decisions |
| Retry supersedes failed attempt | Reliability | Pass | SFRL-028 was canceled when its schema-invalid synthesis was retried as SFRL-029 |
| Evidence-bound approval gate | FR-9 / Governance | Pass | SFRL-030 reached Done only after the matching gate approval was recorded |
| Record verification and accept WorkOrder | Release gate | Pass | Run `zxqqbqer`, PASS receipt, `AWAITING VERIFICATION → DONE` |
| Automated critical accessibility gate | Accessibility | Pass | `critical-accessibility.e2e.spec.ts`; `25-critical-accessibility-prd-dialog.png` |
| Feed evidence into next research cycle | Loop Engineering | Pass | SFRL-031 and run `jv91vh5t`; research, verification, synthesis, and approval nodes SFRL-032 through SFRL-042 completed |
| Inspect fixed workflow observability | FR-10 / Observability | Pass | `27-cycle3-observability-inspector.png`; fixed correlation, status, duration, attempt, retry, token, cost, and completeness fields |
| Preserve historical parent state | Reliability / Governance | Pass | `28-cycle3-parent-pre-sync-inbox.png`; SFRL-031 remains Inbox because Cycle 3 acceptance predates the patch |
| Validate executable output contracts | Reliability / Failure journey | Pass | Final Cycle 4 packets include `architectureFindings`, `governanceFindings`, and `sourceDecisions`; failed attempts and retry reasons are retained |
| Fail fast on missing workflow output fields | Reliability / UX | Pass | Shared task transition validation plus task-editor contract guidance; 6 new contract tests |
| Post-patch explicit acceptance and parent sync | FR-9 / Reliability | Pass | `30-output-contract-guidance.png`, `31-cycle4-ready-for-acceptance.png`, `33-cycle4-refresh-persistence.png`, `34-cycle4-completed-inspector.png`; SFRL-043 synchronized to Done only after explicit acceptance |
| Autonomous completion of every imported inbox item | FR-7 / Loop Engineering | Not complete | Older imported and parent tasks remain actionable and require explicit evidence-backed closure |
| Complete governed P1 batch | FR-2 through FR-8 | Pass | `35-p1-batch-done.png`; all seven tasks retain plans, deliverables, checked criteria, audited transitions, and refresh-persistent Done state |
| Feed accepted batch into next cycle | Loop Engineering | Pass | `36-next-loop-cycle-research-brief.png`; cycle `zn7ba4hw0b68z4gpp168hnkzn58bdps6` persists objective, question, scope, exclusions, freshness, preferred sources, required output, approval policy, and stop condition |

## Acceptance measurements

- Cycle 2 WorkOrder: `DONE`
- Cycle 2 workflow: `COMPLETED`
- Cycle 2 retry count: 1
- Cycle 2 gate approval: 1 matching explicit approval; reason, operator, task, version, digest, and timestamp retained
- Cycle 2 verification: `PASS`
- Cycle 3 workflow and WorkOrder: completed and accepted before the parent-sync patch hot-loaded
- Cycle 4 parent before acceptance: `SFRL-043 / INBOX`
- Cycle 4 workflow and WorkOrder after explicit acceptance: `COMPLETED / DONE`
- Cycle 4 parent after acceptance and refresh: `SFRL-043 / DONE`
- Cycle 4 historical non-backfill check: `SFRL-031 / INBOX`
- Cycle 4 contract failures retained:
  - `researchArchitecture`: missing `architectureFindings`
  - `researchGovernance`: missing `governanceFindings`
  - `verifyLandscape`: missing `sourceDecisions`
- Cycle 4 final allowed attempts: schema-correct; all 8 graph steps completed
- Cycle 4 retry count: 5, with failed attempts and reasons retained
- Cycle 4 gate approval ID: `m17ctdgsngwt1ppcm1ym029y2s8bdxb6`
- Cycle 4 evidence digest: `sha256:c38701428ee0fdf3297d8301dd29d21aa5e061e0b4f774c7b95101926f1e1d69`
- Cycle 4 verification: `PASS`, linked to run `zorsn3gh` and this report
- Output-contract regression coverage: 6 Convex tests and 1 workflow-engine metadata test
- Active stale Cycle 1 workflow attempts: 0; SFRL-003 through SFRL-011 and SFRL-018 are non-actionable
- Duplicate rendered message/activity event: not observed
- Fresh browser JavaScript errors: 0
- Failed network calls in the headed critical route matrix: 0
- Local load timing after clean reload:
  - DOM content loaded: 68 ms
  - load event: 69 ms
  - first paint: 120 ms
  - first contentful paint: 120 ms

## Accessibility evidence

- The first automated axe run found critical failures: invalid `role="list"` structure in the v2 sidebar and unnamed select triggers in Tasks, Work Orders, and Approval Center.
- The sidebar now uses its existing navigation semantics without an invalid ARIA list role.
- Saved-view and WorkOrder/approval filter selects now have stable accessible names.
- Five axe-backed WCAG A/AA critical journeys pass: Overview, Tasks, Work Orders, Approval Center, and the PRD import dialog.
- The PRD dialog has an accessible name and moves initial focus to its textarea.
- Failed accessibility runs retain screenshots and Playwright traces; axe JSON is attached per test.
- Status is represented with text labels in addition to color.

This is an automated critical-journey gate, not a complete WCAG conformance audit.

## Automated verification

| Check | Result |
|---|---:|
| Full repository test command | 870 tests passed |
| Workflow engine | 62 tests passed |
| PRD parser and Loop Engineering | 10 tests passed |
| Mission Control UI | 101 tests passed |
| Coordinator | 28 tests passed |
| Model router | 5 tests passed |
| Critical axe accessibility | 5 tests passed |
| Headed critical browser gate | 9 tests passed |
| Headed v2 route sweep | Full route-matrix test passed |
| UI typecheck | Pass |
| Workflow executor typecheck | Pass |
| Codex factory worker standalone typecheck | Pass |
| Monorepo production build | Pass |
| Workflow seed against local Convex | 6 of 6 seeded |
| Browser console after clean reload | No errors; prior run had two React Router v7 warnings, follow-up run has zero |
| Browser network after clean reload | Observed requests returned 200 or 304 |
| `git diff --check` | Pass |

### Cost-conscious P1 follow-up validation

At the product owner's request, the full 870-test suite was not rerun for this
follow-up batch. Validation was limited to the affected surfaces:

- 34 focused Convex tests passed: Loop Engineering, output contracts, operator
  controls, PRD parsing, and parent synchronization.
- 62 workflow-engine tests passed.
- Mission Control UI typecheck passed.
- Monorepo production build passed.
- Headed UI planning, acceptance-state rendering, refresh persistence, and the
  next-cycle research brief passed.
- Browser errors: zero.
- React Router v7 migration warnings: zero after enabling the supported future
  flags.
- Existing build warning: the shared vendor chunk is approximately 556 KB.

The first Cycle 2 synthesis attempt returned `measurements` as an object while the graph contract requires an array. The executor recorded the failure, superseded SFRL-028, created SFRL-029, and accepted the corrected output. The first axe run then found critical ARIA failures; those failures produced screenshots and traces, the UI was corrected, and all five accessibility checks passed on rerun.

Cycle 4 exposed the same class of error earlier in the graph: task submissions could satisfy the generic Review checklist while omitting workflow-specific JSON fields. Workflow-created tasks now carry a minimal `outputContract` containing only `expects` and required top-level fields. The shared task transition validates the contract for UI, CLI, and API callers, and the task editor displays required JSON fields with an inline accessible error before Review. Prompts and arbitrary metadata are not added to telemetry. The corrected attempts completed the eight-step graph, passed the explicit workflow gate, received a traceable PASS receipt, and proved acceptance-bound parent synchronization in the headed UI.

### Governed P1 follow-up cycle

The bounded follow-up cycle completed on 2026-07-28 without manufacturing a
repository change that the evidence did not support.

- Workflow run: `1zscognu` (`8/8` graph steps completed)
- WorkOrder: `yh7940sjm4408t14ehz0rz2r9d8bcse9` (`DONE`)
- Parent task: `SFRL-057` (`DONE`, synchronized by WorkOrder acceptance)
- Research lanes: landscape, architecture, and governance completed with dated
  source ledgers, freshness, conflicts, and limitations.
- Verification lanes: all three material claim sets received independent
  acceptance and source decisions.
- Synthesis measurements: 34 focused Convex tests, 62 workflow-engine tests,
  seven accepted P1 tasks, and zero browser errors.
- Recommendation result: zero accepted P1 repository-changing recommendations.
- Stop condition: met after one clean focused headed cycle.
- Approval: `m174ta4cybkfwp0fhvprx0fa6n8bdpwj`, approved by `operator` under
  explicit cycle-scoped delegation.
- Evidence digest:
  `sha256:aa2bac77701a3f4209856cfeabcc1def187c49ff4edc3b6817296a4fa1435bbe`
- Verification receipts: `research-evidence`, `independent-verification`, and
  `evidence-linked-recommendations` all passed.
- Headed refresh evidence:
  `tmp/prd-e2e-evidence/37-loop-cycle-workorder-done.png`; the UI retained
  `DONE`, `PASS`, and `COMPLETED` after reload with zero browser errors.
- Scope control: no unrelated pending approval was changed and the approval
  gate was not bypassed.

### Legacy parent disposition and route-load measurement

The four historical Inbox parents were explicitly dispositioned on 2026-07-28.
They were canceled as superseded rather than silently backfilled to Done:

| Task | Disposition | Evidence |
|---|---|---|
| `SFRL-001` | `CANCELED` — superseded | Accessibility audit delivered and verified by the accepted Cycle 2 evidence |
| `SFRL-002` | `CANCELED` — superseded | Critical UI and accessibility objective completed with zero critical violations |
| `SFRL-021` | `CANCELED` — superseded | Cycle 2 run `zxqqbqer` completed and was accepted |
| `SFRL-031` | `CANCELED` — superseded | Cycle 3 run `jv91vh5t` completed; this parent predates outcome synchronization |

The Tasks UI persisted Inbox `0` and Canceled `23` after refresh. Evidence:
`tmp/prd-e2e-evidence/39-legacy-inbox-dispositioned.png`.

The production build still reports a 555.87 KB raw shared vendor chunk, but its
gzip transfer is 180.44 KB. A cold production-preview load of the Work Orders
route measured:

- DOM content loaded: 248 ms
- Load event: 249 ms
- Vendor transfer/duration: 180,744 bytes / 18 ms
- Total asset transfer: 449,866 bytes across 26 assets
- Browser errors: zero
- Major application sections are already loaded with `React.lazy`.

The local measurement does not show user-visible impact, so route or vendor
splitting was not changed. Splitting without a measured regression would add
request and cache complexity without evidence of benefit. Production-preview
evidence: `tmp/prd-e2e-evidence/38-production-route-load-measurement.png`.

### Failed-run recovery

Mission Control now supports an operator-initiated recovery from the Execution
Run Inspector:

- Recovery is available only for a failed run opened from its linked WorkOrder.
- The operator must record a reason of at least 10 characters.
- Recovery creates a new run instead of rewriting the failed run.
- The new run retains `retryOfWorkflowRunId`, the prior public run ID, and the
  operator reason in its context and metadata.
- The WorkOrder audit log records `DISPATCH_REQUESTED`, `DISPATCHED`, and
  `RUN_RETRIED` with the operator identity and recovery linkage.
- The existing dispatch policy still rejects active-run duplicates,
  cross-WorkOrder retry targets, non-failed source runs, missing approvals, and
  invalid WorkOrder states.
- Failed-request feedback remains associated with the recovery form and does
  not erase the entered reason.

Headed verification used existing failed demo run `8qj9yc45`. The UI created
pending recovery run `hq2hdshi`; the original failed run, failure reason, and
retry history remain present. The executor was intentionally not started, so
the recovery run remains pending for inspection. Evidence:
`tmp/prd-e2e-evidence/40-failed-run-recovery-form.png` and
`tmp/prd-e2e-evidence/41-recovery-run-created.png`.

Focused verification:

- WorkOrder dispatch/recovery policy: 18 tests passed.
- Recovery UI states: 3 tests passed.
- Mission Control UI typecheck: passed.
- Mission Control UI production build: passed.
- Browser errors: zero.
- `git diff --check`: passed.

### Continuous evidence lineage

The Execution Run Inspector now exposes a read-only seven-stage evidence chain:
research evidence, independently verified claims, recommendation, approval,
implementation, verification, and measurement. The view is derived from
durable workflow context, approval records, file-change events, artifacts, and
verification receipts; it does not introduce a second source of truth.

Each stage is inspectable and reports `COMPLETE`, `PENDING`, `MISSING`, or
`NOT REQUIRED`. A zero-recommendation clean stop is preserved as a valid
outcome rather than displayed as missing implementation evidence.

Headed verification against completed Loop Engineering run `1zscognu` showed:

- 2 unique research sources
- 3 independently accepted claims
- recommendation and implementation explicitly not required
- 1 retained approval
- 3 accepted verification receipts
- 4 next-cycle measurements
- zero browser errors and zero console warnings

Evidence:
`tmp/prd-e2e-evidence/42-continuous-evidence-lineage.png`.

Focused verification:

- Continuous lineage model: 3 tests passed.
- Existing run-inspector model: 5 tests passed.
- Evidence-lineage UI: 2 tests passed.
- Mission Control UI typecheck: passed.
- Mission Control UI production build: passed.
- `git diff --check`: passed.

## Agent-native review

| UI capability | Shared agent/backend primitive | Result |
|---|---|---:|
| Task transition and assignment | `tasks.transition`, `tasks.assign` | Pass |
| Submit and decide approval | `approvals` and governed WorkOrder mutations | Pass |
| Comment and activity | `messages.post`, `activities.listRecent` | Pass |
| Chat request to linked work | `missionChat.submitRequest` | Pass |
| Create and advance learning cycle | `loopEngineering` actions and mutations | Pass |
| Inspect durable graph | `workflowRuns` queries | Pass |
| Inspect continuous evidence lineage | `workflowRuns.getInspector` | Pass |
| Execute bounded graph work | workflow executor plus Mission Control task UI | Pass |
| Validate workflow output contract | shared `tasks.transition` validation | Pass |
| Resolve recommendation gate | identity-bound approval plus guarded task mutation | Pass |
| Accept verified WorkOrder | verification receipt and explicit acceptance | Pass |

Users and workers share the same Convex project, task, WorkOrder, activity, and run records. The execution-activity row was changed from a dead control to navigation into Work Orders.

## Simplification decisions

- Reused the existing Harness Loops route and renamed it Loop Engineering instead of adding a parallel product area.
- Kept one durable workflow model that supports both linear workflows and DAGs.
- Moved the unsupported `feature-dev-simplified.yaml` proposal out of the runtime workflow directory.
- Made workflow seeding fail when any workflow fails instead of printing a false success message.
- Kept implementation-capable steps behind explicit approval; read-only research and verification steps can advance from evidence submissions.

## Remaining follow-up

1. Add a publication/update date for the LangGraph interrupts page if the
   publisher exposes one; it remains correctly classified `Unknown`.
2. Revisit vendor splitting only if production telemetry exceeds the agreed
   route-interactivity threshold; the current local production measurement
   does not justify a change.
